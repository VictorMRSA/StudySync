import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY not configured');
    }

    console.log('Generating flashcards for:', title);

    const prompt = `⚠️ AVISO CRÍTICO DE CHECAGEM DE INFORMAÇÕES ⚠️

Você DEVE agir como um verificador de fatos rigoroso. 
NUNCA invente, deduza ou infira informações que não estão EXPLICITAMENTE no texto fornecido.
Se um conceito não estiver claramente definido no material, NÃO crie um flashcard sobre ele.
É PREFERÍVEL ter 3 flashcards corretos do que 8 flashcards com informações inventadas.

Você está criando flashcards de estudo sobre "${title}".

Ao gerar flashcards, seu objetivo principal é criar pares 'Termo/Definição' semanticamente precisos.

## A REGRA CENTRAL: Definição Direta e Concisa

- O TERMO deve ser um conceito-chave (substantivo, nome próprio, processo)
- A DEFINIÇÃO deve ser uma resposta concisa e direta ao que é o conceito
- NUNCA comece a definição com "O que é", "O que significa" ou qualquer pergunta
- Vá direto ao ponto: "Processo de...", "Indivíduos que...", "Princípio do..."

## A REGRA DE OURO: Evite Confusões Semânticas

### ❌ NÃO CONFUNDA DEFINIÇÃO COM EXEMPLO/CONSEQUÊNCIA:

Forma Incorreta:
Termo: Gêmeos Idênticos
Definição: Podem ter fenótipos diferentes devido ao ambiente.
(Isso é uma consequência, não a definição)

Forma Correta:
Termo: Gêmeos Idênticos
Definição: Indivíduos originados de um único zigoto, que compartilham o mesmo genótipo (DNA).

### ❌ NÃO CONFUNDA DEFINIÇÃO COM RELAÇÃO:

Forma Incorreta:
Termo: Dogma Central
Definição: É contestado pela epigenética sobre o determinismo genético.
(Isso é uma relação, não a definição)

Forma Correta:
Termo: Dogma Central
Definição: O princípio do fluxo da informação genética: DNA → RNA → Proteína.

## INSTRUÇÕES:

Com base EXCLUSIVAMENTE no seguinte conteúdo, crie 6-8 pares de flashcards:

${content}

REGRAS OBRIGATÓRIAS:
1. Selecione os substantivos e conceitos MAIS IMPORTANTES do texto
2. Para cada conceito, extraia apenas sua DEFINIÇÃO FUNDAMENTAL
3. Cada TERMO deve ser um conceito-chave (não uma pergunta)
4. Cada DEFINIÇÃO deve ser clara e concisa, indo DIRETO ao ponto
5. NÃO comece definições com "O que é", "O que significa" ou perguntas
6. NÃO use exemplos, consequências ou relações como definições
7. Extraia apenas informações que EXISTEM no texto
8. É melhor ter MENOS flashcards corretos do que muitos confusos
9. Formato ideal: "Processo de...", "Indivíduos que...", "Princípio do..."

VALIDAÇÃO FINAL:
Antes de retornar os flashcards, revise cada um e pergunte-se:
"Esta definição está LITERALMENTE no texto fornecido?"
Se a resposta for não, remova o flashcard.

Retorne APENAS um JSON válido neste formato exato, sem markdown:
{
  "flashcards": [
    {
      "term": "Conceito-Chave",
      "definition": "Explicação clara e concisa (SEM iniciar com 'O que é' ou perguntas)"
    }
  ]
}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: 'Você é um assistente especializado em criar flashcards educacionais de alta qualidade. Retorne sempre JSON válido.' },
          { role: 'user', content: prompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'quota_exceeded',
            message: 'Limite de requisições atingido. Por favor, aguarde alguns segundos e tente novamente.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            error: 'payment_required',
            message: 'Créditos insuficientes. Por favor, adicione créditos à sua conta Lovable.'
          }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Lovable AI error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.choices?.[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    console.log('Raw response:', generatedText.substring(0, 200));

    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcardsData = JSON.parse(cleanedText);

    console.log('Successfully generated', flashcardsData.flashcards?.length || 0, 'flashcards');

    return new Response(JSON.stringify(flashcardsData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-flashcards:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
