import React, { useRef, useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import { ChevronLeft, ChevronRight, Maximize2, Download, Edit2, Save, Menu, Minimize2, Info, X, Share2 } from "lucide-react";
import '../../app/globals.css';
import SimpleNYCChart from './SimpleNYCMap';
import VancouverPriorityDashboard from './BudgetDashboard';
import VancouverBCAChart from './BenefitCostAnalysisDashboard';
import { useNotificationStore } from '@/store/NotificationsStore';
import ROIAnalysisDashboard from './ROIAnalysisDashboard';

const CoffeeShopReport = ({ onLayersReady, reportName = "NYC Coffee Shop Investment Analysis: Location Assessment & ROI Projections", artifacts = [],
  }) => {
  const [activeSection, setActiveSection] = useState('intro');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const reportContainerRef = useRef(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false); 
  const [showArtifactGallery] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const infoRef = useRef(null);
  const [showReportDownloadDialog, setShowReportDownloadDialog] = useState(false);
const [reportDownloadSelections, setReportDownloadSelections] = useState({});
const [notificationMessage, setNotificationMessage] = useState('');
const [showEmailNotification, setShowEmailNotification] = useState(false);
const addNotification = useNotificationStore((state) => state.addNotification);
const [slideOut, setSlideOut] = useState(false);
const chartRef = useRef(null);
const [showShareDialog, setShowShareDialog] = useState(false);
const [searchTerm, setSearchTerm] = useState('');
const [selectedTeammate, setSelectedTeammate] = useState(null);
const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];
  // Theme colors
  const COLORS = {
    primary: '#2C3E50',
    secondary: '#34495E',
    neutral: '#F5F5F5',
    white: '#FFFFFF',
    coral: '#008080',
    cta: '#FF5747'
  };
  const filteredTeammates = useMemo(() => {
    return teammateList.filter(name => 
      name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, teammateList]);
  
  // This function will handle the share action
  const handleShareReport = () => {
    if (!selectedTeammate) return;
    
    setShowShareDialog(false);
    const msg = `Report shared with ${selectedTeammate}`;
    setNotificationMessage(msg);
    setShowEmailNotification(true);
    addNotification(msg);
    setSelectedTeammate(null);
    setSearchTerm('');
  };

  const [isEditing, setIsEditing] = useState(false);
const [reportTitle, setReportTitle] = useState(reportName);

  useEffect(() => {
    if (showEmailNotification) {
      const timer = setTimeout(() => {
        setSlideOut(true); // trigger slide-out animation
        setTimeout(() => {
          setShowEmailNotification(false);
          setSlideOut(false); // reset for next time
        }, 300); // match slide-out duration
      }, 4000); // show for 4s before sliding out
  
      return () => clearTimeout(timer);
    }
  }, [showEmailNotification]);
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

 useEffect(() => {
    const timeout = setTimeout(() => {
      if (onLayersReady) onLayersReady();
      if (window.setResponseReady) window.setResponseReady(true); // Optional global trigger
    }, 500); // Or however long you want to delay

    return () => clearTimeout(timeout);
  }, []);
const toggleMenu = () => {
  setIsMenuOpen(!isMenuOpen);
};
const toggleEditMode = () => {
  setIsEditing(!isEditing);
};



const handleContentChange = (sectionId, event) => {
  const updatedContent = event.target.innerHTML;
  setSectionContent(prevContent => ({
    ...prevContent,
    [sectionId]: updatedContent
  }));
};

const handleTitleChange = (event) => {
  setReportTitle(event.target.textContent);
};

const sections = [
    { id: 'executive', name: 'Executive Summary' },
    { id: 'intro', name: 'Introduction' },
    { id: 'methodology', name: 'Research Methodology' },
    { id: 'locations', name: 'Location Analysis' },
    { id: 'chart', name: 'ROI Analysis' },
    { id: 'map', name: 'Areas' },
    { id: 'hellskitchen', name: 'Hell\'s Kitchen Detailed Profile' },
    { id: 'unionsquare', name: 'Union Square Detailed Profile' },
    { id: 'chelsea', name: 'Chelsea Detailed Profile' },
    { id: 'financial', name: 'Financial Projections' },
    { id: 'implementation', name: 'Implementation Timeline' },
    { id: 'conclusion', name: 'Conclusion & Recommendations' },
    { id: 'sources', name: 'Sources & References' }
  ];
  
  const sampleContent = {
    executive: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Executive Summary</h2>
      <p class="mb-4" style="color: #34495E;">
        This report analyzes three prime locations for a new specialty coffee shop venture within a 1-mile radius of Times Square, with an initial investment budget of $200,000. After thorough market research and financial modeling, <strong>Midtown East</strong> emerges as the optimal location with a projected 28% ROI and break-even point of under 13 months, followed by Midtown South (26% ROI) and Union Square (24% ROI).
      </p>
      <p class="mb-4" style="color: #34495E;">
        Midtown East benefits from a high concentration of office workers, strong daytime foot traffic, premium demographics, and relatively lower competition in the specialty coffee segment. The financial model accounts for setup costs, operating expenses, and projected revenue growth based on comparable businesses in similar urban markets.
      </p>
    `,
    intro: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Introduction</h2>
      <p class="mb-4" style="color: #34495E;">
        The specialty coffee market in New York City continues to expand despite high market saturation, with consumers increasingly seeking quality experiences, sustainable practices, and unique cafe environments. This report evaluates optimal locations for establishing a new coffee shop venture within 1 mile of Times Square, with a focus on areas that balance foot traffic, competitive landscape, demographic fit, and financial viability.
      </p>
      <p class="mb-4" style="color: #34495E;">
        With an initial budget of $200,000, the venture aims to create a differentiated coffee experience that can achieve profitability within 18 months while establishing a foundation for potential expansion. The analysis prioritizes locations offering the strongest combination of ROI potential, neighborhood growth trajectory, and alignment with the target customer profile.
      </p>
    `,
    methodology: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Research Methodology</h2>
      <p class="mb-4" style="color: #34495E;">Our location analysis incorporated multiple data sources and methodologies:</p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li>Foot traffic analysis using mobile location data and public transit ridership patterns</li>
        <li>Competitive density mapping of existing coffee shops and cafes</li>
        <li>Demographic analysis using census data and consumer spending reports</li>
        <li>Commercial real estate pricing trends and available storefront inventory</li>
        <li>Public transit accessibility and proximity to major office buildings and attractions</li>
      </ul>
      <p style="color: #34495E;">Each location was scored across 15 weighted factors to create a comprehensive ranking system and ROI projection model.</p>
    `,
    locations: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Location Comparison</h2>
      <div class="overflow-x-auto mb-6">
        <table class="w-full border-collapse">
          <thead>
            <tr>
              <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;"></th>
              <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Midtown East</th>
              <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Midtown South</th>
              <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Union Square</th>
            </tr>
          </thead>
          <tbody style="color: #34495E;">
            <tr class="border-b border-gray-200">
              <td class="p-2 font-medium">ROI</td>
              <td class="p-2">28% (highest)</td>
              <td class="p-2">26%</td>
              <td class="p-2">24%</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-2 font-medium">Break-even</td>
              <td class="p-2">12.8 months</td>
              <td class="p-2">13.5 months</td>
              <td class="p-2">14.5 months</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-2 font-medium">Avg. Rent</td>
              <td class="p-2">$120-300/sq ft</td>
              <td class="p-2">$100-280/sq ft</td>
              <td class="p-2">$150-400/sq ft</td>
            </tr>
            <tr class="border-b border-gray-200">
              <td class="p-2 font-medium">Foot Traffic</td>
              <td class="p-2">High (corporate workforce)</td>
              <td class="p-2">Very High (tech/startup hubs)</td>
              <td class="p-2">Very High (students, office workers, tourists)</td>
            </tr>
            <tr>
              <td class="p-2 font-medium">Competition</td>
              <td class="p-2">Moderate (underserved for specialty coffee)</td>
              <td class="p-2">High (dense cafe environment)</td>
              <td class="p-2">High (intense coffee competition)</td>
            </tr>
          </tbody>
        </table>
      </div>
    `,  
    midtowneast: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Midtown East Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      Midtown East offers a strong combination of stable daytime traffic, affluent demographics, and strategic proximity to major corporate offices:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Demographics:</strong> Predominantly professional workforce, median household income exceeding $130,000, high levels of disposable income</li>
      <li><strong>Foot Traffic:</strong> Driven by office workers, commuters from Grand Central Terminal, and nearby hotels</li>
      <li><strong>Commercial Context:</strong> Relatively low density of independent specialty coffee shops compared to Midtown South and Union Square</li>
      <li><strong>Rental Costs:</strong> Premium but justified by steady customer flow and consistent weekday revenue</li>
      <li><strong>Accessibility:</strong> Excellent subway access (4/5/6, E/M trains) and major commuter arteries</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Target storefronts are located along Lexington Avenue and 3rd Avenue corridors, offering high visibility and steady weekday sales potential.
    </p>
  `,
  midtownsouth: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Midtown South Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      Midtown South presents a vibrant, creative customer base with strong synergies for a community-driven specialty coffee concept:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Demographics:</strong> Younger workforce skew, high percentage of technology, media, and creative professionals</li>
      <li><strong>Growth Trends:</strong> Rapid expansion of co-working spaces, startups, and boutique hotels driving daytime demand</li>
      <li><strong>Foot Traffic:</strong> High pedestrian volumes across weekdays and weekends, particularly near Madison Square Park</li>
      <li><strong>Competitive Landscape:</strong> Higher cafe density, requiring strong differentiation and niche branding</li>
      <li><strong>Rental Environment:</strong> Moderate to high ($100–280/sq ft), but offset by broader customer base</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Best target areas include spaces south of 34th Street between 5th and 6th Avenues, offering access to both business and leisure traffic.
    </p>
  `,
  unionsquare: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Union Square Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      Union Square offers exceptional foot traffic and a dynamic customer mix but comes with elevated operating costs and intense competition:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Demographics:</strong> Blend of NYU students, office workers, shoppers, and tourists</li>
      <li><strong>Commercial Hub:</strong> High volume retail zone with multiple anchor stores and consistent seven-day activity</li>
      <li><strong>Transit Access:</strong> Major hub connecting 4/5/6, L, N/Q/R/W subway lines (~98,000 daily riders)</li>
      <li><strong>Competitive Pressure:</strong> 18+ coffee shops within a 4-block radius, requiring standout positioning</li>
      <li><strong>Cost Considerations:</strong> Rent premiums of 60–90% higher than Midtown South for equivalent spaces</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Union Square offers immediate market access but demands a strong marketing plan and differentiated offering to thrive.
    </p>
  `,
  financial: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Financial Projections</h2>
    <p class="mb-4" style="color: #34495E;">
      Financial models for each location are based on industry benchmarks and comparable NYC coffee shop performance metrics:
    </p>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Midtown East</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>Initial Investment:</strong> $200,000 (includes $150K buildout, $25K equipment, $25K operating reserve)</li>
        <li><strong>Monthly Operating Costs:</strong> $35,000 (includes $13.5K rent, $12K labor, $6K COGS, $3.5K other)</li>
        <li><strong>Projected Monthly Revenue:</strong> $55,000 (month 6+)</li>
        <li><strong>Projected Monthly Profit:</strong> $20,000 (month 6+)</li>
        <li><strong>Year 1 Net Income:</strong> $72,000</li>
        <li><strong>Year 2 Net Income:</strong> $240,000</li>
      </ul>
    </div>
    <p class="mb-4" style="color: #34495E;">
      Midtown East projects the strongest overall financial outcome due to its combination of consistent traffic, premium demographics, and relatively favorable competitive environment.
    </p>
  `,
  implementation: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Implementation Timeline</h2>
    <div class="mb-4" style="color: #34495E;">
      <p class="mb-2">Recommended phased approach for the Midtown East location:</p>
      <ul class="list-disc pl-5">
        <li><strong>Months 1-2:</strong> Lease negotiation, architectural planning, permit applications</li>
        <li><strong>Months 3-4:</strong> Construction buildout, equipment procurement</li>
        <li><strong>Month 5:</strong> Staff recruitment and training, soft opening events</li>
        <li><strong>Month 6:</strong> Grand opening and marketing activation</li>
        <li><strong>Months 7-12:</strong> Customer loyalty programs, operational optimization, community partnerships</li>
        <li><strong>Month 13 onward:</strong> Evaluate second location opportunities based on performance benchmarks</li>
      </ul>
    </div>
    <p class="mb-4" style="color: #34495E;">
      Key success factors include securing favorable lease terms, controlling buildout costs, and aligning marketing efforts with the local professional demographic.
    </p>
  `,
  conclusion: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Conclusion & Recommendations</h2>
    <p class="mb-4" style="color: #34495E;">
      Based on comprehensive analysis of market conditions, financial projections, and growth potential, we recommend:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Primary Recommendation:</strong> Secure the Midtown East location, targeting launch in Q3 2025</li>
      <li><strong>Differentiation Strategy:</strong> Position the cafe as a premium, professional retreat with curated beverage options and tech-friendly design</li>
      <li><strong>Secondary Option:</strong> Midtown South offers strong potential but requires more aggressive brand storytelling to succeed</li>
      <li><strong>Risk Mitigation:</strong> Allocate additional contingency budget (~10%) for potential construction or permitting delays</li>
      <li><strong>Expansion Strategy:</strong> Monitor early performance to identify readiness for a second location near Union Square or downtown within 24 months</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Midtown East provides the optimal blend of financial upside, operational stability, and strategic brand positioning to support the initial phase of the venture.
    </p>
  `,
  sources: `
  <h2 class="text-m font-bold mb-4" style="color: #008080;">Sources & References</h2>
  <div style="font-size: 11px; color: #34495E;">
    <ul class="list-disc pl-5 mb-4">
      <li><a href="https://data.cityofnewyork.us/Transportation/Bi-Annual-Pedestrian-Counts/cqsj-cfgu/about_data" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">NYC Bi-Annual Pedestrian Counts</a></li>
      <li><a href="https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/43nn-pn8j/about_data" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">NYC Restaurant Inspection Results</a></li>
      <li><a href="https://data.cityofnewyork.us/City-Government/2020-Neighborhood-Tabulation-Areas-NTAs-/9nt8-h7nd/about_data" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">NYC Neighborhood Tabulation Areas (NTAs)</a></li>
      <li><a href="https://nycmaps-nyc.hub.arcgis.com/datasets/nyc::subway-station/explore?location=40.707675%2C-74.003874%2C9.72&showTable=true" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">NYC Subway Stations</a></li>
      <li><a href="https://nycmaps-nyc.hub.arcgis.com/datasets/nyc::subway/explore?location=40.707404%2C-74.003705%2C9.71&showTable=true" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">NYC Subway System</a></li>
    </ul>
  </div>
`
};




const [sectionContent, setSectionContent] = useState(sampleContent);
  
 
  
  
  // Refs for each section for intersection observer
  const sectionRefs = useRef({});
  
  // Set up intersection observer to track which section is in view
useEffect(() => {
  const options = {
    root: null,
    rootMargin: '0px',
    threshold: 0.3,
  };
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        // Set the active section based on the intersecting element's ID
        setActiveSection(id);
      }
    });
  }, options);
  
  // Observe all section elements
  Object.values(sectionRefs.current).forEach(ref => {
    if (ref) observer.observe(ref);
  });
  
  return () => {
    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.unobserve(ref);
    });
  };
}, [isFullscreen]); // Add isFullscreen as a dependency to reinitialize observer when toggling modes
  
  // Handle sidebar animation
  useEffect(() => {
    if (isSidebarOpen) {
      // First make the sidebar visible but with 0 width
      setSidebarVisible(true);
      // Then trigger a reflow and animate width in
      setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        const fullscreenSidebar = document.getElementById('fullscreen-sidebar');
        
        if (sidebar) {
          sidebar.style.width = '220px';
        }
        
        if (fullscreenSidebar) {
          fullscreenSidebar.style.width = '220px';
        }
      }, 10);
    } else {
      // First animate width out
      const sidebar = document.getElementById('sidebar');
      const fullscreenSidebar = document.getElementById('fullscreen-sidebar');
      
      if (sidebar) {
        sidebar.style.width = '0px';
      }
      
      if (fullscreenSidebar) {
        fullscreenSidebar.style.width = '0px';
      }
      
      // Then hide the sidebar after animation completes
      setTimeout(() => {
        setSidebarVisible(false);
      }, 300); // Match the transition duration
    }
  }, [isSidebarOpen]);
  
  const toggleFullscreen = () => {
    setIsFullscreen(prev => {
      const next = !prev;
  
      // Delay so that the DOM is ready before applying width
      setTimeout(() => {
        const sidebar = document.getElementById('sidebar');
        const fullscreenSidebar = document.getElementById('fullscreen-sidebar');
        
        const width = isSidebarOpen ? '220px' : '0px';
        if (sidebar) sidebar.style.width = width;
        if (fullscreenSidebar) fullscreenSidebar.style.width = width;
      }, 50);
  
      return next;
    });
  };
  
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };
  
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  const handleReportDownload = () => {
    const downloads = [];
  
    Object.entries(reportDownloadSelections).forEach(([key, { filename, format }]) => {
      const fullName = `${filename}${format}`;
      downloads.push(fullName);
  
      const blob = new Blob(['Sample report content'], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', fullName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  
    if (downloads.length > 0) {
      const msg = `Downloaded ${downloads.length} file${downloads.length > 1 ? 's' : ''}: ${downloads.join(', ')}`;
      setShowReportDownloadDialog(false);
      setNotificationMessage(msg);
      setShowEmailNotification(true);
      addNotification(msg);
    }
  };
  
  // Updated handleDownload function to properly capture charts
const handleDownload = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Show notification
    setNotificationMessage('Preparing your PDF...');
    setShowEmailNotification(true);
    
    // First, we need to ensure the chart is fully rendered
    setTimeout(() => {
      // Dynamically import html2pdf
      import('html2pdf.js').then(html2pdfModule => {
        const html2pdf = html2pdfModule.default;
        
        // Create a simplified document structure for PDF
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '100%';
        tempContainer.style.padding = '20px';
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Add a title
        const title = document.createElement('h1');
        title.textContent = reportTitle;
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '20px';
        title.style.color = '#2C3E50'; // Primary color
        tempContainer.appendChild(title);
        
        // Process each section - capture charts as images when possible
        Promise.all(
          sections.map(async (section) => {
            const sectionContainer = document.createElement('div');
            sectionContainer.style.marginBottom = '30px';
            
            if (section.id === 'chart') {
              // Create heading for chart section
              const heading = document.createElement('h2');
              heading.textContent = 'ROI Analysis';
              heading.style.fontSize = '20px';
              heading.style.fontWeight = 'bold';
              heading.style.marginBottom = '16px';
              heading.style.color = '#008080';
              sectionContainer.appendChild(heading);
              
              // Try to capture the chart as an image
              try {
                const chartElement = document.querySelector('.chart-container');
                if (chartElement) {
                  // Using html2canvas to convert the chart to an image
                  const canvas = await html2canvas(chartElement, {
                    scale: 2,
                    logging: false,
                    useCORS: true
                  });
                  
                  const img = document.createElement('img');
                  img.src = canvas.toDataURL('image/png');
                  img.style.width = '100%';
                  img.style.maxWidth = '100%';
                  img.style.marginTop = '10px';
                  img.style.marginBottom = '10px';
                  sectionContainer.appendChild(img);
                } else {
                  // Fallback if chart container not found
                  const chartPlaceholder = document.createElement('div');
                  chartPlaceholder.textContent = '[ROI Analysis Chart - Interactive version available in online report]';
                  chartPlaceholder.style.padding = '20px';
                  chartPlaceholder.style.border = '1px solid #008080';
                  chartPlaceholder.style.textAlign = 'center';
                  chartPlaceholder.style.marginTop = '10px';
                  chartPlaceholder.style.marginBottom = '10px';
                  chartPlaceholder.style.color = '#34495E';
                  sectionContainer.appendChild(chartPlaceholder);
                }
              } catch (error) {
                console.error('Error capturing chart:', error);
                // Fallback if chart capture fails
                const chartPlaceholder = document.createElement('div');
                chartPlaceholder.textContent = '[ROI Analysis Chart - Interactive version available in online report]';
                chartPlaceholder.style.padding = '20px';
                chartPlaceholder.style.border = '1px solid #008080';
                chartPlaceholder.style.textAlign = 'center';
                chartPlaceholder.style.marginTop = '10px';
                chartPlaceholder.style.marginBottom = '10px';
                chartPlaceholder.style.color = '#34495E';
                sectionContainer.appendChild(chartPlaceholder);
              }
            } else if (section.id !== 'map') {
              // For text content, create a simple div with the content
              const contentDiv = document.createElement('div');
              // Get the HTML content without modifying it
              contentDiv.innerHTML = sectionContent[section.id] || '';
              
              // Remove class attributes but preserve styles
              const allElements = contentDiv.querySelectorAll('*');
              allElements.forEach(el => {
                el.removeAttribute('class');
                
                // Add specific styling for tables if needed
                if (el.tagName === 'TABLE') {
                  el.style.width = '100%';
                  el.style.borderCollapse = 'collapse';
                  el.style.marginBottom = '15px';
                  el.style.border = '1px solid #e5e7eb';
                } else if (el.tagName === 'TH') {
                  el.style.textAlign = 'left';
                  el.style.padding = '8px';
                  el.style.borderBottom = '2px solid #008080';
                  el.style.color = '#2C3E50';
                } else if (el.tagName === 'TD') {
                  el.style.padding = '8px';
                  el.style.borderBottom = '1px solid #e5e7eb';
                  el.style.color = '#34495E';
                } else if (el.tagName === 'H2') {
                  el.style.fontSize = '20px';
                  el.style.fontWeight = 'bold';
                  el.style.marginBottom = '16px';
                  el.style.color = '#008080';
                }
              });
              
              sectionContainer.appendChild(contentDiv);
            }
            
            return sectionContainer;
          })
        ).then(sectionContainers => {
          // Add all section containers to the temp container
          sectionContainers.forEach(container => {
            if (container.children.length > 0) {
              tempContainer.appendChild(container);
            }
          });
          
          document.body.appendChild(tempContainer);
          
          // Set PDF generation options
          const options = {
            margin: [25, 25, 25, 25],
            filename: `${reportTitle.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          
          // Use html2pdf to convert temp container to PDF
          html2pdf()
            .from(tempContainer)
            .set(options)
            .save()
            .then(() => {
              document.body.removeChild(tempContainer);
              setNotificationMessage('PDF downloaded successfully!');
              setShowEmailNotification(true);
            })
            .catch(error => {
              console.error('Error generating PDF:', error);
              document.body.removeChild(tempContainer);
              setNotificationMessage('Error creating PDF. Please try again.');
              setShowEmailNotification(true);
            });
        });
      }).catch(error => {
        console.error('Error loading html2pdf:', error);
        setNotificationMessage('Error loading PDF generator. Please try again.');
        setShowEmailNotification(true);
      });
    }, 500); // Give charts time to render fully
  };
  
  // Make sure to add this import at the top of your file
  // import html2canvas from 'html2canvas';
  
  // Alternative function that uses dom-to-image for better chart capture
  // Updated handleDownloadWithDomToImage function to capture only the chart visualization
const handleDownloadWithDomToImage = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Show notification
    setNotificationMessage('Preparing your PDF...');
    setShowEmailNotification(true);
    
    // First, ensure all charts are rendered
    setTimeout(async () => {
      try {
        // Dynamically import required libraries
        const [html2pdfModule, domtoimage] = await Promise.all([
          import('html2pdf.js'),
          import('dom-to-image')
        ]);
        
        const html2pdf = html2pdfModule.default;
        
        // Create a document for PDF
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '100%';
        tempContainer.style.padding = '20px';
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = reportTitle;
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '20px';
        title.style.color = '#2C3E50';
        tempContainer.appendChild(title);
        
        // Process each section
        for (const section of sections) {
          const sectionContainer = document.createElement('div');
          sectionContainer.style.marginBottom = '30px';
          
          if (section.id === 'chart') {
            // Create heading for chart section
            const heading = document.createElement('h2');
            heading.textContent = 'ROI Analysis';
            heading.style.fontSize = '20px';
            heading.style.fontWeight = 'bold';
            heading.style.marginBottom = '16px';
            heading.style.color = '#008080';
            sectionContainer.appendChild(heading);
            
            // Try to capture the chart as an image
            try {
              // Target only the specific chart visualization elements, not the entire container with controls
              // This is more specific than '.chart-container'
              const chartElement = document.querySelector('.recharts-responsive-container') || 
                                  document.querySelector('.recharts-wrapper') ||
                                  document.querySelector('.chart-container .recharts-surface');
              
              if (chartElement) {
                // Add a background to ensure the chart is visible
                const originalBg = chartElement.style.background;
                chartElement.style.background = '#fff';
                
                // Using dom-to-image with higher quality settings
                const dataUrl = await domtoimage.toPng(chartElement, {
                  quality: 1.0,
                  bgcolor: '#fff',
                  // Higher scale for better resolution
                  scale: 3,
                  // Increase image dimensions
                  width: chartElement.offsetWidth * 2,
                  height: chartElement.offsetHeight * 2,
                  style: {
                    // Remove any UI elements that might be included
                    '.recharts-legend-item': { display: 'none' },
                    'button': { display: 'none' },
                    '.control-panel': { display: 'none' }
                  }
                });
                
                // Restore original background
                chartElement.style.background = originalBg;
                
                const img = document.createElement('img');
                img.src = dataUrl;
                img.style.width = '100%';
                img.style.maxWidth = '100%';
                img.style.marginTop = '10px';
                img.style.marginBottom = '10px';
                sectionContainer.appendChild(img);
              } else {
                // Try alternative approach - create a static chart image
                const chartImageContainer = document.createElement('div');
                chartImageContainer.style.width = '100%';
                chartImageContainer.style.marginTop = '15px';
                chartImageContainer.style.marginBottom = '15px';
                chartImageContainer.style.textAlign = 'center';
                
                // Manually create a clean static chart representation
                // This is a fallback if we can't capture the dynamic chart
                const staticChartHTML = `
                  <div style="background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    <h3 style="margin-bottom: 15px; color: #2C3E50; font-size: 16px; text-align: center;">ROI Comparison by Location</h3>
                    <div style="display: flex; justify-content: space-around; margin-bottom: 20px;">
                      <div style="text-align: center;">
                        <div style="font-weight: bold; color: #3498DB;">Hell's Kitchen</div>
                        <div style="font-size: 24px; margin: 5px 0;">28%</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="font-weight: bold; color: #27AE60;">Union Square</div>
                        <div style="font-size: 24px; margin: 5px 0;">26%</div>
                      </div>
                      <div style="text-align: center;">
                        <div style="font-weight: bold; color: #E67E22;">Chelsea</div>
                        <div style="font-size: 24px; margin: 5px 0;">24%</div>
                      </div>
                    </div>
                    <p style="text-align: center; font-size: 14px; color: #7F8C8D;">
                      Hell's Kitchen shows the highest ROI at 28% with a break-even point of 12.8 months.
                    </p>
                  </div>
                `;
                
                chartImageContainer.innerHTML = staticChartHTML;
                sectionContainer.appendChild(chartImageContainer);
              }
            } catch (error) {
              console.error('Error capturing chart:', error);
              // Fallback if chart capture fails - create a simple static representation
              const chartPlaceholder = document.createElement('div');
              chartPlaceholder.style.padding = '20px';
              chartPlaceholder.style.border = '1px solid #008080';
              chartPlaceholder.style.borderRadius = '8px';
              chartPlaceholder.style.textAlign = 'center';
              chartPlaceholder.style.marginTop = '15px';
              chartPlaceholder.style.marginBottom = '15px';
              chartPlaceholder.style.color = '#34495E';
              chartPlaceholder.style.backgroundColor = '#f9f9f9';
              
              const chartTitle = document.createElement('h3');
              chartTitle.textContent = 'ROI Comparison by Location';
              chartTitle.style.marginBottom = '10px';
              chartTitle.style.color = '#2C3E50';
              chartPlaceholder.appendChild(chartTitle);
              
              const chartContent = document.createElement('div');
              chartContent.innerHTML = `
                <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                  <div style="text-align: center;">
                    <div style="font-weight: bold; color: #3498DB;">Hell's Kitchen</div>
                    <div style="font-size: 24px; margin: 5px 0;">28%</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-weight: bold; color: #27AE60;">Union Square</div>
                    <div style="font-size: 24px; margin: 5px 0;">26%</div>
                  </div>
                  <div style="text-align: center;">
                    <div style="font-weight: bold; color: #E67E22;">Chelsea</div>
                    <div style="font-size: 24px; margin: 5px 0;">24%</div>
                  </div>
                </div>
                <div style="margin-top: 10px; font-style: italic; font-size: 14px;">
                  Interactive version available in online report
                </div>
              `;
              chartPlaceholder.appendChild(chartContent);
              sectionContainer.appendChild(chartPlaceholder);
            }
          } else if (section.id !== 'map') {
            // For text content
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = sectionContent[section.id] || '';
            
            // Process styling
            const allElements = contentDiv.querySelectorAll('*');
            allElements.forEach(el => {
              el.removeAttribute('class');
              
              if (el.tagName === 'TABLE') {
                el.style.width = '100%';
                el.style.borderCollapse = 'collapse';
                el.style.marginBottom = '15px';
                el.style.border = '1px solid #e5e7eb';
              } else if (el.tagName === 'TH') {
                el.style.textAlign = 'left';
                el.style.padding = '8px';
                el.style.borderBottom = '2px solid #008080';
                el.style.color = '#2C3E50';
              } else if (el.tagName === 'TD') {
                el.style.padding = '8px';
                el.style.borderBottom = '1px solid #e5e7eb';
                el.style.color = '#34495E';
              } else if (el.tagName === 'H2') {
                el.style.fontSize = '20px';
                el.style.fontWeight = 'bold';
                el.style.marginBottom = '16px';
                el.style.color = '#008080';
              }
            });
            
            sectionContainer.appendChild(contentDiv);
          }
          
          if (sectionContainer.children.length > 0) {
            tempContainer.appendChild(sectionContainer);
          }
        }
        
        document.body.appendChild(tempContainer);
        
        // Configure and generate PDF
        const options = {
          margin: [25, 25, 25, 25],
          filename: `${reportTitle.replace(/\s+/g, '_')}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { 
            scale: 2, 
            useCORS: true,
            logging: false
          },
          jsPDF: { 
            unit: 'mm', 
            format: 'a4', 
            orientation: 'portrait',
            compress: true
          },
          pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
        };
        
        html2pdf()
          .from(tempContainer)
          .set(options)
          .save()
          .then(() => {
            document.body.removeChild(tempContainer);
            setNotificationMessage('PDF downloaded successfully!');
            setShowEmailNotification(true);
          })
          .catch(error => {
            console.error('Error generating PDF:', error);
            document.body.removeChild(tempContainer);
            setNotificationMessage('Error creating PDF. Please try again.');
            setShowEmailNotification(true);
          });
      } catch (error) {
        console.error('Error in PDF generation:', error);
        setNotificationMessage('Error creating PDF. Please try again.');
        setShowEmailNotification(true);
      }
    }, 2000); // Increased delay for chart rendering
  };
  
  // Alternative approach - capture chart to canvas first
  const handleDownloadWithCanvas = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Show notification
    setNotificationMessage('Preparing your PDF...');
    setShowEmailNotification(true);
    
    // First, ensure all charts are rendered
    setTimeout(async () => {
      try {
        // Dynamically import required libraries
        const html2pdfModule = await import('html2pdf.js');
        const html2pdf = html2pdfModule.default;
        
        // Create a document for PDF
        const tempContainer = document.createElement('div');
        tempContainer.style.width = '100%';
        tempContainer.style.padding = '20px';
        tempContainer.style.boxSizing = 'border-box';
        tempContainer.style.fontFamily = 'Arial, sans-serif';
        
        // Add title
        const title = document.createElement('h1');
        title.textContent = reportTitle;
        title.style.fontSize = '24px';
        title.style.fontWeight = 'bold';
        title.style.marginBottom = '20px';
        title.style.color = '#2C3E50';
        tempContainer.appendChild(title);
        
        // Process each section
        for (const section of sections) {
          const sectionContainer = document.createElement('div');
          sectionContainer.style.marginBottom = '30px';
          
          if (section.id === 'chart') {
            // Create heading for chart section
            const heading = document.createElement('h2');
            heading.textContent = 'ROI Analysis';
            heading.style.fontSize = '20px';
            heading.style.fontWeight = 'bold';
            heading.style.marginBottom = '16px';
            heading.style.color = '#008080';
            sectionContainer.appendChild(heading);
            
            // Try to manually create the chart image using canvas
            try {
              // Find ONLY the chart SVG element
              const chartSvg = document.querySelector('.recharts-surface');
              
              if (chartSvg) {
                // Create a canvas element
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas dimensions to be larger for better quality
                canvas.width = chartSvg.width.baseVal.value * 2;
                canvas.height = chartSvg.height.baseVal.value * 2;
                
                // Fill with white background
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Convert SVG to data URL
                const svgData = new XMLSerializer().serializeToString(chartSvg);
                const svg = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
                const url = URL.createObjectURL(svg);
                
                // Create image from SVG
                const img = new Image();
                img.onload = () => {
                  // Draw image to canvas at 2x scale for better quality
                  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                  URL.revokeObjectURL(url);
                  
                  // Create image element from canvas
                  const chartImg = document.createElement('img');
                  chartImg.src = canvas.toDataURL('image/png');
                  chartImg.style.width = '100%';
                  chartImg.style.maxWidth = '100%';
                  chartImg.style.marginTop = '10px';
                  chartImg.style.marginBottom = '10px';
                  
                  sectionContainer.appendChild(chartImg);
                  
                  // Continue with PDF creation
                  tempContainer.appendChild(sectionContainer);
                  continueWithPdf();
                };
                
                img.src = url;
                return; // Early return, will continue in onload handler
              } else {
                throw new Error('Chart SVG not found');
              }
            } catch (error) {
              console.error('Error capturing chart with canvas:', error);
              
              // Fallback to static representation
              const chartPlaceholder = document.createElement('div');
              chartPlaceholder.innerHTML = `
                <div style="padding: 20px; border: 1px solid #008080; border-radius: 8px; text-align: center; background-color: #f9f9f9; margin: 15px 0;">
                  <h3 style="margin-bottom: 10px; color: #2C3E50;">ROI Comparison by Location</h3>
                  <div style="display: flex; justify-content: space-around; margin: 15px 0;">
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #3498DB;">Hell's Kitchen</div>
                      <div style="font-size: 24px; margin: 5px 0;">28%</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #27AE60;">Union Square</div>
                      <div style="font-size: 24px; margin: 5px 0;">26%</div>
                    </div>
                    <div style="text-align: center;">
                      <div style="font-weight: bold; color: #E67E22;">Chelsea</div>
                      <div style="font-size: 24px; margin: 5px 0;">24%</div>
                    </div>
                  </div>
                  <div style="margin-top: 10px; font-style: italic; font-size: 14px;">
                    Interactive version available in online report
                  </div>
                </div>
              `;
              sectionContainer.appendChild(chartPlaceholder);
            }
          } else if (section.id !== 'map') {
            // For text content (same as before)
            const contentDiv = document.createElement('div');
            contentDiv.innerHTML = sectionContent[section.id] || '';
            
            // Process styling
            const allElements = contentDiv.querySelectorAll('*');
            allElements.forEach(el => {
              el.removeAttribute('class');
              
              if (el.tagName === 'TABLE') {
                el.style.width = '100%';
                el.style.borderCollapse = 'collapse';
                el.style.marginBottom = '15px';
                el.style.border = '1px solid #e5e7eb';
              } else if (el.tagName === 'TH') {
                el.style.textAlign = 'left';
                el.style.padding = '8px';
                el.style.borderBottom = '2px solid #008080';
                el.style.color = '#2C3E50';
              } else if (el.tagName === 'TD') {
                el.style.padding = '8px';
                el.style.borderBottom = '1px solid #e5e7eb';
                el.style.color = '#34495E';
              } else if (el.tagName === 'H2') {
                el.style.fontSize = '20px';
                el.style.fontWeight = 'bold';
                el.style.marginBottom = '16px';
                el.style.color = '#008080';
              }
            });
            
            sectionContainer.appendChild(contentDiv);
          }
          
          if (sectionContainer.children.length > 0) {
            tempContainer.appendChild(sectionContainer);
          }
        }
        
        // Define function to continue with PDF generation
        const continueWithPdf = () => {
          document.body.appendChild(tempContainer);
          
          // Configure and generate PDF
          const options = {
            margin: [25, 25, 25, 25],
            filename: `${reportTitle.replace(/\s+/g, '_')}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
              scale: 2, 
              useCORS: true,
              logging: false
            },
            jsPDF: { 
              unit: 'mm', 
              format: 'a4', 
              orientation: 'portrait',
              compress: true
            },
            pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
          };
          
          html2pdf()
            .from(tempContainer)
            .set(options)
            .save()
            .then(() => {
              document.body.removeChild(tempContainer);
              setNotificationMessage('PDF downloaded successfully!');
              setShowEmailNotification(true);
            })
            .catch(error => {
              console.error('Error generating PDF:', error);
              document.body.removeChild(tempContainer);
              setNotificationMessage('Error creating PDF. Please try again.');
              setShowEmailNotification(true);
            });
        };
        
        // If we didn't early return (meaning we're not doing the canvas approach), continue now
        continueWithPdf();
        
      } catch (error) {
        console.error('Error in PDF generation:', error);
        setNotificationMessage('Error creating PDF. Please try again.');
        setShowEmailNotification(true);
      }
    }, 2000); // Increased delay for chart rendering
  };

const handleDownloadFallback = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Show notification
    setNotificationMessage('Preparing your PDF...');
    setShowEmailNotification(true);
    
    try {
      // Create a plain HTML representation of the report
      let reportContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${reportTitle}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              line-height: 1.6; 
              color: #333; 
              margin: 40px; 
            }
            h1 { 
              color: #2C3E50; 
              font-size: 24px; 
              margin-bottom: 20px; 
            }
            h2 { 
              color: #008080; 
              font-size: 20px; 
              margin-top: 30px; 
              margin-bottom: 16px; 
            }
            p { 
              margin-bottom: 16px; 
              color: #34495E; 
            }
            table { 
              width: 100%; 
              border-collapse: collapse; 
              margin-bottom: 20px; 
            }
            th { 
              text-align: left; 
              padding: 8px; 
              border-bottom: 2px solid #008080; 
              color: #2C3E50; 
            }
            td { 
              padding: 8px; 
              border-bottom: 1px solid #ddd; 
              color: #34495E; 
            }
            .chart-placeholder {
              padding: 20px;
              border: 1px solid #008080;
              text-align: center;
              margin: 20px 0;
              color: #34495E;
            }
            ul { 
              margin-bottom: 16px; 
              padding-left: 20px; 
              color: #34495E; 
            }
            li { 
              margin-bottom: 8px; 
            }
          </style>
        </head>
        <body>
          <h1>${reportTitle}</h1>
      `;
      
      // Add content for each section
      sections.forEach(section => {
        // Skip the map section for now as we can't easily render it
        if (section.id !== 'map') {
          if (section.id === 'chart') {
            reportContent += `
              <h2>ROI Analysis</h2>
              <div class="chart-placeholder">[ROI Analysis Chart - Please see online version for interactive visualization]</div>
            `;
          } else {
            // Use the HTML content directly (already has proper tags)
            const content = sectionContent[section.id] || '';
            
            // Simple regex to remove class attributes
            const cleanedContent = content.replace(/class="[^"]*"/g, '');
            
            reportContent += cleanedContent;
          }
        }
      });
      
      // Close HTML
      reportContent += `
        </body>
        </html>
      `;
      
      // Create a Blob from the HTML content
      const blob = new Blob([reportContent], { type: 'text/html' });
      
      // Create a temporary link to download the file
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `${reportTitle.replace(/\s+/g, '_')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setNotificationMessage('Report downloaded as HTML. Please open in your browser and use print-to-PDF for best results.');
      setShowEmailNotification(true);
    } catch (error) {
      console.error('Error creating report:', error);
      setNotificationMessage('Error creating report. Please try again.');
      setShowEmailNotification(true);
    }
  };
  
  // Modified click handler that uses both methods
  const handleDownloadButton = () => {
    try {
      // First try the PDF method
      handleDownload();
      
      // Set a fallback timer - if PDF doesn't download in 5 seconds, try HTML method
      setTimeout(() => {
        const pdfNotification = document.querySelector('.text-\\[\\#008080\\]');
        if (pdfNotification && pdfNotification.textContent.includes('Preparing your PDF')) {
          // PDF is still preparing after 5 seconds, try fallback
          handleDownloadFallback();
        }
      }, 5000);
    } catch (error) {
      console.error('Primary download method failed:', error);
      // If primary method throws an error, use fallback immediately
      handleDownloadFallback();
    }
  };

  const regularPanelContent = (
<div className="flex flex-col h-full overflow-hidden bg-white relative z-10">
<div className="flex flex-1 overflow-hidden">
        {/* Table of contents sidebar - animated with CSS transitions */}
        {sidebarVisible && (
  <div 
    id="sidebar"
    className="border-r overflow-auto"
    style={{ 
      width: '0px', 
      borderColor: '#e5e7eb', 
      backgroundColor: COLORS.white,
      transition: 'width 300ms ease-in-out'
    }}
  >
    {/* Button container - add this at the top */}
    <div className="flex justify-center bg-white">
      <div 
        className="flex px-3 py-2 rounded-full"
        style={{ 
            backgroundColor: COLORS.white,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
            border: `none`,
            borderRadius: '9999px'
        }}
      >
        {isMenuOpen && (
          <div className="flex items-center space-x-1 bg-white rounded-full shadow-md p-2">

            <button 
              onClick={toggleEditMode}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
              data-tooltip={isEditing ? "Save edits" : "Edit report"}
              style={{ 
                color: COLORS.coral, 
                border: 'none',
                backgroundColor: 'COLORS.white',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.coral;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.coral;
              }}
            >
              {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
            </button>

            <button onClick={() => setShowSources(prev => !prev)} className="tooltip-bottom" data-tooltip="View Sources" style={{ 
            color: COLORS.coral,
            backgroundColor: 'white',
            border: 'none',
            transition: 'all 0.2s ease-in-out',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
            <Info size={20} />
          </button>

          <button 
  onClick={() => setShowShareDialog(true)}
  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
  data-tooltip="Share and Download"
  style={{ 
    color: COLORS.coral, 
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Share2 size={20} />
</button>

            <button 
              onClick={toggleSidebar}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
              data-tooltip="Close sidebar"
              style={{ 
                color: COLORS.coral,
                border: 'none',
                backgroundColor: 'COLORS.white',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.coral;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.coral;
              }}
            >
              <Menu size={18} />
            </button>

            <button 
              onClick={toggleFullscreen}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
              data-tooltip="Toggle fullscreen"
              style={{ 
                color: COLORS.coral, 
                border: 'none',
                backgroundColor: 'COLORS.white',
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.coral;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = COLORS.coral;
              }}
            >
              <Maximize2 size={20} />
            </button>
          </div>
        )}
        
      </div>
    </div>

    {/* Keep your existing sidebar content structure */}
    <div className="py-4 px-2 whitespace-nowrap">
      
      
      {/* Content sections with more indentation */}
      <div className="pl-2 mt-2">
        {sections.map((section) => (
          <button
            key={section.id}
            onClick={() => {
              setActiveSection(section.id);
              const element = document.getElementById(section.id);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
              }
            }}
            className="w-full text-left px-4 py-3 text-sm flex items-center mb-2 rounded-full transition-all tooltip-bottom"
            style={{
              backgroundColor: activeSection === section.id ? COLORS.coral : COLORS.white,
              color: activeSection === section.id ? COLORS.white : COLORS.secondary,
              border: 'none',
              boxShadow: activeSection === section.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.backgroundColor = '#f0f0f0';
              }
            }}
            onMouseLeave={(e) => {
              if (activeSection !== section.id) {
                e.currentTarget.style.backgroundColor = 'transparent';
              }
            }}
          >
            <div className="flex justify-between items-center w-full">
              <span>{section.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  </div>
)}
{/* Floating menu button when sidebar is closed */}
{!sidebarVisible && (
  <div 
    className="fixed top-6 right-6 z-30"
    style={{
      top: '8rem',
      right: '2rem'
    }}
  >
    <div 
      className="flex px-3 py-2 rounded-full"
      style={{ 
        backgroundColor: 'transparent',
        boxShadow: 'none)',
      }}
    >
      {isMenuOpen && (
        <div className="flex items-center space-x-1 bg-white rounded-full shadow-md p-2 t">
          <button 
            onClick={toggleEditMode}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
            data-tooltip={isEditing ? "Save edits" : "Edit report"}
            style={{ 
              color: COLORS.coral, 
              border: 'none',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.coral;
            }}
          >
            {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
          </button>

          <button 
  onClick={() => setShowSources(prev => !prev)} 
  className="tooltip-bottom"
  data-tooltip="View Sources"
  style={{ 
    color: COLORS.coral,
    backgroundColor: 'transparent',
    border: 'none',
    transition: 'all 0.2s ease-in-out',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '0.5rem'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Info size={20} />
</button>

<button 
  onClick={() => setShowShareDialog(true)}
  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
  data-tooltip="Share and Download"
  style={{ 
    color: COLORS.coral, 
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Share2 size={20} />
</button>

          <button 
            onClick={toggleSidebar}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
            data-tooltip="Open table of contents"
            style={{ 
              color: COLORS.coral,
              border: 'none',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.coral;
            }}
          >
            <Menu size={18} />
          </button>

          <button 
            onClick={toggleFullscreen}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
            data-tooltip="Toggle fullscreen"
            style={{ 
              color: COLORS.coral, 
              border: 'none',
              backgroundColor: 'transparent',
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = COLORS.coral;
            }}
          >
            <Maximize2 size={20} />
          </button>
        </div>
      )}
      
      {/* Menu toggle button - always rightmost */}
      <button 
        onClick={toggleMenu}
        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
        data-tooltip="Toggle menu"
        style={{ 
          color: COLORS.coral, 
          border: 'none',
          backgroundColor: 'transparent',
          transition: 'all 0.2s ease-in-out'

        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.coral;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'transparent';
          e.currentTarget.style.color = COLORS.coral;
        }}
      >
        {isMenuOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>
    </div>
  </div>
)}
        {/* Main content with added margin/gap from sidebar */}
        <div className="flex-1 overflow-auto pl-4" style={{ backgroundColor: COLORS.white }}>
        <div className="w-full max-w-3xl mx-auto px-4 sm:px-6 py-4 sm:py-6 my-4 bg-white rounded-lg shadow-sm" ref={reportContainerRef}>
        {/* All sections rendered in a single scrollable document */}
        <div 
  className={`text-3xl font-bold mb-10 ${isEditing ? 'border-b-2 pb-2' : ''}`}
  style={{ 
    color: COLORS.primary,
    borderColor: isEditing ? COLORS.coral : 'transparent',
    outline: 'none',
    textAlign: 'center' // optional: if you want it centered
  }}
  contentEditable={isEditing}
  suppressContentEditableWarning={true}
  onBlur={handleTitleChange}
>
  {reportTitle}
</div>
            {sections.map((section) => (
              <div 
                key={section.id}
                id={section.id}
                ref={el => sectionRefs.current[section.id] = el}
                className="mb-12"
              >

    {section.id === 'map' ? (
<div className="w-full h-[400px] sm:h-[500px] md:h-[600px] my-6 rounded-lg overflow-hidden">
        <SimpleNYCChart onLayersReady={onLayersReady} />
      </div>
    ) : section.id === 'chart' ? (
<div className="w-full my-6 chart-container" ref={chartRef}>
<ROIAnalysisDashboard onLayersReady={onLayersReady} />
      </div>
    ) : isEditing ? (
      <div 
        className="prose prose-sm max-w-none p-3 rounded-md"
        style={{ backgroundColor: '#f8f9fa', border: `1px solid ${COLORS.coral}30`, minHeight: '150px', outline: 'none' }}
        contentEditable={true}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={createMarkup(sectionContent[section.id] || '')}
        onBlur={(e) => handleContentChange(section.id, e)}
      />
    ) : (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={createMarkup(sectionContent[section.id] || '')}
      />
    )}



                
                
              </div>
            ))}
          </div>
        </div>
      </div>
      
      
      
    </div>
  );
  const fullscreenPanelContent = (
<div className="fixed inset-0 z-50 mt-10 bg-white backdrop-blur-sm flex flex-col">

      <div className="flex-1 flex flex-col bg-white h-screen overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          {/* Floating menu button when sidebar is closed */}
          {!sidebarVisible && (
            <div 
              className="fixed z-50"
              style={{
                top: '1rem',
                right: '2rem'
              }}
            >
              <div 
                className="flex px-3 py-2 rounded-full"
                style={{ 
                  backgroundColor: 'transparent',
                  boxShadow: 'none)',
                  border: `none`,
                }}
              >
                {/* Other buttons - only visible when menu is open */}
                {isMenuOpen && (
                  <div className="flex items-center space-x-1 bg-white rounded-full shadow-md p-2">

                    {/* Edit/Save button */}
                    <button 
                      onClick={toggleEditMode}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
                      data-tooltip={isEditing ? "Save edits" : "Edit report"}
                      style={{ 
                        color: COLORS.coral, 
                        border: 'none',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.coral;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.coral;
                      }}
                    >
                      {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                    </button>
                    <button 
  onClick={() => setShowSources(prev => !prev)} 
  className="tooltip-bottom"
  data-tooltip="View Sources"
  style={{ 
    color: COLORS.coral,
    backgroundColor: 'transparent',
    border: 'none',
    transition: 'all 0.2s ease-in-out',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '0.5rem'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Info size={20} />
</button>

  
<button 
  onClick={() => setShowShareDialog(true)}
  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
  data-tooltip="Share and Download"
  style={{ 
    color: COLORS.coral, 
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Share2 size={20} />
</button>
                    
                    {/* TOC toggle button */}
                    <button 
                      onClick={toggleSidebar}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
                      data-tooltip="Open table of contents"
                      style={{ 
                        color: COLORS.coral,
                        border: 'none',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.coral;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.coral;
                      }}
                    >
                      <Menu size={18} />
                    </button>
  
                    {/* Exit fullscreen button */}
                    <button 
                      onClick={toggleFullscreen}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2 tooltip-bottom"
                      data-tooltip="Exit fullscreen"
                      style={{ 
                        color: COLORS.coral, 
                        border: 'none',
                        backgroundColor: 'transparent',
                        transition: 'all 0.2s ease-in-out'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = COLORS.coral;
                        e.currentTarget.style.color = 'white';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = COLORS.coral;
                      }}
                    >
                      <Minimize2 size={20} />
                    </button>
                  </div>
                )}
                
                {/* Menu toggle button - always visible and rightmost */}
                <button 
                  onClick={toggleMenu}
                  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
                  data-tooltip="Toggle menu"
                  style={{ 
                    color: COLORS.coral, 
                    border: 'none',
                    backgroundColor: 'transparent',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = COLORS.coral;
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.color = COLORS.coral;
                  }}
                >
                  {isMenuOpen ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                </button>
              </div>
            </div>
          )}
          
          {/* Table of contents sidebar with animation for fullscreen mode */}
          {sidebarVisible && (
            <div 
              id="fullscreen-sidebar"
              className="border-r overflow-auto" 
              style={{ 
                width: '0px', 
                border: `none`,
                borderColor: '#e5e7eb', 
                backgroundColor: COLORS.white,
                transition: 'width 300ms ease-in-out' 
              }}
            >
              {/* Button container - add this at the top */}
              <div className="py-3 flex justify-center">
                <div 
                  className="flex px-3 py-2 rounded-full"
                  style={{ 
                    backgroundColor: COLORS.white,
  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
  border: `none`,
  borderRadius: '9999px'
                  }}
                >
                  {isMenuOpen && (
                    <div className="flex items-center space-x-1 bg-white rounded-full shadow-md p-2">

                      <button 
                        onClick={toggleEditMode}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
                        data-tooltip={isEditing ? "Save edits" : "Edit report"}
                        style={{ 
                          color: COLORS.coral, 
                          border: 'none',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.coral;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.coral;
                        }}
                      >
                        {isEditing ? <Save size={20} /> : <Edit2 size={20} />}
                      </button>
  
                      <button 
  onClick={() => setShowSources(prev => !prev)} 
  className="tooltip-bottom"
  data-tooltip="View Sources"
  style={{ 
    color: COLORS.coral,
    backgroundColor: 'transparent',
    border: 'none',
    transition: 'all 0.2s ease-in-out',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: '0.5rem'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Info size={20} />
</button>

  
<button 
  onClick={() => setShowShareDialog(true)}
  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
  data-tooltip="Share and Download"
  style={{ 
    color: COLORS.coral, 
    border: 'none',
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease-in-out'
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Share2 size={20} />
</button>
  
                      <button 
                        onClick={toggleSidebar}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
                        data-tooltip="Close sidebar"
                        style={{ 
                          color: COLORS.coral,
                          border: 'none',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.coral;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.coral;
                        }}
                      >
                        <Menu size={18} />
                      </button>
  
                      <button 
                        onClick={toggleFullscreen}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow tooltip-bottom"
                        data-tooltip="Exit fullscreen"
                        style={{ 
                          color: COLORS.coral, 
                          border: 'none',
                          backgroundColor: 'transparent',
                          transition: 'all 0.2s ease-in-out'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = COLORS.coral;
                          e.currentTarget.style.color = 'white';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = COLORS.coral;
                        }}
                      >
                        <Minimize2 size={20} />
                      </button>
                    </div>
                  )}
                  
                </div>
              </div>
  
              {/* Sidebar content */}
              <div className="py-4 px-2 whitespace-nowrap">
              
              
              {/* Content sections with more indentation */}
              <div className="pl-2 mt-2">
                {sections.map((section) => (
                  <button
                    key={section.id}
                    onClick={() => {
                      // Use the fullscreen section ID format for active section
                      const fullscreenId = `fullscreen-${section.id}`;
                      setActiveSection(fullscreenId);
                      const element = document.getElementById(fullscreenId);
                      if (element) {
                        element.scrollIntoView({ behavior: 'smooth' });
                      }
                    }}
                    className="w-full text-left px-4 py-3 text-sm flex items-center mb-2 rounded-full transition-all"
                    style={{
                      backgroundColor: activeSection === `fullscreen-${section.id}` ? COLORS.coral : COLORS.white,
                      color: activeSection === `fullscreen-${section.id}` ? COLORS.white : COLORS.secondary,
                      border: 'none',
                      boxShadow: activeSection === section.id ? '0 2px 4px rgba(0,0,0,0.1)' : 'none',
                      transition: 'all 0.2s ease-in-out'
                    }}
                    onMouseEnter={(e) => {
                      if (activeSection !== `fullscreen-${section.id}`) {
                        e.currentTarget.style.backgroundColor = '#f0f0f0';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (activeSection !== `fullscreen-${section.id}`) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    <div className="flex justify-between items-center w-full">
                      <span>{section.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Main content with added margin/gap from sidebar */}
        <div className="flex-1 overflow-auto pl-4" style={{ backgroundColor: COLORS.white,               marginTop: artifacts.length > 0 && !showArtifactGallery ? '60px' : '0' }}>
          <div className="max-w-4xl mx-auto p-8 bg-white my-6 rounded-lg shadow-sm" ref={reportContainerRef}>
            
<div 
  className={`text-3xl font-bold mb-10 ${isEditing ? 'border-b-2 pb-2' : ''}`}
  style={{ 
    color: COLORS.primary,
    borderColor: isEditing ? COLORS.coral : 'transparent',
    outline: 'none',
    textAlign: 'center' // optional: if you want it centered
  }}
  contentEditable={isEditing}
  suppressContentEditableWarning={true}
  onBlur={handleTitleChange}
>
  {reportTitle}
</div>

            {sections.map((section) => (
              <div 
                key={`fullscreen-${section.id}`}
                id={`fullscreen-${section.id}`}
                ref={el => sectionRefs.current[`fullscreen-${section.id}`] = el}
                className="mb-16"
              >
               

{section.id === 'map' ? (
      <div className="w-full h-[600px] my-6 rounded-lg overflow-hidden">
        <SimpleNYCChart onLayersReady={onLayersReady} />
      </div>
    ) : section.id === 'chart' ? (
      <div className="w-full my-6">
        <ROIAnalysisDashboard onLayersReady={onLayersReady} />
      </div>
    ) : isEditing ? (
      <div 
        className="prose prose-sm max-w-none p-3 rounded-md"
        style={{ backgroundColor: '#f8f9fa', border: `1px solid ${COLORS.coral}30`, minHeight: '150px', outline: 'none' }}
        contentEditable={true}
        suppressContentEditableWarning={true}
        dangerouslySetInnerHTML={createMarkup(sectionContent[section.id] || '')}
        onBlur={(e) => handleContentChange(section.id, e)}
      />
    ) : (
      <div 
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={createMarkup(sectionContent[section.id] || '')}
      />
    )}


           
                
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>

    
  </div>
);

return (
    <>
      {isFullscreen ? fullscreenPanelContent : regularPanelContent}
      {showReportDownloadDialog && (
  <div className="absolute bottom-[10px] right-6 z-[1000]">
    <div className="bg-white w-[320px] rounded-xl shadow-2xl p-6 border border-gray-200 relative">
      <button
        onClick={() => setShowReportDownloadDialog(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Download Report</h2>

      <div className="space-y-4">
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-800 mb-2">📄 Resilience Report</div>
          <div className="flex space-x-2">
            <input
              type="text"
              className="border px-3 py-1 rounded w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
              value={reportDownloadSelections['report']?.filename || 'report_analysis'}
              onChange={(e) =>
                setReportDownloadSelections(prev => ({
                  ...prev,
                  report: {
                    filename: e.target.value,
                    format: prev['report']?.format || '.pdf'
                  }
                }))
              }
            />
            <select
              value={reportDownloadSelections['report']?.format || '.pdf'}
              onChange={(e) =>
                setReportDownloadSelections(prev => ({
                  ...prev,
                  report: {
                    filename: prev['report']?.filename || 'report_analysis',
                    format: e.target.value
                  }
                }))
              }
              className="border px-2 py-1 rounded text-sm focus:outline-none"
            >
              <option value=".pdf">.pdf</option>
              <option value=".docx">.docx</option>
            </select>
          </div>
        </div>
      </div>

      <button
        onClick={handleDownloadWithDomToImage}
        className="mt-6 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
      >
        Download Report
      </button>
    </div>
  </div>
)}

{showShareDialog && (
  <div className="absolute bottom-[10px] right-6 z-[1000]">
    <div className="bg-white w-[340px] rounded-2xl shadow-2xl p-6 border border-gray-200 relative animate-fade-in">
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        onClick={() => setShowShareDialog(false)}
      >
        <X size={16} />
      </button>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Share This Report</h2>

      {/* Teammate Search */}
      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">Search Teammate</label>
        <input
          type="text"
          placeholder="Type a name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Teammate List */}
      <div className="max-h-40 overflow-y-auto mb-4 space-y-1 pr-1">
        {filteredTeammates.map(teammate => (
          <div
            key={teammate}
            onClick={() => setSelectedTeammate(teammate)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition border 
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
              <span className="text-xs font-medium text-[#008080]">✓</span>
            )}
          </div>
        ))}
        {filteredTeammates.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-3">No teammates found</div>
        )}
      </div>

      {/* Share Button */}
      <button
        disabled={!selectedTeammate}
        onClick={handleShareReport}
        className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200 mb-2
          ${selectedTeammate 
            ? 'bg-[#008080] text-white hover:bg-teal-700' 
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
        `}
      >
        Share Report
      </button>

      {/* Divider */}
      <div className="border-t border-gray-200 my-4" />

      {/* Download Section */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Download This Report</h3>

      <div className="space-y-3">
        <div className="flex space-x-2">
          <input
            type="text"
            className="border px-3 py-2 rounded-lg w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
            value={reportDownloadSelections['report']?.filename || 'coffee_shop_report'}
            onChange={(e) =>
              setReportDownloadSelections(prev => ({
                ...prev,
                report: {
                  filename: e.target.value,
                  format: prev['report']?.format || '.pdf'
                }
              }))
            }
            placeholder="File name"
          />
          <select
            value={reportDownloadSelections['report']?.format || '.pdf'}
            onChange={(e) =>
              setReportDownloadSelections(prev => ({
                ...prev,
                report: {
                  filename: prev['report']?.filename || 'coffee_shop_report',
                  format: e.target.value
                }
              }))
            }
            className="border px-2 py-2 rounded-lg text-sm focus:outline-none"
          >
            <option value=".pdf">.pdf</option>
            <option value=".docx">.docx</option>
          </select>
        </div>

        <button
          onClick={handleDownloadWithDomToImage}
          className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
        >
          Download Report
        </button>
      </div>
    </div>
  </div>
)}

{showEmailNotification && (
  <div
    className={`fixed top-6 right-6 z-[9999] transition-all duration-300 ${
      slideOut ? 'animate-slide-out' : 'animate-slide-in'
    }`}
  >
    <div className="bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
      {notificationMessage}
    </div>
  </div>
)}


      {showSources && (
    <div ref={infoRef}className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-[1000000]" style={{top:'100px'}}>
      <div className="space-y-2 text-sm text-gray-700">
        <div>
          <a
            href="https://data.austintexas.gov/City-Infrastructure/Strategic-Measure_Infrastructure-Condition_Network/5sh6-vxv8/about_data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Infrastructure Charts
          </a>
        </div>
        <div>
          <a
            href="https://data.austintexas.gov/City-Infrastructure/Strategic-Measure_Street-Segment-Condition-Data/pcwe-pwxe/about_data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Street Condition
          </a>
        </div>
        <div>
          <span className="font-medium">Building Condition Data:</span>{' '}
          <a>
            Building Condition data(contains building footprints, maintenance details, conditions, and year built)
          </a>
        </div>
        <div>
          <a
            href="https://data.austintexas.gov/Locations-and-Maps/Neighborhoods/a7ap-j2yt/about_data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Neighborhoods
          </a>
        </div>
        <div>
          <a
            href="https://data.austintexas.gov/stories/s/Austin-Demographic-Data-Hub/3wck-mabg/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Demographic
          </a>
        </div>
        <div>
          <a
            href="https://docs.google.com/document/d/1P8aDfU6qj_Ao7Ql3v8YJ9dkq0vqDJ8cTk_Y3GMkMOUM/edit?tab=t.0#heading=h.p2fewxb06id2"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Vancouver Office of Resilience 2023, A path to create a Resilience Hub Network in Vancouver
          </a>
        </div>
        <div>
          <a
            href="https://www.austintexas.gov/sites/default/files/files/Sustainability/Climate%20Equity%20Plan/Climate%20Equity%20Plan%20Full%20Document__FINAL.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Vancouver Climate Equity Plan
          </a>
        </div>
        <div>
          <a
            href="https://www.opengovpartnership.org/documents/inception-report-action-plan-austin-united-states-2024-2028/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Inception Report – Action plan – Vancouver2024 – 2028
          </a>
        </div>
        <div>
          <a
            href="https://services.austintexas.gov/edims/document.cfm?id=254319"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Flood Mitigation Task Force-Final Report to Vancouver City Council Codes
          </a>
        </div>
        <div>
          <a
            href="https://data.austintexas.gov/d/q3y3-ungd"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Zoning
          </a>
        </div>
        <div>
          <a
            href="https://data.austintexas.gov/d/4etb-jk4d"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Land use
          </a>
        </div>
      </div>
    </div>
  )}
  
    </>
  );
};

export default CoffeeShopReport;