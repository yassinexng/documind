import { useState } from 'react';
import axios from 'axios';

interface LoginPageProps {
  onSwitch: () => void;
  onSuccess: (data: any) => void;
}

export default function LoginPage({ onSwitch, onSuccess }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(
        'http://localhost:8000/auth/login',
        { username, password }, 
        { withCredentials: true }
      );
      onSuccess(response.data);
    } catch (err: any) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-card">
      <h1>DocuMind</h1>
      <h2>Login</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
          disabled={loading}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Processing...' : 'Login'}
        </button>
      </form>
      <button 
        type="button"
        onClick={onSwitch} 
        className="btn-secondary" 
        disabled={loading}
      >
        Don't have an account? Register
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}