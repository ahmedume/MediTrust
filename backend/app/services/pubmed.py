"""Fetch medical literature from PubMed via NCBI E-utilities."""

from __future__ import annotations

import re
import xml.etree.ElementTree as ET

import httpx

from backend.app.models import RawArticle

ESEARCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
EFETCH = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi"


async def fetch_articles(query: str, max_results: int = 8) -> list[RawArticle]:
    params = {
        "db": "pubmed",
        "term": query,
        "retmax": max_results,
        "retmode": "json",
        "sort": "relevance",
    }
    async with httpx.AsyncClient(timeout=30.0) as client:
        search_resp = await client.get(ESEARCH, params=params)
        search_resp.raise_for_status()
        ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
        if not ids:
            return []

        fetch_params = {
            "db": "pubmed",
            "id": ",".join(ids),
            "retmode": "xml",
        }
        fetch_resp = await client.get(EFETCH, params=fetch_params)
        fetch_resp.raise_for_status()

    return _parse_pubmed_xml(fetch_resp.text)


def _parse_pubmed_xml(xml_text: str) -> list[RawArticle]:
    articles: list[RawArticle] = []
    root = ET.fromstring(xml_text)
    for article_el in root.findall(".//PubmedArticle"):
        medline = article_el.find(".//MedlineCitation")
        if medline is None:
            continue
        pmid_el = medline.find("PMID")
        pmid = pmid_el.text if pmid_el is not None else ""
        article_node = medline.find("Article")
        if article_node is None:
            continue
        title_el = article_node.find("ArticleTitle")
        title = _text(title_el) or "Untitled"
        abstract_el = article_node.find(".//AbstractText")
        abstract = _text(abstract_el) or ""
        journal_el = article_node.find(".//Journal/Title")
        journal = _text(journal_el) or "PubMed"
        year = _extract_year(article_node)
        authors = _extract_authors(article_node)
        url = f"https://pubmed.ncbi.nlm.nih.gov/{pmid}/" if pmid else ""
        articles.append(
            RawArticle(
                title=title,
                source=journal,
                url=url,
                abstract=abstract[:2000],
                year=year,
                authors=authors,
                pmid=pmid or "",
            )
        )
    return articles


def _text(el: ET.Element | None) -> str:
    if el is None:
        return ""
    parts = [el.text or ""]
    for child in el:
        if child.text:
            parts.append(child.text)
        if child.tail:
            parts.append(child.tail)
    return " ".join(p.strip() for p in parts if p).strip()


def _extract_year(article_node: ET.Element) -> int | None:
    for path in (".//PubDate/Year", ".//ArticleDate/Year"):
        year_el = article_node.find(path)
        if year_el is not None and year_el.text and year_el.text.isdigit():
            return int(year_el.text)
    return None


def _extract_authors(article_node: ET.Element) -> str:
    names: list[str] = []
    for author in article_node.findall(".//Author"):
        last = author.find("LastName")
        fore = author.find("ForeName")
        if last is not None and last.text:
            name = last.text
            if fore is not None and fore.text:
                name = f"{fore.text} {name}"
            names.append(name)
    return ", ".join(names[:5])


def expand_query_terms(query: str) -> list[str]:
    """Lightweight medical synonym expansion for research sub-queries."""
    base = query.strip()
    terms = [base]
    expansions = {
        "heart": ["cardiovascular", "cardiac"],
        "diabetes": ["glycemic control", "type 2 diabetes mellitus"],
        "cancer": ["neoplasm", "oncology"],
        "covid": ["SARS-CoV-2", "COVID-19"],
        "depression": ["major depressive disorder", "antidepressant"],
        "hypertension": ["blood pressure", "antihypertensive"],
    }
    lower = base.lower()
    for key, syns in expansions.items():
        if key in lower:
            terms.extend(syns)
    cleaned = []
    seen: set[str] = set()
    for t in terms:
        t = re.sub(r"\s+", " ", t).strip()
        if t and t.lower() not in seen:
            seen.add(t.lower())
            cleaned.append(t)
    return cleaned[:5]
