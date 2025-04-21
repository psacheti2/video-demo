import React, { useState, useEffect } from 'react';
import DynamicChart from './DynamicChart';
import { useNotificationStore } from '@/store/NotificationsStore'; 

const ChartContainer = ({ chartId, title, onBack }) => {
  // State
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedArtifacts, setSavedArtifacts] = useState([]);
  
  // Get notification function from store
  const addNotification = useNotificationStore((state) => state.addNotification);

  // Load saved artifacts from localStorage on mount
  useEffect(() => {
    try {
      const savedItems = localStorage.getItem('savedArtifacts');
      if (savedItems) {
        setSavedArtifacts(JSON.parse(savedItems));
      }
    } catch (err) {
      console.error("Error loading saved artifacts:", err);
    }
  }, []);

  useEffect(() => {
    if (!chartId) return;
    
    const fetchChartData = async () => {
      try {
        setLoading(true);
        
        const response = await fetch(`/api/charts/${chartId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch chart data: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.error) {
          throw new Error(result.error);
        }
        
        setChartData(result);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching chart data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    fetchChartData();
  }, [chartId]);

  const handleLayersReady = () => {
    console.log("Chart layers are ready");
  };

  const handleSaveArtifacts = (newArtifacts) => {
    setSavedArtifacts(newArtifacts);
    localStorage.setItem('savedArtifacts', JSON.stringify(newArtifacts));
  };

  const handleAddNotification = (message) => {
    if (addNotification) {
      addNotification(message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-teal-500"></div>
        <span className="ml-3 text-gray-600">Loading chart data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64 bg-red-50 rounded-lg border border-red-200">
        <div className="text-center">
          <p className="text-red-500 font-semibold">Error loading chart</p>
          <p className="text-sm text-red-400 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="flex justify-center items-center h-64 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-gray-500">No chart data available</div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 rounded-xl shadow-sm border border-gray-100">
      <DynamicChart
        chartData={chartData}
        onLayersReady={handleLayersReady}
        setSavedArtifacts={handleSaveArtifacts}
        title={title || chartData.name || "Chart"}
        onBack={onBack}
        addNotification={handleAddNotification}
      />
    </div>
  );
};

export default ChartContainer;