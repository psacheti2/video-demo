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
}

export default function ArtifactsPanel({
  artifacts,
  isFullscreen = false,
  toggleFullscreen
}: ArtifactsPanelProps) {
  const [selectedArtifact, setSelectedArtifact] = useState<ArtifactData | null>(null);

  // Define properly typed components to fix TypeScript error
  const InfrastructureFloodMapWithProps = ({ data }: { data: any }) => <InfrastructureFloodMap {...data} />;
  const ChartComponentWithProps = ({ data }: { data: any }) => <ChartComponent {...data} />;
  const ReportComponentWithProps = ({ data }: { data: any }) => <ReportComponent {...data} />;
  const BudgetDashboardComponentWithProps = ({ data }: { data: any }) => <BudgetDashboard {...data} />;
  const IndexDashboardComponentWithProps = ({ data }: { data: any }) => <IndexDashboard {...data} />;
  const ReportComponentVancouverWithProps = ({ data }: { data: any }) => <ReportComponentVancouver {...data} />;
  const IndexMapComponentWithProps = ({ data }: { data: any }) => <InfrastructureIndexMap {...data} />;
  const HousingMapComponentWithProps = ({ data }: { data: any }) => <HousingMapComponent {...data} />;
  const SevenExtractComponentWithProps = ({ data }: { data: any }) => <ExtractComponent {...data} />;
  const FourMapComponentWithProps = ({ data }: { data: any }) => <FourMap {...data} />;
  const PdfViewerComponentWithProps = ({ data }: { data: any }) => <PdfViewer {...data} />;

  const prevArtifactsLength = useRef(artifacts.length);

  useEffect(() => {
    if (artifacts.length > prevArtifactsLength.current) {
      // Automatically open the newest artifact
      setSelectedArtifact(artifacts[artifacts.length - 1]);
    }
    prevArtifactsLength.current = artifacts.length;
  }, [artifacts]);

  const renderArtifactComponent = (artifact: ArtifactData) => {
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
        return <PdfViewerComponentWithProps data={artifact.data} />;
      case 'FourMap' :
          return <FourMapComponentWithProps data={artifact.data} />;
      default:
        return <div>Unknown artifact type</div>;
    }
  };

  return (
<div className="flex flex-col h-full overflow-y-hidden bg-white border-l border-gray-200">
<div
  className="sticky top-0 z-10 flex items-center justify-between py-2 px-3 shadow-sm"
  style={{
    background: 'linear-gradient(to right, white, transparent)'
  }}
>
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
    <h2 className="text-sm font-semibold text-gray-800">Artifacts</h2>
  )}

</div>



      <div className="flex-1 overflow-y-auto">
        {artifacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No artifacts generated yet.</p>
            <p className="text-sm mt-2">Ask Neuracities to create maps, charts, or reports.</p>
          </div>
        ) : selectedArtifact ? (
          <div className="h-full p-2 overflow-auto">
            {renderArtifactComponent(selectedArtifact)}
          </div>
        ) : (
          <div className="p-4 space-y-4">
{[...artifacts].reverse().map((artifact, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setSelectedArtifact(artifact)}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">{artifact.title}</h3>
                  <span className="bg-gray-100 px-2 py-1 rounded text-xs uppercase">
                    {artifact.type}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mt-2">
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