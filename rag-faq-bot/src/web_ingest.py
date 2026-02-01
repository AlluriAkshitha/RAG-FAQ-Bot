from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from pathlib import Path
import os

from langchain_community.document_loaders import WebBaseLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


VECTOR_DIR = Path("vectorstore") / "faiss_index"


def build_index_from_url(url: str):
    print(f"🌐 Loading page: {url}")

    # Important: WebBaseLoader expects a list in newer versions
    loader = WebBaseLoader([url])
    docs = loader.load()
    print(f"📄 Loaded {len(docs)} document(s)")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=2000,
        chunk_overlap=200,
    )

    chunks = splitter.split_documents(docs)
    print(f"✂️ Split into {len(chunks)} chunks")

    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

    os.makedirs(VECTOR_DIR, exist_ok=True)
    vectorstore = FAISS.from_documents(chunks, embeddings)
    vectorstore.save_local(str(VECTOR_DIR))

    print("✅ WEB VECTOR DB READY!")


if __name__ == "__main__":
    import sys

    if len(sys.argv) != 2:
        print("Usage: python src/web_ingest.py <url>")
        raise SystemExit(1)

    build_index_from_url(sys.argv[1])
