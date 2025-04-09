'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';

// Custom sidebar component that directly integrates with the chat layout
export default function ResponsiveChatLayout({ onArtifactGenerated }) {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const [sidebarTab, setSidebarTab] = useState('recent'); 
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async ({ text, file }) => {
    // Add user message
    const userMessage = { text, file, isUser: true };
setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Call API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get response');
      }
      
      const data = await response.json();
      
      // Add bot response
      setMessages(prev => [...prev, { text: data.text, isUser: false }]);
      
      // Add any artifacts that were generated
      if (data.artifacts && data.artifacts.length > 0) {
        data.artifacts.forEach((artifact) => {
          onArtifactGenerated(artifact);
        });
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Directly include the recentChats data here
  const recentChats = [
    { id: 1, title: "Vancouver Flood Analysis", date: "Apr 2, 2025" },
    { id: 2, title: "Infrastructure Budget Planning", date: "Mar 28, 2025" },
    { id: 3, title: "311 Call Data Integration", date: "Mar 22, 2025" }
  ];
  const savedArtifacts = [
    { id: 'a1', title: 'Infrastructure Flood Map', type: 'Map', date: 'Apr 9, 2025' },
    { id: 'a2', title: 'Risk Index Map', type: 'Map', date: 'Apr 9, 2025' },
  ];
  
  
  return (
    <div className="flex h-full relative">
      {/* Custom integrated sidebar with direct hover handlers */}
      <aside 
className={`w-64 text-white flex flex-col absolute h-full left-0 top-0 transition-all duration-300 transform ${
  sidebarOpen ? 'bg-[#008080] translate-x-0' : 'bg-white -translate-x-[calc(100%-8px)]'
} z-10`}
        onMouseEnter={() => setSidebarOpen(true)}
        onMouseLeave={() => setSidebarOpen(false)}
      >
        <div className="p-4">
          <button className="w-full py-2 bg-white rounded-lg hover:bg-opacity-90 text-[#34495E] font-medium">
            New Conversation
          </button>
        </div>
        <div className="p-4 flex space-x-2">
  <button
    onClick={() => setSidebarTab('recent')}
    className={`flex-1 py-1 text-sm rounded-lg transition ${
      sidebarTab === 'recent' ? 'bg-white text-[#008080]' : 'bg-[#006666] text-white'
    }`}
  >
    Recent
  </button>
  <button
    onClick={() => setSidebarTab('saved')}
    className={`flex-1 py-1 text-sm rounded-lg transition ${
      sidebarTab === 'saved' ? 'bg-white text-[#008080]' : 'bg-[#006666] text-white'
    }`}
  >
    Saved
  </button>
</div>
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
          {sidebarTab === 'recent' ? (
  <>
    <h3 className="text-xs uppercase tracking-wider text-white opacity-80 mb-2">Recent Chats</h3>
    <ul className="space-y-2">
      {recentChats.map(chat => (
        <li key={chat.id}>
          <a href="#" className="block p-2 rounded hover:bg-[#006666] transition-colors duration-200">
            <div className="text-sm font-medium truncate">{chat.title}</div>
            <div className="text-xs text-white opacity-70">{chat.date}</div>
          </a>
        </li>
      ))}
    </ul>
  </>
) : (
  <>
    <h3 className="text-xs uppercase tracking-wider text-white opacity-80 mb-2">Saved Artifacts</h3>
    <ul className="space-y-2">
      {savedArtifacts.map(artifact => (
        <li key={artifact.id}>
          <a href="#" className="block p-2 rounded hover:bg-[#006666] transition-colors duration-200">
            <div className="text-sm font-medium truncate">{artifact.title}</div>
            <div className="text-xs text-white opacity-70">{artifact.type} • {artifact.date}</div>
          </a>
        </li>
      ))}
    </ul>
  </>
)}

          </div>
        </div>
        <div className="p-4 border-t border-[#006666]">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
              <span className="text-sm font-medium text-[#008080]">JD</span>
            </div>
            <div>
              <div className="text-sm font-medium">John Doe</div>
            </div>
          </div>
        </div>
      </aside>
      
      <div 
        className="flex flex-col flex-1 transition-all duration-300"
        style={{ 
          marginLeft: sidebarOpen ? '250px' : '8px'
        }}
      >
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-none">
          {messages.map((message, index) => (
            <ChatMessage key={index} message={message} isUser={message.isUser} />
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-[#34495E] text-[#FFFFFF] rounded-lg px-4 py-2 rounded-bl-none">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}