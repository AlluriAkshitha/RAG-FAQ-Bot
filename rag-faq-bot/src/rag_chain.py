from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_ollama import ChatOllama
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_core.output_parsers import StrOutputParser


def get_chain():
    # Load vector store
    embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
    vectorstore = FAISS.load_local(
        "vectorstore/faiss_index",
        embeddings,
        allow_dangerous_deserialization=True,
    )
    retriever = vectorstore.as_retriever(search_kwargs={"k": 2})

    # Local LLM via Ollama
    llm = ChatOllama(model="llama3.2:3b", temperature=0)




    prompt = ChatPromptTemplate.from_template(
    """You are a precise study tutor.

    Use ONLY the information in the context to answer the question.
    If the answer is not clearly in the context, say "I don't know from this page."

    Rules:
    - Do NOT invent code that is not present in the context.
    - Do NOT mix Java and JavaScript unless the context explicitly compares them.
    - Do NOT paste long paragraphs; summarize in your own words.
    - Answer concisely and exam-oriented.

    Context:
    {context}

    Question:
    {question}

    Answer in 2–5 sentences, based only on the context above."""
    )



    def format_docs(docs):
        return "\n\n".join(doc.page_content for doc in docs)

    chain = (
        {
            "context": retriever | format_docs,
            "question": RunnablePassthrough(),
        }
        | prompt
        | llm
        | StrOutputParser()
    )
    return chain
