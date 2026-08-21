"""
Serviço principal de interação com LangChain e Google Generative AI.
Contém toda a lógica de IA: chat, sumarização, análise, quiz, flashcards e RAG.
Os prompts são idênticos aos das Supabase Edge Functions originais.
"""

import json
import logging
import re

from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from config import settings

logger = logging.getLogger(__name__)


class LangChainService:
    """Serviço centralizado de IA usando LangChain + Google Generative AI."""

    def __init__(self) -> None:
        self._llm = ChatGoogleGenerativeAI(
            model=settings.MODEL_NAME,
            google_api_key=settings.GEMINI_API_KEY,
            temperature=0.7,
            top_k=40,
            top_p=0.95,
            max_output_tokens=4096,
        )
        logger.info("LangChainService inicializado com modelo: %s", settings.MODEL_NAME)

    # ── Utilitário: parse de JSON da resposta do LLM ────────────────────

    @staticmethod
    def _parse_json_response(text: str) -> dict | list:
        """
        Extrai e faz parse de JSON da resposta do LLM.

        Remove blocos de código markdown (```json ... ```) e tenta
        encontrar o objeto/array JSON na resposta.
        """
        # Remover blocos de código markdown
        cleaned = re.sub(r"```json\s*\n?", "", text)
        cleaned = re.sub(r"```\s*\n?", "", cleaned)
        cleaned = cleaned.strip()

        # Tentar parse direto
        try:
            return json.loads(cleaned)
        except json.JSONDecodeError:
            pass

        # Tentar encontrar objeto JSON { ... }
        json_match = re.search(r"\{[\s\S]*\}", cleaned)
        if json_match:
            try:
                return json.loads(json_match.group())
            except json.JSONDecodeError:
                pass

        # Tentar encontrar array JSON [ ... ]
        array_match = re.search(r"\[[\s\S]*\]", cleaned)
        if array_match:
            try:
                return json.loads(array_match.group())
            except json.JSONDecodeError:
                pass

        raise ValueError(f"Não foi possível extrair JSON válido da resposta: {text[:200]}")

    # ── Chat ─────────────────────────────────────────────────────────────

    async def chat(self, message: str, history: list) -> str:
        """
        Processa uma mensagem de chat com contexto de histórico.

        Args:
            message: Mensagem do usuário.
            history: Lista de mensagens anteriores.

        Returns:
            Texto da resposta do assistente.
        """
        # Sanitizar mensagem — remover caracteres de controle
        sanitized = re.sub(r"[\x00-\x1f\x7f-\x9f]", "", message.strip())

        messages = [
            HumanMessage(content=(
                "Você é um assistente educacional inteligente. "
                "Ajude os estudantes com suas dúvidas de forma clara e didática."
            )),
            AIMessage(content=(
                "Olá! Sou seu assistente educacional. "
                "Estou aqui para ajudá-lo com seus estudos. "
                "Como posso auxiliá-lo hoje?"
            )),
        ]

        # Converter histórico
        for item in history:
            role = getattr(item, "role", None) or (item.get("role") if isinstance(item, dict) else None)
            # Extrair texto do histórico (aceita vários formatos)
            if hasattr(item, "content") and item.content:
                text = item.content
            elif hasattr(item, "parts") and item.parts:
                text = item.parts[0].get("text", "") if isinstance(item.parts[0], dict) else ""
            elif isinstance(item, dict):
                text = item.get("content", "")
                if not text and "parts" in item:
                    parts = item["parts"]
                    text = parts[0].get("text", "") if parts and isinstance(parts[0], dict) else ""
            else:
                text = ""

            text = str(text or "").strip()[:4000]
            if not text:
                continue

            if role in ("assistant", "model"):
                messages.append(AIMessage(content=text))
            else:
                messages.append(HumanMessage(content=text))

        # Adicionar mensagem atual do usuário
        messages.append(HumanMessage(content=sanitized))

        # Invocar LLM
        response = await self._llm.ainvoke(messages)
        return response.content

    # ── Sumarização ──────────────────────────────────────────────────────

    async def summarize(self, content: str, summary_type: str, feedback: str | None = None) -> str:
        """
        Gera um resumo/análise do conteúdo educacional.

        Os prompts são idênticos aos da edge function gemini-summarize.

        Args:
            content: Conteúdo a ser sumarizado.
            summary_type: Tipo de resumo desejado.
            feedback: Feedback opcional do usuário sobre análise anterior.

        Returns:
            Texto do resumo gerado.
        """
        # Contexto de feedback (idêntico à edge function)
        feedback_context = ""
        if feedback:
            feedback_context = (
                f'\n\nFEEDBACK DO USUÁRIO SOBRE ANÁLISE ANTERIOR:\n'
                f'"{feedback}"\n\n'
                f'Por favor, considere este feedback e melhore a análise '
                f'focando nos pontos mencionados pelo usuário.\n\n'
            )

        # Prompts idênticos à edge function gemini-summarize
        prompts: dict[str, str] = {
            "resumo": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Faça um resumo claro e conciso do seguinte conteúdo educacional. Use:\n"
                "- ## para títulos de seções principais\n"
                "- ### para subtítulos e tópicos importantes\n"
                "- **negrito** para conceitos e termos importantes\n"
                "- - para listas de tópicos\n"
                "- > para citações ou destaques relevantes\n\n"
                f"Destaque os pontos principais e conceitos importantes:{feedback_context}\n\n"
                f"{content}"
            ),
            "pontos-chave": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Extraia e liste os pontos-chave mais importantes do seguinte conteúdo. Use:\n"
                "- ## Pontos-Chave para o título\n"
                "- - **Termo/Conceito**: descrição para cada item\n"
                "- **negrito** para destacar conceitos principais\n\n"
                f"{feedback_context}\n\n"
                f"{content}"
            ),
            "perguntas": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Com base no seguinte conteúdo, gere 5-8 perguntas de estudo relevantes. Use:\n"
                "- ## Perguntas de Estudo para o título\n"
                "- ### para numerar cada pergunta (### 1. Pergunta...)\n"
                "- **negrito** para destacar conceitos nas perguntas\n"
                "- Organize por níveis: Básico, Intermediário, Avançado\n\n"
                f"{feedback_context}\n\n"
                f"{content}"
            ),
            "conceitos": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Identifique e explique os conceitos principais. Use:\n"
                "- ## Conceitos Principais para o título\n"
                "- ### para cada conceito\n"
                "- **negrito** para termos técnicos\n"
                "- - para listar características\n\n"
                f"{feedback_context}\n\n"
                f"{content}"
            ),
            "glossario": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Crie um glossário com os termos técnicos e importantes. Use:\n"
                "- ## Glossário de Termos para o título\n"
                "- - **Termo**: definição clara e objetiva\n"
                "- _itálico_ para exemplos ou observações\n\n"
                f"{feedback_context}\n\n"
                f"{content}"
            ),
            "mapa-mental": (
                "IMPORTANTE: Responda em Markdown com formatação rica.\n\n"
                "Crie um mapa mental estruturado. Use:\n"
                "- # para o tema central\n"
                "- ## para temas principais\n"
                "- ### para subtemas\n"
                "- - para detalhes e ramificações\n"
                "- **negrito** para conceitos-chave\n\n"
                f"{feedback_context}\n\n"
                f"{content}"
            ),
        }

        # Prompt padrão (fallback)
        prompt = prompts.get(
            summary_type,
            (
                "IMPORTANTE: Responda em Markdown com formatação rica "
                "(use ##, ###, **negrito**, listas, etc).\n\n"
                f"Analise o seguinte conteúdo educacional:{feedback_context}\n\n"
                f"{content}"
            ),
        )

        # Usar temperatura 0.3 para sumarização (idêntico à edge function)
        llm = self._llm.bind(temperature=0.3, max_output_tokens=8192)
        response = await llm.ainvoke([HumanMessage(content=prompt)])
        return response.content

    # ── Análise de Material ──────────────────────────────────────────────

    async def analyze(self, content: str, title: str | None = None, description: str | None = None) -> dict:
        """
        Analisa material educacional e retorna categoria, nível, tags e resumo.

        Prompt idêntico ao da edge function gemini-analyze.

        Args:
            content: Conteúdo do material.
            title: Título do material (opcional).
            description: Descrição do material (opcional).

        Returns:
            Dicionário com category, level, tags e summary.
        """
        prompt = (
            "\nAnalise o seguinte material educacional e forneça:\n"
            "1. Categoria/Matéria principal (ex: Matemática, História, Ciências, etc.)\n"
            "2. Nível de dificuldade (Básico, Intermediário, Avançado)\n"
            "3. Tags relevantes (máximo 5)\n"
            "4. Breve descrição do conteúdo (1-2 frases)\n\n"
            "Material:\n"
            f"Título: {title or 'Não informado'}\n"
            f"Descrição: {description or 'Não informado'}\n"
            f"Conteúdo: {content or 'Não informado'}\n\n"
            "Responda no formato JSON:\n"
            "{\n"
            '  "category": "categoria",\n'
            '  "level": "nivel",\n'
            '  "tags": ["tag1", "tag2", "tag3"],\n'
            '  "summary": "breve descrição"\n'
            "}\n"
        )

        # Temperatura 0.1 (idêntico à edge function)
        llm = self._llm.bind(temperature=0.1, max_output_tokens=512)
        response = await llm.ainvoke([HumanMessage(content=prompt)])

        try:
            analysis = self._parse_json_response(response.content)
        except ValueError:
            logger.warning("Falha ao fazer parse do JSON de análise, usando fallback")
            analysis = {
                "category": "Geral",
                "level": "Intermediário",
                "tags": ["educação", "estudo"],
                "summary": "Material educacional para análise",
            }

        return analysis

    # ── Quiz ─────────────────────────────────────────────────────────────

    async def generate_quiz(self, content: str, title: str) -> dict:
        """
        Gera 5 questões de múltipla escolha a partir do conteúdo.

        Prompt idêntico ao da edge function generate-quiz.

        Args:
            content: Conteúdo base para as questões.
            title: Título do material.

        Returns:
            Dicionário com lista de questions.
        """
        prompt = (
            f'Você é um professor criando um quiz sobre "{title}".\n\n'
            "Com base EXCLUSIVAMENTE no seguinte conteúdo, crie 5 perguntas de múltipla escolha:\n\n"
            f"{content}\n\n"
            "REGRAS OBRIGATÓRIAS:\n"
            "1. As perguntas DEVEM ser sobre o conteúdo fornecido acima\n"
            "2. Cada pergunta deve ter 4 opções (apenas 1 correta)\n"
            "3. As perguntas devem cobrir diferentes partes do conteúdo\n"
            "4. Não invente informações que não estão no texto\n"
            "5. Faça perguntas específicas, não genéricas\n\n"
            "Retorne APENAS um JSON válido neste formato exato, sem markdown:\n"
            "{\n"
            '  "questions": [\n'
            "    {\n"
            '      "question": "Pergunta específica sobre o conteúdo?",\n'
            '      "options": ["Opção A", "Opção B", "Opção C", "Opção D"],\n'
            '      "correctAnswer": 0\n'
            "    }\n"
            "  ]\n"
            "}\n\n"
            "O índice correctAnswer deve ser de 0 a 3."
        )

        # Temperatura 0.7 (idêntico à edge function)
        llm = self._llm.bind(temperature=0.7, max_output_tokens=2048)
        response = await llm.ainvoke([HumanMessage(content=prompt)])

        try:
            quiz_data = self._parse_json_response(response.content)
        except ValueError:
            logger.error("Falha ao fazer parse do JSON do quiz")
            raise ValueError("Não foi possível gerar o quiz. Tente novamente.")

        # Garantir formato correto
        if isinstance(quiz_data, dict) and "questions" in quiz_data:
            return quiz_data
        if isinstance(quiz_data, list):
            return {"questions": quiz_data}
        return {"questions": []}

    # ── Flashcards ───────────────────────────────────────────────────────

    async def generate_flashcards(self, content: str, title: str) -> dict:
        """
        Gera 6-8 flashcards de estudo a partir do conteúdo.

        Prompt idêntico ao da edge function generate-flashcards, incluindo
        todas as regras de precisão semântica e validação.

        Args:
            content: Conteúdo base para os flashcards.
            title: Título do material.

        Returns:
            Dicionário com lista de flashcards.
        """
        prompt = (
            "⚠️ AVISO CRÍTICO DE CHECAGEM DE INFORMAÇÕES ⚠️\n\n"
            "Você DEVE agir como um verificador de fatos rigoroso. \n"
            "NUNCA invente, deduza ou infira informações que não estão EXPLICITAMENTE no texto fornecido.\n"
            "Se um conceito não estiver claramente definido no material, NÃO crie um flashcard sobre ele.\n"
            "É PREFERÍVEL ter 3 flashcards corretos do que 8 flashcards com informações inventadas.\n\n"
            f'Você está criando flashcards de estudo sobre "{title}".\n\n'
            "Ao gerar flashcards, seu objetivo principal é criar pares 'Termo/Definição' semanticamente precisos.\n\n"
            "## A REGRA CENTRAL: Definição Direta e Concisa\n\n"
            "- O TERMO deve ser um conceito-chave (substantivo, nome próprio, processo)\n"
            "- A DEFINIÇÃO deve ser uma resposta concisa e direta ao que é o conceito\n"
            '- NUNCA comece a definição com "O que é", "O que significa" ou qualquer pergunta\n'
            '- Vá direto ao ponto: "Processo de...", "Indivíduos que...", "Princípio do..."\n\n'
            "## A REGRA DE OURO: Evite Confusões Semânticas\n\n"
            "### ❌ NÃO CONFUNDA DEFINIÇÃO COM EXEMPLO/CONSEQUÊNCIA:\n\n"
            "Forma Incorreta:\n"
            "Termo: Gêmeos Idênticos\n"
            "Definição: Podem ter fenótipos diferentes devido ao ambiente.\n"
            "(Isso é uma consequência, não a definição)\n\n"
            "Forma Correta:\n"
            "Termo: Gêmeos Idênticos\n"
            "Definição: Indivíduos originados de um único zigoto, que compartilham o mesmo genótipo (DNA).\n\n"
            "### ❌ NÃO CONFUNDA DEFINIÇÃO COM RELAÇÃO:\n\n"
            "Forma Incorreta:\n"
            "Termo: Dogma Central\n"
            "Definição: É contestado pela epigenética sobre o determinismo genético.\n"
            "(Isso é uma relação, não a definição)\n\n"
            "Forma Correta:\n"
            "Termo: Dogma Central\n"
            "Definição: O princípio do fluxo da informação genética: DNA → RNA → Proteína.\n\n"
            "## INSTRUÇÕES:\n\n"
            "Com base EXCLUSIVAMENTE no seguinte conteúdo, crie 6-8 pares de flashcards:\n\n"
            f"{content}\n\n"
            "REGRAS OBRIGATÓRIAS:\n"
            "1. Selecione os substantivos e conceitos MAIS IMPORTANTES do texto\n"
            "2. Para cada conceito, extraia apenas sua DEFINIÇÃO FUNDAMENTAL\n"
            "3. Cada TERMO deve ser um conceito-chave (não uma pergunta)\n"
            "4. Cada DEFINIÇÃO deve ser clara e concisa, indo DIRETO ao ponto\n"
            '5. NÃO comece definições com "O que é", "O que significa" ou perguntas\n'
            "6. NÃO use exemplos, consequências ou relações como definições\n"
            "7. Extraia apenas informações que EXISTEM no texto\n"
            "8. É melhor ter MENOS flashcards corretos do que muitos confusos\n"
            '9. Formato ideal: "Processo de...", "Indivíduos que...", "Princípio do..."\n\n'
            "VALIDAÇÃO FINAL:\n"
            "Antes de retornar os flashcards, revise cada um e pergunte-se:\n"
            '"Esta definição está LITERALMENTE no texto fornecido?"\n'
            "Se a resposta for não, remova o flashcard.\n\n"
            "Retorne APENAS um JSON válido neste formato exato, sem markdown:\n"
            "{\n"
            '  "flashcards": [\n'
            "    {\n"
            '      "term": "Conceito-Chave",\n'
            '      "definition": "Explicação clara e concisa (SEM iniciar com \'O que é\' ou perguntas)"\n'
            "    }\n"
            "  ]\n"
            "}"
        )

        # Usar mensagem de sistema para contexto (idêntico à edge function)
        messages = [
            SystemMessage(content=(
                "Você é um assistente especializado em criar flashcards educacionais "
                "de alta qualidade. Retorne sempre JSON válido."
            )),
            HumanMessage(content=prompt),
        ]

        llm = self._llm.bind(temperature=0.7, max_output_tokens=2048)
        response = await llm.ainvoke(messages)

        try:
            flashcards_data = self._parse_json_response(response.content)
        except ValueError:
            logger.error("Falha ao fazer parse do JSON dos flashcards")
            raise ValueError("Não foi possível gerar os flashcards. Tente novamente.")

        # Garantir formato correto
        if isinstance(flashcards_data, dict) and "flashcards" in flashcards_data:
            return flashcards_data
        if isinstance(flashcards_data, list):
            return {"flashcards": flashcards_data}
        return {"flashcards": []}

    # ── RAG Query ────────────────────────────────────────────────────────

    async def rag_query(self, query: str, context_docs: list[str]) -> str:
        """
        Responde a uma consulta baseada em documentos de contexto (RAG).

        Args:
            query: Pergunta do usuário.
            context_docs: Lista de trechos relevantes do documento.

        Returns:
            Resposta gerada com base no contexto.
        """
        context = "\n\n---\n\n".join(context_docs)

        prompt = (
            "Você é um assistente educacional especializado. "
            "Responda à pergunta do usuário com base EXCLUSIVAMENTE no contexto fornecido abaixo.\n\n"
            "Se a informação não estiver no contexto, diga que não encontrou a informação "
            "no material disponível.\n\n"
            "IMPORTANTE: Responda em Markdown com formatação rica quando apropriado.\n\n"
            f"## Contexto do Material:\n\n{context}\n\n"
            f"## Pergunta do Usuário:\n\n{query}\n\n"
            "## Resposta:"
        )

        response = await self._llm.ainvoke([HumanMessage(content=prompt)])
        return response.content


# Instância global reutilizável
langchain_service = LangChainService()
