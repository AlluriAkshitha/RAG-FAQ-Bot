from pathlib import Path
import os
from langchain_community.document_loaders import TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

PDF_PATH = Path("data") / "faq.txt"

# AUTO-CREATE SAMPLE FAQ
if not PDF_PATH.exists():
    faq_content = """
RAG FAQ Bot

Q: What is RAG?
A: Retrieval-Augmented Generation. Loads your PDF → chunks → embeddings → FAISS vector search → LLM answers from YOUR docs only.

Q: Tech stack?
A: LangChain + Ollama (llama3.1 local) + FAISS + FastAPI + VSCode.

Q: How to add more docs?
A: Put new PDF in data/ → rerun ingest.py → query /chat endpoint.

Q: Deployment?
A: uvicorn backend.app:app → React frontend or curl test.
"""
    os.makedirs("data", exist_ok=True)
    with open(PDF_PATH, "w") as f:
        f.write(faq_content)
    print("✅ Created sample FAQ!")

loader = TextLoader(str(PDF_PATH))
docs = loader.load()
print("📖 Loaded")

splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=100)
chunks = splitter.split_documents(docs)
print(f"✂️ {len(chunks)} chunks")

embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
os.makedirs("vectorstore/faiss_index", exist_ok=True)
vectorstore = FAISS.from_documents(chunks, embeddings)
vectorstore.save_local("vectorstore/faiss_index")
print("✅ VECTOR DB READY! 🎉")
