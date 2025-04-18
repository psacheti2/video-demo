'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Maximize2, Minimize2, ArrowLeft } from 'lucide-react';
import InfrastructureFloodMap from '../artifacts/InfrastructureFloodMap';
import ChartComponent from '../artifacts/ChartComponent';
import ReportComponent from '../artifacts/ReportComponent';
import BudgetDashboard from '../artifacts/BudgetDashboard';
import IndexDashboard from '../artifacts/BenefitCostAnalysisDashboard'
import ReportComponentVancouver from '../artifacts/ReportComponentVancouver'
import InfrastructureIndexMap from '../artifacts/InfrastructureRiskIndexMap'
import HousingMapComponent from '../artifacts/AffordableHousingMap'
import ExtractComponent from '../artifacts/SevenExtract'
import FourReport from '../artifacts/FourReport'
import FourMap from '../artifacts/FourMap'
import PdfViewer from '../artifacts/PdfViewerComponent'


interface ArtifactData {
  id: string;
  date: string;
  title: string;
  type: string;
  component: string;
  data: any;
}

interface ArtifactsPanelProps {
  artifacts: ArtifactData[];
  isFullscreen?: boolean;
  toggleFullscreen: () => void;
  messageId?: string;
  prevArtifactsCount?: number;
  selectedArtifact?: ArtifactData | null;
  setSelectedArtifact?: (artifact: ArtifactData | null) => void;
  savedArtifacts?: ArtifactData[];
  setSavedArtifacts?: React.Dispatch<React.SetStateAction<ArtifactData[]>>;
}


export default function ArtifactsPanel({
  artifacts,
  isFullscreen = false,
  toggleFullscreen,
  messageId = '',
  prevArtifactsCount = 0,
  selectedArtifact,
  setSelectedArtifact,
  savedArtifacts = [], 
  setSavedArtifacts = () => {} 
}: ArtifactsPanelProps) {
  const controlledArtifact = selectedArtifact;
  const setControlledArtifact = setSelectedArtifact || (() => {});
    const prevMessageId = useRef(messageId);
  const prevArtifactsLength = useRef(artifacts.length);


  const InfrastructureFloodMapWithProps = ({ data }: { data: any }) => {
    const component = useMemo(() => (
      <InfrastructureFloodMap
  {...data}
  savedMaps={savedArtifacts}
  setSavedArtifacts={setSavedArtifacts}
  title={controlledArtifact?.title}
  onBack={() => {
    if (isFullscreen) {
      toggleFullscreen();               // ⬅️ exit fullscreen first
      setTimeout(() => {
        setControlledArtifact(null);    // ⬅️ then open gallery
      }, 300);
    } else {
      setControlledArtifact(null);      // ⬅️ regular back just opens gallery
    }
  }}
/>
    
    ), [data.id, controlledArtifact?.title, isFullscreen, setControlledArtifact]);    
    return component;
  };

  const ChartComponentWithProps = ({ data }: { data: any }) => <ChartComponent {...data} />;
  const ReportComponentWithProps = ({ data }: { data: any }) => <ReportComponent {...data} />;
  const BudgetDashboardComponentWithProps = ({ data }: { data: any }) => (
    <BudgetDashboard
      {...data}
      setSavedArtifacts={setSavedArtifacts}
      title={controlledArtifact?.title}
      onBack={() => {
        if (isFullscreen) {
          toggleFullscreen();
          setTimeout(() => {
            setControlledArtifact(null);
          }, 300);
        } else {
          setControlledArtifact(null);
        }
      }}
    />
  );  
  const IndexDashboardComponentWithProps = ({ data }: { data: any }) => <IndexDashboard {...data} />;
  const ReportComponentVancouverWithProps = ({ data }: { data: any }) => <ReportComponentVancouver {...data} />;
  const IndexMapComponentWithProps = ({ data }: { data: any }) => <InfrastructureIndexMap {...data} />;
  const HousingMapComponentWithProps = ({ data }: { data: any }) => <HousingMapComponent {...data} savedMaps={savedArtifacts} setSavedArtifacts={setSavedArtifacts} />
  const SevenExtractComponentWithProps = ({ data }: { data: any }) => <PdfViewer {...data} />;
  const FourMapComponentWithProps = ({ data }: { data: any }) => (
    <FourMap {...data} savedMaps={savedArtifacts} setSavedArtifacts={setSavedArtifacts} />
  );  
  const PdfViewerComponentWithProps = ({ data }: { data: any }) => <PdfViewer {...data} />;

  // This effect detects when a new message arrives (messageId changes)
  useEffect(() => {
    // Only react to new user messages, not conversation reloads
    if (messageId !== '' && messageId !== prevMessageId.current && messageId.startsWith('user_')) {
      if (artifacts.length > prevArtifactsCount) {
        setControlledArtifact?.(artifacts[artifacts.length - 1]);
      }
  
      prevMessageId.current = messageId;
      prevArtifactsLength.current = artifacts.length;
    }
  }, [messageId, artifacts, prevArtifactsCount]);
  

  const renderArtifactComponent = (artifact: ArtifactData) => {
    // You need to implement this function based on your actual components
    // For example:
    switch (artifact.component) {
      case 'MapComponent':
        return <InfrastructureFloodMapWithProps data={artifact.data} />;
      case 'ChartComponent':
        return <ChartComponentWithProps data={artifact.data} />;
      case 'BudgetDashboard':
       return <BudgetDashboardComponentWithProps data={artifact.data} />;
      case 'IndexDashboard':
        return <IndexDashboardComponentWithProps data={artifact.data} />; 
      case 'ReportComponentVancouver':
        return <ReportComponentVancouverWithProps data={artifact.data} />; 
      case 'ReportComponent':
        return <ReportComponentWithProps data={artifact.data} />;
      case 'RiskComponent':
        return <IndexMapComponentWithProps data={artifact.data} />;
      case 'HousingMapComponent' :
        return <HousingMapComponentWithProps data={artifact.data} />;
      case 'SevenExtract' :
        return <SevenExtractComponentWithProps data={artifact.data} />;
      case 'FourMap' :
          return <FourMapComponentWithProps data={artifact.data} />;     
      default:
        return <div>Artifact component: {artifact.component}</div>;
    }
  };

  // If there are no artifacts, don't show the panel
  if (artifacts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col h-full overflow-hidden relative">
<div 
  className="sticky top-0 z-10 flex items-center justify-between py-4 px-3 bg-white border-t border-b border-gray-300" 
>
         {controlledArtifact ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() =>setControlledArtifact?.(null)}
              className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
              aria-label="Back to List"
            >
              <ArrowLeft className="h-4 w-4 text-[#008080] group-hover:text-white" />
            </button>
            <h2 className="text-sm font-semibold text-gray-800">{controlledArtifact.title}</h2>
          </div>
        ) : (
          <h2 className="text-sm font-semibold text-[#2C3E50]">Artifacts ({artifacts.length})</h2>
        )}
        
        
      </div>

      <div className="flex-1 overflow-y-auto">
        {controlledArtifact ? (
          <div className="h-full p-2 overflow-auto">
            {renderArtifactComponent(controlledArtifact)}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {[...artifacts].reverse().map((artifact, index) => (
              <div
                key={index}
                className="border border-[#008080] rounded-lg p-4 cursor-pointer bg-white text-[#008080] hover:bg-[#008080] hover:text-white transition-colors duration-200 group"
                onClick={() => setControlledArtifact?.(artifact)}
                >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{artifact.title}</h3>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase text-gray-600 group-hover:text-[#008080]">
                    {artifact.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2 group-hover:text-white">
                  Click to view {artifact.type} artifact
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}