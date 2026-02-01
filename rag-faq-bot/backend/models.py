from pydantic import BaseModel


class Query(BaseModel):
    question: str


class Response(BaseModel):
    answer: str


class IngestRequest(BaseModel):
    url: str
