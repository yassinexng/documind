import { useState } from 'react';
import axios from 'axios';

interface RegisterPageProps {
  onSwitch: () => void;
}

export default function RegisterPage({ onSwitch }: RegisterPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ text: '', isError: false });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', isError: true });
      return;
    }

    setLoading(true);
    setMessage({ text: '', isError: false });
    
    try {
      const response = await axios.post('http://localhost:8000/auth/register', { 
        username: username, 
        password: password 
      });
      
      setMessage({ text: 'Account created! Redirecting to login...', isError: false });
      
      setTimeout(() => {
        onSwitch();
      }, 2000);
      
    } catch (err: any) {
      let errorText = 'Registration failed';
      
      if (err.response && err.response.data && err.response.data.detail) {
        errorText = err.response.data.detail;
      }
      
      setMessage({ text: errorText, isError: true });
    }
    
    setLoading(false);
  };

  return (
    <div className="login-card">
      <h1>DocuMind</h1>
      <h2>Create Account</h2>
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
        <input
          type="password"
          placeholder="Confirm Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading}
        />
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? 'Creating Account...' : 'Register'}
        </button>
      </form>
      <button type="button" onClick={onSwitch} className="btn-secondary" disabled={loading}>
        Already have an account? Login
      </button>
      {message.text && (
        <p className={message.isError ? "error-message" : "message success"}>
          {message.text}
        </p>
      )}
    </div>
  );
}