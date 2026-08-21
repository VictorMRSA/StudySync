"""
Router de flashcards — gera flashcards de estudo a partir do conteúdo.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import FlashcardRequest, FlashcardResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Flashcards"])


@router.post(
    "/flashcards",
    response_model=FlashcardResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_flashcards(request: FlashcardRequest) -> FlashcardResponse:
    """Gera 6-8 flashcards de estudo a partir do conteúdo."""
    if not request.content or not request.content.strip():
        raise HTTPException(
            status_code=400,
            detail="Conteúdo é obrigatório para gerar flashcards",
        )

    if not request.title or not request.title.strip():
        raise HTTPException(
            status_code=400,
            detail="Título é obrigatório para gerar flashcards",
        )

    try:
        flashcards_data = await langchain_service.generate_flashcards(
            content=request.content,
            title=request.title,
        )
        return FlashcardResponse(
            flashcards=flashcards_data.get("flashcards", []),
            success=True,
        )
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        logger.error("Erro ao gerar flashcards: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao gerar flashcards: {str(e)}",
        )
