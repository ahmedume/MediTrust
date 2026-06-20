"""Research stage: expand query and fetch PubMed articles."""

from __future__ import annotations

from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnableLambda, RunnableParallel

from backend.app.agents.llm import get_llm
from backend.app.models import RawArticle
from backend.app.services.pubmed import expand_query_terms, fetch_articles


async def _fetch_for_terms(terms: list[str]) -> list[RawArticle]:
    seen: set[str] = set()
    collected: list[RawArticle] = []
    for term in terms:
        batch = await fetch_articles(term, max_results=5)
        for article in batch:
            key = article.pmid or article.title.lower()
            if key not in seen:
                seen.add(key)
                collected.append(article)
        if len(collected) >= 8:
            break
    return collected[:8]


def build_research_chain():
    """Expand query and fetch PubMed articles."""

    expand_prompt = ChatPromptTemplate.from_messages(
        [
            (
                "system",
                "You are a medical librarian. Given a user topic, output 3 PubMed search "
                "phrases, one per line, concise, no numbering.",
            ),
            ("human", "{query}"),
        ]
    )

    async def fetch_node(inputs: dict) -> list[RawArticle]:
        query = inputs["query"]
        llm_terms: list[str] = []
        expanded_text = inputs.get("expanded", "")
        if expanded_text:
            llm_terms = [ln.strip() for ln in expanded_text.splitlines() if ln.strip()]
        terms = list(dict.fromkeys(expand_query_terms(query) + llm_terms))[:6]
        articles = await _fetch_for_terms(terms)
        return articles

    try:
        llm = get_llm(temperature=0)
        expand_chain = expand_prompt | llm | StrOutputParser()
    except ValueError:
        expand_chain = RunnableLambda(lambda _: "")

    return (
        RunnableParallel(
            query=RunnableLambda(lambda x: x["query"]),
            expanded=expand_chain,
        )
        | RunnableLambda(lambda x: {"query": x["query"], "expanded": x["expanded"]})
        | RunnableLambda(fetch_node)
    )


async def run_research_agent(query: str) -> list[RawArticle]:
    chain = build_research_chain()
    return await chain.ainvoke({"query": query})
