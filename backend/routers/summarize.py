"""
Router de sumarização — gera resumos, pontos-chave, glossários, etc.
Usa StreamingResponse para evitar timeout do Cloudflare em respostas longas.
"""

import logging
import json

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.schemas import SummarizeRequest, SummarizeResponse, ErrorResponse
from services.langchain_service import langchain_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Sumarização"])


@router.post(
    "/summarize",
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def summarize(request: SummarizeRequest):
    """Gera um resumo ou análise do conteúdo educacional via streaming."""
    if not request.content or not request.content.strip():
        raise HTTPException(status_code=400, detail="Conteúdo é obrigatório")

    async def generate():
        """Gera tokens em streaming e ao final envia o JSON completo."""
        full_text = ""
        try:
            # Stream token por token do Ollama
            async for chunk in langchain_service.summarize_stream(
                content=request.content,
                summary_type=request.type,
                feedback=request.feedback,
            ):
                full_text += chunk
                # Envia cada chunk como Server-Sent Event para manter a conexão viva
                yield f"data: {json.dumps({'chunk': chunk})}\n\n"

            # Ao final, envia o resultado completo
            yield f"data: {json.dumps({'result': full_text, 'type': request.type, 'success': True, 'done': True})}\n\n"

        except Exception as e:
            logger.error("Erro na sumarização: %s", e, exc_info=True)
            yield f"data: {json.dumps({'error': str(e), 'success': False})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",  # Desativa buffer do nginx/Cloudflare
        },
    )
