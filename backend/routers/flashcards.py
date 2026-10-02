"""
Router de flashcards — gera flashcards de estudo a partir do conteúdo.
Usa StreamingResponse com keepalive imediato para evitar timeout 524 do Cloudflare.
"""

import logging
import json
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import FlashcardRequest, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Flashcards"])


@router.post(
    "/flashcards",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_flashcards(request: FlashcardRequest):
    """
    Gera flashcards de estudo via streaming com keepalive imediato.
    O keepalive é enviado antes de iniciar a geração para evitar timeout 524 do Cloudflare.
    """
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo é obrigatório para gerar flashcards")

    if not request.title or not request.title.strip():
        raise HTTPException(status_code=400, detail="Título é obrigatório para gerar flashcards")

    async def generate():
        # Cria uma task para rodar a geração em background
        task = asyncio.create_task(
            langchain_service.generate_flashcards(
                content=request.content,
                title=request.title,
            )
        )

        # Envia keepalive a cada 5 segundos enquanto a task não terminar.
        # Impede o Cloudflare 524 timeout mesmo se o Ollama demorar vários minutos no CPU.
        while not task.done():
            yield f"data: {json.dumps({'keepalive': True})}\n\n"
            await asyncio.sleep(5)

        try:
            flashcards_data = task.result()
            flashcards = flashcards_data.get("flashcards", [])
            yield f"data: {json.dumps({'flashcards': flashcards, 'success': True, 'done': True})}\n\n"

        except Exception as e:
            logger.error("Erro ao gerar flashcards: %s", e, exc_info=True)
            yield f"data: {json.dumps({'error': str(e), 'success': False})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )
