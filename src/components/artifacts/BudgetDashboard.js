import React, { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Maximize2, X, Info, Share2  } from 'lucide-react';
import Papa from 'papaparse';
import { useNotificationStore } from '@/store/NotificationsStore';


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

const PIE_COLORS = ['#3498DB', '#E67E22', '#9B59B6', '#2ECC71', '#1ABC9C', '#F39C12', '#D35400', '#C0392B'];

const BudgetDashboard = ({ onLayersReady }) => {
  const [budgetData, setBudgetData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedChart, setSelectedChart] = useState('category-budget');
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
  
  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];
  // Check for mobile viewport
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
        // Use fetch instead of window.fs.readFile
        const response = await fetch('/data/budget-data.csv');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSV: ${response.status} ${response.statusText}`);
        }
        
        const csvText = await response.text();
        console.log("CSV loaded successfully, first 100 chars:", csvText.substring(0, 100));
        
        // Parse CSV data
        Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
          delimiter: ';',
          complete: (results) => {
            console.log("CSV parsing complete, row count:", results.data.length);
            setBudgetData(results.data);
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

  // Chart options
  const chartOptions = [
    { id: 'category-budget', name: 'Budget & Spending by Service Category' },
    { id: 'streets-subcategory', name: 'Streets Budget by Subcategory' },
    { id: 'yearly-spending', name: 'Yearly Spending Forecast (2025-2029)' },
    { id: 'top-projects', name: 'Top 10 Projects by Budget' },
    { id: 'project-count', name: 'Project Count by Category' }
  ];

  // Data processing functions
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
        category: isMobile ? (category.length > 15 ? category.substring(0, 15) + '...' : category) : category,
        budget: totalBudget / 1000000,
        spending: totalSpending / 1000000
      };
    });
  };

  const getStreetsSubcategoryData = () => {
    if (!budgetData.length) return [];
    
    const streetProjects = budgetData.filter(item => item['Service Category 1'] === 'Streets');
    const subcategories = [...new Set(streetProjects.map(item => item['Service Category 2']))];
    
    return subcategories.map(subcategory => {
      const projects = streetProjects.filter(item => item['Service Category 2'] === subcategory);
      
      const totalBudget = projects.reduce((sum, project) => {
        const budget = parseFloat(project['Multi-Year Capital Project Budgets-Total Open Project Budget in 2025']) || 0;
        return sum + budget;
      }, 0);
      
      return {
        subcategory: isMobile ? (subcategory.length > 15 ? subcategory.substring(0, 15) + '...' : subcategory) : subcategory,
        budget: totalBudget / 1000000
      };
    });
  };

  const getYearlySpendingData = () => {
    if (!budgetData.length) return [];
    
    const categories = [...new Set(budgetData.map(item => item['Service Category 1']))];
    const years = [2025, 2026, 2027, 2028, 2029];
    
    return years.map(year => {
      const yearData = { year };
      
      categories.forEach(category => {
        const projects = budgetData.filter(item => item['Service Category 1'] === category);
        const columnName = `Annual Capital Expenditure-${year} ${year === 2025 ? 'Capital Expenditure Budget' : 'Forecast'}`;
        
        const totalSpending = projects.reduce((sum, project) => {
          const spending = parseFloat(project[columnName]) || 0;
          return sum + spending;
        }, 0);
        
        // Use abbreviated category names for better display
        let shortCategory = category;
        if (category === 'Streets') shortCategory = 'Streets';
        else if (category === 'One Water: Potable water, rainwater & sanitary Water*') shortCategory = 'Water';
        else if (category === 'Waste collection, diversion & disposal') shortCategory = 'Waste';
        
        yearData[shortCategory] = totalSpending / 1000000;
      });
      
      return yearData;
    });
  };

  const getTopProjectsData = () => {
    if (!budgetData.length) return [];
    
    return [...budgetData]
      .sort((a, b) => 
        parseFloat(b['Multi-Year Capital Project Budgets-Total Open Project Budget in 2025']) - 
        parseFloat(a['Multi-Year Capital Project Budgets-Total Open Project Budget in 2025'])
      )
      .slice(0, 10)
      .map(project => ({
        name: project['Project/Program Name'] || 'Unnamed Project',
        category: project['Service Category 1'],
        budget: parseFloat(project['Multi-Year Capital Project Budgets-Total Open Project Budget in 2025']) / 1000000
      }));
  };

  const getProjectCountData = () => {
    if (!budgetData.length) return [];
    
    const categories = [...new Set(budgetData.map(item => item['Service Category 1']))];
    
    return categories.map(category => {
      const count = budgetData.filter(item => item['Service Category 1'] === category).length;
      
      return {
        category: isMobile ? (category.length > 15 ? category.substring(0, 15) + '...' : category) : category,
        count
      };
    });
  };

  // Render the selected chart
  const renderSelectedChart = () => {
    if (loading) return <div className="flex justify-center items-center h-64">Loading...</div>;
    if (error) return <div className="text-red-500 text-center h-64">{error}</div>;
    
    switch (selectedChart) {
      case 'category-budget':
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <BarChart data={getCategoryBudgetData()} layout={isMobile ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" />
              {isMobile ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey="category" type="category" width={120} />
                </>
              ) : (
                <>
                  <XAxis 
  dataKey="category" 
  type="category" 
  label={{ value: "Service Categories", position: "insideBottom", offset: -5 }}
/>
<YAxis 
  type="number" 
  label={{ value: "Amount (Millions $)", angle: -90, position: "insideLeft" }}
/>
                </>
              )}
              <Tooltip formatter={(value) => `$${value.toFixed(2)}M`} />
              <Legend />
              <Bar dataKey="budget" name="Total Budget" fill={COLORS.blue} />
              <Bar dataKey="spending" name="2025 Spending" fill={COLORS.green} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'streets-subcategory':
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <BarChart data={getStreetsSubcategoryData()} layout={isMobile ? "vertical" : "horizontal"}>
              <CartesianGrid strokeDasharray="3 3" />
              {isMobile ? (
                <>
                  <XAxis type="number" />
                  <YAxis dataKey="subcategory" type="category" width={150} />
                </>
              ) : (
                <>
                  <XAxis 
  dataKey="subcategory" 
  type="category" 
  label={{ value: "Subcategories", position: "insideBottom", offset: -5 }}
/>
<YAxis 
  type="number" 
  label={{ value: "Budget (Millions $)", angle: -90, position: "insideLeft" }}
/>
                </>
              )}
              <Tooltip formatter={(value) => `$${value.toFixed(2)}M`} />
              <Bar dataKey="budget" name="Total Budget" fill={COLORS.purple} />
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'yearly-spending':
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <LineChart data={getYearlySpendingData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
  dataKey="year" 
  label={{ value: "Fiscal Year", position: "insideBottom", offset: -5 }}
/>
<YAxis 
  label={{ value: "Spending (Millions $)", angle: -90, position: "insideLeft" }}
/>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}M`} />
              <Legend />
              <Line type="monotone" dataKey="Streets" stroke={COLORS.blue} strokeWidth={2} />
              <Line type="monotone" dataKey="Water" stroke={COLORS.green} strokeWidth={2} />
              <Line type="monotone" dataKey="Waste" stroke={COLORS.orange} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
        
      case 'top-projects':
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 400 : 500}>
            <BarChart data={getTopProjectsData()} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
  type="number" 
  label={{ value: "Budget (Millions $)", position: "insideBottom", offset: -5 }}
