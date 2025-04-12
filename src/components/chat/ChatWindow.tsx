// 2. MODIFY CHATWINDOW COMPONENT
// Next, update the ChatWindow component to receive messages and setMessages as props

'use client';

import { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import { Artifact, ChatMessageType } from '../../app/page';
import { Dialog } from '@headlessui/react';
import { Search, Plus, PanelRight } from 'lucide-react';


interface RecentChat {
  id: number;
  title: string;
  date: string;
}

interface SavedArtifact {
  id: string;
  title: string;
  type: string;
  date: string;
}

interface ChatWindowProps {
  messages: ChatMessageType[];
  setMessages: React.Dispatch<React.SetStateAction<ChatMessageType[]>>;
  isLoading: boolean;
  onSendMessage: ({ text, file }: { text: string, file: string | null }) => Promise<void>;
  isCentered?: boolean;
  sidebarOpen: boolean;
  setSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
}
export default function ChatWindow({ 
  messages,
  setMessages,
  isLoading,
  onSendMessage,
  isCentered = false,
  sidebarOpen,
  setSidebarOpen
}: ChatWindowProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  
  // Set up a mutation observer to detect changes in the chat content
useEffect(() => {
  if (!messagesEndRef.current) return;
  
  // Create a MutationObserver to watch for changes in the DOM
  const observer = new MutationObserver(() => {
    scrollToBottom();
  });
  
  // Get the parent container that contains all messages
  const chatContainer = messagesEndRef.current.parentElement;
  
  if (chatContainer) {
    // Start observing the chat container for changes
    observer.observe(chatContainer, {
      childList: true, // Watch for changes to the child nodes
      subtree: true, // Watch for changes to the entire subtree
      characterData: true // Watch for changes to the character data
    });
  }
  
  // Cleanup function
  return () => {
    observer.disconnect();
  };
}, []);


  return (
    
    <div className="flex h-full relative">
      <div
  className="flex flex-col flex-1 transition-all duration-300"
  style={{ marginLeft: !isCentered && sidebarOpen && messages.length > 0 ? '60px' : '0' }}
>
    
      {/* Only render sidebar if not in centered mode */}
      <Dialog open={searchOpen} onClose={() => setSearchOpen(false)} className="relative z-50">
<div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
<div className="fixed inset-0 flex items-center justify-center p-4">
  <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl space-y-4">
    <Dialog.Title className="text-lg font-semibold text-[#008080]">Search Conversations</Dialog.Title>
    <input
  type="text"
  placeholder="Search..."
  value={searchQuery}
  onChange={(e) => setSearchQuery(e.target.value)}
  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
/>

    <div className="flex justify-end">
      <button
        onClick={() => setSearchOpen(false)}
        className="px-4 py-2 bg-[#008080] text-white rounded-lg hover:bg-opacity-90 transition"
      >
        Close
      </button>
    </div>
  </Dialog.Panel>
</div>
</Dialog>
      
      
      <div 
        className="flex flex-col flex-1 transition-all duration-300"
        style={{
          marginLeft: !isCentered && sidebarOpen ? '260px' : '0'
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
        
        <ChatInput onSendMessage={onSendMessage} />
      </div>
      </div>
    </div>
  );
}

