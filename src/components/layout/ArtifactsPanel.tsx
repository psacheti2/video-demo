'use client';

import { useState, useEffect, useRef } from 'react';
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
  type: string;
  title: string;
  component: string;
  data: any;
}

interface ArtifactsPanelProps {
  artifacts: ArtifactData[];
  isFullscreen?: boolean;
  toggleFullscreen: () => void;
  messageId?: string; // Add a messageId prop to detect new messages
  prevArtifactsCount?: number; // Previous count of artifacts
}

export default function ArtifactsPanel({
  artifacts,
  isFullscreen = false,
  toggleFullscreen,
  messageId = '', // Default to empty string
  prevArtifactsCount = 0 // Default to 0
}: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactData | null>(null);
  const prevMessageId = useRef(messageId);
  const prevArtifactsLength = useRef(artifacts.length);

  const InfrastructureFloodMapWithProps = ({ data }: { data: any }) => <InfrastructureFloodMap {...data} />;
  const ChartComponentWithProps = ({ data }: { data: any }) => <ChartComponent {...data} />;
  const ReportComponentWithProps = ({ data }: { data: any }) => <ReportComponent {...data} />;
  const BudgetDashboardComponentWithProps = ({ data }: { data: any }) => <BudgetDashboard {...data} />;
  const IndexDashboardComponentWithProps = ({ data }: { data: any }) => <IndexDashboard {...data} />;
  const ReportComponentVancouverWithProps = ({ data }: { data: any }) => <ReportComponentVancouver {...data} />;
  const IndexMapComponentWithProps = ({ data }: { data: any }) => <InfrastructureIndexMap {...data} />;
  const HousingMapComponentWithProps = ({ data }: { data: any }) => <HousingMapComponent {...data} />;
  const SevenExtractComponentWithProps = ({ data }: { data: any }) => <PdfViewer {...data} />;
  const FourMapComponentWithProps = ({ data }: { data: any }) => <FourMap {...data} />;
  const PdfViewerComponentWithProps = ({ data }: { data: any }) => <PdfViewer {...data} />;

  // This effect detects when a new message arrives (messageId changes)
  useEffect(() => {
    // Only run when messageId changes and it's not the initial render
    if (messageId !== '' && messageId !== prevMessageId.current) {
      console.log(`Message ID changed: ${prevMessageId.current} -> ${messageId}`);
      console.log(`Artifacts count: ${artifacts.length}, Previous count: ${prevArtifactsCount}`);
      
      // A new message has arrived
      if (artifacts.length === prevArtifactsCount) {
        // If no new artifacts were added with this message, show the artifact list
        console.log('No new artifacts detected, showing list view');
        setSelectedArtifact(null);
      } else if (artifacts.length > prevArtifactsCount) {
        // If new artifacts were added, select the newest one
        console.log('New artifact detected, showing newest artifact');
        setSelectedArtifact(artifacts[artifacts.length - 1]);
      }
      
      // Update the previous message ID
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
      <div className="sticky top-0 z-10 flex items-center justify-between py-4 px-3 bg-white shadow-sm">
        {selectedArtifact ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedArtifact(null)}
              className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
              aria-label="Back to List"
            >
              <ArrowLeft className="h-4 w-4 text-[#008080] group-hover:text-white" />
            </button>
            <h2 className="text-sm font-semibold text-gray-800">{selectedArtifact.title}</h2>
          </div>
        ) : (
          <h2 className="text-sm font-semibold text-[#2C3E50]">Artifacts ({artifacts.length})</h2>
        )}
        
        <button
          onClick={toggleFullscreen}
          className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
          aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
          {isFullscreen ? (
            <Minimize2 className="h-4 w-4 text-[#008080] group-hover:text-white" />
          ) : (
            <Maximize2 className="h-4 w-4 text-[#008080] group-hover:text-white" />
          )}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedArtifact ? (
          <div className="h-full p-2 overflow-auto">
            {renderArtifactComponent(selectedArtifact)}
          </div>
        ) : (
          <div className="p-4 space-y-4">
            {[...artifacts].reverse().map((artifact, index) => (
              <div
                key={index}
                className="border border-[#008080] rounded-lg p-4 cursor-pointer bg-white text-[#008080] hover:bg-[#008080] hover:text-white transition-colors duration-200 group"
                onClick={() => setSelectedArtifact(artifact)}
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