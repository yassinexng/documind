import os
import fitz
import pandas as pd
import google.generativeai as genai
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer
from io import BytesIO

from ..database import get_db
from .. import models

router = APIRouter()

_embedding_model = None

def get_embedding_model():
    global _embedding_model
    if _embedding_model is None:
        try:
            _embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
        except Exception as e:
            raise HTTPException(status_code=500, detail="AI Model failed to load")
    return _embedding_model

def read_pdf(file_bytes):
    try:
        doc = fitz.open(stream=file_bytes, filetype="pdf")
        text = ""
        for page in doc:
            page_text = page.get_text()
            text += page_text + "\n"
        doc_text = text.strip()
        return doc_text
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read PDF.")

def read_excel(file_bytes):
    try:
        file_stream = BytesIO(file_bytes)
        df = pd.read_excel(file_stream)
        text = df.to_string(index=False)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read Excel file.")

def read_csv(file_bytes):
    try:
        file_stream = BytesIO(file_bytes)
        df = pd.read_csv(file_stream)
        text = df.to_string(index=False)
        return text
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not read CSV file.")

async def ask_gemini(context, question):
    key = os.getenv("GOOGLE_API_KEY")
    if not key:
        return "System Error: API Key missing on server."
    
    try:
        genai.configure(api_key=key)
        model = genai.GenerativeModel('gemini-2.5-flash')
        
        prompt = f"""
        You are a helpful and direct AI assistant. Answer the question based strictly on the provided context.
        
        CONTEXT:
        {context}
        
        QUESTION:
        {question}
        """
        
        response = model.generate_content(prompt)
        answer_text = response.text
        return answer_text
        
    except Exception as e:
        error_message = f"I couldn't answer that. (Error: {str(e)})"
        return error_message

@router.post("/upload", status_code=status.HTTP_201_CREATED)
async def upload_document(
    user_id: int = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    model = get_embedding_model()

    content = await file.read()
    
    file_type = file.content_type
    filename_lower = file.filename.lower()
    
    if file_type == "application/pdf" or filename_lower.endswith('.pdf'):
        text = read_pdf(content)
    elif filename_lower.endswith('.xlsx') or filename_lower.endswith('.xls'):
        text = read_excel(content)
    elif filename_lower.endswith('.csv'):
        text = read_csv(content)
    elif file_type == "text/plain" or filename_lower.endswith('.txt'):
        decoded_text = content.decode("utf-8")
        text = decoded_text
    else:
        raise HTTPException(status_code=400, detail="Unsupported file type")

    if not text:
        raise HTTPException(status_code=400, detail="File is empty")

    filename_parts = file.filename.split('.')
    file_ext = filename_parts[-1][:10]
    
    new_doc = models.Document(user_id=user_id, file_name=file.filename, file_type=file_ext)
    db.add(new_doc)
    db.flush()

    chunk_size = 500
    chunks = []
    
    for i in range(0, len(text), chunk_size):
        chunk_text = text[i:i+chunk_size]
        chunks.append(chunk_text)

    for i in range(len(chunks)):
        chunk_text = chunks[i]
        vector = model.encode(chunk_text)
        vector_list = vector.tolist()
        
        db_chunk = models.DocumentChunk(
            document_id=new_doc.id,
            user_id=user_id,
            content=chunk_text,
            embedding=vector_list,
            chunk_index=i
        )
        db.add(db_chunk)

    db.commit()
    
    response = {
        "message": "Success",
        "document_id": new_doc.id
    }
    return response

@router.post("/query")
async def query_documents(data: dict, db: Session = Depends(get_db)):
    user_id = data.get("user_id")
    question = data.get("question")

    if not question:
        return {"answer": "Please ask a question."}

    model = get_embedding_model()

    question_vector = model.encode(question)
    question_vector_list = question_vector.tolist()
    
    all_chunks = db.query(models.DocumentChunk).filter(
        models.DocumentChunk.user_id == user_id
    ).all()
    
    if not all_chunks:
        return {"answer": "I don't see any relevant documents. Upload one first!"}
    
    chunk_scores = []
    for chunk in all_chunks:
        distance = models.DocumentChunk.embedding.cosine_distance(question_vector_list)
        chunk_scores.append({
            "chunk": chunk,
            "distance": distance
        })
    
    results = db.query(models.DocumentChunk).filter(
        models.DocumentChunk.user_id == user_id
    ).order_by(
        models.DocumentChunk.embedding.cosine_distance(question_vector_list)
    ).limit(5).all()

    context_parts = []
    for chunk in results:
        context_parts.append(chunk.content)
    
    context_text = "\n\n".join(context_parts)

    answer = await ask_gemini(context_text, question)

    return {"answer": answer}

@router.get("/list/{user_id}")
def list_documents(user_id: int, db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(
        models.Document.user_id == user_id
    ).order_by(
        models.Document.uploaded_at.desc()
    ).all()
    
    doc_list = []
    for d in docs:
        doc_info = {
            "id": d.id,
            "file_name": d.file_name,
            "uploaded_at": d.uploaded_at.isoformat()
        }
        doc_list.append(doc_info)
    
    return doc_list

@router.delete("/all/{user_id}")
def delete_all(user_id: int, db: Session = Depends(get_db)):
    docs = db.query(models.Document).filter(
        models.Document.user_id == user_id
    ).all()
    
    for doc in docs:
        db.delete(doc)
    
    db.commit()
    
    return {"message": "All deleted"}

@router.delete("/{document_id}")
def delete_one(document_id: int, db: Session = Depends(get_db)):
    doc = db.query(models.Document).filter(
        models.Document.id == document_id
    ).first()
    
    if doc:
        db.delete(doc)
        db.commit()
    
    return {"message": "Deleted"}