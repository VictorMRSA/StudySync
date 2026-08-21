"""
Router de documentos — upload de arquivos e consultas RAG.
"""

import logging
import uuid

from fastapi import APIRouter, HTTPException, UploadFile, File, Form

from models.schemas import (
    DocumentUploadResponse,
    ErrorResponse,
    RAGQueryRequest,
    RAGQueryResponse,
)
from services.document_processor import document_processor
from services.langchain_service import langchain_service
from services.vector_store import vector_store_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["Documentos"])

# Tamanho máximo do arquivo: 20 MB
MAX_FILE_SIZE = 20 * 1024 * 1024


@router.post(
    "/documents/upload",
    response_model=DocumentUploadResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def upload_document(
    file: UploadFile = File(...),
    create_vector_store: bool = Form(default=False),
    session_id: str = Form(default=""),
) -> DocumentUploadResponse:
    """
    Faz upload e processa um documento, extraindo seu texto.

    Opcionalmente cria um vector store FAISS para consultas RAG.
    """
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Arquivo não fornecido",
        )

    # Verificar tamanho do arquivo
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Arquivo muito grande (máximo 20 MB)",
        )
    # Rebobinar o arquivo para os parsers
    await file.seek(0)

    try:
        text, filename = await document_processor.process(file)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error("Erro ao processar documento: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao processar documento: {str(e)}",
        )

    # Criar vector store se solicitado
    if create_vector_store:
        try:
            sid = session_id if session_id else str(uuid.uuid4())
            vector_store_service.create_store(sid, text)
            logger.info("Vector store criado para sessão: %s", sid)
        except Exception as e:
            logger.warning(
                "Falha ao criar vector store (upload continua): %s", e
            )

    return DocumentUploadResponse(
        content=text,
        success=True,
        file_name=filename,
    )


@router.post(
    "/rag/query",
    response_model=RAGQueryResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}},
)
async def rag_query(request: RAGQueryRequest) -> RAGQueryResponse:
    """Consulta o material do documento usando RAG (Retrieval-Augmented Generation)."""
    if not request.query or not request.query.strip():
        raise HTTPException(
            status_code=400,
            detail="Query é obrigatória",
        )

    if not request.session_id or not request.session_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Session ID é obrigatório",
        )

    # Verificar se o vector store existe
    if not vector_store_service.store_exists(request.session_id):
        raise HTTPException(
            status_code=404,
            detail="Nenhum documento encontrado para esta sessão. "
                   "Faça upload de um documento primeiro.",
        )

    try:
        # Buscar documentos relevantes
        context_docs = vector_store_service.query(
            session_id=request.session_id,
            query=request.query,
            k=4,
        )

        # Gerar resposta com RAG
        answer = await langchain_service.rag_query(
            query=request.query,
            context_docs=context_docs,
        )

        return RAGQueryResponse(
            answer=answer,
            sources=context_docs,
            success=True,
        )
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error("Erro na consulta RAG: %s", e, exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Erro ao consultar documento: {str(e)}",
        )
