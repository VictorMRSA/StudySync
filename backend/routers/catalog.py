"""
Router do catálogo — gera a ficha (matéria, resumo, tópicos/unidades) de um material
para a Biblioteca IA.
"""

import logging

from fastapi import APIRouter, HTTPException

from models.schemas import CatalogGenerateRequest, CatalogGenerateResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/catalog", tags=["Catálogo"])


@router.post(
    "/generate",
    response_model=CatalogGenerateResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_catalog_entry(request: CatalogGenerateRequest) -> CatalogGenerateResponse:
    """Gera a ficha de catálogo de um material a partir do texto extraído."""
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo é obrigatório para catalogar")

    try:
        entry = await langchain_service.catalog_entry(
            content=request.content,
            title=request.title,
            description=request.description,
            class_name=request.class_name,
        )
        return CatalogGenerateResponse(**entry, success=True)
    except Exception as e:
        logger.error("Erro ao gerar ficha de catálogo: %s", e, exc_info=True)
        raise HTTPException(status_code=500, detail=f"Erro ao catalogar material: {str(e)}")
