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

    # ── IA via Gemini API (padrão) ────────────────────────────────────────
    MODEL_NAME: str = "gemini-flash-lite-latest"
    GEMINI_API_KEY: str = ""

    # ── Legado: Ollama local / DeepSeek (não usados atualmente) ──────────
    OLLAMA_BASE_URL: str = "http://localhost:11434/v1"
    DEEPSEEK_API_KEY: str = "no-key-needed-for-local"

    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000,https://studysync-lyart-one.vercel.app"
    VECTOR_STORE_PATH: str = "./vector_stores"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Retorna lista de origins a partir da string separada por vírgulas."""
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]


# Instância global de configuração
settings = Settings()
