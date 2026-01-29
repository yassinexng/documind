import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import './App.css';
import DashboardPage from './pages/dashboard/DashboardPage';
import LoginPage from './pages/login/LoginPage';
import RegisterPage from './pages/register/RegisterPage';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState(0);
  const [isRegister, setIsRegister] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const authInProgress = useRef(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    if (authInProgress.current) {
      return;
    }
    
    try {
      authInProgress.current = true;
      setIsLoading(true);
      
      const response = await axios.get('http://localhost:8000/auth/me', { 
        withCredentials: true 
      });
      
      handleAuthSuccess(response.data);
      
    } catch (error) {
      setIsLoggedIn(false);
    }
    
    setIsLoading(false);
    authInProgress.current = false;
  };

  const handleAuthSuccess = (userData: any) => {
    setIsLoggedIn(true);
    setUsername(userData.username);
    
    let id = userData.id;
    if (!id && userData.user_id) {
      id = userData.user_id;
    }
    setUserId(id);
  };

  const handleLogout = async () => {
    try {
      await axios.post('http://localhost:8000/auth/logout', {}, { 
        withCredentials: true 
      });
    } catch (err) {
      console.warn('Logout API call failed, proceeding with local logout');
    }
    
    setIsLoggedIn(false);
    setUsername('');
    setUserId(0);
  };

  if (isLoading) {
    return (
      <div className="login-page">
        <div className="login-card">
          <h1>DocuMind</h1>
          <p className="loading-state">Validating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      {isLoggedIn ? (
        <DashboardPage 
          username={username} 
          userId={userId} 
          onLogout={handleLogout} 
        />
      ) : (
        <div className="login-page">
          {isRegister ? (
            <RegisterPage 
              onSwitch={() => setIsRegister(false)} 
            />
          ) : (
            <LoginPage 
              onSwitch={() => setIsRegister(true)} 
              onSuccess={handleAuthSuccess} 
            />
          )}
        </div>
      )}
    </div>
  );
}