'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Trash2 } from 'lucide-react';
import Navbar from '../components/layout/Navbar';
import ResponsiveChatLayout from '../components/chat/ChatWindow';
import ArtifactsPanel from '../components/layout/ArtifactsPanel';
import WelcomeCard from '../components/chat/WelcomeCard';
import rawSidebar from '../components/layout/Sidebar.jsx';
const Sidebar = rawSidebar as React.ComponentType<any>;
import { Dialog } from '@headlessui/react';
import ArtifactViewer from '../components/ArtifactViewer'

export interface Artifact {
  id: string;
  title: string;
  type: string;
  component: string;
  data: any;
  date: string;
}

export interface ChatMessageType {
  text: string;
  file?: string | null;
  isUser: boolean;
  artifacts?: Artifact[];
  id: string;
}

export default function Home() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewConversation, setIsNewConversation] = useState(true);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(40);
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [lastMessageId, setLastMessageId] = useState<string>('');
  const prevArtifactsLength = useRef(0);
  const [sidebarTab, setSidebarTab] = useState('recent');
  // Use a function for initial state that doesn't depend on browser APIs
  const [conversationId, setConversationId] = useState('');
  const [refreshSidebarKey, setRefreshSidebarKey] = useState(0);
  const [selectedArtifact, setSelectedArtifact] = useState<Artifact | null>(null);
  const [savedArtifacts, setSavedArtifacts] = useState<Artifact[]>([]);
  const isReloading = useRef(false);
  const [pendingSelectedArtifact, setPendingSelectedArtifact] = useState<Artifact | null>(null);
  const [modalArtifact, setModalArtifact] = useState<Artifact | null>(null);
  const [showAllSavedDialog, setShowAllSavedDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize state that depends on browser APIs
  useEffect(() => {
    // Only run on client side
    setConversationId(`conv_${Date.now()}`);
    
    // Load saved artifacts from localStorage
    const stored = typeof window !== 'undefined' ? localStorage.getItem('savedArtifacts') : null;
    if (stored) {
      setSavedArtifacts(JSON.parse(stored));
    }
  }, []);

  const loadConversation = (id: string) => {
    if (typeof window === 'undefined') return; // Guard against SSR
    
    isReloading.current = true;
    const stored = JSON.parse(localStorage.getItem('conversations') || '{}');
    const convo = stored[id];
    if (convo) {
      const messages: ChatMessageType[] = convo.messages || [];

      const allArtifacts: Artifact[] = [];
      messages.forEach((msg) => {
        if (msg.artifacts && msg.artifacts.length > 0) {
          allArtifacts.push(...msg.artifacts);
        }
      });

      setMessages(messages);
      setArtifacts(allArtifacts);
      setSelectedArtifact(null); 
      setArtifactsPanelWidth(0); 
      setConversationId(id);
      localStorage.setItem('activeConversationId', id);
      setIsNewConversation(false);
      prevArtifactsLength.current = allArtifacts.length;
      setLastMessageId(prev => prev || `loaded_${id}`);
      if (pendingSelectedArtifact) {
        setTimeout(() => {
          setSelectedArtifact(pendingSelectedArtifact);
          setPendingSelectedArtifact(null);
        }, 50); 
      }
    }
    setTimeout(() => {
      isReloading.current = false;
    }, 500);
  };

  // Update localStorage only on client side
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('savedArtifacts', JSON.stringify(savedArtifacts));
    }
  }, [savedArtifacts]);

  const addArtifact = (artifact: Artifact) => {
    setArtifacts(prev => [...prev, artifact]);
  };

  const saveConversationToLocalStorage = (id: string, messages: ChatMessageType[], artifacts: Artifact[]) => {
    if (typeof window === 'undefined') return; // Guard against SSR
    
    const allConversations = JSON.parse(localStorage.getItem('conversations') || '{}');
    allConversations[id] = {
      messages,
      artifacts,
      lastUpdated: new Date().toISOString(),
    };
    localStorage.setItem('conversations', JSON.stringify(allConversations));
  };

  const startNewConversation = () => {
    const isEmpty =
      messages.length === 0 ||
      (messages.length === 1 && messages[0].text.trim() === '');
  
    if (!isEmpty) {
      setMessages([]);
      setArtifacts([]);
      setSelectedArtifact(null); 
      setArtifactsPanelWidth(0);
      setIsNewConversation(true);
  
      const newId = `conv_${Date.now()}`;
      setConversationId(newId);
      if (typeof window !== 'undefined') {
        localStorage.setItem('activeConversationId', newId);
      }
    }
  };
  
  const handleSendMessage = async ({ text, file }: { text: string, file: string | null }) => {
    if (isNewConversation) {
      setIsNewConversation(false);
    }
    
    const userMessageId = `user_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const userMessage: ChatMessageType = { 
      text, 
      file, 
      isUser: true, 
      id: userMessageId 
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    prevArtifactsLength.current = artifacts.length;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });
    
      if (!response.ok) throw new Error('Failed to get response');
    
      const data = await response.json();
      const assistantMessageId = `assistant_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
      const botMessage: ChatMessageType = {
        text: data.text,
        isUser: false,
        id: assistantMessageId,
      };
    
      if (data.artifacts && data.artifacts.length > 0) {
        botMessage.artifacts = data.artifacts;
        data.artifacts.forEach((artifact: Artifact, index: number) => {
          addArtifact(artifact);
          // Select the first new artifact immediately
          if (index === 0) {
            setSelectedArtifact(artifact);
            if (artifactsPanelWidth === 0) {
              setArtifactsPanelWidth(40); // Open panel if closed
            }
          }
        });
      }
      const updatedMessages = [...messages, userMessage, botMessage];
      const updatedArtifacts = [...artifacts];
    
      setMessages(updatedMessages);
      saveConversationToLocalStorage(conversationId, updatedMessages, updatedArtifacts);
      setRefreshSidebarKey(prev => prev + 1);
      setLastMessageId(assistantMessageId);
    
    } catch (error) {
      console.error('Error sending message:', error);
      
      const errorMessageId = `error_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      
      setMessages(prev => [...prev, {
        text: "Sorry, I encountered an error. Please try again.",
        isUser: false,
        id: errorMessageId
      }]);
      
      setLastMessageId(errorMessageId);
      
    } finally {
      setIsLoading(false);
    }
  };

  const toggleSidebar = () => {
    setShowSidebar(prev => !prev);
  };

  const hasArtifacts = artifacts.length > 0;

  interface SidebarButtonProps {
    onClick: () => void;
    Icon: React.ElementType;
    position: 'left' | 'right';
  }

  const handleArtifactSelect = (artifact: Artifact) => {
    console.log('Selected artifact:', artifact);
    setSelectedArtifact(artifact);
  
    if (isNewConversation) {
      setIsNewConversation(false);
    }
  
    if (artifactsPanelWidth === 0) {
      setArtifactsPanelWidth(40);
    }
  };
  
  const SidebarButton = ({ onClick, Icon, position }: SidebarButtonProps) => (
    <button 
      onClick={onClick}
      className={`p-2 rounded-full bg-white border border-gray-300 hover:bg-[#008080]/90 group shadow-sm transition absolute top-4 ${position === 'left' ? 'left-4' : 'right-4'} z-10`}
    >
      <Icon className="h-5 w-5 text-[#008080] group-hover:text-white" />
    </button>
  );

  // Create resizable divider component
  const DividerComponent = () => {
    const [isDragging, setIsDragging] = useState(false);

    useEffect(() => {
      if (isDragging) {
        const onMouseMove = (e: MouseEvent) => {
          if (typeof window === 'undefined') return; // Guard against SSR
          const containerWidth = document.body.clientWidth;
          const widthPercentage = (e.clientX / containerWidth) * 100;
          setArtifactsPanelWidth(Math.max(20, Math.min(80, 100 - widthPercentage)));
        };

        const onMouseUp = () => {
          setIsDragging(false);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);

        return () => {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mouseup', onMouseUp);
        };
      }
    }, [isDragging]);

    return (
      <div
        className="relative"
        onMouseDown={() => setIsDragging(true)}
      >
        <div className="group relative w-1 h-full cursor-ew-resize bg-transparent">
          <div
            className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[6px] rounded-md h-full bg-white/60 backdrop-blur-md shadow-sm border border-gray-300 group-hover:bg-[#008080] group-hover:shadow-md transition-all duration-200"
          />
        </div>
      </div>
    );
  };

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
      
      <Sidebar
        isOpen={showSidebar}
        onClose={() => setShowSidebar(false)}
        activeTab={sidebarTab}
        setActiveTab={setSidebarTab}
        onLoadConversation={loadConversation}
        refreshKey={refreshSidebarKey}
        onStartNewChat={startNewConversation}
        savedArtifacts={savedArtifacts}
        setModalArtifact={setModalArtifact}
        activeChatId={conversationId}
      />
      
      <Navbar
        onToggleSidebar={toggleSidebar}
        sidebarOpen={showSidebar}
        onStartNewChat={startNewConversation}
      />
      
      <div className="flex flex-1 overflow-hidden pt-1">
        {/* Conditional layout based on artifact presence */}
        {isArtifactFullscreen ? (
          // Fullscreen artifact view
          <div className="flex-1 overflow-hidden">
            <ArtifactsPanel
              artifacts={artifacts}
              toggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
              messageId={lastMessageId}
              prevArtifactsCount={prevArtifactsLength.current}
              selectedArtifact={selectedArtifact}
              setSelectedArtifact={setSelectedArtifact}
              savedArtifacts={savedArtifacts}
              setSavedArtifacts={setSavedArtifacts}
            />
          </div>
        ) : hasArtifacts || selectedArtifact ? (  
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
                isCentered={!hasArtifacts && !selectedArtifact}
                sidebarOpen={showSidebar}
                setSidebarOpen={setShowSidebar}
                setSelectedArtifact={handleArtifactSelect}
              />
            </div>
            
            <DividerComponent />
            
            <div
              style={{ width: `${artifactsPanelWidth}%` }}
              className="bg-white overflow-hidden shadow-md"
            >
              <ArtifactsPanel
                artifacts={artifacts}
                toggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
                messageId={lastMessageId}
                prevArtifactsCount={prevArtifactsLength.current}
                selectedArtifact={selectedArtifact}
                setSelectedArtifact={setSelectedArtifact}
                savedArtifacts={savedArtifacts}
                setSavedArtifacts={setSavedArtifacts}
              />
            </div>
          </div>
        ) : (
          // Centered chat view with no artifacts
          <div className="flex justify-center w-full relative">
            <div className="w-full max-w-3xl">
              {isNewConversation ? (
                <>
                  <div className="mt-48"> 
                    <div className="mb-1">
                      <WelcomeCard
                        onSendMessage={handleSendMessage}
                        savedArtifacts={savedArtifacts}
                        setModalArtifact={setModalArtifact}
                      />
                    </div>
                    {savedArtifacts.length > 0 && (
                      <div className="w-full mt-6 px-4 flex justify-center">
                        <div className="w-full max-w-[600px]">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                              Recently Saved
                            </h3>
                            <button
                              onClick={() => setShowAllSavedDialog(true)}
                              className="text-xs font-medium text-[#008080] bg-[#e6f9f9] px-3 py-1.5 rounded-full shadow-sm hover:bg-[#d2f3f3] transition"
                            >
                              See All
                            </button>
                          </div>

                          <div className="flex flex-wrap justify-center gap-4">
                            {savedArtifacts.slice(0, 3).map((artifact) => (
                              <button
                                key={artifact.id}
                                onClick={() => setModalArtifact(artifact)}
                                className="flex flex-col w-[180px] p-4 bg-white rounded-xl border border-gray-200 shadow hover:shadow-md transition group text-left"
                              >
                                <div className="text-[#008080] font-semibold text-sm truncate group-hover:underline">
                                  {artifact.title}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  {artifact.type} • {artifact.date}
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <ResponsiveChatLayout 
                  messages={messages}
                  setMessages={setMessages}
                  isLoading={isLoading}
                  onSendMessage={handleSendMessage}
                  isCentered={!hasArtifacts && !selectedArtifact}
                  sidebarOpen={showSidebar}
                  setSidebarOpen={setShowSidebar}
                  setSelectedArtifact={handleArtifactSelect}
                />
              )}
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={!!modalArtifact} onClose={() => setModalArtifact(null)} className="relative z-[500]">
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[500]">
          <Dialog.Panel className="w-full max-w-5xl h-[80vh] overflow-hidden rounded-xl bg-white shadow-xl p-4 relative">
            <button
              onClick={() => setModalArtifact(null)}
              className="absolute top-4 right-4 text-[#008080] hover:text-white bg-white border border-[#008080] hover:bg-[#008080] p-1.5 rounded-full transition"
            >
              <span className="text-sm font-bold">X</span>
            </button>
            {modalArtifact && (
  <ArtifactViewer
    artifact={modalArtifact}
    onClose={() => setModalArtifact(null)}
  />
)}
          </Dialog.Panel>
        </div>
      </Dialog>
      
      <Dialog open={showAllSavedDialog} onClose={() => setShowAllSavedDialog(false)} className="relative z-[400]">
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4 z-[400]">
          <Dialog.Panel className="w-full max-w-xl max-h-[80vh] overflow-y-auto bg-white rounded-2xl shadow-2xl p-6 relative space-y-5 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-base font-semibold text-[#008080]">All Saved Artifacts</h2>
              <button
                onClick={() => setShowAllSavedDialog(false)}
                className="p-2 rounded-full bg-white border border-[#008080] hover:bg-[#008080] group shadow-sm transition"
                title="Close"
              >
                <X className="h-4 w-4 text-[#008080] group-hover:text-white" />
              </button>
            </div>

            {/* Search Input */}
            <input
              type="text"
              placeholder="Search by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#008080]"
            />

            {/* List */}
            <div className="space-y-3">
              {savedArtifacts
                .filter((artifact) =>
                  artifact.title.toLowerCase().includes(searchQuery.toLowerCase())
                )
                .map((artifact) => (
                  <div
                    key={artifact.id}
                    className="flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg bg-[#f9fafa] hover:shadow-sm transition"
                  >
                    {/* Info */}
                    <button
                      onClick={() => {
                        setModalArtifact(artifact);
                        setShowAllSavedDialog(false);
                      }}
                      className="flex-1 text-left"
                    >
                      <div className="font-medium text-sm text-[#008080] truncate">
                        {artifact.title}
                      </div>
                      <div className="text-xs text-gray-500">{artifact.type} • {artifact.date}</div>
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() =>
                        setSavedArtifacts((prev) =>
                          prev.filter((a) => a.id !== artifact.id)
                        )
                      }
                      className="p-2 rounded-full bg-white border border-[#008080] hover:bg-[#008080] group shadow-sm transition ml-2"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4 text-[#008080] group-hover:text-white" />
                    </button>
                  </div>
                ))}
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}