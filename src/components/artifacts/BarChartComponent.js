import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Maximize2, X, Info, Share2, BookmarkPlus, ArrowLeft, Palette,  } from 'lucide-react';
import ShareDialog from '../ShareDialog'

// Color scheme for charts
const COLORS = {
  primary: '#2C3E50',
  secondary: '#34495E',
  coral: '#008080',
  gray: '#95A5A6',
  blue: '#3498DB',
  green: '#27AE60',
  orange: '#E67E22',
  purple: '#9B59B6',
  red: '#E74C3C',
  yellow: '#F1C40F',
  white: '#FFFFFF'
};

const locationData = [
  { 
    name: 'San Fernando de Henares Industrial Park',
    shortName: 'San Fernando',
    infrastructure: 8.9,
    regulatory: 8.8,
    environmental: 8.4,
    economic: 8.6,
    total: 8.7
  },
  { 
    name: 'Valdebebas – New Urban Extension',
    shortName: 'Valdebebas',
    infrastructure: 8.2,
    regulatory: 8.0,
    environmental: 7.8,
    economic: 7.9,
    total: 8.0
  },
  { 
    name: 'Las Rozas de Madrid – NTT Madrid 1',
    shortName: 'Las Rozas',
    infrastructure: 7.5,
    regulatory: 7.2,
    environmental: 6.9,
    economic: 7.1,
    total: 7.2
  },
  { 
    name: 'Alcalá de Henares – Punto Com Park',
    shortName: 'Alcalá',
    infrastructure: 6.8,
    regulatory: 6.5,
    environmental: 6.2,
    economic: 6.4,
    total: 6.7
  },
  { 
    name: 'Alcobendas – Equinix MD2',
    shortName: 'Alcobendas',
    infrastructure: 5.5,
    regulatory: 5.0,
    environmental: 4.8,
    economic: 5.1,
    total: 5.2
  },
];

// Component scoring colors
const componentColors = {
  infrastructure: '#2C3E50',
  regulatory: '#27AE60', 
  environmental: '#E67E22',
  economic: '#3498DB'
};

