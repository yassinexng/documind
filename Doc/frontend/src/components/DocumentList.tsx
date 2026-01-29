import { useEffect, useState } from 'react';
import axios from 'axios';

interface Document {
  id: number;
  file_name: string;
  uploaded_at: string;
}

interface DocumentListProps {
  userId: number;
  refresh: number;
}

export default function DocumentList({ userId, refresh }: DocumentListProps) {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDocuments();
  }, [userId, refresh]);

  const loadDocuments = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/documents/list/${userId}`, {
        withCredentials: true,
      });
      setDocuments(response.data);
    } catch (error) {
      console.error('Failed to load documents');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId: number) => {
    try {
      await axios.delete(`http://localhost:8000/documents/${docId}`, {
        withCredentials: true,
      });
      loadDocuments();
    } catch (error) {
      alert('Delete failed');
    }
  };

  const handleClearAll = async () => {
    if (!confirm("Delete ALL uploaded documents? This cannot be undone.")) return;
    try {
      await axios.delete(`http://localhost:8000/documents/all/${userId}`, {
        withCredentials: true,
      });
      loadDocuments();
    } catch (error) {
      alert('Failed to clear documents');
    }
  };

  if (loading) return <div style={{ color: '#666', padding: '1rem' }}>Loading...</div>;

  return (
    <div className="document-list" style={{ marginTop: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ margin: 0, color: '#333' }}>Your Documents</h3>
        {documents.length > 0 && (
          <button 
            onClick={handleClearAll}
            style={{
              background: 'transparent',
              border: '1px solid #ef4444',
              color: '#ef4444',
              padding: '4px 8px',
              borderRadius: '4px',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            Clear All
          </button>
        )}
      </div>
      
      {documents.length === 0 ? (
        <p className="empty-message" style={{ color: '#888', fontStyle: 'italic' }}>
          No documents. Upload a PDF to start.
        </p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {documents.map((doc) => (
            <li key={doc.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '10px',
              background: '#f8f9fa',
              marginBottom: '8px',
              borderRadius: '6px',
              border: '1px solid #e1e5e9'
            }}>
              <span style={{ fontSize: '0.9rem', color: '#333' }}>{doc.file_name}</span>
              <button 
                onClick={() => handleDelete(doc.id)} 
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#666',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}