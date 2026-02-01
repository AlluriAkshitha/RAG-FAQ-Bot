from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.models import Query, Response, IngestRequest
from src.rag_chain import get_chain
from src.web_ingest import build_index_from_url

app = FastAPI(title="RAG FAQ Bot")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # you can tighten this later
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Start with whatever index exists; will be replaced by /ingest
chain = get_chain()


@app.get("/")
def root():
    return {"status": "ok", "msg": "RAG FAQ Bot running"}


@app.post("/ingest")
async def ingest(req: IngestRequest):
    """
    Build a new vector index from the given URL.
    After this, /chat will answer based on that page.
    """
    print(f"⚙️ Ingesting URL: {req.url}")
    build_index_from_url(req.url)

    global chain
    chain = get_chain()

    return {"status": "ok", "msg": f"Indexed content from {req.url}"}


@app.post("/chat", response_model=Response)
async def chat(q: Query):
    answer = chain.invoke(q.question)
    return Response(answer=answer)
