import { useState, useRef, useEffect } from 'react';
import axios from 'axios';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

interface ChatInterfaceProps {
  userId: number;
}

export default function ChatInterface({ userId }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleClear = () => {
    setMessages([]);
  };

  const handleSend = async () => {
    const trimmedQuestion = question.trim();
    if (!trimmedQuestion) {
      return;
    }

    const userMessage = { role: 'user' as 'user', text: question };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    const currentQuestion = question;
    setQuestion('');
    setLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:8000/documents/query',
        { 
          user_id: userId, 
          question: currentQuestion 
        },
        { withCredentials: true }
      );

      const answerText = response.data.answer;
      const aiResponse = answerText || "No response generated.";
      
      const aiMessage = { 
        role: 'ai' as 'ai', 
        text: aiResponse
      };
      
      const newMessages = [...updatedMessages, aiMessage];
      setMessages(newMessages);

    } catch (error: any) {
      console.error("Chat Error:", error);
      
      const errorMessage = { 
        role: 'ai' as 'ai', 
        text: 'System Error: Unable to retrieve answer. Please verify document uploads.' 
      };
      
      const errorMessages = [...updatedMessages, errorMessage];
      setMessages(errorMessages);
    }
    
    setLoading(false);
  };

  const chatContainerStyle = {
    display: 'flex',
    flexDirection: 'column' as 'column',
    height: '100%',
    background: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)'
  };

  const headerStyle = {
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between' as 'space-between',
    alignItems: 'center' as 'center',
    background: '#fafafa'
  };

  const headerTitleStyle = {
    margin: 0,
    color: '#1a1a1a',
    fontSize: '1.1rem',
    fontWeight: 600
  };

  const clearButtonStyle = {
    background: 'transparent',
    border: 'none',
    color: '#667eea',
    fontSize: '0.875rem',
    cursor: 'pointer',
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    transition: 'background 0.2s'
  };

  const messagesContainerStyle = {
    flex: 1,
    overflowY: 'auto' as 'auto',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column' as 'column',
    gap: '1rem',
    backgroundColor: '#ffffff'
  };

  const emptyStateStyle = {
    textAlign: 'center' as 'center',
    color: '#9ca3af',
    marginTop: 'auto',
    marginBottom: 'auto',
    padding: '2rem'
  };

  const inputAreaStyle = {
    padding: '1rem 1.5rem',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    gap: '12px',
    background: '#fafafa'
  };

  const inputStyle = {
    flex: 1,
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    outline: 'none',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    transition: 'border-color 0.2s'
  };

  const sendButtonStyle = {
    padding: '0 24px',
    borderRadius: '8px',
    height: '44px',
    fontWeight: 500,
    background: loading ? '#d1d5db' : '#667eea',
    color: 'white',
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background 0.2s',
    fontSize: '0.95rem'
  };

  const loadingTextStyle = {
    alignSelf: 'flex-start' as 'flex-start',
    padding: '10px 0',
    color: '#9ca3af',
    fontSize: '0.9rem',
    fontStyle: 'italic'
  };

  return (
    <div className="chat-interface" style={chatContainerStyle}>
      <header style={headerStyle}>
        <h3 style={headerTitleStyle}>Chat Assistant</h3>
        {messages.length > 0 && (
          <button 
            onClick={handleClear}
            style={clearButtonStyle}
          >
            Clear Chat
          </button>
        )}
      </header>

      <div className="messages" style={messagesContainerStyle}>
        {messages.length === 0 && (
          <div style={emptyStateStyle}>
            <p>Ask me anything about your documents</p>
          </div>
        )}
        
        {messages.map((msg, index) => {
          const messageWrapperStyle = {
            alignSelf: msg.role === 'user' ? 'flex-end' as 'flex-end' : 'flex-start' as 'flex-start',
            maxWidth: '80%'
          };
          
          const messageBubbleStyle = {
            padding: '14px 18px',
            borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
            fontSize: '0.95rem',
            lineHeight: '1.6',
            whiteSpace: 'pre-wrap' as 'pre-wrap',
            backgroundColor: msg.role === 'user' ? '#667eea' : '#f3f4f6',
            color: msg.role === 'user' ? '#ffffff' : '#1f2937',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          };
          
          return (
            <div key={index} className={`message ${msg.role}`} style={messageWrapperStyle}>
              <div style={messageBubbleStyle}>
                {msg.text}
              </div>
            </div>
          );
        })}
        
        {loading && (
          <div style={loadingTextStyle}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="input-area" style={inputAreaStyle}>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSend();
            }
          }}
          placeholder="Ask a question about your documents..."
          style={inputStyle}
          disabled={loading}
        />
        <button 
          onClick={handleSend} 
          disabled={loading || !question.trim()} 
          style={sendButtonStyle}
        >
          {loading ? 'Sending...' : 'Send'}
        </button>
      </div>
    </div>
  );
}