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
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');

    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log('Generating flashcards for:', title);

    const prompt = `Você está criando flashcards de estudo sobre "${title}".

Ao gerar flashcards, seu objetivo principal é criar pares 'Termo/Definição' semanticamente precisos.

## A REGRA CENTRAL: "O que é?"

- O TERMO deve ser um conceito-chave (substantivo, nome próprio, processo)
- A DEFINIÇÃO deve responder de forma concisa e direta: "O que é [Termo]?" ou "O que significa [Termo]?"

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
4. Cada DEFINIÇÃO deve responder "O que é?" de forma clara e concisa
5. NÃO use exemplos, consequências ou relações como definições
6. Extraia apenas informações que EXISTEM no texto
7. É melhor ter MENOS flashcards corretos do que muitos confusos

Retorne APENAS um JSON válido neste formato exato, sem markdown:
{
  "flashcards": [
    {
      "term": "Conceito-Chave",
      "definition": "O que é [Conceito-Chave]: explicação clara e concisa"
    }
  ]
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!generatedText) {
      throw new Error('No content generated');
    }

    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const flashcardsData = JSON.parse(cleanedText);

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
