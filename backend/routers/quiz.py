"""
Router de quiz — gera questões de múltipla escolha a partir do conteúdo.
Usa StreamingResponse com keepalive imediato para evitar timeout 524 do Cloudflare.
"""

import logging
import json
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import QuizRequest, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Quiz"])


@router.post(
    "/quiz",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def generate_quiz(request: QuizRequest):
    """
    Gera questões de múltipla escolha via streaming com keepalive imediato.
    O keepalive é enviado antes de iniciar a geração para evitar timeout 524 do Cloudflare.
    """
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo é obrigatório para gerar o quiz")

    if not request.title or not request.title.strip():
        raise HTTPException(status_code=400, detail="Título é obrigatório para gerar o quiz")

    async def generate():
        # Cria uma task para rodar a geração em background
        task = asyncio.create_task(
            langchain_service.generate_quiz(
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
            quiz_data = task.result()
            questions = quiz_data.get("questions", [])
            yield f"data: {json.dumps({'questions': questions, 'success': True, 'done': True})}\n\n"

        except Exception as e:
            logger.error("Erro ao gerar quiz: %s", e, exc_info=True)
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