/>
<YAxis 
  dataKey="name" 
  type="category" 
  width={isMobile ? 120 : 250}
  tick={{ fontSize: isMobile ? 10 : 12 }}
  label={{ value: "Project Name", position: "insideLeft", angle: -90 }}
/>
              <Tooltip formatter={(value) => `$${value.toFixed(2)}M`} />
              <Bar dataKey="budget" name="Total Budget" fill={COLORS.teal}>
                {getTopProjectsData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
        
      case 'project-count':
        return (
          <ResponsiveContainer width="100%" height={isMobile ? 300 : 400}>
            <PieChart>
              <Pie
                data={getProjectCountData()}
                dataKey="count"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={isMobile ? 100 : 150}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {getProjectCountData().map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `${value} projects`} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
        
      default:
        return null;
    }
  };

  const toggleFullscreen = () => setIsFullscreen(!isFullscreen);

  const renderPanelContent = (fullscreen = false) => (
    <div
    className={`px-4 pt-4 ${fullscreen ? 'fixed inset-0 z-50 p-30 mt-12 overflow-auto' : 'max-h-[90vh] overflow-y-auto pb-4'}`}
    ref={chartContainerRef}
    style={{ 
      backgroundColor: 'rgba(255, 255, 255, 0.7)' 
    }}
  >
      <div className="flex flex-col md:flex-row md:justify-between md:items-center mb-4">
  {/* Dropdown on the left */}
  <div className="mb-2 md:mb-0">
    <label htmlFor="chart-select" className="block text-sm font-medium text-gray-700">
      Select Chart:
    </label>
    <select
      id="chart-select"
      value={selectedChart}
      onChange={(e) => setSelectedChart(e.target.value)}
      className="p-2 border rounded-md w-full md:w-auto"
    >
      {chartOptions.map(option => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
    </select>
  </div>

  {/* Buttons on the right */}
  <div className="flex items-center space-x-2">
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
        <Info size={18} />
      </button>

      {/* Info popup */}
      {showSources && (
        <div 
          ref={infoRef} 
          className="absolute right-0 top-full mt-2 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50"
        >
          <div className="space-y-2 text-sm text-gray-700">
            <h3 className="font-bold">About This Dashboard</h3>
            <p>This dashboard visualizes the 2025 capital budget data for infrastructure projects.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Amounts are shown in millions of dollars</li>
              <li>Projects are categorized by service area</li>
              <li>Data includes approved and proposed budgets</li>
              <li>Forecasts extend from 2025 to 2029</li>
            </ul>
          </div>
        </div>
      )}
    </div>

    {/* Fullscreen button */}
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
  <Share2 size={18} />
</button>
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
      {isFullscreen ? <X size={18} /> : <Maximize2 size={18} />}
    </button>
  </div>
</div>


      <div className="bg-white p-4 rounded-lg shadow relative z-10">
      {chartOptions.find(opt => opt.id === selectedChart)?.name}
        {renderSelectedChart()}
      </div>
      
      {selectedChart === 'category-budget' && (
        <div className="mt-4 text-sm text-gray-600">
          <p>The chart displays total budgets and planned 2025 spending for each service category.</p>
        </div>
      )}
      
      {selectedChart === 'streets-subcategory' && (
        <div className="mt-4 text-sm text-gray-600">
          <p>This shows how the Streets budget is distributed across different subcategories.</p>
        </div>
      )}
      
      {selectedChart === 'yearly-spending' && (
        <div className="mt-4 text-sm text-gray-600">
          <p>The chart tracks projected spending across service categories from 2025 through 2029.</p>
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
        <X size={20} />
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Share This Dashboard</h2>

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
          const msg = `Budget Dashboard shared with ${selectedTeammate}`;
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
        Share Dashboard
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
      {renderPanelContent(false)}
      {isFullscreen && renderPanelContent(true)}
    </>
  );
};

export default BudgetDashboard;