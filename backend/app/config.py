from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    groq_api_key: str | None = None
    groq_model: str = "llama-3.3-70b-versatile"
    groq_suggest_model: str = "llama-3.1-8b-instant"
    reports_dir: str = "data/reports"
    pdf_dir: str = "data/pdfs"
    vector_store_dir: str = "data/vector_store"
    rag_upload_dir: str = "data/uploads"

    @property
    def pdfs_dir(self) -> Path:
        return Path(self.pdf_dir)

    @property
    def vector_store_dir_path(self) -> Path:
        return Path(self.vector_store_dir)

    @property
    def rag_upload_dir_path(self) -> Path:
        return Path(self.rag_upload_dir)

    def ensure_dirs(self) -> None:
        self.pdfs_dir.mkdir(parents=True, exist_ok=True)
        Path(self.reports_dir).mkdir(parents=True, exist_ok=True)
        Path(self.vector_store_dir).mkdir(parents=True, exist_ok=True)
        Path(self.rag_upload_dir).mkdir(parents=True, exist_ok=True)


@lru_cache
def get_settings() -> Settings:
    return Settings()
