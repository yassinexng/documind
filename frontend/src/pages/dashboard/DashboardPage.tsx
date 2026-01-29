import { useState, Component, ErrorInfo, ReactNode } from 'react';
import Navbar from '../../components/Navbar';
import DocumentUpload from '../../components/DocumentUpload';
import DocumentList from '../../components/DocumentList';
import ChatInterface from '../../components/ChatInterface';

interface DashboardPageProps {
  username: string;
  userId: number;
  onLogout: () => void;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Dashboard Runtime Error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-state" style={{ margin: '2rem' }}>
          <h2>Dashboard Component Error</h2>
          <p>{this.state.errorMessage}</p>
          <button onClick={this.handleReset} className="btn-primary">
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function DashboardPage({ username, userId, onLogout }: DashboardPageProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <ErrorBoundary>
      <div className="dashboard">
        <Navbar username={username} onLogout={onLogout} />
        <div className="dashboard-content">
          <aside className="sidebar">
            <DocumentUpload userId={userId} onUploadSuccess={handleUploadSuccess} />
            <DocumentList userId={userId} refresh={refreshKey} />
          </aside>
          <main className="main-content">
            <ChatInterface userId={userId} />
          </main>
        </div>
      </div>
    </ErrorBoundary>
  );
}