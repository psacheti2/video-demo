'use client';

import { useState, useEffect } from 'react';
import { PanelRight, ArrowLeft, ChevronLeft } from 'lucide-react'; // Import the Lucide icons
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

export default function Home() {
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [artifactsPanelWidth, setArtifactsPanelWidth] = useState(40); // percentage
  const [isArtifactFullscreen, setIsArtifactFullscreen] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const addArtifact = (artifact: Artifact) => {
    setArtifacts(prev => [...prev, artifact]);
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
      <div className="flex flex-1 overflow-hidden">
        {/* Conditional layout based on artifact presence */}
        {isArtifactFullscreen ? (
          // Fullscreen artifact view
          <div className="flex-1 overflow-hidden">
            <ArtifactsPanel
              artifacts={artifacts}
              isFullscreen={true}
              toggleFullscreen={() => setIsArtifactFullscreen(!isArtifactFullscreen)}
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
                onArtifactGenerated={addArtifact}
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
                onArtifactGenerated={addArtifact}
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