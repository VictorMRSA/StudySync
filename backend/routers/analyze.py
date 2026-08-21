"""
Router de análise — analisa material educacional e retorna metadados.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import AnalyzeRequest, AnalyzeResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Análise"])


@router.post(
    "/analyze",
    response_model=AnalyzeResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def analyze(request: AnalyzeRequest) -> AnalyzeResponse:
    """Analisa material educacional e retorna categoria, nível, tags e resumo."""
    if not request.content or not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Conteúdo é obrigatório para análise",
        )

    try:
        analysis = await langchain_service.analyze(
            content=request.content,
            title=request.title,
            description=request.description,
        )
        return AnalyzeResponse(analysis=analysis, success=True)
    except Exception as e:
        logger.error("Erro na análise: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao analisar material: {str(e)}",
        )
