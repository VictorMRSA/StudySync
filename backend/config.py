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

    GEMINI_API_KEY: str = "your_gemini_api_key_here"
    CORS_ORIGINS_STR: str = "http://localhost:5173,http://localhost:3000"
    VECTOR_STORE_PATH: str = "./vector_stores"
    MODEL_NAME: str = "gemini-2.5-flash"

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Retorna lista de origins a partir da string separada por vírgulas."""
        return [o.strip() for o in self.CORS_ORIGINS_STR.split(",") if o.strip()]


# Instância global de configuração
settings = Settings()
