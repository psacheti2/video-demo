import React, { useRef, useState, useEffect, useMemo } from 'react';
import html2canvas from 'html2canvas';
import domtoimage from 'dom-to-image';
import { ChevronLeft, ChevronRight, Maximize2, Download, Edit2, Save, Menu, Minimize2, Info, X, Share2 } from "lucide-react";
import '../../app/globals.css';
import IndexMap from './IndexMap';
import VancouverPriorityDashboard from './BudgetDashboard';
import VancouverBCAChart from './BenefitCostAnalysisDashboard';
import { useNotificationStore } from '@/store/NotificationsStore';
import BarChartComponent from './BarChartComponent';

const DataCenterReport = ({ onLayersReady, reportName = "Greater Madrid Data Center Site Selection: Infrastructure Assessment & Location Optimization Analysis"
, artifacts = [],
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
  { id: 'methodology', name: 'Analysis Methodology' },
  { id: 'locations', name: 'Location Overview' },
  { id: 'chart', name: 'Weighted Scoring Analysis' },
  { id: 'map', name: 'Site Locations' },
  { id: 'locationa', name: 'San Fernando: Detailed Profile' },
  { id: 'locationb', name: 'Valdebebas: Detailed Profile' },
  { id: 'locationc', name: 'Las Rozas: Detailed Profile' },
  { id: 'infrastructure', name: 'Power & Connectivity Assessment' },
  { id: 'environmental', name: 'Environmental & Regulatory Analysis' },
  { id: 'economic', name: 'Economic Analysis' },
  { id: 'implementation', name: 'Implementation Timeline' },
  { id: 'conclusion', name: 'Conclusion & Recommendations' },
  { id: 'sources', name: 'Sources & References' }
];

// Updated sample content
const sampleContent = {
  executive: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Executive Summary</h2>
    <p class="mb-4" style="color: #34495E;">
      This report analyzes five potential data center locations in Greater Madrid, evaluating each site against critical infrastructure, environmental, regulatory, and economic parameters for a 50MW facility requirement. After comprehensive weighted analysis, <strong>San Fernando de Henares Industrial Park</strong> emerges as the optimal choice with a score of 8.7/10, offering excellent power capacity (85MW available), dual fiber connectivity, streamlined regulatory approval (6-month timeline), and competitive land costs.
    </p>
    <p class="mb-4" style="color: #34495E;">
      Valdebebas Extension ranks second (8.0/10) with good infrastructure despite environmental considerations. Las Rozas NTT Madrid 1 follows (7.2/10) with superior connectivity but power constraints. Alcobendas – Equinix MD2 (6.7/10) offers moderate capabilities while Alcalá de Henares – Punto Com Park (5.2/10) faces significant zoning and regulatory challenges. The weighted scoring model prioritized infrastructure (40%) and regulatory factors (30%) as requested.
    </p>
`,
  intro: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Introduction</h2>
    <p class="mb-4" style="color: #34495E;">
      The Greater Madrid region presents significant opportunities for data center development, driven by Spain's growing digital economy, strategic location for European connectivity, and supportive government policies for digital infrastructure. This analysis evaluates five client-specified locations for a new 50MW data center facility, focusing on the critical success factors that will determine operational viability and long-term profitability.
    </p>
    <p class="mb-4" style="color: #34495E;">
      The selection process prioritizes power infrastructure reliability, connectivity redundancy, environmental resilience, and regulatory efficiency. Each location has been assessed against standardized criteria to provide data-driven recommendations for optimal site selection within the competitive Madrid market.
    </p>
  `,
  methodology: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Analysis Methodology</h2>
    <p class="mb-4" style="color: #34495E;">Our site evaluation incorporated multiple assessment frameworks:</p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Power Infrastructure Analysis:</strong> Grid capacity assessment, substation proximity, redundancy options, and utility reliability data</li>
      <li><strong>Connectivity Evaluation:</strong> Fiber route density, carrier diversity, latency measurements, and internet exchange proximity</li>
      <li><strong>Environmental Risk Assessment:</strong> Wildfire zones, flood mapping, seismic activity, extreme weather patterns, and water availability</li>
      <li><strong>Regulatory Review:</strong> Zoning compliance, permitting timelines, environmental approvals, and local government policies</li>
      <li><strong>Economic Analysis:</strong> Land acquisition costs, construction estimates, tax incentives, and operational expense projections</li>
    </ul>
    <p style="color: #34495E;">
      The weighted scoring model applies: Infrastructure (40%), Regulatory (30%), Environmental (20%), and Economic (10%) weightings to reflect operational priorities.
    </p>
  `,
  locations: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Las Rozas NTT Madrid 1omparison Overview</h2>
    <div class="overflow-x-auto mb-6">
      <table class="w-full border-collapse">
        <thead>
          <tr>
            <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;"></th>
            <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">San Fernando Industrial Park</th>
            <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Valdebebas Extension</th>
            <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Las Rozas NTT Madrid 1</th>
          </tr>
        </thead>
        <tbody style="color: #34495E;">
          <tr class="border-b border-gray-200">
            <td class="p-2 font-medium">Overall Score</td>
            <td class="p-2">8.7/10 (highest)</td>
            <td class="p-2">8.0/10</td>
            <td class="p-2">7.2/10</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="p-2 font-medium">Power Capacity</td>
            <td class="p-2">85MW available</td>
            <td class="p-2">70MW available</td>
            <td class="p-2">30MW max (constraint)</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="p-2 font-medium">Connectivity</td>
            <td class="p-2">Dual fiber routes</td>
            <td class="p-2">Good fiber access</td>
            <td class="p-2">Superior (multiple carriers)</td>
          </tr>
          <tr class="border-b border-gray-200">
            <td class="p-2 font-medium">Permit Timeline</td>
            <td class="p-2">6 months (streamlined)</td>
            <td class="p-2">9-12 months</td>
            <td class="p-2">8-10 months</td>
          </tr>
          <tr>
            <td class="p-2 font-medium">Environmental Risk</td>
            <td class="p-2">Low-moderate</td>
            <td class="p-2">Moderate-high</td>
            <td class="p-2">Moderate</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
  locationa: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">San Fernando de Henares Industrial Park: Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      San Fernando de Henares Industrial Park represents the optimal balance of infrastructure capacity, regulatory efficiency, and operational resilience:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Power Infrastructure:</strong> 85MW grid capacity with dedicated substation 1.2km away, dual utility feeds, and 99.9% historical reliability</li>
      <li><strong>Connectivity:</strong> Direct access to two major fiber routes, 4ms latency to Madrid city center, proximity to DE-CIX Madrid internet exchange</li>
      <li><strong>Environmental Factors:</strong> Low wildfire risk zone, minimal flood exposure, adequate water supply from municipal sources</li>
      <li><strong>Regulatory Status:</strong> Pre-approved industrial zoning, streamlined permitting process, strong local government support</li>
      <li><strong>Economic Advantage:</strong> Competitive land costs at €120/m², available tax incentives for digital infrastructure projects</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      San Fernando de Henares Industrial Park's comprehensive infrastructure capabilities and regulatory advantages make it the preferred choice for immediate development and long-term operational stability.
    </p>
  `,
  locationb: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Valdebebas Extension: Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      Valdebebas Extension offers strong infrastructure capabilities but requires careful environmental risk management:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Power Infrastructure:</strong> 70MW available capacity, reliable grid connection with backup options, substation 2.1km distance</li>
      <li><strong>Connectivity:</strong> Good fiber access with three carrier options, 6ms latency to city center, expanding network infrastructure</li>
      <li><strong>Environmental Considerations:</strong> Moderate wildfire risk requiring enhanced fire suppression systems, adequate water availability</li>
      <li><strong>Regulatory Framework:</strong> Standard industrial zoning, 9-12 month permitting timeline, moderate local government engagement</li>
      <li><strong>Economic Position:</strong> Lower land acquisition costs at €95/m², potential for negotiated utility rates</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Valdebebas Extension presents a viable alternative with cost advantages, though environmental mitigation measures would require additional capital investment.
    </p>
  `,
  locationc: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Las Rozas de Madrid – NTT Madrid 1: Detailed Profile</h2>
    <p class="mb-4" style="color: #34495E;">
      Las Rozas NTT Madrid 1 excels in connectivity infrastructure but faces power capacity limitations for large-scale deployment:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Power Constraints:</strong> Limited to 30MW maximum capacity, requiring potential grid upgrades for expansion beyond initial phase</li>
      <li><strong>Superior Connectivity:</strong> Multiple carrier presence, direct fiber routes to major European hubs, 3ms latency to Madrid core</li>
      <li><strong>Environmental Profile:</strong> Moderate risk factors, stable water supply, minimal seismic concerns</li>
      <li><strong>Regulatory Environment:</strong> Favorable zoning status, 8-10 month approval process, established data center precedent</li>
      <li><strong>Economic Factors:</strong> Premium land costs at €180/m² offset by excellent connectivity value proposition</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      Las Rozas NTT Madrid 1 would be ideal for connectivity-focused operations but may require phased development approach due to power limitations.
    </p>
  `,
infrastructure: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Power & Connectivity Assessment</h2>
    <p class="mb-4" style="color: #34495E;">
      Power infrastructure analysis reveals significant capacity variations across sites, with connectivity generally strong throughout the region:
    </p>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Power Infrastructure Summary</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>San Fernando Industrial Park:</strong> 85MW capacity with dedicated substation access and dual utility feeds ensuring 99.9% uptime</li>
        <li><strong>Valdebebas Extension:</strong> 70MW available capacity with reliable grid connection and backup power options</li>
        <li><strong>Las Rozas NTT Madrid 1:</strong> 30MW maximum capacity limitation requiring future grid investment for expansion</li>
        <li><strong>Alcalá de Henares – Punto Com Park:</strong> 45MW capacity but aging infrastructure requiring modernization</li>
        <li><strong>Alcobendas – Equinix MD2:</strong> 60MW capacity with standard utility connections and moderate reliability</li>
      </ul>
    </div>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Connectivity Infrastructure</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>Fiber Route Density:</strong> All locations have access to major carrier networks with varying levels of redundancy</li>
        <li><strong>Latency Performance:</strong> Range from 3ms (Las Rozas NTT Madrid 1) to 8ms (Alcalá de Henares – Punto Com Park) to Madrid city center</li>
        <li><strong>Carrier Diversity:</strong> San Fernando de Henares Industrial Park and Las Rozas de Madrid offer the highest carrier diversity with 4+ options each</li>
      </ul>
    </div>
  `,
  environmental: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Environmental & Regulatory Analysis</h2>
    <p class="mb-4" style="color: #34495E;">
      Environmental risk assessment reveals varying exposure levels across sites, with regulatory frameworks generally favorable but differing in complexity:
    </p>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Environmental Risk Factors</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>Wildfire Risk:</strong> High across all sites with San Fernando de Henares Industrial Park showing lowest exposure due to defensible space</li>
        <li><strong>Water Scarcity:</strong> Moderate to high risk region-wide, with municipal supply agreements critical</li>
        <li><strong>Extreme Heat:</strong> All locations face increasing temperature challenges requiring enhanced cooling strategies</li>
        <li><strong>Flood Risk:</strong> Medium exposure with Las Rozas NTT Madrid 1 showing best drainage infrastructure</li>
      </ul>
    </div>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Regulatory Environment</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>San Fernando Industrial Park:</strong> Industrial zoning approved, 6-month streamlined permitting process</li>
        <li><strong>Alcalá de Henares:</strong> Significant zoning restrictions requiring 18-month approval timeline</li>
        <li><strong>Others:</strong> Standard 8-12 month permitting processes with moderate complexity</li>
      </ul>
    </div>
  `,
  economic: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Economic Analysis</h2>
    <p class="mb-4" style="color: #34495E;">
      Economic evaluation reveals significant cost variations driven by land prices, infrastructure requirements, and regulatory timelines:
    </p>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Land Acquisition Costs</h3>
      <ul class="list-disc pl-5" style="color: #34495E;">
        <li><strong>San Fernando Industrial Park:</strong> €120/m² - competitive pricing for excellent infrastructure access</li>
        <li><strong>Valdebebas Extension:</strong> €95/m² - lowest acquisition cost but requires environmental mitigation investment</li>
        <li><strong>Las Rozas NTT Madrid 1:</strong> €180/m² - premium pricing justified by superior connectivity</li>
        <li><strong>Alcalá de Henares:</strong> €110/m² - moderate cost offset by regulatory delays and infrastructure needs</li>
        <li><strong>Alcobendas Equinix MD2:</strong> €135/m² - mid-range pricing with balanced infrastructure capabilities</li>
      </ul>
    </div>
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Total Cost of Ownership</h3>
      <p style="color: #34495E;">
        When factoring construction costs, utility connections, regulatory compliance, and operational expenses, San Fernando de Henares Industrial Park provides the best economic value despite moderate land costs due to infrastructure readiness and regulatory efficiency.
      </p>
    </div>
  `,
  implementation: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Implementation Timeline</h2>
    <div class="mb-4" style="color: #34495E;">
      <p class="mb-2">Recommended phased approach for San Fernando de Henares Industrial Park deployment:</p>
      <ul class="list-disc pl-5">
        <li><strong>Months 1-3:</strong> Land acquisition, environmental impact assessment, detailed engineering design</li>
        <li><strong>Months 4-6:</strong> Permit submission and approval process, utility coordination, contractor selection</li>
        <li><strong>Months 7-18:</strong> Site preparation, construction of Phase 1 (25MW), power infrastructure installation</li>
        <li><strong>Months 19-21:</strong> Equipment installation, testing, and commissioning of initial capacity</li>
        <li><strong>Months 22-24:</strong> Phase 2 expansion planning and permitting for additional 25MW capacity</li>
        <li><strong>Months 25-30:</strong> Phase 2 construction and full 50MW facility operational</li>
      </ul>
    </div>
    <p class="mb-4" style="color: #34495E;">
      Critical path items include power utility coordination and environmental compliance, with contingency planning for potential permitting delays.
    </p>
  `,
  conclusion: `
    <h2 class="text-xl font-bold mb-4" style="color: #008080;">Conclusion & Recommendations</h2>
    <p class="mb-4" style="color: #34495E;">
      Based on comprehensive weighted analysis prioritizing infrastructure and regulatory factors, we recommend:
    </p>
    <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
      <li><strong>Primary Recommendation:</strong> Proceed with San Fernando de Henares Industrial Park for optimal balance of power capacity, connectivity, and regulatory efficiency</li>
      <li><strong>Secondary Option:</strong> Valdebebas New Urban Extension offers cost advantages but requires enhanced environmental risk mitigation strategies</li>
      <li><strong>Connectivity-Focused Alternative:</strong> Las Rozas NTT Madrid 1 for scenarios prioritizing maximum carrier diversity over power capacity</li>
      <li><strong>Risk Mitigation:</strong> Implement comprehensive environmental monitoring and cooling redundancy across all sites</li>
      <li><strong>Expansion Strategy:</strong> Reserve adjacent parcels at San Fernando de Henares Industrial Park for future capacity scaling beyond initial 50MW requirement</li>
    </ul>
    <p class="mb-4" style="color: #34495E;">
      San Fernando de Henares Industrial Park's superior infrastructure readiness, streamlined regulatory pathway, and balanced cost structure provide the foundation for successful data center operations in the competitive Madrid market.
    </p>
  `,
  sources: `
    <h2 class="text-m font-bold mb-4" style="color: #008080;">Sources & References</h2>
    <div style="font-size: 11px; color: #34495E;">
      <ul class="list-disc pl-5 mb-4">
        <li><a href="https://www.red electrica.es/en/grid/grid-structure" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Red Eléctrica de España - Grid Infrastructure Data</a></li>
        <li><a href="https://www.cnmc.es/en" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Spanish National Commission of Markets and Competition</a></li>
        <li><a href="https://www.miteco.gob.es/en" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Ministry for Ecological Transition and Demographic Challenge</a></li>
        <li><a href="https://www.comunidad.madrid/en" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">Community of Madrid Regional Government</a></li>
        <li><a href="https://www.espon.eu/" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">European Spatial Planning Observation Network (ESPON)</a></li>
        <li><a href="https://www.de-cix.net/en/locations/madrid" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">DE-CIX Madrid Internet Exchange</a></li>
        <li><a href="https://www.aemet.es/en" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:text-blue-800 underline">State Meteorological Agency (AEMET) - Climate Data</a></li>
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
    <IndexMap onLayersReady={onLayersReady} hideLoadingBar={true} />
  </div>
    ) : section.id === 'chart' ? (
<div className="w-full my-6 chart-container" ref={chartRef}>
<BarChartComponent onLayersReady={onLayersReady} />
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
  <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] my-6 rounded-lg overflow-hidden">
    <IndexMap onLayersReady={onLayersReady} hideLoadingBar={true} />
  </div>
    ) : section.id === 'chart' ? (
      <div className="w-full my-6">
        <BarChartComponent onLayersReady={onLayersReady} />
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

export default DataCenterReport;