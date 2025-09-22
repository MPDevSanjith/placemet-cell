import React, { useState, useRef, useEffect } from 'react';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';
import { analyzeWithAI, getAICapabilities } from '../../global/api';
import TypingMessage from '../../components/TypingMessage';
import { Download, Send, Bot, User, FileText, BarChart3, Database, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  reports?: Report[];
  dataContext?: {
    totalStudents: number;
    totalJobs: number;
    totalCompanies: number;
  };
}

interface Report {
  type: 'csv' | 'pdf' | 'excel';
  filename: string;
  content: string;
  recordCount: number;
  generatedAt: string;
}

interface AICapabilities {
  analysisTypes: string[];
  sampleQueries: string[];
  supportedFormats: string[];
  dataSources: string[];
}

const AIChatbot: React.FC = () => {
  const { auth } = useAuth();
  const token = auth?.token;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [capabilities, setCapabilities] = useState<AICapabilities | null>(null);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sample queries for quick access
  const sampleQueries = [
    'Give me the list of all MCA students',
    'Show me all BTech students',
    'List all students from CSE department',
    'Show me students with CGPA above 8.0',
    'Generate a report of placed students in 2024',
    'What is the placement rate by department?',
    'Find students eligible for software engineering roles',
    'Compare placement statistics between UG and PG programs',
    'Show me students with backlogs and their details',
    'Generate a comprehensive placement report',
    'What are the top performing departments?',
    'Find students who haven\'t completed onboarding',
    'Show me all IT department students',
    'List students from 2025 batch',
    'Generate course-wise placement analysis',
    'Show me students with attendance below 75%',
    'Find all placed students with company details',
    'Compare performance between different courses',
    'Show me year-wise student distribution',
    'Generate department-wise placement statistics'
  ];

  useEffect(() => {
    scrollToBottom();
    loadCapabilities();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadCapabilities = async () => {
    if (!token) {
      console.log('No token available for capabilities request');
      return;
    }
    console.log('Loading capabilities with token:', token ? 'Token present' : 'No token');
    try {
      const response = await getAICapabilities(token);
      if (response.success) {
        setCapabilities(response.capabilities);
      }
    } catch (error) {
      console.error('Failed to load capabilities:', error);
    }
  };

  const sendMessage = async (message: string) => {
    if (!message.trim() || isLoading || !token) {
      console.log('Send message blocked:', { hasMessage: !!message.trim(), isLoading, hasToken: !!token });
      return;
    }
    console.log('Sending message with token:', token ? 'Token present' : 'No token');

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: message.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await analyzeWithAI(token, {
        query: message.trim(),
        analysisType: 'general'
      });

      if (response.success) {
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'ai',
          content: response.response.content,
          timestamp: new Date(),
          reports: response.reports || [],
          dataContext: response.dataContext
        };

        setMessages(prev => [...prev, aiMessage]);
        setTypingMessageId(aiMessage.id);
      } else {
        throw new Error(response.error || 'Analysis failed');
      }
    } catch (error) {
      console.error('AI Analysis error:', error);
      let errorContent = 'Sorry, I encountered an error. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('timeout') || error.message.includes('TIMEOUT')) {
          errorContent = 'The request timed out. This might be due to high server load. Please try again with a simpler query.';
        } else if (error.message.includes('Failed to fetch')) {
          errorContent = 'Unable to connect to the server. Please check your internet connection and try again.';
        } else {
          errorContent = `Sorry, I encountered an error: ${error.message}. Please try again.`;
        }
      }
      
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputValue);
  };

  const handleSampleQuery = (query: string) => {
    setInputValue(query);
  };

  const downloadReport = (report: Report) => {
    const blob = new Blob([report.content], { 
      type: report.type === 'csv' ? 'text/csv' : 'text/html' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = report.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const clearChat = () => {
    setMessages([]);
  };

  return (
    <Layout>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AI Assistant</h1>
                <p className="text-sm text-gray-500">Placement Analysis</p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <div className="space-y-6">
              {/* Quick Actions */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Quick Actions</h3>
                <div className="space-y-2">
                  <button
                    onClick={clearChat}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    🗑️ Clear Chat
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    📁 Upload Data
                  </button>
                </div>
              </div>

              {/* Sample Queries */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Sample Queries</h3>
                <div className="space-y-2">
                  {sampleQueries.slice(0, 5).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuery(query)}
                      className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg transition-colors border border-gray-200"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capabilities */}
              {capabilities && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Capabilities</h3>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <Database className="w-4 h-4" />
                      <span>{capabilities.dataSources.length} Data Sources</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <FileText className="w-4 h-4" />
                      <span>{capabilities.supportedFormats.length} Export Formats</span>
                    </div>
                    <div className="flex items-center space-x-2 text-xs text-gray-500">
                      <BarChart3 className="w-4 h-4" />
                      <span>{capabilities.analysisTypes.length} Analysis Types</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to AI Assistant</h2>
                <p className="text-gray-600 mb-6 max-w-md">
                  I can help you analyze student data, generate reports, and provide insights about placements. 
                  Try asking me something like "Show me all MCA students" or "Generate a placement report".
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-w-2xl">
                  {sampleQueries.slice(0, 4).map((query, index) => (
                    <button
                      key={index}
                      onClick={() => handleSampleQuery(query)}
                      className="text-left p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors"
                    >
                      <span className="text-sm text-gray-700">{query}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-3xl px-4 py-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        message.type === 'user' ? 'bg-blue-700' : 'bg-gray-100'
                      }`}>
                        {message.type === 'user' ? (
                          <User className="w-4 h-4 text-white" />
                        ) : (
                          <Bot className="w-4 h-4 text-gray-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        {message.type === 'ai' && typingMessageId === message.id ? (
                          <TypingMessage
                            content={message.content}
                            speed={20}
                            delay={500}
                            onComplete={() => setTypingMessageId(null)}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap text-sm">
                            {message.content}
                          </div>
                        )}
                        
                        {/* Data Context */}
                        {message.dataContext && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <div className="text-xs text-gray-600 mb-2">Data Context:</div>
                            <div className="grid grid-cols-3 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Students:</span> {message.dataContext.totalStudents}
                              </div>
                              <div>
                                <span className="font-medium">Jobs:</span> {message.dataContext.totalJobs}
                              </div>
                              <div>
                                <span className="font-medium">Companies:</span> {message.dataContext.totalCompanies}
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Reports */}
                        {message.reports && message.reports.length > 0 && (
                          <div className="mt-3 space-y-2">
                            <div className="text-xs text-gray-600">Generated Reports:</div>
                            {message.reports.map((report, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                              >
                                <div className="flex items-center space-x-2">
                                  <FileText className="w-4 h-4 text-gray-500" />
                                  <span className="text-sm text-gray-700">
                                    {report.filename} ({report.recordCount} records)
                                  </span>
                                </div>
                                <button
                                  onClick={() => downloadReport(report)}
                                  className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                                >
                                  <Download className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        <div className="text-xs text-gray-500 mt-2">
                          {message.timestamp.toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="max-w-3xl px-4 py-3 rounded-lg bg-white border border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                        <Bot className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                        </div>
                        <span className="text-sm text-gray-500">AI is thinking...</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-gray-200 p-6">
            <form onSubmit={handleSubmit} className="flex space-x-4">
              <div className="flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask me anything about student data, placements, or generate reports..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={isLoading}
                />
              </div>
              <button
                type="submit"
                disabled={!inputValue.trim() || isLoading}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send</span>
              </button>
            </form>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={(e) => {
            // Handle file upload if needed
            console.log('File selected:', e.target.files?.[0]);
          }}
        />
      </div>
    </Layout>
  );
};

export default AIChatbot;
