"""Configuration for Léa API."""

from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings."""

    # API OpenAI
    openai_api_key: str = ""
    llm_model: str = "gpt-4o"

    # Database: use DATABASE_URL or build from PostgreSQL vars
    database_url: str = "sqlite+aiosqlite:///./lea_api.db"
    db_name: str = ""
    db_user: str = "postgres"
    db_password: str = ""
    db_host: str = "localhost"
    db_port: str = "5432"

    # Redis (optional - for session state)
    redis_url: str = "redis://localhost:6379"
    use_redis: bool = False

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"

    @property
    def resolved_database_url(self) -> str:
        """Use PostgreSQL if DB_NAME is set, else DATABASE_URL (SQLite)."""
        if self.db_name and self.db_user:
            return (
                f"postgresql+asyncpg://{self.db_user}:{self.db_password}"
                f"@{self.db_host}:{self.db_port}/{self.db_name}"
            )
        return self.database_url


@lru_cache
def get_settings() -> Settings:
    return Settings()
