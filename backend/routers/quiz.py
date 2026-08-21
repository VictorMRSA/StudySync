"""
Router de quiz — gera questões de múltipla escolha a partir do conteúdo.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import QuizRequest, QuizResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Quiz"])


@router.post(
    "/quiz",
    response_model=QuizResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_quiz(request: QuizRequest) -> QuizResponse:
    """Gera 5 questões de múltipla escolha a partir do conteúdo."""
    if not request.content or not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Conteúdo é obrigatório para gerar o quiz",
        )

    if not request.title or not request.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Título é obrigatório para gerar o quiz",
        )

    try:
        quiz_data = await langchain_service.generate_quiz(
            content=request.content,
            title=request.title,
        )
        return QuizResponse(
            questions=quiz_data.get("questions", []),
            success=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Erro ao gerar quiz: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar quiz: {str(e)}",
        )
