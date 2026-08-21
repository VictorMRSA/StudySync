"""
Router de chat — endpoint de conversa com o assistente educacional.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import ChatRequest, ChatResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post(
    "/chat",
    response_model=ChatResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def chat(request: ChatRequest) -> ChatResponse:
    """Processa uma mensagem de chat e retorna a resposta do assistente."""
    # Validação de tamanho da mensagem
    message = request.message.strip()

    if not message:
        raise HTTPException(
            status_code=400,
            detail="Mensagem não pode estar vazia",
        )

    if len(message) > 2000:
        raise HTTPException(
            status_code=400,
            detail="Mensagem muito longa (máximo 2000 caracteres)",
        )

    # Validação do histórico
    if len(request.history) > 50:
        raise HTTPException(
            status_code=400,
            detail="Histórico muito longo (máximo 50 mensagens)",
        )

    try:
        response_text = await langchain_service.chat(message, request.history)
        return ChatResponse(response=response_text, success=True)
    except Exception as e:
        logger.error("Erro no chat: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar mensagem: {str(e)}",
        )