const BarChartComponent = ({ onLayersReady, setSavedArtifacts, title, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeLocation, setActiveLocation] = useState('all');
  const chartContainerRef = useRef(null);
  const infoRef = useRef(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showPaletteDialog, setShowPaletteDialog] = useState(false);
  const [customSaveName, setCustomSaveName] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [editableTitle, setEditableTitle] = useState({
    roi: "ROI Comparison by Location",
    breakeven: "Break-Even Timeline by Location"
  });
  const [editableDescription, setEditableDescription] = useState({
    roi: "Projected ROI percentages across different NYC locations",
    breakeven: "Projected timeline to break even on initial $200,000 investment"
  });
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  
  const [customColors, setCustomColors] = useState({
    infrastructure: componentColors.infrastructure,
    regulatory: componentColors.regulatory,
    environmental: componentColors.environmental,
    economic: componentColors.economic
  });
  
  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];
  
  const [downloadSelections, setDownloadSelections] = useState({});
  
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowSources(false);
      }
    };
  
    if (showSources) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSources]);

  // Simulating data load
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      setLoading(false);
      if (onLayersReady) onLayersReady();
    }, 800);
    
    return () => clearTimeout(timer);
  }, [onLayersReady]);

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const addNotification = (message) => {
    setNotificationMessage(message);
    setShowEmailNotification(true);
    setTimeout(() => {
      setShowEmailNotification(false);
    }, 5000);
  };

  const renderBarChart = () => {
    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    
    return (
      <ResponsiveContainer width="100%" height={500}>
        <BarChart 
          data={locationData} 
          margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="shortName" 
            angle={-45}
            textAnchor="end"
            height={100}
            fontSize={12}
          />
          <YAxis 
            domain={[0, 10]}
            label={{ value: 'Score (0-10)', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value, name) => [value.toFixed(1), name.charAt(0).toUpperCase() + name.slice(1)]}
            labelFormatter={(label) => {
              const location = locationData.find(loc => loc.shortName === label);
              return location ? location.name : label;
            }}
          />
          <Legend />
          <Bar dataKey="infrastructure" stackId="a" fill={customColors.infrastructure} name="Infrastructure (40%)" />
          <Bar dataKey="regulatory" stackId="a" fill={customColors.regulatory} name="Regulatory (30%)" />
          <Bar dataKey="environmental" stackId="a" fill={customColors.environmental} name="Environmental (20%)" />
          <Bar dataKey="economic" stackId="a" fill={customColors.economic} name="Economic (10%)" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const handleDownloadChart = () => {
    // In a real implementation, this would use html2canvas or similar
    // to convert the chart to an image for download
    
    const format = downloadSelections['chart']?.format || '.jpg';
    const filename = downloadSelections['chart']?.filename || 'data_center_site_analysis';
    const fullName = `${filename}${format}`;
    
    addNotification(`Downloaded ${fullName}`);
    setShowShareDialog(false);
  };

  const renderPanelContent = (fullscreen = false) => (
    <div
      className={`transition-all duration-300 ${
        fullscreen
          ? 'fixed top-4 bottom-4 left-4 right-4 z-50 overflow-auto bg-white rounded-2xl shadow-2xl border border-gray-300 p-6'
          : 'px-4 pt-0 max-h-[90vh] overflow-y-auto pb-4'
      }`}
      ref={chartContainerRef}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-0 gap-0">
        {isFullscreen && title && (
          <div className="sticky top-0 z-50 flex items-center justify-between py-3 px-4 bg-white border-b border-gray-300 rounded-t-2xl">
            <div className="flex items-center gap-2">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
                  aria-label="Back to List"
                >
                  <ArrowLeft className="h-4 w-4 text-[#008080] group-hover:text-white" />
                </button>
              )}
              <h2 className="text-sm font-semibold text-gray-800">{title || "Data Center Site Analysis"}</h2>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-b-2xl shadow-inner pt-0 px-4 pb-4 min-h-[630px]">
        <div className="mb-4 pt-4 text-center">
          <h2 className="text-xl font-semibold text-gray-800 cursor-pointer">
            Data Center Site Selection - Weighted Scores by Location
          </h2>
          
          <p className="text-sm text-gray-600 mt-1 cursor-pointer">
            Detailed breakdown of weighted scoring across four key criteria: Infrastructure capacity and reliability (40%), Regulatory compliance and zoning (30%), Environmental impact and sustainability (20%), and Economic factors including costs and incentives (10%)
          </p>
        </div>

        <div className="bg-white p-1 rounded-lg z-10">
          {renderBarChart()}
        </div>
      </div>

      {showShareDialog && (
        <ShareDialog
          isOpen={showShareDialog}
          onClose={() => setShowShareDialog(false)}
          onShare={(teammates) => {
            setShowShareDialog(false);
            const msg = `Chart shared with ${teammates.length} teammate${teammates.length > 1 ? 's' : ''}: ${teammates.join(', ')}`;
            setNotificationMessage(msg);
            setShowEmailNotification(true);
            addNotification(msg);
          }}
          onShowDownloader={() => setShowMapDownloader(true)}
          title="Share This Chart"
          position={{ 
            bottom: isFullscreen ? '80px' : '60px', 
            right: '16px' 
          }}
        />
      )}

      {/* Palette Dialog - Updated for new color scheme */}
      {showPaletteDialog && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white w-[240px] rounded-xl shadow-lg border border-gray-200 p-4 relative text-sm">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setShowPaletteDialog(false)}
              aria-label="Close Palette"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <h2 className="text-base font-semibold text-gray-800 mb-4">Chart Colors</h2>

            <div className="space-y-3">
              {[
                { label: "Infrastructure", key: "infrastructure" },
                { label: "Regulatory", key: "regulatory" },
                { label: "Environmental", key: "environmental" },
                { label: "Economic", key: "economic" },
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                  <input
                    type="color"
                    value={customColors[key]}
                    onChange={(e) => setCustomColors({ ...customColors, [key]: e.target.value })}
                    className="w-full h-6 cursor-pointer appearance-none rounded-md border border-gray-300"
                  />
                </div>
              ))}
            </div>

            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                onClick={() =>
                  setCustomColors({
                    infrastructure: componentColors.infrastructure,
                    regulatory: componentColors.regulatory,
                    environmental: componentColors.environmental,
                    economic: componentColors.economic
                  })
                }
              >
                Reset
              </button>
              <button
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-[#008080] text-white hover:bg-teal-700 transition"
                onClick={() => setShowPaletteDialog(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowSaveDialog(false)}
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Save Analysis</h2>
            <input
              type="text"
              placeholder="Enter a name"
              value={customSaveName}
              onChange={(e) => setCustomSaveName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
            />
            <button
              className="mt-4 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
              onClick={() => {
                const name = customSaveName.trim() || 'Data Center Site Analysis';
                const artifact = {
                  id: Date.now().toString(),
                  title: name,
                  type: 'chart',
                  component: 'DataCenterAnalysisDashboard',
                  data: {
                    conversationId: localStorage.getItem('activeConversationId') || '',
                  },
                  date: new Date().toLocaleDateString(),
                };

                if (typeof setSavedArtifacts === 'function') {
                  setSavedArtifacts((prev) => {
                    const updated = [...prev, artifact];
                    localStorage.setItem('savedArtifacts', JSON.stringify(updated));
                    return updated;
                  });
                }

                const msg = `${name} has been saved`;
                setShowSaveDialog(false);
                setCustomSaveName('');
                addNotification(msg);
              }}
            >
              Save
            </button>
          </div>
        </div>
      )} 

      {/* Notification Toast */}
      {showEmailNotification && (
        <div className="fixed top-6 right-6 z-[9999] animate-slide-in group">
          <div className="relative bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg flex items-center">
            <span className="text-sm font-medium">
              {notificationMessage}
            </span>
            <button
              onClick={() => setShowEmailNotification(false)}
              className="absolute top-1 right-1 w-5 h-5 rounded-full text-[#008080] hover:bg-[#008080]/10 hidden group-hover:flex items-center justify-center"
              data-tooltip="Dismiss"
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {isFullscreen ? renderPanelContent(true) : renderPanelContent(false)}
    </>
  );
};

export default BarChartComponent;