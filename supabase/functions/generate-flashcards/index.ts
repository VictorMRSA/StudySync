import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Função para fazer retry com exponential backoff
async function fetchWithRetry(
  url: string, 
  options: RequestInit, 
  maxRetries: number = 3,
  baseDelay: number = 5000
): Promise<Response> {
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetch(url, options);
      
      // Se for erro 429, fazer retry com backoff
      if (response.status === 429) {
        const delay = baseDelay * Math.pow(2, attempt); // 5s, 10s, 20s
        console.log(`Rate limited (429). Attempt ${attempt + 1}/${maxRetries}. Waiting ${delay/1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      return response;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Max retries exceeded');
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { content, title } = await req.json();
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
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

    // Usar modelo mais estável com retry automático
    const response = await fetchWithRetry(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.5,
            maxOutputTokens: 2048,
          },
        }),
      },
      3, // maxRetries
      5000 // baseDelay (5 segundos)
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      
      // Verificar se é erro de quota
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            error: 'quota_exceeded',
            message: 'Limite de requisições atingido. Por favor, aguarde alguns segundos e tente novamente.'
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

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
