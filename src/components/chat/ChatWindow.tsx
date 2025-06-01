'use client';

import { useState, useEffect, useRef } from 'react';
import { Brain, Zap, Sparkles, Code, FileText, Send } from 'lucide-react';

interface SequentialLoadingMessagesProps {
  isVisible: boolean;
}


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
  onSendMessage: ({ text, files }: { text: string, files?: (File | string)[] }) => Promise<void>; // Updated
  isCentered?: boolean;
  sidebarOpen: boolean;
  setSidebarOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  setSelectedArtifact: (artifact: Artifact) => void; 
  isReloading?: React.RefObject<boolean>; 
}

export default function ChatWindow({ 
  messages,
  setMessages,
  isLoading,
  onSendMessage,
  isCentered = false,
  sidebarOpen,
  setSidebarOpen,
  setSelectedArtifact,
  isReloading
}: ChatWindowProps) {
 
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  const handleFeedback = (messageId: string, feedbackType: 'like' | 'dislike' | null) => {
    // Update the message with the feedback
    setMessages(prevMessages => 
      prevMessages.map(msg => 
        msg.id === messageId ? { ...msg, feedback: feedbackType } : msg
      )
    );
    
    // You can also send the feedback to your backend here if needed
    console.log(`Message ${messageId} received ${feedbackType} feedback`);
  };
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

const [activeFeedbackMessageId, setActiveFeedbackMessageId] = useState<string | null>(null);

  return (
    
    <div className="flex h-full relative">
      <div
  className="flex flex-col flex-1 transition-all duration-300"
  style={{ marginLeft: !isCentered && sidebarOpen && messages.length > 0 ? '260px' : '0' }}
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
      
<div className="flex flex-col h-full">
  <div className="flex-1 overflow-y-auto p-4 space-y-4">
    {messages.map((message, index) => (
      <ChatMessage
        key={index}
        message={message}
        isUser={message.isUser}
        isReloading={isReloading?.current || false} 
        onArtifactClick={(artifact: Artifact) => setSelectedArtifact(artifact)}
        onFeedback={handleFeedback} 
        activeFeedbackMessageId={activeFeedbackMessageId}
  setActiveFeedbackMessageId={setActiveFeedbackMessageId}
      />
    ))}
    <div ref={messagesEndRef} />
  </div>
  <ChatInput onSendMessage={onSendMessage} setActiveFeedbackMessageId={setActiveFeedbackMessageId} />
</div>

      </div>
    </div>
  );
}

