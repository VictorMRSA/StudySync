"""
Ponto de entrada do backend Study Sync.

Configura a aplicação FastAPI com CORS, routers e health check.
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from config import settings
from routers import chat, summarize, analyze, quiz, flashcards, documents

# Configuração de logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Gerencia o ciclo de vida da aplicação."""
    logger.info("🚀 Study Sync Backend iniciado!")
    logger.info("📚 Modelo de IA: %s", settings.MODEL_NAME)
    logger.info("🌐 CORS origins: %s", settings.CORS_ORIGINS)
    yield
    logger.info("👋 Study Sync Backend encerrado.")


# Criar aplicação FastAPI
app = FastAPI(
    title="Study Sync Backend",
    description="Backend do Study Sync — plataforma educacional com IA.",
    version="1.0.0",
    lifespan=lifespan,
)

# ── CORS ─────────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──────────────────────────────────────────────────────────────────
app.include_router(chat.router)
app.include_router(summarize.router)
app.include_router(analyze.router)
app.include_router(quiz.router)
app.include_router(flashcards.router)
app.include_router(documents.router)


# ── Health Check ─────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["Health"])
async def health_check() -> dict:
    """Verifica se o backend está ativo e operacional."""
    return {
        "status": "healthy",
        "service": "Study Sync Backend",
        "model": settings.MODEL_NAME,
    }
