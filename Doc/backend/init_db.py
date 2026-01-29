import sys
from sqlalchemy import text, exc
from app.database import engine
from app.models import Base, User, Document, DocumentChunk

def init_db():
    with engine.begin() as conn:
        try:
            print("Testing database connection...")
            conn.execute(text("SELECT 1"))
            
            print("Configuring pgvector.")
            try:
                conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector"))
            except exc.ProgrammingError as e:
                if "permission denied" in str(e).lower():
                    print("Warning: Permission denied for 'CREATE EXTENSION'. Skipping.")
                else:
                    raise

            print("Syncing schema.")
            tables = [
                ("users", User),
                ("documents", Document),
                ("document_chunks", DocumentChunk)
            ]

            for name, model in tables:
                if not conn.dialect.has_table(conn, name):
                    model.__table__.create(conn)
                    print(f"Created table: {name}")

            print("Applying indexes..")
            indices = [
                """
                CREATE INDEX IF NOT EXISTS doc_chunks_vector_idx 
                ON document_chunks USING hnsw (embedding vector_cosine_ops)
                """,
                "CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_chunks_user_id ON document_chunks(user_id)",
                "CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON document_chunks(document_id)"
            ]

            for query in indices:
                try:
                    conn.execute(text(query))
                except exc.ProgrammingError as e:
                    print(f"Index creation failed: {e}")

            conn.execute(text("SELECT '[1,2,3]'::vector"))
            print("Database initialization complete.")

        except exc.SQLAlchemyError as e:
            print(f"Database error: {e}", file=sys.stderr)
            sys.exit(1)
        except Exception as e:
            print(f"Unexpected error: {e}", file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    init_db()