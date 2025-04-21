import React, { useState, useRef, useEffect } from 'react';
import { 
  BarChart, Bar, 
  LineChart, Line, 
  PieChart, Pie, Cell, 
  ScatterChart, Scatter,
  AreaChart, Area,
  CartesianGrid, 
  XAxis, YAxis, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Maximize2, X, Info, Share2, 
  BookmarkPlus, ArrowLeft, Palette, 
  Download, Mail 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

// Color scheme
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

const EXTENDED_COLORS = [
  '#3498DB', '#27AE60', '#E67E22', '#9B59B6', '#E74C3C', 
  '#F1C40F', '#1ABC9C', '#2980B9', '#D35400', '#8E44AD',
  '#16A085', '#2980B9', '#8E44AD', '#2C3E50', '#F39C12',
  '#D35400', '#C0392B', '#BDC3C7', '#7F8C8D', '#34495E'
];

const DynamicChart = ({ 
  chartData, 
  onLayersReady, 
  setSavedArtifacts, 
  title, 
  onBack,
  addNotification = () => {} 
}) => {
  // Chart state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: COLORS.blue,
    secondary: COLORS.green,
    tertiary: COLORS.orange,
    quaternary: COLORS.purple,
    quinary: COLORS.red
  });
  const [histogramBins, setHistogramBins] = useState(null);
  const [showPaletteDialog, setShowPaletteDialog] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadSelections, setDownloadSelections] = useState({
    chart: { filename: 'chart', format: '.jpg' }
  });
  const [customSaveName, setCustomSaveName] = useState('');
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState(null);

  const chartContainerRef = useRef(null);
  const infoRef = useRef(null);
  
  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", 
    "David Li", "Emma Patel"
  ];

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIfMobile();
    
    window.addEventListener('resize', checkIfMobile);
    
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

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-500">No chart data available</div>
      </div>
    );
  }

  const { name, type, description, data, error, geojson } = chartData;

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-64 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="text-yellow-700">No data available for this chart</div>
      </div>
    );
  }

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const handleDownload = () => {
    const { filename, format } = downloadSelections.chart;
    const chartElement = chartContainerRef.current.querySelector('.rounded-lg.shadow');
    
    if (!chartElement) {
      console.error("Chart element not found");
      return;
    }
    
    if (format === '.pdf') {
      html2canvas(chartElement, {
        backgroundColor: 'white',
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        try {
          const imgData = canvas.toDataURL('image/jpeg', 1.0);
          const pdf = new jsPDF({
            orientation: 'landscape',
            unit: 'mm'
          });
          const imgWidth = 280;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;
          pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
          pdf.save(`${filename}.pdf`);
          
          setShowDownloadDialog(false);
          const msg = `Downloaded ${filename}.pdf`;
          setNotificationMessage(msg);
          setShowEmailNotification(true);
          addNotification(msg);
        } catch (err) {
          console.error("Error creating PDF:", err);
        }
      }).catch(err => {
        console.error("Error rendering canvas for PDF:", err);
      });
    } else {
      html2canvas(chartElement, {
        backgroundColor: 'white',
        scale: 2,
        logging: true,
        useCORS: true,
        allowTaint: true
      }).then(canvas => {
        try {
          const mimeType = format === '.png' ? 'image/png' : 'image/jpeg';
          const imageData = canvas.toDataURL(mimeType, 0.9);
          const link = document.createElement('a');
          link.href = imageData;
          link.download = `${filename}${format}`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          setShowDownloadDialog(false);
          const msg = `Downloaded ${filename}${format}`;
          setNotificationMessage(msg);
          setShowEmailNotification(true);
          addNotification(msg);
        } catch (err) {
          console.error("Error creating download:", err);
        }
      }).catch(err => {
        console.error("Error rendering canvas:", err);
      });
    }
  };

  // Save chart as an artifact
  const handleSave = () => {
    const name = customSaveName.trim() || (chartData.name || 'Chart');
    const artifact = {
      id: Date.now().toString(),
      title: name,
      type: 'chart',
      chartType: chartData.type,
      data: {
        chartData,
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
    setNotificationMessage(msg);
    setShowEmailNotification(true);
    addNotification(msg);
  };

  // Share chart with a teammate
  const handleShare = () => {
    if (!selectedTeammate) return;
    
    setShowShareDialog(false);
    const msg = `${chartData.name || 'Chart'} shared with ${selectedTeammate}`;
    setNotificationMessage(msg);
    setShowEmailNotification(true);
    addNotification(msg);
  };

  
  const renderBarChart = () => {
    // Get column names from data
    const dataKeys = Object.keys(data[0]);
    const xAxisKey = dataKeys[0]; 
    const valueKeys = dataKeys.slice(1); 
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: '#4a5568' }}
            angle={-45} 
            textAnchor="end"
            height={80}
          />
          <YAxis label={{ 
            value: 'Value', 
            angle: -90, 
            position: 'insideLeft', 
            style: { textAnchor: 'middle', fill: '#4a5568' } 
          }} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, index) => (
            <Bar 
              key={key} 
              dataKey={key} 
              name={key}
              fill={getColorForIndex(index)}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const getColorForIndex = (index) => {
    const colorKeys = ['primary', 'secondary', 'tertiary', 'quaternary', 'quinary'];
    if (index < colorKeys.length) {
      return customColors[colorKeys[index]];
    }
    return EXTENDED_COLORS[index % EXTENDED_COLORS.length];
  };

  const renderLineChart = () => {
    const dataKeys = Object.keys(data[0]);
    const xAxisKey = dataKeys[0];
    const valueKeys = dataKeys.slice(1);
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xAxisKey} 
            tick={{ fill: '#4a5568' }}
            angle={-45} 
            textAnchor="end"
            height={80}
          />
          <YAxis label={{ 
            value: 'Value', 
            angle: -90, 
            position: 'insideLeft', 
            style: { textAnchor: 'middle', fill: '#4a5568' } 
          }} />
          <Tooltip />
          <Legend />
          {valueKeys.map((key, index) => (
            <Line 
              key={key} 
              type="monotone" 
              dataKey={key} 
              name={key} 
              stroke={getColorForIndex(index)}
              activeDot={{ r: 8 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    const dataKeys = Object.keys(data[0]);
    const nameKey = dataKeys[0];
    const valueKey = dataKeys[1];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <PieChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <Pie
            data={data}
            dataKey={valueKey}
            nameKey={nameKey}
            cx="50%"
            cy="50%"
            outerRadius={140}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            labelLine={true}
          >
            {data.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={index < 5 ? getColorForIndex(index) : EXTENDED_COLORS[index % EXTENDED_COLORS.length]} 
              />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderScatterPlot = () => {
    const dataKeys = Object.keys(data[0]);
    const xKey = dataKeys[0];
    const yKey = dataKeys[1];
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey={xKey} 
            name={xKey} 
            tick={{ fill: '#4a5568' }}
            label={{ 
              value: xKey, 
              position: 'bottom', 
              offset: 10,
              style: { textAnchor: 'middle', fill: '#4a5568' } 
            }}
          />
          <YAxis 
            dataKey={yKey} 
            name={yKey} 
            tick={{ fill: '#4a5568' }}
            label={{ 
              value: yKey, 
              angle: -90, 
              position: 'insideLeft', 
              style: { textAnchor: 'middle', fill: '#4a5568' } 
            }}
          />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend />
          <Scatter 
            name={`${xKey} vs ${yKey}`} 
            data={data} 
            fill={customColors.primary}
          />
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  const renderHistogram = () => {
    const dataKeys = Object.keys(data[0]);
    const valueKey = dataKeys[0];
    
    const values = data.map(d => d[valueKey]);
    const bins = calculateHistogramBins(values, histogramBins);
    
    return (
      <div className="flex flex-col">
        <div className="mb-4 flex items-center justify-end space-x-2">
          <label className="text-sm text-gray-600">Number of bins:</label>
          <select
            value={histogramBins || 'auto'}
            onChange={(e) => setHistogramBins(e.target.value === 'auto' ? null : parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="auto">Auto</option>
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="30">30</option>
            <option value="50">50</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={bins} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
            {/* rest of the chart code */}
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };
  
  const calculateOptimalBins = (values) => {
    const n = values.length;
    const stdDev = standardDeviation(values);
    const iqr = interquartileRange(values);
    const range = Math.max(...values) - Math.min(...values);
    
    // Sturges' rule
    const sturgesBins = Math.ceil(1 + Math.log2(n));
    
    // Scott's rule
    const scottBinWidth = 3.5 * stdDev / Math.pow(n, 1/3);
    const scottBins = Math.ceil(range / scottBinWidth);
    
    // Freedman-Diaconis rule
    const fdBinWidth = 2 * iqr / Math.pow(n, 1/3);
    const fdBins = fdBinWidth > 0 ? Math.ceil(range / fdBinWidth) : 30;
    
    // Rice rule
    const riceBins = Math.ceil(2 * Math.pow(n, 1/3));
    
    // Use median method for robustness
    const allBins = [sturgesBins, scottBins, fdBins, riceBins];
    allBins.sort((a, b) => a - b);
    const medianBins = allBins[Math.floor(allBins.length / 2)];
    
    // Ensure reasonable range
    return Math.max(10, Math.min(medianBins, 100));
  };
  
  const standardDeviation = (values) => {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - mean, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b, 0) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  };
  
  const interquartileRange = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    return q3 - q1;
  };
  
  const quantile = (sorted, q) => {
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    
    if (sorted[base + 1] !== undefined) {
      return sorted[base] + rest * (sorted[base + 1] - sorted[base]);
    } else {
      return sorted[base];
    }
  };
  
  // Update your calculateHistogramBins function to use dynamic bins
  const calculateHistogramBins = (values, numberOfBins = null) => {
    const min = Math.min(...values);
    const max = Math.max(...values);
    
    // Use optimal bins if not specified
    if (!numberOfBins) {
      numberOfBins = calculateOptimalBins(values);
    }
    
    const binWidth = (max - min) / numberOfBins;
    
    const bins = [];
    for (let i = 0; i < numberOfBins; i++) {
      const binStart = min + i * binWidth;
      const binEnd = binStart + binWidth;
      bins.push({
        range: `${Math.round(binStart)}-${Math.round(binEnd)}`,
        start: binStart,
        end: binEnd,
        count: 0
      });
    }
    
    values.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), numberOfBins - 1);
      if (binIndex >= 0 && binIndex < numberOfBins) {
        bins[binIndex].count++;
      }
    });
    
    return bins;
  };
  

  const renderChoroplethMap = () => {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-100 rounded-lg border border-gray-300">
        <div className="text-center p-4">
          <p className="text-lg font-medium text-gray-700">Choropleth Map</p>
          <p className="text-sm text-gray-500">
Map          </p>
          <p className="text-xs text-gray-400 mt-2">
            {geojson ? "GeoJSON data is available" : "No GeoJSON data available"}
          </p>
        </div>
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar_chart':
        return renderBarChart();
      case 'line_chart':
        return renderLineChart();
      case 'pie_chart':
        return renderPieChart();
      case 'scatter_plot':
        return renderScatterPlot();
      case 'histogram':
        return renderHistogram();
      case 'choropleth_map':
        return renderChoroplethMap();
      default:
        return (
          <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg">
            <div className="text-red-500">Unsupported chart type: {type}</div>
          </div>
        );
    }
  };

  // Main panel content
  const renderPanelContent = (fullscreen = false) => (
    <div
      className={`transition-all duration-300 ${
        fullscreen
          ? 'fixed top-4 bottom-4 left-4 right-4 z-50 mt-10 overflow-auto bg-white rounded-2xl shadow-2xl border border-gray-300 p-6'
          : 'px-4 pt-4 max-h-[90vh] overflow-y-auto pb-4'
      }`}
      ref={chartContainerRef}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4 md:gap-8">
        {isFullscreen && (title || name) && (
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
              <h2 className="text-sm font-semibold text-gray-800">{title || name || "Chart"}</h2>
            </div>
          </div>
        )}
      </div>

      <div className="mb-4 text-center">
        <h2 className="text-xl font-semibold text-gray-800">{name || title || "Chart"}</h2>
        <p className="text-sm text-gray-600 mt-1">{description || `${type.replace('_', ' ')} visualization`}</p>
      </div>

      {/* Main chart container */}
      <div className="bg-white p-4 rounded-lg shadow relative z-10">
        {renderChart()}
      </div>
      
      {/* Bottom Toolbar */}
      <div className="flex justify-center items-center mt-4">
        <div className="inline-flex items-center space-x-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 shadow-sm z-30 rounded-full transition-all duration-300">
          {/* Info Button */}
          <div className="relative">
            <button
              onClick={() => setShowSources(prev => !prev)}
              title="View Information"
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
                  <h3 className="font-bold">About This Chart</h3>
                  <p>{description || `This ${type.replace('_', ' ')} visualizes the provided data.`}</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Chart type: {type.replace('_', ' ')}</li>
                    <li>Data points: {data.length}</li>
                    {Object.keys(data[0]).map((col, i) => (
                      <li key={i}>{i === 0 ? 'X-axis' : 'Y-axis'}: {col}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            onClick={() => setShowSaveDialog(true)}
            title="Save Chart"
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
            title="Change Colors"
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

          {/* Download button */}
          <button
            onClick={() => setShowDownloadDialog(true)}
            title="Download Chart"
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
            <Download size={16} />
          </button>

          {/* Share button */}
          <button
            onClick={() => setShowShareDialog(true)}
            title="Share Chart"
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
            <Share2 size={16} />
          </button>
          
          {/* Fullscreen button */}
          <button 
            onClick={toggleFullscreen} 
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
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

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="absolute bottom-[20px] right-6 z-[1000]">
          <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowSaveDialog(false)}
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Save Chart</h2>
            <input
              type="text"
              placeholder="Enter a name"
              value={customSaveName}
              onChange={(e) => setCustomSaveName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
            />
            <button
              className="mt-4 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Download Dialog */}
      {showDownloadDialog && (
        <div className="absolute bottom-[20px] right-6 z-[1000]">
          <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowDownloadDialog(false)}
            >
              <X size={16} />
            </button>

            <h2 className="text-lg font-semibold text-gray-800 mb-4">Download Chart</h2>
            
            <div className="flex space-x-2 mb-3">
              <input
                type="text"
                className="border px-3 py-2 rounded-lg w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                value={downloadSelections.chart?.filename || (name ? name.replace(/\s+/g, '_').toLowerCase() : 'chart')}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    ...prev,
                    chart: {
                      filename: e.target.value,
                      format: prev.chart?.format || '.jpg'
                    }
                  }))
                }
                placeholder="File name"
              />
              <select
                value={downloadSelections.chart?.format || '.jpg'}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    ...prev,
                    chart: {
                      filename: prev.chart?.filename || (name ? name.replace(/\s+/g, '_').toLowerCase() : 'chart'),
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
              onClick={handleDownload}
              className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
            >
              Download Chart
            </button>
          </div>
        </div>
      )}

      {/* Share Dialog */}
      {showShareDialog && (
        <div className="absolute bottom-[20px] right-6 z-[1000]">
          <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
            <button
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              onClick={() => setShowShareDialog(false)}
            >
              <X size={16} />
            </button>

            <h2 className="text-xl font-semibold text-gray-800 mb-4">Share This Chart</h2>

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
              onClick={handleShare}
              className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200
                ${selectedTeammate
                  ? 'bg-[#008080] text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
              `}
            >
              Share Chart
            </button>
          </div>
        </div>
      )}

      {/* Palette Dialog */}
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
                { label: "Primary", key: "primary" },
                { label: "Secondary", key: "secondary" },
                { label: "Tertiary", key: "tertiary" },
                { label: "Quaternary", key: "quaternary" },
                { label: "Quinary", key: "quinary" }
              ].map(({ label, key }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-600 mb-1">{label} Color</label>
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
                onClick={() => setCustomColors({
                  primary: COLORS.blue,
                  secondary: COLORS.green,
                  tertiary: COLORS.orange,
                  quaternary: COLORS.purple,
                  quinary: COLORS.red
                })}
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
              title="Dismiss"
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

export default DynamicChart;