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

    console.log('Generating quiz for:', title);

    const prompt = `Você é um professor criando um quiz sobre "${title}".

Com base EXCLUSIVAMENTE no seguinte conteúdo, crie 5 perguntas de múltipla escolha:

${content}

REGRAS OBRIGATÓRIAS:
1. As perguntas DEVEM ser sobre o conteúdo fornecido acima
2. Cada pergunta deve ter 4 opções (apenas 1 correta)
3. As perguntas devem cobrir diferentes partes do conteúdo
4. Não invente informações que não estão no texto
5. Faça perguntas específicas, não genéricas

Retorne APENAS um JSON válido neste formato exato, sem markdown:
{
  "questions": [
    {
      "question": "Pergunta específica sobre o conteúdo?",
      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],
      "correctAnswer": 0
    }
  ]
}

O índice correctAnswer deve ser de 0 a 3.`;

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

    // Remove markdown code blocks se existirem
    const cleanedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const quizData = JSON.parse(cleanedText);

    return new Response(JSON.stringify(quizData), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-quiz:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
