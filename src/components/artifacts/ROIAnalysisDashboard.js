import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Maximize2, X, Info, Share2, BookmarkPlus, ArrowLeft, Palette,  } from 'lucide-react';

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

const roiData = [
    { name: 'Midtown East', value: 28 },
    { name: 'Midtown South', value: 26 },
    { name: 'Union Square', value: 24 },
    { name: 'Chelsea', value: 22 },
    { name: 'Herald Square', value: 20 },
  ];

// Synthetic data - Break-even timeline (months)
const breakEvenData = [
  { month: 1, "Midtown East": -200000, "Midtown South": -200000, "Union Square": -200000, "Chelsea": -200000, "Herald Square": -200000 },
  { month: 2, "Midtown East": -182000, "Midtown South": -184000, "Union Square": -188000, "Chelsea": -185000, "Herald Square": -183000 },
  { month: 3, "Midtown East": -164000, "Midtown South": -168000, "Union Square": -176000, "Chelsea": -170000, "Herald Square": -166000 },
  { month: 4, "Midtown East": -146000, "Midtown South": -152000, "Union Square": -164000, "Chelsea": -155000, "Herald Square": -149000 },
  { month: 5, "Midtown East": -128000, "Midtown South": -136000, "Union Square": -152000, "Chelsea": -140000, "Herald Square": -132000 },
  { month: 6, "Midtown East": -110000, "Midtown South": -120000, "Union Square": -140000, "Chelsea": -125000, "Herald Square": -115000 },
  { month: 7, "Midtown East": -92000, "Midtown South": -104000, "Union Square": -128000, "Chelsea": -110000, "Herald Square": -98000 },
  { month: 8, "Midtown East": -74000, "Midtown South": -88000, "Union Square": -116000, "Chelsea": -95000, "Herald Square": -81000 },
  { month: 9, "Midtown East": -56000, "Midtown South": -72000, "Union Square": -104000, "Chelsea": -80000, "Herald Square": -64000 },
  { month: 10, "Midtown East": -38000, "Midtown South": -56000, "Union Square": -92000, "Chelsea": -65000, "Herald Square": -47000 },
  { month: 11, "Midtown East": -20000, "Midtown South": -40000, "Union Square": -80000, "Chelsea": -50000, "Herald Square": -30000 },
  { month: 12, "Midtown East": -2000, "Midtown South": -24000, "Union Square": -68000, "Chelsea": -35000, "Herald Square": -13000 },
  { month: 13, "Midtown East": 16000, "Midtown South": -8000, "Union Square": -56000, "Chelsea": -20000, "Herald Square": 4000 },
  { month: 14, "Midtown East": 34000, "Midtown South": 8000, "Union Square": -44000, "Chelsea": -5000, "Herald Square": 21000 },
  { month: 15, "Midtown East": 52000, "Midtown South": 24000, "Union Square": -32000, "Chelsea": 10000, "Herald Square": 38000 },
  { month: 16, "Midtown East": 70000, "Midtown South": 40000, "Union Square": -20000, "Chelsea": 25000, "Herald Square": 55000 },
  { month: 17, "Midtown East": 88000, "Midtown South": 56000, "Union Square": -8000, "Chelsea": 40000, "Herald Square": 72000 },
  { month: 18, "Midtown East": 106000, "Midtown South": 72000, "Union Square": 4000, "Chelsea": 55000, "Herald Square": 89000 },
  { month: 19, "Midtown East": 124000, "Midtown South": 88000, "Union Square": 16000, "Chelsea": 70000, "Herald Square": 106000 },
  { month: 20, "Midtown East": 142000, "Midtown South": 104000, "Union Square": 28000, "Chelsea": 85000, "Herald Square": 123000 },
  { month: 21, "Midtown East": 160000, "Midtown South": 120000, "Union Square": 40000, "Chelsea": 100000, "Herald Square": 140000 },
  { month: 22, "Midtown East": 178000, "Midtown South": 136000, "Union Square": 52000, "Chelsea": 115000, "Herald Square": 157000 },
  { month: 23, "Midtown East": 196000, "Midtown South": 152000, "Union Square": 64000, "Chelsea": 130000, "Herald Square": 174000 },
  { month: 24, "Midtown East": 214000, "Midtown South": 168000, "Union Square": 76000, "Chelsea": 145000, "Herald Square": 191000 },
];


