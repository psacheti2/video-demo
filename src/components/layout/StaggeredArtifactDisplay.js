import React, { useState, useEffect } from 'react';
import { Artifact, ChatMessageType } from '../../app/page';

// This component will manage the staggered display of artifacts
export default function StaggeredArtifactsDisplay() {
  const [messages, setMessages] = useState([]);
  const [artifacts, setArtifacts] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Simulate the conversation steps
  useEffect(() => {
    // Initial message from user
    setMessages([
      {
        text: "Help me prioritize our budget across Vancouver based on flood risk and infrastructure needs. Also add relevant 311 call data and socio-economic demographics to this",
        isUser: true
      }
    ]);

    // Start the sequence
    setTimeout(() => {
      // First part of assistant's response
      setMessages(prev => [
        ...prev,
        {
          text: "Here's your interactive map with flood zones, infrastructure conditions, stormwater projects, 311 calls, and demographic indicators.",
          isUser: false
        }
      ]);

      // Add first artifact (Chart Component)
      setArtifacts([
        {
          type: "chart",
          title: "Budget Priority Analysis Dashboard",
          component: "BudgetDashboard",
          data: {
            source: "data/budget-data.csv",
            chartOptions: [
              { id: 'category-budget', name: 'Budget & Spending by Service Category' },
              { id: 'streets-subcategory', name: 'Streets Budget by Subcategory' },
              { id: 'yearly-spending', name: 'Yearly Spending Forecast (2025-2029)' },
              { id: 'top-projects', name: 'Top 10 Projects by Budget' },
              { id: 'project-count', name: 'Project Count by Category' }
            ]
          }
        }
      ]);

      // Start loading for map
      setCurrentStep(1);
      setIsLoading(true);

      // After a delay, show map is initializing
      setTimeout(() => {
        setMessages(prev => [
          ...prev,
          {
            text: "Initializing flood risk map...",
            isUser: false
          }
        ]);
        setCurrentStep(2);
        
        // After another delay, map is loading data
        setTimeout(() => {
          setMessages(prev => [
            ...prev,
            {
              text: "Loading infrastructure and demographic data layers...",
              isUser: false
            }
          ]);
          setCurrentStep(3);
          
          // After another delay, map is complete and insights are shown
          setTimeout(() => {
            // Add map artifact
            setArtifacts(prev => [
              ...prev,
              {
                type: "map",
                title: "Vancouver Flood Risk & Infrastructure Priority Map",
                component: "MapComponent",
                data: {
                  layers: ["flood_zones", "stormwater_projects", "infrastructure_conditions", "311_data", "demographics"],
                  operations: ["overlay", "index_calculation"]
                }
              }
            ]);
            
            // Update with insights
            setMessages(prev => [
              ...prev,
              {
                text: "Key insights: \n1. Eastern neighborhoods show both high flood risk and aging sewer infrastructure \n2. Three high-density residential areas have significant flood risk but no current projects \n3. Northwestern areas have clustered 311 drainage complaints that align with flood risk models. \nThese patterns suggest where budget allocation would have maximum impact. Would you like me to create a composite risk-need index to help prioritize specific areas?",
                isUser: false
              }
            ]);
            setIsLoading(false);
            setCurrentStep(4);
          }, 3000); // 3 seconds
        }, 2000); // 2 seconds
      }, 2000); // 2 seconds
    }, 1000); // 1 second
  }, []);

  // Render the chat messages and artifacts panel
  return (
    <div className="flex flex-col h-screen">
      {/* Mock header */}
      <div className="h-16 bg-[#008080] flex items-center px-4">
        <h1 className="text-white text-lg font-medium">Urban Planning Assistant</h1>
      </div>
      
      <div className="flex flex-1 overflow-hidden">
        {/* Main chat area */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}>
                <div 
                  className={`rounded-lg px-4 py-2 max-w-[70%] ${
                    message.isUser 
                      ? 'bg-[#008080] text-white rounded-br-none' 
                      : 'bg-[#34495E] text-white rounded-bl-none'
                  }`}
                >
                  {message.text.split('\\n').map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-[#34495E] text-white rounded-lg px-4 py-2 rounded-bl-none">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '200ms' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '400ms' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Mock input area */}
          <div className="border-t border-gray-200 p-4">
            <div className="flex">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="flex-1 px-4 py-2 rounded-l-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#008080]"
                disabled={true}
              />
              <button className="bg-[#008080] text-white px-4 py-2 rounded-r-md">
                Send
              </button>
            </div>
          </div>
        </div>
        
        {/* Artifacts panel */}
        <div className="w-96 border-l border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-800">Artifacts</h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {artifacts.map((artifact, index) => (
              <div 
                key={index}
                className="border border-[#008080] rounded-lg p-4 cursor-pointer bg-white text-[#008080] hover:bg-[#008080] hover:text-white transition-colors duration-200 group"
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
        </div>
      </div>
    </div>
  );
}