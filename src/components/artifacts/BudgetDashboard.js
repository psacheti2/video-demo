import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Maximize2, X, Info, Share2, BookmarkPlus, ArrowLeft, Palette } from 'lucide-react';
import Papa from 'papaparse';
import { useNotificationStore } from '@/store/NotificationsStore';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

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

const BudgetDashboard = ({ onLayersReady, setSavedArtifacts, title, onBack }) => {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showSources, setShowSources] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartContainerRef = useRef(null);
  const infoRef = useRef(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customSaveName, setCustomSaveName] = useState('');
  const [showPaletteDialog, setShowPaletteDialog] = useState(false);
  const [customColors, setCustomColors] = useState({
    blue: COLORS.blue,
    green: COLORS.green
  });
  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadSelections, setDownloadSelections] = useState({});
  const [attachments, setAttachments] = useState([
    { id: 'chart', label: '📊 Budget Category Chart.jpg' }
  ]);
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
    const fetchData = async () => {
      try {
        // Fetch the data file from public/data/budget-data.csv
        const response = await fetch('/data/budget-data.csv');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        
        // Parse CSV data
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ';',
          complete: (results) => {
            console.log("CSV parsing complete, row count:", results.data.length);
            // Convert numeric strings to numbers where possible
            const processedData = results.data.map(item => {
              const processedItem = {};
              for (const key in item) {
                // Try to convert to number if possible
                const numValue = parseFloat(item[key]);
                processedItem[key] = isNaN(numValue) ? item[key] : numValue;
              }
              return processedItem;
            });
            
            setBudgetData(processedData);
            setLoading(false);
            
            // Notify when data is loaded
            if (onLayersReady) onLayersReady();
          },
          error: (error) => {
            console.error("CSV parsing error:", error);
            setError('Error parsing CSV data: ' + error.message);
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("Error loading data:", err);
        setError('Error loading data: ' + err.message);
        setLoading(false);
      }
    };

    fetchData();
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

  // Data processing function for category budget
  const getCategoryBudgetData = () => {
    if (!budgetData.length) return [];
    
    const categories = [...new Set(budgetData.map(item => item['Service Category 1']))];
    
    return categories.map(category => {
      const projects = budgetData.filter(item => item['Service Category 1'] === category);
      
      const totalBudget = projects.reduce((sum, project) => {
        const budget = parseFloat(project['Multi-Year Capital Project Budgets-Total Open Project Budget in 2025']) || 0;
        return sum + budget;
      }, 0);
      
      const totalSpending = projects.reduce((sum, project) => {
        const spending = parseFloat(project['Annual Capital Expenditure-2025 Capital Expenditure Budget']) || 0;
        return sum + spending;
      }, 0);
      
      return {
        category: isMobile ? (category.length > 15 ? category.substring(0, 15) + '...' : category) : 
                (category === 'One Water: Potable water, rainwater & sanitary Water*' ? 'One Water' : 
                 category === 'Waste collection, diversion & disposal' ? 'Waste' : category),
        budget: totalBudget / 1000000,
        spending: totalSpending / 1000000
      };
    });
  };

  const renderChart = () => {
    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    if (error) return <div className="text-red-500 text-center h-64">{error}</div>;
    
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={getCategoryBudgetData()} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="category" tick={{ fill: '#4a5568' }} />
          <YAxis label={{ value: 'Millions ($)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#4a5568' } }} />
          <Tooltip formatter={(value) => `$${value.toFixed(2)}M`} />
          <Legend />
          <Bar dataKey="budget" name="Total Budget" fill={customColors.blue} />
          <Bar dataKey="spending" name="2025 Spending" fill={customColors.green} />
        </BarChart>
      </ResponsiveContainer>
    );
  };
 
  const handleDownloadAll = () => {
    const downloadedFiles = [];
  
    Object.entries(downloadSelections).forEach(([key, { filename, format }]) => {
      const fullName = `${filename}${format}`;
      downloadedFiles.push(fullName);
  
      if (key === 'chart') {
        // Get the chart container element
        const chartElement = chartContainerRef.current.querySelector('.rounded-lg.shadow');
        
        if (!chartElement) {
          console.error("Chart element not found");
          return;
        }
        
        if (format === '.pdf') {
          // For PDF format
          html2canvas(chartElement, {
            backgroundColor: 'white',
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true
          }).then(canvas => {
            try {
              // Convert canvas to image
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              
              // Initialize PDF
              const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm'
              });
              
              // Get canvas dimensions
              const imgWidth = 280; // mm
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Add image to PDF
              pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
              
              // Save PDF
              pdf.save(`${filename}.pdf`);
            } catch (err) {
              console.error("Error creating PDF:", err);
            }
          }).catch(err => {
            console.error("Error rendering canvas for PDF:", err);
          });
        } else {
          // For JPG and PNG formats (existing code)
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
              link.download = fullName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err) {
              console.error("Error creating download:", err);
            }
          }).catch(err => {
            console.error("Error rendering canvas:", err);
          });
        }
      }
    });
  
    // Push notification
    if (downloadedFiles.length > 0) {
      const fileList = downloadedFiles.join(', ');
      setShowShareDialog(false);
      setNotificationMessage(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
      setShowEmailNotification(true);
      addNotification(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

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
              <h2 className="text-sm font-semibold text-gray-800">{title || "2025 Capital Budget by Category"}</h2>
            </div>
          </div>
        )}
      </div>

<div className="mb-4 text-center">
  <h2 className="text-xl font-semibold text-gray-800">Capital Budget by Category</h2>
  <p className="text-sm text-gray-600 mt-1">
    Comparison of total budget allocation and planned spending across service categories
  </p>
</div>

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
                  <p>This chart visualizes the 2025 capital budget data by service category.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Blue bars show total budget allocation (in millions)</li>
                    <li>Green bars show planned 2025 spending (in millions)</li>
                    <li>Data is aggregated from all projects in each category</li>
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
          {/* Share button */}
          <button
            onClick={() => setShowShareDialog(true)}
            className="p-2 rounded-full border"
            title="Share"
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
              onClick={() => {
                setShowShareDialog(false);
                const msg = `Budget Chart shared with ${selectedTeammate}`;
                setNotificationMessage(msg);
                setShowEmailNotification(true);
                addNotification(msg);
              }}
              className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200
                ${selectedTeammate
                  ? 'bg-[#008080] text-white hover:bg-teal-700'
                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
              `}
            >
              Share Chart
            </button>
            {/* Divider */}
<div className="border-t border-gray-200 mb-6 mt-4" />

{/* Download Section */}
<h3 className="text-sm font-semibold text-gray-700 mb-3">Download This Chart</h3>

<div className="flex space-x-2 mb-3">
  <input
    type="text"
    className="border px-3 py-2 rounded-lg w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
    value={downloadSelections['chart']?.filename || 'budget_category_chart'}
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
          filename: prev['chart']?.filename || 'budget_category_chart',
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
  onClick={() => {
    if (!downloadSelections['chart']) {
      setDownloadSelections(prev => ({
        ...prev,
        chart: { filename: 'budget_category_chart', format: '.jpg' }
      }));
    }
    handleDownloadAll();
  }}
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
          { label: "Budget Color", key: "blue" },
          { label: "Spending Color", key: "green" },
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
              onClick={() => {
                const name = customSaveName.trim() || 'Budget Category Chart';
                const artifact = {
                  id: Date.now().toString(),
                  title: name,
                  type: 'chart',
                  component: 'BudgetDashboard',
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
                setNotificationMessage(msg);
                setShowEmailNotification(true);
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

export default BudgetDashboard;