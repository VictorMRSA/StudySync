"""
Router de chat — endpoint de conversa com o assistente educacional.
Usa StreamingResponse com keepalive imediato para evitar timeout 524 do Cloudflare.
"""

import logging
import json
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import ChatRequest, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Chat"])


@router.post(
    "/chat",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def chat(request: ChatRequest):
    """
    Processa uma mensagem de chat e retorna a resposta via streaming com keepalive imediato.
    """
    message = request.message.strip()

    if not message:
        raise HTTPException(status_code=400, detail="Mensagem não pode estar vazia")

    if len(message) > 2000:
        raise HTTPException(status_code=400, detail="Mensagem muito longa (máximo 2000 caracteres)")

    if len(request.history) > 50:
        raise HTTPException(status_code=400, detail="Histórico muito longo (máximo 50 mensagens)")

    async def generate():
        # Keepalive imediato
        yield f"data: {json.dumps({'keepalive': True})}\n\n"
        await asyncio.sleep(0)

        full_text = ""
        keepalive_count = 0

        try:
            async for chunk in langchain_service.chat_stream(message, request.history):
                full_text += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                keepalive_count += 1
                if keepalive_count % 30 == 0:
                    yield f"data: {json.dumps({'keepalive': True})}\n\n"

            yield f"data: {json.dumps({'response': full_text, 'success': True, 'done': True})}\n\n"

        except Exception as e:
            logger.error("Erro no chat: %s", e, exc_info=True)
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
