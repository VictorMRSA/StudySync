"""
Router de sumarização — gera resumos, pontos-chave, glossários, etc.
Usa StreamingResponse com keepalive imediato para evitar timeout do Cloudflare (524).
"""

import logging
import json
import asyncio

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import SummarizeRequest, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Sumarização"])


@router.post(
    "/summarize",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def summarize(request: SummarizeRequest):
    """
    Gera um resumo via streaming com keepalive imediato.
    O keepalive é enviado antes de iniciar a geração para evitar timeout 524 do Cloudflare.
    """
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo é obrigatório")

    async def generate():
        # ── Keepalive imediato ────────────────────────────────────────────────
        # Enviado ANTES de chamar o Ollama para manter a conexão viva.
        # Sem isso o Cloudflare cancela com 524 antes do primeiro token.
        yield f"data: {json.dumps({'keepalive': True})}\n\n"
        await asyncio.sleep(0)  # Garante que o dado foi flushed

        full_text = ""
        keepalive_count = 0

        try:
            async for chunk in langchain_service.summarize_stream(
                content=request.content,
                summary_type=request.type,
                feedback=request.feedback,
            ):
                full_text += chunk
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

                # Keepalive extra a cada ~30 chunks para prevenir timeout em documentos longos
                keepalive_count += 1
                if keepalive_count % 30 == 0:
                    yield f"data: {json.dumps({'keepalive': True})}\n\n"

            # Resultado final
            yield f"data: {json.dumps({'result': full_text, 'type': request.type, 'success': True, 'done': True})}\n\n"

        except Exception as e:
            logger.error("Erro na sumarização: %s", e, exc_info=True)
            yield f"data: {json.dumps({'error': str(e), 'success': False})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",      # Desativa buffer nginx/Cloudflare
            "Connection": "keep-alive",
        },
    )
