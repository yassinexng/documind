import { useState } from 'react';
import axios from 'axios';

interface DocumentUploadProps {
  userId: number;
  onUploadSuccess: () => void;
}

export default function DocumentUpload({ userId, onUploadSuccess }: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const selectedFile = files[0];
      setFile(selectedFile);
    } else {
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      return;
    }
    
    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    
    const userIdString = userId.toString();
    formData.append('user_id', userIdString);

    try {
      const response = await axios.post('http://localhost:8000/documents/upload', formData, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setFile(null);
      onUploadSuccess();
      alert('Upload successful!');
      
    } catch (error) {
      alert('Upload failed');
    }
    
    setUploading(false);
  };

  const uploadSectionStyle = {
    background: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '1.5rem',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  };

  const headingStyle = {
    margin: '0 0 0.5rem 0',
    color: '#1a1a1a',
    fontSize: '1.1rem',
    fontWeight: 600
  };

  const supportedFormatsStyle = {
    margin: '0 0 1.25rem 0',
    fontSize: '0.875rem',
    color: '#6b7280'
  };

  const fileInputContainerStyle = {
    marginBottom: '1rem',
    position: 'relative' as 'relative'
  };

  const fileInputStyle = {
    width: '100%',
    padding: '1rem',
    border: '2px dashed #cbd5e0',
    borderRadius: '8px',
    background: '#fafafa',
    fontSize: '0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s'
  };

  const buttonStyle = {
    width: '100%',
    padding: '0.875rem 1.5rem',
    borderRadius: '8px',
    border: 'none',
    cursor: uploading || !file ? 'not-allowed' : 'pointer',
    fontSize: '0.95rem',
    fontWeight: 500,
    transition: 'all 0.2s',
    background: uploading || !file ? '#d1d5db' : '#667eea',
    color: 'white'
  };

  const fileInfoStyle = {
    marginTop: '0.75rem',
    padding: '0.75rem 1rem',
    background: '#f3f4f6',
    borderRadius: '6px',
    fontSize: '0.875rem',
    color: '#4b5563',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  };

  const removeButtonStyle = {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    cursor: 'pointer',
    fontSize: '0.875rem',
    padding: '0.25rem 0.5rem',
    fontWeight: 500
  };

  return (
    <div className="upload-section" style={uploadSectionStyle}>
      <h3 style={headingStyle}>Upload Document</h3>
      
      <p style={supportedFormatsStyle}>
        Supported formats: PDF, TXT, Excel, and CSV files
      </p>
      
      <div style={fileInputContainerStyle}>
        <input 
          type="file" 
          onChange={handleFileChange}
          accept=".pdf,.txt,.xlsx,.xls,.csv"
          style={fileInputStyle}
          disabled={uploading}
        />
      </div>

      {file && (
        <div style={fileInfoStyle}>
          <span>{file.name}</span>
          <button 
            onClick={() => setFile(null)} 
            style={removeButtonStyle}
            disabled={uploading}
          >
            Remove
          </button>
        </div>
      )}
      
      <button 
        onClick={handleUpload} 
        disabled={uploading || !file} 
        className="btn-primary"
        style={buttonStyle}
      >
        {uploading ? 'Uploading...' : 'Upload Document'}
      </button>
    </div>
  );
}