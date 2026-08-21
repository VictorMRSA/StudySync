"""
Router de sumarização — gera resumos, pontos-chave, glossários, etc.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import SummarizeRequest, SummarizeResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Sumarização"])


@router.post(
    "/summarize",
    response_model=SummarizeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def summarize(request: SummarizeRequest) -> SummarizeResponse:
    """Gera um resumo ou análise do conteúdo educacional."""
    if not request.content or not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Conteúdo é obrigatório",
        )

    try:
        result = await langchain_service.summarize(
            content=request.content,
            summary_type=request.type,
            feedback=request.feedback,
        )
        return SummarizeResponse(
            result=result,
            type=request.type,
            success=True,
        )
    except Exception as e:
        logger.error("Erro na sumarização: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao sumarizar conteúdo: {str(e)}",
        )
