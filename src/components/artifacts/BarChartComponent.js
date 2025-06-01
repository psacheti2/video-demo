import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Maximize2, X, Info, Share2, BookmarkPlus, ArrowLeft, Palette,  } from 'lucide-react';
import ShareDialog from '../ShareDialog'
// Color scheme for charts
const COLORS = {
  primary: '#2C3E50',
  secondary: '#34495E',
  teal: '#008080',
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
  { name: 'A', value: 8.7 },
  { name: 'B', value: 8.0 },
  { name: 'C', value: 7.2 },
  { name: 'D', value: 5.2 },
  { name: 'E', value: 6.7 },
];


// Pie chart colors
const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.red];

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
    blue: COLORS.blue,
    green: COLORS.green,
    orange: COLORS.orange,
    purple: COLORS.purple,
    red: COLORS.red
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
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={locationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="value" fill={customColors.blue} />
      </BarChart>
    </ResponsiveContainer>
  );
};
  const handleDownloadChart = () => {
    // In a real implementation, this would use html2canvas or similar
    // to convert the chart to an image for download
    
    const format = downloadSelections['chart']?.format || '.jpg';
    const filename = downloadSelections['chart']?.filename || 'coffee_shop_roi_analysis';
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
              <h2 className="text-sm font-semibold text-gray-800">{title || "Coffee Shop ROI Analysis"}</h2>
            </div>
          </div>
        )}
      </div>


      <div className="bg-white rounded-b-2xl shadow-inner pt-0 px-4 pb-4 min-h-[630px]">
      <div className="mb-4 pt-4 text-center">
 
    <h2
      className="text-xl font-semibold text-gray-800 cursor-pointer"
    >
        Data Center Site Selection - Weighted Scores by Location

    </h2>
  

  
    <p
      onDoubleClick={() => setIsEditingDescription(true)}
      className="text-sm text-gray-600 mt-1 cursor-pointer"
    >
        Comprehensive weighted analysis of 5 potential data center locations in Greater Madrid, prioritizing infrastructure (40%) and regulatory factors (30%) over environmental and economic considerations
    </p>
  
</div>


  <div className="bg-white p-1 rounded-lg z-10">
    {renderBarChart()}
  </div>

      {/* Bottom Toolbar */}
      <div className="flex justify-center items-center mt-4">
        <div className="inline-flex items-center space-x-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 shadow-sm z-30 rounded-full transition-all duration-300">
          {/* Info Button */}
          <div className="relative">
            <button
              onClick={() => setShowSources(prev => !prev)}
              data-tooltip="View Information"
              className="p-2 rounded-full border"
              style={{ 
                color: COLORS.teal,
                backgroundColor: COLORS.white,
                border: `1px solid ${COLORS.teal}`,
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.teal;
                e.currentTarget.style.color = COLORS.white;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.white;
                e.currentTarget.style.color = COLORS.teal;
              }}
            >
              <Info size={16} />
            </button>

            {/* Info popup */}
            {showSources && (
              <div 
                ref={infoRef} 
                className="absolute right-0 bottom-full mb-2 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50"
              >
                <div className="space-y-2 text-sm text-gray-700">
                  <h3 className="font-bold">About This Analysis</h3>
                  <p>This chart visualizes the projected ROI and break-even timeline for potential coffee shop locations near Times Square.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>ROI Chart: Comparison of percentage returns</li>
                    <li>Break-Even Chart: Months until profitable</li>
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={() => setShowSaveDialog(true)}
            data-tooltip="Save Chart"
            className="p-2 rounded-full border"
            style={{ 
              color: COLORS.teal,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.teal}`,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.teal;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.color = COLORS.teal;
            }}
          >
            <BookmarkPlus size={16} />
          </button>

          {/* Palette button */}
          <button
            onClick={() => setShowPaletteDialog(true)}
            data-tooltip="Change Colors"
            className="p-2 rounded-full border"
            style={{ 
              color: COLORS.teal,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.teal}`,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.teal;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.color = COLORS.teal;
            }}
          >
            <Palette size={16} />
          </button>

          {/* Share button */}
          <button
            onClick={() => setShowShareDialog(true)}
            className="p-2 rounded-full border"
            data-tooltip="Share"
            style={{ 
              color: COLORS.teal,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.teal}`,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.teal;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.color = COLORS.teal;
            }}
          >
            <Share2 size={16} />
          </button>
          
          {/* Fullscreen button */}
          <button 
            onClick={toggleFullscreen} 
            className="p-2 rounded-full border" 
            style={{ 
              color: COLORS.teal,
              backgroundColor: COLORS.white,
              border: `1px solid ${COLORS.teal}`,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.teal;
              e.currentTarget.style.color = COLORS.white;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.white;
              e.currentTarget.style.color = COLORS.teal;
            }}
          >
            {isFullscreen ? <X size={16} /> : <Maximize2 size={16} />}
          </button>
        </div>
      </div>
</div>

      

{showShareDialog && (
  <ShareDialog
    isOpen={showShareDialog}
    onClose={() => setShowShareDialog(false)}
    onShare={(teammates) => {
      setShowShareDialog(false);
      const msg = `Map shared with ${teammates.length} teammate${teammates.length > 1 ? 's' : ''}: ${teammates.join(', ')}`;
      setNotificationMessage(msg);
      setShowEmailNotification(true);
      addNotification(msg);
    }}
    onShowDownloader={() => setShowMapDownloader(true)}
    title="Share This Map"
    position={{ 
      bottom: isFullscreen ? '80px' : '60px', 
      right: '16px' 
    }}
  />
)}

      {/* Palette Dialog */}
      {showPaletteDialog && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white w-[240px] rounded-xl shadow-lg border border-gray-200 p-4 relative text-sm">
            {/* Close Button */}
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 transition"
              onClick={() => setShowPaletteDialog(false)}
              aria-label="Close Palette"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Header */}
            <h2 className="text-base font-semibold text-gray-800 mb-4">Chart Colors</h2>

            {/* Color Pickers */}
            <div className="space-y-3">
              {[
                { label: "Midtown East", key: "blue" },
                { label: "Midtown South", key: "green" },
                { label: "Union Square", key: "orange" },
                { label: "Chelsea", key: "purple" },
                { label: "Herald Square", key: "red" },
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

            {/* Buttons */}
            <div className="flex gap-2 mt-4">
              <button
                className="flex-1 py-1.5 rounded-md text-xs font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                onClick={() =>
                  setCustomColors({
                    blue: COLORS.blue,
                    green: COLORS.green,
                    orange: COLORS.orange,
                    purple: COLORS.purple,
                    red: COLORS.red
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
                const name = customSaveName.trim() || 'Coffee Shop ROI Analysis';
                const artifact = {
                  id: Date.now().toString(),
                  title: name,
                  type: 'chart',
                  component: 'ROIAnalysisDashboard',
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