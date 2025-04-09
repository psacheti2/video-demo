import React, { useState, useEffect, useRef } from 'react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, 
  Legend, ResponsiveContainer, Label, ReferenceLine, Cell,
  BarChart, Bar, PieChart, Pie, ComposedChart
} from 'recharts';
import { Maximize2, X, Info } from 'lucide-react';

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
  lightBlue: '#ADD8E6',
  white: '#FFFFFF'
};

const QUADRANT_COLORS = {
  'High Priority': COLORS.red,
  'Medium-High Priority': COLORS.orange,
  'Medium-Low Priority': COLORS.blue,
  'Low Priority': COLORS.gray
};

const CONDITION_COLORS = {
  'A': '#27AE60', // Excellent
  'B': '#2ECC71', // Very Good
  'C': '#F1C40F', // Good
  'D': '#E67E22', // Fair
  'E': '#E74C3C', // Poor
  'F': '#C0392B'  // Critical
};

const TYPE_COLORS = {
  'Sanitary': '#3498DB',
  'Storm': '#9B59B6'
};

const PIE_COLORS = ['#3498DB', '#E67E22', '#9B59B6', '#2ECC71', '#1ABC9C', '#F39C12'];

// Custom tooltip for scatter plot
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-3 border border-gray-200 rounded shadow-md text-sm">
        <p className="font-bold">{`Risk Index: ${data.riskIndex}`}</p>
        <p>{`Benefit-Cost Ratio: ${data.bca}`}</p>
        {data.effluent_type && <p>{`Type: ${data.effluent_type}`}</p>}
        {data.condition && <p>{`Condition: ${data.condition}`}</p>}
        {data.material && <p>{`Material: ${data.material}`}</p>}
        {data.diameter_mm && <p>{`Diameter: ${data.diameter_mm}mm`}</p>}
        {data.hblock && <p>{`Location: ${data.hblock}`}</p>}
        <p className="font-medium" style={{ color: data.quadrantColor }}>{data.priority}</p>
      </div>
    );
  }
  return null;
};

const BenefitCostAnalysisDashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('quadrant');
  const [categoryData, setCategoryData] = useState([]);
  const [bcaCountData, setBcaCountData] = useState([]);
  const [quadrantData, setQuadrantData] = useState([]);
  const [topProjects, setTopProjects] = useState([]);
  const [riskThreshold, setRiskThreshold] = useState(90);
  const [bcaThreshold, setBcaThreshold] = useState(3);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartContainerRef = useRef(null);
  const infoRef = useRef(null);

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
        setLoading(true);
        
        // Fetch the data from the public folder
        const response = await fetch('/data/index-data.geojson');
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const jsonData = await response.json();
        
        // Process the data for visualization
        processData(jsonData);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching or processing data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchData();
  }, [riskThreshold, bcaThreshold]);

  // Handle click outside info panel to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (infoRef.current && !infoRef.current.contains(event.target)) {
        setShowInfo(false);
      }
    };
  
    if (showInfo) {
      document.addEventListener('mousedown', handleClickOutside);
    }
  
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showInfo]);

  const processData = (jsonData) => {
    if (!jsonData || !jsonData.features) {
      setError("Invalid data format");
      return;
    }

    // Extract data points
    const processedData = jsonData.features.map(feature => {
      const { properties } = feature;
      
      // Determine priority quadrant
      const highBCA = properties.BCA >= bcaThreshold;
      const highRisk = properties["Risk Index"] >= riskThreshold;
      
      let priority;
      let quadrantColor;
      
      if (highBCA && highRisk) {
        priority = "High Priority";
        quadrantColor = QUADRANT_COLORS["High Priority"];
      } else if (!highBCA && highRisk) {
        priority = "Medium-High Priority";
        quadrantColor = QUADRANT_COLORS["Medium-High Priority"];
      } else if (highBCA && !highRisk) {
        priority = "Medium-Low Priority";
        quadrantColor = QUADRANT_COLORS["Medium-Low Priority"];
      } else {
        priority = "Low Priority";
        quadrantColor = QUADRANT_COLORS["Low Priority"];
      }
      
      return {
        ...properties,
        priority,
        quadrantColor,
        // Create a unique ID for each item
        id: `${properties.diameter_mm || ''}${properties.effluent_type || ''}${properties.install_yr || ''}${Math.random().toString(36).substring(2, 5)}`
      };
    });
    
    setData(processedData);
    
    // Group data for various charts
    createChartData(processedData);
  };

  const createChartData = (processedData) => {
    // 1. Category data (type and condition)
    const categoryGroups = {};
    processedData.forEach(item => {
      if (item.effluent_type && item.condition) {
        const category = `${item.effluent_type}-${item.condition}`;
        categoryGroups[category] = categoryGroups[category] || { 
          count: 0, 
          totalBCA: 0, 
          totalRisk: 0,
          type: item.effluent_type,
          condition: item.condition
        };
        
        categoryGroups[category].count++;
        categoryGroups[category].totalBCA += item.BCA || 0;
        categoryGroups[category].totalRisk += item["Risk Index"] || 0;
      }
    });
    
    // Calculate averages and prepare for chart
    const categoryChartData = Object.keys(categoryGroups).map(key => {
      const group = categoryGroups[key];
      return {
        category: key,
        type: group.type,
        condition: group.condition,
        count: group.count,
        avgBCA: group.totalBCA / group.count,
        avgRisk: group.totalRisk / group.count
      };
    }).sort((a, b) => b.avgBCA - a.avgBCA);
    
    setCategoryData(categoryChartData);
    
    // 2. BCA count data
    const bcaGroups = {};
    processedData.forEach(item => {
      if (item.BCA !== null && item.BCA !== undefined) {
        bcaGroups[item.BCA] = bcaGroups[item.BCA] || {
          count: 0,
          totalRisk: 0
        };
        
        bcaGroups[item.BCA].count++;
        bcaGroups[item.BCA].totalRisk += item["Risk Index"] || 0;
      }
    });
    
    const bcaChartData = Object.keys(bcaGroups).map(bca => ({
      bca: parseInt(bca),
      count: bcaGroups[bca].count,
      avgRisk: bcaGroups[bca].totalRisk / bcaGroups[bca].count
    })).sort((a, b) => a.bca - b.bca);
    
    setBcaCountData(bcaChartData);
    
    // 3. Quadrant data for pie chart
    const quadrantGroups = {};
    processedData.forEach(item => {
      quadrantGroups[item.priority] = (quadrantGroups[item.priority] || 0) + 1;
    });
    
    const quadrantChartData = Object.keys(quadrantGroups).map(quadrant => ({
      name: quadrant,
      value: quadrantGroups[quadrant],
      color: QUADRANT_COLORS[quadrant]
    }));
    
    setQuadrantData(quadrantChartData);
    
    // 4. Top projects by BCA and Risk Index (highest priority first)
    const sortedProjects = [...processedData]
      .filter(item => item.BCA >= 3 && item["Risk Index"] >= 85)
      .sort((a, b) => {
        // First sort by BCA descending
        if (b.BCA !== a.BCA) return b.BCA - a.BCA;
        // Then by Risk Index descending
        return b["Risk Index"] - a["Risk Index"];
      })
      .slice(0, 10)
      .map(item => ({
        ...item,
        description: item.effluent_type 
          ? `${item.effluent_type} Line (${item.condition})`
          : item.hblock || 'Infrastructure Project'
      }));
    
    setTopProjects(sortedProjects);
  };

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Render the scatter plot with quadrants
  const renderScatterPlot = () => {
    return (
      <ResponsiveContainer width="100%" height={230}>
        <ScatterChart
          margin={{ top: 20, right: 20, bottom: 40, left: 20 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            type="number" 
            dataKey="BCA" 
            name="Benefit-Cost Ratio"
            domain={[0, 5]}
            tick={{ fontSize: 12 }}
          >
            <Label value="Benefit-Cost Ratio (BCA)" position="bottom" offset={15} />
          </XAxis>
          <YAxis 
            type="number" 
            dataKey="Risk Index" 
            name="Risk Index"
            domain={[80, 100]}
            tick={{ fontSize: 12 }}
          >
            <Label value="Risk Index" position="left" angle={-90} offset={0} style={{ textAnchor: 'middle' }} />
          </YAxis>
          
          {/* Reference lines for quadrants */}
          <ReferenceLine y={riskThreshold} stroke="#666" strokeDasharray="3 3" />
          <ReferenceLine x={bcaThreshold} stroke="#666" strokeDasharray="3 3" />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Scatter
            name="Infrastructure Projects"
            data={data}
            fill={COLORS.blue}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.quadrantColor} />
            ))}
          </Scatter>
        </ScatterChart>
      </ResponsiveContainer>
    );
  };

  // Render the bar chart of BCA distribution
  const renderBCADistribution = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={bcaCountData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="bca" label={{ value: 'Benefit-Cost Ratio', position: 'bottom', offset: 0 }} />
          <YAxis label={{ value: 'Number of Assets', angle: -90, position: 'left' }} />
          <Tooltip 
            formatter={(value, name) => [value, name === 'count' ? 'Count' : 'Avg Risk Index']}
            labelFormatter={(value) => `BCA: ${value}`}
          />
          <Bar dataKey="count" name="Number of Assets" fill={COLORS.teal} />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  // Render the pie chart of priority distribution
  const renderPriorityDistribution = () => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={quadrantData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {quadrantData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => [`${value} projects`, 'Count']} />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  // Render the bar chart for category analysis
  const renderCategoryAnalysis = () => {
    const filteredData = categoryData.slice(0, 8); // Top 8 for readability
    
    return (
      <ResponsiveContainer width="100%" height={350}>
        <ComposedChart data={filteredData} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 5]} label={{ value: 'Average BCA', position: 'bottom' }} />
          <YAxis 
            dataKey="category" 
            type="category" 
            width={150}
            tickFormatter={(value) => {
              const parts = value.split('-');
              return `${parts[0]} (${parts[1]})`;
            }}
          />
          <Tooltip 
            formatter={(value, name) => [value.toFixed(2), name === 'avgBCA' ? 'Avg BCA' : 'Count']}
            labelFormatter={(value) => {
              const parts = value.split('-');
              return `${parts[0]} - Condition ${parts[1]}`;
            }}
          />
          <Bar 
            dataKey="avgBCA" 
            name="Average BCA" 
            fill={COLORS.blue}
            barSize={20}
          >
            {filteredData.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={TYPE_COLORS[entry.type] || COLORS.gray} 
                stroke={CONDITION_COLORS[entry.condition] || COLORS.gray}
                strokeWidth={2}
              />
            ))}
          </Bar>
        </ComposedChart>
      </ResponsiveContainer>
    );
  };

  // Render bar chart for top projects
  const renderTopProjects = () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={topProjects} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={[0, 5]} />
          <YAxis 
            dataKey="description" 
            type="category" 
            width={180}
            tick={{ fontSize: 12 }}
          />
          <Tooltip 
            formatter={(value) => [value, 'BCA']}
            labelFormatter={(value) => `${value}`}
          />
          <Bar 
            dataKey="BCA" 
            name="Benefit-Cost Ratio" 
            fill={COLORS.green}
          >
            {topProjects.map((entry, index) => (
              <Cell 
                key={`cell-${index}`} 
                fill={PIE_COLORS[index % PIE_COLORS.length]} 
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center p-4">
        Error loading data: {error}
      </div>
    );
  }

  // Render dashboard content (can be used for both normal and fullscreen mode)
  const renderDashboardContent = (fullscreen = false) => (
    <div 
      className={`bg-white ${fullscreen ? 'fixed inset-0 z-50 overflow-auto pt-20 pb-8 px-8' : 'p-6 rounded-lg shadow-lg z-10'}`}
      ref={chartContainerRef}
    >
      {/* Header with buttons */}


      {/* Tabs for different charts */}
      <div className="flex items-center justify-between mb-4 border-b border-gray-200 pb-1">
  
  {/* Tabs (left-aligned) */}
  <div className="flex space-x-1">
    {['quadrant', 'distribution', 'category', 'top'].map((tab) => (
      <button
        key={tab}
        className={`px-3 py-1 rounded-t-md text-sm font-medium transition-all duration-200 border
          ${
            activeTab === tab
              ? 'bg-[#008080] text-white border-[#008080]'
              : 'bg-white text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'
          }`}
        onClick={() => setActiveTab(tab)}
      >
        {tab === 'quadrant' && 'Priority Quadrants'}
        {tab === 'distribution' && 'BCA Distribution'}
        {tab === 'category' && 'Category Analysis'}
        {tab === 'top' && 'Top Projects'}
      </button>
    ))}
  </div>

  {/* Buttons (right-aligned) */}
  <div className="flex items-center space-x-1 relative">
    {/* Info Button */}
    <button
      onClick={() => setShowInfo(prev => !prev)}
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
    {showInfo && (
      <div 
        ref={infoRef} 
        className={`absolute top-full right-0 mt-2 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50`}
      >
        <div className="space-y-2 text-sm text-gray-700">
          <h3 className="font-bold">About This Dashboard</h3>
          <p>This dashboard visualizes infrastructure projects based on their benefit-cost ratio (BCA) and risk index.</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>High Priority: High BCA, High Risk</li>
            <li>Medium-High Priority: Low BCA, High Risk</li>
            <li>Medium-Low Priority: High BCA, Low Risk</li>
            <li>Low Priority: Low BCA, Low Risk</li>
          </ul>
          <p>Use the threshold sliders to adjust the quadrant boundaries.</p>
        </div>
      </div>
    )}

    {/* Fullscreen Button */}
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


      {/* Threshold controls for quadrant view */}
      {activeTab === 'quadrant' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Risk Threshold: {riskThreshold}
            </label>
            <input
              type="range"
              min="80"
              max="100"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              BCA Threshold: {bcaThreshold}
            </label>
            <input
              type="range"
              min="0"
              max="4"
              step="1"
              value={bcaThreshold}
              onChange={(e) => setBcaThreshold(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      )}

      {/* Chart area */}
      <div className="bg-white p-4 rounded-lg relative z-10 shadow">
        {activeTab === 'quadrant' && (
          <div>
            <div className="font-medium text-lg mb-2">Priority Quadrant Analysis</div>
            <p className="text-sm text-gray-600 mb-4">
              Projects in upper-right quadrant (high BCA, high risk) should be prioritized.
            </p>
            {renderScatterPlot()}
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-white p-3 rounded shadow-sm border-l-4" style={{ borderLeftColor: QUADRANT_COLORS["High Priority"] }}>
                <div className="text-xs text-gray-500">High Priority</div>
                <div className="text-lg font-bold">{quadrantData.find(q => q.name === "High Priority")?.value || 0}</div>
                <div className="text-xs">High BCA, High Risk</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-l-4" style={{ borderLeftColor: QUADRANT_COLORS["Medium-High Priority"] }}>
                <div className="text-xs text-gray-500">Medium-High Priority</div>
                <div className="text-lg font-bold">{quadrantData.find(q => q.name === "Medium-High Priority")?.value || 0}</div>
                <div className="text-xs">Low BCA, High Risk</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-l-4" style={{ borderLeftColor: QUADRANT_COLORS["Medium-Low Priority"] }}>
                <div className="text-xs text-gray-500">Medium-Low Priority</div>
                <div className="text-lg font-bold">{quadrantData.find(q => q.name === "Medium-Low Priority")?.value || 0}</div>
                <div className="text-xs">High BCA, Low Risk</div>
              </div>
              <div className="bg-white p-3 rounded shadow-sm border-l-4" style={{ borderLeftColor: QUADRANT_COLORS["Low Priority"] }}>
                <div className="text-xs text-gray-500">Low Priority</div>
                <div className="text-lg font-bold">{quadrantData.find(q => q.name === "Low Priority")?.value || 0}</div>
                <div className="text-xs">Low BCA, Low Risk</div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'distribution' && (
          <div>
            <div className="font-medium text-lg mb-2">BCA Distribution Analysis</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                {renderBCADistribution()}
                <p className="text-sm text-gray-600 mt-2">
                  Distribution of assets by benefit-cost ratio.
                </p>
              </div>
              <div>
                {renderPriorityDistribution()}
                <p className="text-sm text-gray-600 mt-2">
                  Project distribution by priority level.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'category' && (
          <div>
            <div className="font-medium text-lg mb-2">Category Analysis</div>
            <p className="text-sm text-gray-600 mb-4">
              Benefit-cost ratio by infrastructure type and condition rating.
            </p>
            {renderCategoryAnalysis()}
          </div>
        )}
        
        {activeTab === 'top' && (
          <div>
            <div className="font-medium text-lg mb-2">Top Priority Projects</div>
            <p className="text-sm text-gray-600 mb-4">
              Projects with highest benefit-cost ratios in high-risk areas.
            </p>
            {renderTopProjects()}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {renderDashboardContent(false)}
      {isFullscreen && renderDashboardContent(true)}
    </>
  );
};

export default BenefitCostAnalysisDashboard;