// Pie chart colors
const PIE_COLORS = [COLORS.blue, COLORS.green, COLORS.orange, COLORS.purple, COLORS.red];

const ROIAnalysisDashboard = ({ onLayersReady, setSavedArtifacts, title, onBack }) => {
  const [loading, setLoading] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [activeLocation, setActiveLocation] = useState('all');
  const [activeChart, setActiveChart] = useState('roi');
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

  const renderROIPieChart = () => {
    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart>
        <Pie
  data={roiData}
  cx="50%"
  cy="50%"
  labelLine={true}   
  outerRadius={150}
  fill="#8884d8"
  dataKey="value"
  nameKey="name"
  label={({ value }) => `${value}%`}   
>
{roiData.map((entry, index) => {
  const colorKeys = ['blue', 'green', 'orange', 'purple', 'red'];
  const colorKey = colorKeys[index % colorKeys.length];
  return (
    <Cell key={`cell-${index}`} fill={customColors[colorKey]} />
  );
})}

          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

// Replace your current renderBreakEvenLineChart function with this:

const renderBreakEvenLineChart = () => {
    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
  
    const formattedData = breakEvenData.map(entry => {
      const newEntry = { ...entry };
      
      const unionSquareValue = newEntry["Union Square"];
      
      newEntry["Union Square"] = newEntry["Herald Square"];
      
      newEntry["Herald Square"] = unionSquareValue;
      
      return newEntry;
    });
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart
          data={formattedData}
          margin={{ top: 20, right: 30, left: 40, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" label={{ value: 'Month', position: 'insideBottomRight', offset: -10 }} />
          <YAxis 
            label={{ 
              value: 'Profit/Loss ($)', 
              angle: -90, 
              position: 'outsideLeft',
              dy: 5,
              dx: -60
            }} 
          />
          <Tooltip formatter={(value) => `${value.toLocaleString()}`} />
          <Legend />
          <ReferenceLine y={0} stroke="#008080" strokeWidth={2} strokeDasharray="4 4" />
          <Line type="monotone" dataKey="Midtown East" stroke={customColors.blue} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Midtown South" stroke={customColors.green} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Union Square" stroke={customColors.purple} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Chelsea" stroke={customColors.orange} activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="Herald Square" stroke={customColors.red} activeDot={{ r: 8 }} />
        </LineChart>
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

      {/* Tabs */}
      <div className="mb-0">
        <div className="flex flex-wrap space-x-1 border-b border-gray-200">
          {[
            { id: 'roi', label: 'ROI Comparison' },
            { id: 'breakeven', label: 'Break-Even Timeline' },
          ].map((tab) => (
            <button
  key={tab.id}
  onClick={() => setActiveChart(tab.id)}
  className={`px-4 py-2 text-sm font-medium rounded-t-lg border transition-colors ${
    activeChart === tab.id
      ? 'bg-[#008080] text-white border-[#008080]'
      : 'bg-white text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'
  }`}
>
  {tab.label}
</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-b-2xl shadow-inner pt-0 px-4 pb-4 min-h-[630px]">
      <div className="mb-4 pt-4 text-center">
  {isEditingTitle ? (
    <input
      type="text"
      value={editableTitle[activeChart]}
      onChange={(e) => setEditableTitle({ ...editableTitle, [activeChart]: e.target.value })}
      onBlur={() => setIsEditingTitle(false)}
      autoFocus
      className="text-xl font-semibold text-center text-gray-800 border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-[#008080]"
    />
  ) : (
    <h2
      onDoubleClick={() => setIsEditingTitle(true)}
      className="text-xl font-semibold text-gray-800 cursor-pointer"
    >
      {editableTitle[activeChart]}
    </h2>
  )}

  {isEditingDescription ? (
    <textarea
      value={editableDescription[activeChart]}
      onChange={(e) => setEditableDescription({ ...editableDescription, [activeChart]: e.target.value })}
      onBlur={() => setIsEditingDescription(false)}
      autoFocus
      className="mt-1 w-full text-sm text-center text-gray-600 border-b border-gray-300 resize-none focus:outline-none focus:ring-1 focus:ring-[#008080]"
      rows={2}
    />
  ) : (
    <p
      onDoubleClick={() => setIsEditingDescription(true)}
      className="text-sm text-gray-600 mt-1 cursor-pointer"
    >
      {editableDescription[activeChart]}
    </p>
  )}
</div>


  <div className="bg-white p-1 rounded-lg z-10">
    {activeChart === 'roi' && renderROIPieChart()}
    {activeChart === 'breakeven' && renderBreakEvenLineChart()}
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

      

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="absolute bottom-4 right-4 z-[1000]">
          <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowShareDialog(false)}
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Share This Analysis</h2>

            <div className="mb-4">
              <label className="text-sm font-medium text-gray-700 mb-1 block">Search Teammate</label>
              <input
                type="text"
                placeholder="Type a name..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-48 overflow-y-auto mb-4 space-y-1">
              {teammateList.filter(name =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
              ).map(teammate => (
                <div
                  key={teammate}
                  onClick={() => setSelectedTeammate(teammate)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border 
                    ${selectedTeammate === teammate
                      ? 'bg-[#008080]/10 border-[#008080]'
                      : 'bg-white hover:bg-gray-50 border-gray-200'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-[#008080]/90 text-white text-sm font-semibold flex items-center justify-center shadow-sm">
                      {teammate.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-800 font-medium">{teammate}</span>
                  </div>
                  {selectedTeammate === teammate && (
                    <span className="text-xs font-medium text-[#008080]">✓ Selected</span>
                  )}
                </div>
              ))}
              {teammateList.filter(name =>
                name.toLowerCase().includes(searchTerm.toLowerCase())
              ).length === 0 && (
                <div className="text-sm text-gray-500 text-center py-3">No teammates found</div>
              )}
            </div>

            <button
              disabled={!selectedTeammate}
              onClick={() => {
                setShowShareDialog(false);
                const msg = `ROI Analysis shared with ${selectedTeammate}`;
                addNotification(msg);
              }}
              className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200
                ${selectedTeammate
                  ? 'bg-[#008080] text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
              `}
            >
              Share Analysis
            </button>

            {/* Divider */}
            <div className="border-t border-gray-200 mb-6 mt-4" />

            {/* Download Section */}
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Download This Chart</h3>

            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                className="border px-3 py-2 rounded-lg w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                value={downloadSelections['chart']?.filename || 'coffee_shop_roi'}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    ...prev,
                    chart: {
                      filename: e.target.value,
                      format: prev['chart']?.format || '.jpg'
                    }
                  }))
                }
                placeholder="File name"
              />
              <select
                value={downloadSelections['chart']?.format || '.jpg'}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    ...prev,
                    chart: {
                      filename: prev['chart']?.filename || 'coffee_shop_roi',
                      format: e.target.value
                    }
                  }))
                }
                className="border px-2 py-2 rounded-lg text-sm focus:outline-none"
              >
                <option value=".jpg">.jpg</option>
                <option value=".png">.png</option>
                <option value=".pdf">.pdf</option>
              </select>
            </div>

            <button
              onClick={handleDownloadChart}
              className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
            >
              Download Chart
            </button>
          </div>
        </div>
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

export default ROIAnalysisDashboard;