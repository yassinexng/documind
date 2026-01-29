import os
import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

DB_PASSWORD = os.getenv("password")

if not DB_PASSWORD:
    raise ValueError("Database password not set in environment variables")

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    f"postgresql://postgres:{DB_PASSWORD}@localhost:5432/documind"
)

def create_engine_with_retry(max_retries=10, delay=5):
    for attempt in range(max_retries):
        try:
            engine = create_engine(
                DATABASE_URL,
                pool_size=10,
                max_overflow=20,
                pool_pre_ping=True
            )
            
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            
            print(f"Database connection established successfully (attempt {attempt + 1})")
            return engine
            
        except OperationalError as e:
            if attempt == max_retries - 1:
                raise Exception(f"Failed to connect to database after {max_retries} attempts: {e}")
            
            print(f"Database connection failed (attempt {attempt + 1}/{max_retries}). Retrying in {delay} seconds...")
            time.sleep(delay)

engine = create_engine_with_retry()

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()