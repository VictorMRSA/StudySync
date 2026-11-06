"""
Núcleo puro da Biblioteca IA (sem dependência de LLM, testável isoladamente).

- normalize_entry: higieniza a ficha vinda do LLM / do banco.
- format_catalog: monta o bloco de texto enviado ao modelo, respeitando um orçamento.
- parse_study_set: extrai a seleção `<studyset>D1,D4</studyset>` da resposta.
"""

import re
from typing import Any

MAX_SUMMARY_CHARS = 400
MAX_TOPICS = 12
MAX_TOPIC_CHARS = 120
DEFAULT_BUDGET_CHARS = 60_000


def _clean(text: Any, limit: int) -> str:
    value = re.sub(r"\s+", " ", str(text or "")).strip()
    return value[:limit]


def normalize_entry(raw: dict | None) -> dict:
    """Garante o formato {subject, summary, topics[]} com tamanhos limitados."""
    raw = raw or {}
    topics_raw = raw.get("topics") or []
    if isinstance(topics_raw, str):
        topics_raw = [t for t in re.split(r"[\n;]+", topics_raw)]

    topics: list[str] = []
    for item in topics_raw:
        topic = _clean(item, MAX_TOPIC_CHARS)
        if topic and topic not in topics:
            topics.append(topic)
        if len(topics) >= MAX_TOPICS:
            break

    return {
        "subject": _clean(raw.get("subject") or raw.get("category"), 80),
        "summary": _clean(raw.get("summary"), MAX_SUMMARY_CHARS),
        "topics": topics,
    }


def _render(entry: dict, include_topics: bool, summary_limit: int) -> str:
    lines = [f"[{entry['ref']}] {entry['title']}"]
    lines.append(f"  Turma: {entry.get('class_name') or 'Sem turma'}")
    if entry.get("subject"):
        lines.append(f"  Matéria: {entry['subject']}")
    if entry.get("date"):
        lines.append(f"  Data: {entry['date']}")
    summary = _clean(entry.get("summary"), summary_limit)
    if summary:
        lines.append(f"  Resumo: {summary}")
    topics = entry.get("topics") or []
    if include_topics and topics:
        lines.append("  Tópicos: " + " | ".join(topics))
    return "\n".join(lines)


def format_catalog(entries: list[dict], budget: int = DEFAULT_BUDGET_CHARS) -> tuple[str, bool]:
    """
    Renderiza o catálogo. Retorna (texto, truncado).

    Degradação para caber no orçamento: (1) tudo; (2) sem tópicos;
    (3) resumos curtos; (4) corta documentos do fim da lista.
    """
    if not entries:
        return "", False

    attempts = [(True, MAX_SUMMARY_CHARS), (False, MAX_SUMMARY_CHARS), (False, 120)]
    for include_topics, summary_limit in attempts:
        blocks = [_render(e, include_topics, summary_limit) for e in entries]
        text = "\n\n".join(blocks)
        if len(text) <= budget:
            return text, False

    blocks = [_render(e, False, 120) for e in entries]
    kept: list[str] = []
    used = 0
    for block in blocks:
        if used + len(block) + 2 > budget:
            break
        kept.append(block)
        used += len(block) + 2
    return "\n\n".join(kept), True


_STUDYSET_RE = re.compile(r"<studyset>(.*?)</studyset>", re.IGNORECASE | re.DOTALL)
_REF_RE = re.compile(r"\bD\d+\b", re.IGNORECASE)


def parse_study_set(text: str) -> list[str]:
    """Extrai refs (D1, D4...) do bloco <studyset>, sem duplicatas, na ordem."""
    match = _STUDYSET_RE.search(text or "")
    if not match:
        return []
    refs: list[str] = []
    for ref in _REF_RE.findall(match.group(1)):
        ref = ref.upper()
        if ref not in refs:
            refs.append(ref)
    return refs


def strip_study_set(text: str) -> str:
    """Remove o bloco <studyset> do texto exibido ao usuário."""
    return _STUDYSET_RE.sub("", text or "").strip()


# ── Prompts (puros, para poderem ser testados sem LLM) ───────────────────────

MAX_GENERATION_CHARS = 12_000


def build_catalog_prompt(
    content: str,
    title: str | None = None,
    description: str | None = None,
    class_name: str | None = None,
) -> str:
    """Prompt que pede a ficha de catálogo (matéria, resumo, tópicos/unidades) em JSON."""
    excerpt = (content or "")[:MAX_GENERATION_CHARS]
    return (
        "Você cataloga materiais de estudo para uma biblioteca acadêmica.\n"
        "Leia o material e produza a ficha de catálogo.\n\n"
        "REGRAS:\n"
        "- subject: a matéria/disciplina (ex: Cálculo I, Direito Penal).\n"
        "- summary: 2 a 3 frases objetivas sobre o conteúdo (máx. 400 caracteres).\n"
        "- topics: até 12 itens curtos. Se o material indicar unidades, módulos, aulas ou "
        "capítulos, escreva o rótulo EXPLÍCITO no item, ex: \"Unidade 3: Derivadas\", "
        "\"Capítulo 2: Limites\". Nunca invente unidades que o texto não mostra.\n"
        "- Responda SOMENTE com JSON válido, sem texto antes ou depois.\n\n"
        f"Título: {title or 'Não informado'}\n"
        f"Descrição: {description or 'Não informado'}\n"
        f"Turma: {class_name or 'Não informada'}\n"
        f"Conteúdo:\n{excerpt}\n\n"
        "Formato:\n"
        '{"subject": "...", "summary": "...", "topics": ["...", "..."]}'
    )


def build_library_instruction(catalog_text: str, truncated: bool = False) -> str:
    """Instrução de sistema do modo Biblioteca (catálogo de fichas, não o texto completo)."""
    aviso = (
        "\nATENÇÃO: o catálogo foi truncado por tamanho; avise o usuário que alguns "
        "documentos podem não estar listados.\n"
        if truncated
        else ""
    )
    return (
        "Você é o bibliotecário acadêmico do StudySync no modo 'Biblioteca'.\n"
        "Você enxerga o CATÁLOGO de fichas dos documentos das turmas do estudante "
        "(título, turma de origem, matéria, resumo e tópicos/unidades). "
        "Você NÃO vê o texto completo dos documentos.\n\n"
        "DIRETRIZES OBRIGATÓRIAS:\n"
        "1. Baseie-se SOMENTE no catálogo. Nunca invente documentos, unidades ou turmas.\n"
        "2. Ao listar documentos, use o formato: **[D#] Título** — Turma: X — motivo curto.\n"
        "3. Para perguntas sobre unidades/temas, use os campos Tópicos e Resumo; se um "
        "documento só cobre parte do pedido, diga qual parte.\n"
        "4. Se nenhum documento contemplar o pedido, diga isso claramente.\n"
        "5. Se o estudante pedir para SEPARAR/SELECIONAR documentos (ex: para estudar para uma "
        "prova), liste-os e, ao final da resposta, acrescente exatamente uma linha no formato "
        "<studyset>D1,D4</studyset> com os códigos [D#] escolhidos. Só inclua essa linha "
        "quando houver seleção.\n"
        "6. Para dúvidas de conteúdo que exijam o texto, sugira usar o modo SyncDocs com os "
        "documentos indicados.\n"
        "7. Responda em Markdown, de forma concisa.\n"
        f"{aviso}\n"
        f"## CATÁLOGO DA BIBLIOTECA:\n{catalog_text}"
    )
