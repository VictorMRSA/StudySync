"""
Serviço de armazenamento vetorial com FAISS.
Gerencia criação, persistência e consulta de vector stores por sessão.
"""

import logging
import os

from langchain_community.vectorstores import FAISS
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

from config import settings

logger = logging.getLogger(__name__)


class VectorStoreService:
    """Gerencia vector stores FAISS para consultas RAG."""

    def __init__(self) -> None:
        self._base_path = settings.VECTOR_STORE_PATH
        os.makedirs(self._base_path, exist_ok=True)
        logger.info("VectorStoreService inicializado. Path: %s", self._base_path)

    def _get_embeddings(self) -> GoogleGenerativeAIEmbeddings:
        """Retorna instância de embeddings do Google Generative AI."""
        return GoogleGenerativeAIEmbeddings(
            model="models/embedding-001",
            google_api_key=settings.GEMINI_API_KEY,
        )

    def _get_store_path(self, session_id: str) -> str:
        """Retorna o caminho de armazenamento para uma sessão específica."""
        return os.path.join(self._base_path, session_id)

    def store_exists(self, session_id: str) -> bool:
        """Verifica se já existe um vector store para a sessão."""
        store_path = self._get_store_path(session_id)
        index_file = os.path.join(store_path, "index.faiss")
        return os.path.exists(index_file)

    def create_store(self, session_id: str, text: str) -> FAISS:
        """
        Cria um vector store FAISS a partir de texto.

        Divide o texto em chunks, gera embeddings e persiste localmente.

        Args:
            session_id: Identificador da sessão/documento.
            text: Texto completo do documento.

        Returns:
            Instância do FAISS vector store criado.
        """
        logger.info("Criando vector store para sessão: %s", session_id)

        # Dividir texto em chunks
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len,
            separators=["\n\n", "\n", ". ", " ", ""],
        )
        documents = splitter.create_documents([text])
        logger.info("Texto dividido em %d chunks", len(documents))

        # Criar vector store com FAISS
        embeddings = self._get_embeddings()
        vector_store = FAISS.from_documents(documents, embeddings)

        # Persistir localmente
        store_path = self._get_store_path(session_id)
        vector_store.save_local(store_path)
        logger.info("Vector store salvo em: %s", store_path)

        return vector_store

    def query(self, session_id: str, query: str, k: int = 4) -> list[str]:
        """
        Consulta o vector store de uma sessão por similaridade.

        Args:
            session_id: Identificador da sessão/documento.
            query: Texto da consulta do usuário.
            k: Número máximo de documentos relevantes a retornar.

        Returns:
            Lista com o conteúdo dos documentos mais relevantes.

        Raises:
            FileNotFoundError: Se o vector store da sessão não existir.
        """
        store_path = self._get_store_path(session_id)

        if not self.store_exists(session_id):
            raise FileNotFoundError(
                f"Vector store não encontrado para a sessão: {session_id}"
            )

        logger.info("Consultando vector store da sessão: %s", session_id)
        embeddings = self._get_embeddings()
        vector_store = FAISS.load_local(
            store_path,
            embeddings,
            allow_dangerous_deserialization=True,
        )

        results = vector_store.similarity_search(query, k=k)
        contents = [doc.page_content for doc in results]
        logger.info("Encontrados %d documentos relevantes", len(contents))

        return contents


# Instância global reutilizável
vector_store_service = VectorStoreService()
