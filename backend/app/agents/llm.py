from langchain_groq import ChatGroq

from backend.app.config import get_settings


def get_llm(temperature: float = 0.1) -> ChatGroq:
    settings = get_settings()
    if not settings.groq_api_key:
        raise ValueError("GROQ_API_KEY is not set")
    return ChatGroq(
        api_key=settings.groq_api_key,
        model=settings.groq_model,
        temperature=temperature,
    )
