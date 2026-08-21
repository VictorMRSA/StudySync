"""
Schemas Pydantic para requisições e respostas da API Study Sync.
"""

from pydantic import BaseModel, Field


# ─── Chat ────────────────────────────────────────────────────────────────────

class ChatMessagePart(BaseModel):
    """Parte de uma mensagem do histórico de chat."""
    role: str
    parts: list[dict[str, str]] | None = None
    content: str | None = None


class ChatRequest(BaseModel):
    """Requisição para o endpoint de chat."""
    message: str
    history: list[ChatMessagePart] = Field(default_factory=list)


class ChatResponse(BaseModel):
    """Resposta do endpoint de chat."""
    response: str
    success: bool = True


# ─── Resumo / Sumarização ───────────────────────────────────────────────────

class SummarizeRequest(BaseModel):
    """Requisição para o endpoint de sumarização."""
    content: str
    type: str = "resumo"
    feedback: str | None = None


class SummarizeResponse(BaseModel):
    """Resposta do endpoint de sumarização."""
    result: str
    type: str
    success: bool = True


# ─── Análise ─────────────────────────────────────────────────────────────────

class AnalyzeRequest(BaseModel):
    """Requisição para o endpoint de análise de material."""
    content: str
    title: str | None = None
    description: str | None = None


class AnalyzeResponse(BaseModel):
    """Resposta do endpoint de análise de material."""
    analysis: dict
    success: bool = True


# ─── Quiz ────────────────────────────────────────────────────────────────────

class QuizRequest(BaseModel):
    """Requisição para geração de quiz."""
    content: str
    title: str


class QuizResponse(BaseModel):
    """Resposta com questões de quiz geradas."""
    questions: list
    success: bool = True


# ─── Flashcards ──────────────────────────────────────────────────────────────

class FlashcardRequest(BaseModel):
    """Requisição para geração de flashcards."""
    content: str
    title: str


class FlashcardResponse(BaseModel):
    """Resposta com flashcards gerados."""
    flashcards: list
    success: bool = True


# ─── Documentos / Upload ────────────────────────────────────────────────────

class DocumentUploadResponse(BaseModel):
    """Resposta do upload e processamento de documento."""
    content: str
    success: bool = True
    file_name: str


# ─── RAG ─────────────────────────────────────────────────────────────────────

class RAGQueryRequest(BaseModel):
    """Requisição para consulta RAG."""
    query: str
    session_id: str


class RAGQueryResponse(BaseModel):
    """Resposta de consulta RAG."""
    answer: str
    sources: list[str] = Field(default_factory=list)
    success: bool = True


# ─── Erro ────────────────────────────────────────────────────────────────────

class ErrorResponse(BaseModel):
    """Resposta de erro padronizada."""
    error: str
    success: bool = False
