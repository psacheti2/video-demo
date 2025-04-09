'use client';

import { useState, useEffect, useRef } from 'react';
import { PanelRight, ArrowLeft, ChevronLeft } from 'lucide-react'; 
import Navbar from '../components/layout/Navbar';
import ResponsiveChatLayout from '../components/chat/ChatWindow';
import ArtifactsPanel from '../components/layout/ArtifactsPanel';

// Define the artifact type
export interface Artifact {
  type: string;
  title: string;
  component: string;
  data: any;
}

// Define the chat message type
export interface ChatMessageType {
  text: string;
  file?: string | null;
  isUser: boolean;
  artifacts?: Artifact[];
  id: string; // Add unique ID to each message
}

export default function Home() {
  // Lift the messages state up to the Home component
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(40); // percentage
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string>(''); // Track last message ID
  const prevArtifactsLength = useRef(0); // Track previous artifacts length

  const addArtifact = (artifact: Artifact) => {
    setArtifacts(prev => [...prev, artifact]);
  };

  // Function to handle sending messages
  const handleSendMessage = async ({ text, file }: { text: string, file: string | null }) => {
    // Generate unique message ID
    const userMessageId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Add user message
    const userMessage: ChatMessageType = { 
      text, 
      file, 
      isUser: true, 
      id: userMessageId 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    // Remember current artifacts count before response
    prevArtifactsLength.current = artifacts.length;
    
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
      
      // Generate unique ID for assistant message
      const assistantMessageId = `assistant_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      // Create bot message with any artifacts attached
      const botMessage: ChatMessageType = { 
        text: data.text, 
        isUser: false,
        id: assistantMessageId
      };
      
      // Add artifacts to the message if any were generated
      if (data.artifacts && data.artifacts.length > 0) {
        botMessage.artifacts = data.artifacts;
        
        // Add each artifact to the artifacts state
        data.artifacts.forEach((artifact: Artifact) => {
          addArtifact(artifact);
        });
      }
      
      // Add the bot message to the messages state
      setMessages(prev => [...prev, botMessage]);
      
      // Set the last message ID to trigger the artifacts panel update
      setLastMessageId(assistantMessageId);
      
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Generate unique ID for error message
      const errorMessageId = `error_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        id: errorMessageId
      }]);
      
      // Update last message ID
      setLastMessageId(errorMessageId);
      
    } finally {
      setIsLoading(false);
    }
  };

  // Function to toggle sidebar
  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  // Check if artifacts exist
  const hasArtifacts = artifacts.length > 0;

  // Create sidebar button component with navbar-like styling
  interface SidebarButtonProps {
    onClick: () => void;
    Icon: React.ElementType;
    position: 'left' | 'right';
  }
  
  const SidebarButton = ({ onClick, Icon, position }: SidebarButtonProps) => (
    <button 
      onClick={onClick}
      className={`p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} z-10`}
    >
      <Icon className="h-5 w-5 text-[#008080] group-hover:text-white" />
    </button>
  );

  return (
    <div className="flex flex-col h-screen max-h-screen overflow-hidden">
      {/* Topography overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage: "url('/assets/topography.svg')",
          backgroundPosition: "center",
          filter: "opacity(0.1)",
        }}
      />
      
      <Navbar />
      <div className="flex flex-1 overflow-hidden pt-1">
        {/* Conditional layout based on artifact presence */}
        {isArtifactFullscreen ? (
          // Fullscreen artifact view
          <div className="flex-1 overflow-hidden">
            <ArtifactsPanel
              artifacts={artifacts}
              isFullscreen={true}
              toggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              messageId={lastMessageId}
              prevArtifactsCount={prevArtifactsLength.current}
            />
          </div>
        ) : hasArtifacts || showSidebar ? (
          // Split view with artifacts panel
          <div className="flex flex-1 overflow-hidden">
            <div
              className="flex-1 overflow-hidden relative"
              style={{ width: `${100 - artifactsPanelWidth}%` }}
            >
              <ResponsiveChatLayout 
                messages={messages}
                setMessages={setMessages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                isCentered={false} 
              />
            </div>
            <div
              className="relative"
              onMouseDown={(e) => {
                const startX = e.clientX;
                const startWidth = artifactsPanelWidth;
                const onMouseMove = (moveEvent: MouseEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const containerWidth = document.body.clientWidth;
                  const newWidth = startWidth - (deltaX / containerWidth * 100);
                  setArtifactsPanelWidth(Math.max(20, Math.min(80, newWidth)));
                };
                const onMouseUp = () => {
                  document.removeEventListener('mousemove', onMouseMove);
                  document.removeEventListener('mouseup', onMouseUp);
                };
                document.addEventListener('mousemove', onMouseMove);
                document.addEventListener('mouseup', onMouseUp);
              }}
            >
              <div className="group relative w-1 h-full cursor-ew-resize bg-transparent">
                <div
                  className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[6px] rounded-md h-full bg-white/60 backdrop-blur-md shadow-sm border border-gray-300 group-hover:bg-[#008080] group-hover:shadow-md transition-all duration-200"
                >
                </div>
              </div>
            </div>
            <div
              style={{ width: `${artifactsPanelWidth}%` }}
              className="bg-white overflow-hidden shadow-md"
            >
              <ArtifactsPanel
                artifacts={artifacts}
                toggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
                messageId={lastMessageId}
                prevArtifactsCount={prevArtifactsLength.current}
              />
            </div>
          </div>
        ) : (
          // Centered chat view with no artifacts
          <div className="flex justify-center w-full relative">
            {/* Left sidebar button */}
            <SidebarButton onClick={toggleSidebar} Icon={PanelRight} position="left" />
            
            <div className="w-full max-w-3xl">
              <ResponsiveChatLayout 
                messages={messages}
                setMessages={setMessages}
                isLoading={isLoading}
                onSendMessage={handleSendMessage}
                isCentered={true} 
              />
            </div>
            
            {/* Right arrow button */}
            <SidebarButton onClick={() => {/* Define action for right arrow */}} Icon={ChevronLeft} position="right" />
          </div>
        )}
      </div>
    </div>
  );
}