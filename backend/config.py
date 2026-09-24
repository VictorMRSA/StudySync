"""
Configurações do backend Study Sync.
Carrega variáveis de ambiente usando pydantic-settings.
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configurações carregadas a partir do arquivo .env."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    # ── IA Local via Ollama (padrão) ──────────────────────────────────────
    # Ollama roda em localhost:11434 com API compatível com OpenAI
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    MODEL_NAME: str = "huihui_ai/qwen3-abliterated:4b"

    # ── DeepSeek / Cloud (opcional — preencher se quiser usar nuvem) ──────
    DEEPSEEK_API_KEY: str = "no-key-needed-for-local"
    GEMINI_API_KEY: str = "no-key-needed-for-local"

    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000,https://studysync-lyart-one.vercel.app"
    VECTOR_STORE_PATH: str = "./vector_stores"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Retorna lista de origins a partir da string separada por vírgulas."""
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]


# Instância global de configuração
settings = Settings()
