import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Download, Edit2, Save, Menu, Minimize2, Info, X } from "lucide-react";
import '../../app/globals.css';
import VancouverFloodInfraMap from './InfrastructureFloodMap';
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

  // Theme colors
  const COLORS = {
    primary: '#2C3E50',
    secondary: '#34495E',
    neutral: '#F5F5F5',
    white: '#FFFFFF',
    coral: '#008080',
    cta: '#FF5747'
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
    { id: 'hellskitchen', name: 'Hell\'s Kitchen Detailed Profile' },
    { id: 'unionsquare', name: 'Union Square Detailed Profile' },
    { id: 'chelsea', name: 'Chelsea Detailed Profile' },
    { id: 'financial', name: 'Financial Projections' },
    { id: 'implementation', name: 'Implementation Timeline' },
    { id: 'conclusion', name: 'Conclusion & Recommendations' }
  ];
  
  const sampleContent = {
    executive: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Executive Summary</h2>
      <p class="mb-4" style="color: #34495E;">
        This report analyzes three prime locations for a new specialty coffee shop venture within a 3-mile radius of Times Square, with an initial investment budget of $200,000. After thorough market research and financial modeling, <strong>Hell's Kitchen</strong> emerges as the optimal location with a projected 28% ROI and break-even point of under 13 months, followed by Union Square (26% ROI) and Chelsea (24% ROI).
      </p>
      <p class="mb-4" style="color: #34495E;">
        The Hell's Kitchen location benefits from strong foot traffic, lower rental costs compared to other midtown-adjacent neighborhoods, favorable demographics, and a relative undersaturation of specialty coffee options. The financial model accounts for setup costs, operating expenses, and projected revenue growth based on comparable businesses in similar urban markets.
      </p>
    `,
    intro: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Introduction</h2>
      <p class="mb-4" style="color: #34495E;">
        The specialty coffee market in New York City continues to expand despite high market saturation, with consumers increasingly seeking quality experiences, sustainable practices, and unique cafe environments. This report evaluates optimal locations for establishing a new coffee shop venture within 3 miles of Times Square, with a focus on areas that balance foot traffic, competitive landscape, demographic fit, and financial viability.
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
        <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Hell's Kitchen</th>
        <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Union Square</th>
        <th class="text-left p-2 border-b-2" style="color: #2C3E50; border-color: #008080;">Chelsea</th>
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
        <td class="p-2">$75-200/sq ft (most affordable)</td>
        <td class="p-2">$150-400/sq ft</td>
        <td class="p-2">$100-350/sq ft</td>
      </tr>
      <tr class="border-b border-gray-200">
        <td class="p-2 font-medium">Foot Traffic</td>
        <td class="p-2">High (especially along 9th Avenue)</td>
        <td class="p-2">Very High (diverse mix of office workers, students, residents)</td>
        <td class="p-2">Moderate to High (especially near High Line)</td>
      </tr>
      <tr>
        <td class="p-2 font-medium">Competition</td>
        <td class="p-2">Moderate (fewer specialty coffee shops)</td>
        <td class="p-2">High (many established coffee brands)</td>
        <td class="p-2">Moderate (mixture of chains and independents)</td>
      </tr>
    </tbody>
  </table>
</div>
    `,
    hellskitchen: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Hell's Kitchen Detailed Profile</h2>
      <p class="mb-4" style="color: #34495E;">
        The recommended Hell's Kitchen location centers on the western section of the neighborhood, particularly along 9th Avenue between 50th and 55th Streets. This area benefits from:
      </p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li><strong>Demographics:</strong> 62% of residents aged 25-44, median household income of $98,700, with 78% of residents holding bachelor's degrees or higher</li>
        <li><strong>Growth Trajectory:</strong> 12% increase in food & beverage spending in the last 24 months</li>
        <li><strong>Transit Access:</strong> Within 3 blocks of A/C/E and 1/2/3 subway lines, servicing over 35,000 daily riders</li>
        <li><strong>Cultural Context:</strong> Strong arts community due to proximity to Theater District, with opportunity for cultural programming</li>
        <li><strong>Competitive Landscape:</strong> Lower density of specialty coffee shops compared to other Manhattan neighborhoods with similar foot traffic</li>
      </ul>
      <p class="mb-4" style="color: #34495E;">
        Two specific available storefronts have been identified, with the 9th Avenue & 53rd Street location offering the optimal balance of space (1,200 sq ft), visibility, and value ($115/sq ft annual rent).
      </p>
    `,
    unionsquare: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Union Square Detailed Profile</h2>
      <p class="mb-4" style="color: #34495E;">
        The Union Square area offers exceptional foot traffic and diverse customer segments but comes with higher operating costs and significant competition:
      </p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li><strong>Demographics:</strong> Major student population from NYU and The New School, substantial office worker presence, and weekend shopping/tourist traffic</li>
        <li><strong>Commercial Environment:</strong> High retail density with substantial anchor stores driving consistent traffic patterns</li>
        <li><strong>Transit Hub:</strong> Serves 6 subway lines with approximately 98,000 daily riders</li>
        <li><strong>Market Saturation:</strong> 16 coffee-focused establishments within a 4-block radius, including major chains and established independents</li>
        <li><strong>Rental Costs:</strong> 65-85% higher than Hell's Kitchen for comparable spaces</li>
      </ul>
      <p class="mb-4" style="color: #34495E;">
        While offering strong visibility and built-in foot traffic, the higher operating costs and competitive density require a more substantial marketing investment to achieve differentiation.
      </p>
    `,
    chelsea: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Chelsea Detailed Profile</h2>
      <p class="mb-4" style="color: #34495E;">
        Chelsea offers a compelling mix of residential and commercial traffic with particular strength in weekend business:
      </p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li><strong>Demographics:</strong> Higher average household income ($115,200), with strong representation in creative industries and technology</li>
        <li><strong>Cultural Attractions:</strong> Proximity to High Line and Chelsea Market creates consistent tourist and weekend traffic</li>
        <li><strong>Growth Indicators:</strong> Continued development of Hudson Yards area driving northern expansion</li>
        <li><strong>Weekday/Weekend Balance:</strong> More balanced traffic patterns compared to other neighborhoods, with strong weekend performance</li>
        <li><strong>Storefront Availability:</strong> Limited inventory of appropriately-sized spaces under $150/sq ft annually</li>
      </ul>
      <p class="mb-4" style="color: #34495E;">
        The most promising Chelsea location is on 8th Avenue near 18th Street, though the space would require significant buildout investment and higher initial rent compared to Hell's Kitchen.
      </p>
    `,
    financial: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Financial Projections</h2>
      <p class="mb-4" style="color: #34495E;">
        Financial models for each location are based on industry benchmarks and comparable NYC coffee shop performance metrics:
      </p>
      <div class="mb-4">
        <h3 class="text-lg font-semibold mb-2" style="color: #2C3E50;">Hell's Kitchen</h3>
        <ul class="list-disc pl-5" style="color: #34495E;">
          <li><strong>Initial Investment:</strong> $200,000 (includes $145K buildout, $30K equipment, $25K operating reserve)</li>
          <li><strong>Monthly Operating Costs:</strong> $32,000 (includes $11.5K rent, $12K labor, $5K COGS, $3.5K other)</li>
          <li><strong>Projected Monthly Revenue:</strong> $50,000 (month 6+)</li>
          <li><strong>Projected Monthly Profit:</strong> $18,000 (month 6+)</li>
          <li><strong>Year 1 Net Income:</strong> $56,000</li>
          <li><strong>Year 2 Net Income:</strong> $216,000</li>
        </ul>
      </div>
      <p class="mb-4" style="color: #34495E;">
        This location projects the strongest financial performance due to the combination of lower occupancy costs and favorable foot traffic patterns, with break-even occurring approximately 1-2 months earlier than the other locations.
      </p>
    `,
    implementation: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Implementation Timeline</h2>
      <div class="mb-4" style="color: #34495E;">
        <p class="mb-2">Recommended phased approach for the Hell's Kitchen location:</p>
        <ul class="list-disc pl-5">
          <li><strong>Months 1-2:</strong> Lease negotiation, architectural plans, permit applications</li>
          <li><strong>Months 3-4:</strong> Construction and buildout, equipment ordering</li>
          <li><strong>Month 5:</strong> Staff hiring and training, soft opening, menu refinement</li>
          <li><strong>Month 6:</strong> Grand opening and initial marketing push</li>
          <li><strong>Months 7-12:</strong> Operational optimization, community building, loyalty program implementation</li>
          <li><strong>Month 13 onward:</strong> Evaluate expansion opportunities, menu diversification</li>
        </ul>
      </div>
      <p class="mb-4" style="color: #34495E;">
        Critical path items include securing the lease with favorable terms, completing buildout on schedule, and establishing supplier relationships. Contingency planning is recommended for construction delays, which are common in NYC commercial spaces.
      </p>
    `,
    conclusion: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Conclusion & Recommendations</h2>
      <p class="mb-4" style="color: #34495E;">
        Based on comprehensive analysis of market conditions, financial projections, and growth potential, we recommend:
      </p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li><strong>Primary Recommendation:</strong> Secure the Hell's Kitchen location at 9th Avenue & 53rd Street, with target launch in Q3 2025</li>
        <li><strong>Differentiation Strategy:</strong> Focus on theater district theme with extended evening hours, performance space, and arts partnerships</li>
        <li><strong>Secondary Option:</strong> Union Square location offers high visibility but requires additional $45K investment and carries higher risk</li>
        <li><strong>Expansion Potential:</strong> Success of Hell's Kitchen location could create opportunity for second location in Chelsea within 24-36 months</li>
        <li><strong>Risk Mitigation:</strong> Negotiate graduated rent increase and tenant improvement allowance to preserve capital</li>
      </ul>
      <p class="mb-4" style="color: #34495E;">
        The Hell's Kitchen location provides the optimal balance of financial return, market opportunity, and alignment with the concept's unique positioning in a neighborhood undergoing continued development with favorable demographics.
      </p>
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
  
  
  const handleDownload = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Dynamically import html2pdf
    import('html2pdf.js').then(html2pdfModule => {
      const html2pdf = html2pdfModule.default;
      
      // Create a simplified document structure for PDF
      const tempContainer = document.createElement('div');
      tempContainer.style.width = '100%';
      tempContainer.style.padding = '20px';
      tempContainer.style.boxSizing = 'border-box';
      
      // Add a title
      const title = document.createElement('h1');
      title.textContent = reportTitle;
      title.style.fontSize = '24px';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '20px';
      title.style.color = '#000';
      tempContainer.appendChild(title);
      
      // Process each section
      sections.forEach(section => {
        // Create section header
        const sectionHeader = document.createElement('h2');
        sectionHeader.textContent = section.name;
        sectionHeader.style.fontSize = '18px';
        sectionHeader.style.fontWeight = 'bold';
        sectionHeader.style.marginTop = '30px';
        sectionHeader.style.marginBottom = '10px';
        sectionHeader.style.color = '#000';
        sectionHeader.style.pageBreakBefore = 'always';
        tempContainer.appendChild(sectionHeader);
        
        // Skip complex components, create placeholders
        if (section.id === 'map') {
          const mapPlaceholder = document.createElement('div');
          mapPlaceholder.textContent = '[Infrastructure Map Visualization]';
          mapPlaceholder.style.padding = '20px';
          mapPlaceholder.style.border = '1px solid #000';
          mapPlaceholder.style.textAlign = 'center';
          tempContainer.appendChild(mapPlaceholder);
        } else if (section.id === 'chart') {
          const chartPlaceholder = document.createElement('div');
          chartPlaceholder.textContent = '[Budget Prioritization Chart]';
          chartPlaceholder.style.padding = '20px';
          chartPlaceholder.style.border = '1px solid #000';
          chartPlaceholder.style.textAlign = 'center';
          tempContainer.appendChild(chartPlaceholder);
        } else {
          // For text content, create a simple div with the content
          const contentDiv = document.createElement('div');
          // Get the HTML content but strip out style attributes
          const originalElement = document.getElementById(section.id) || document.getElementById(`fullscreen-${section.id}`);
          if (originalElement) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = sectionContent[section.id] || '';
            
            // Clean all elements to use basic styling
            const allElements = tempDiv.querySelectorAll('*');
            allElements.forEach(el => {
              // Remove class and style attributes
              el.removeAttribute('class');
              el.removeAttribute('style');
              
              // Use simple HTML semantic styling
              if (el.tagName === 'H2') {
                el.style.fontSize = '18px';
                el.style.fontWeight = 'bold';
                el.style.marginTop = '20px';
                el.style.marginBottom = '10px';
                el.style.color = '#000';
              } else if (el.tagName === 'P') {
                el.style.marginBottom = '10px';
                el.style.color = '#000';
              } else if (el.tagName === 'UL') {
                el.style.paddingLeft = '20px';
                el.style.marginBottom = '10px';
              } else if (el.tagName === 'LI') {
                el.style.marginBottom = '5px';
                el.style.color = '#000';
              } else if (el.tagName === 'A') {
                el.style.color = '#000';
                el.style.textDecoration = 'underline';
              }
            });
            
            contentDiv.innerHTML = tempDiv.innerHTML;
          }
          tempContainer.appendChild(contentDiv);
        }
      });
      
      document.body.appendChild(tempContainer);
      
      // Set PDF generation options
      const options = {
        margin: [25, 25, 25, 25],
        filename: `${reportTitle.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
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
        })
        .catch(error => {
          console.error('Error generating PDF:', error);
          document.body.removeChild(tempContainer);
        });
    }).catch(error => {
      console.error('Error loading html2pdf:', error);
    });
  };
  // Regular panel content
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
            border: `1px solid ${COLORS.coral}`,
            borderRadius: '9999px'
        }}
      >
        {isMenuOpen && (
          <>
            <button 
              onClick={toggleEditMode}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
              title={isEditing ? "Save edits" : "Edit report"}
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

            <button onClick={() => setShowSources(prev => !prev)} title="View Sources" style={{ 
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
              onClick={setShowReportDownloadDialog}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
              title="Download as PDF"
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
              <Download size={20} />
            </button>

            <button 
              onClick={toggleSidebar}
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
              title="Close sidebar"
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
              className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
              title="Toggle fullscreen"
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
          </>
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
            className="w-full text-left px-4 py-3 text-sm flex items-center mb-2 rounded-full transition-all"
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
        <>
          <button 
            onClick={toggleEditMode}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
            title={isEditing ? "Save edits" : "Edit report"}
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
  title="View Sources"
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
            onClick={setShowReportDownloadDialog}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
            title="Download as PDF"
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
            <Download size={20} />
          </button>

          <button 
            onClick={toggleSidebar}
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
            title="Open table of contents"
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
            className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
            title="Toggle fullscreen"
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
        </>
      )}
      
      {/* Menu toggle button - always rightmost */}
      <button 
        onClick={toggleMenu}
        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
        title="Toggle menu"
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
            {sections.map((section) => (
              <div 
                key={section.id}
                id={section.id}
                ref={el => sectionRefs.current[section.id] = el}
                className="mb-12"
              >
                {/* Report title - editable when in edit mode */}
{section.id === 'intro' && (
  <div 
    className={`text-2xl font-bold mb-6 ${isEditing ? 'border-b-2 pb-2' : ''}`}
    style={{ 
      color: COLORS.primary,
      borderColor: isEditing ? COLORS.coral : 'transparent',
      outline: 'none'
    }}
    contentEditable={isEditing}
    suppressContentEditableWarning={true}
    onBlur={handleTitleChange}
  >
    {reportTitle}
  </div>
)}
    {section.id === 'map' ? (
<div className="w-full h-[400px] sm:h-[500px] md:h-[600px] my-6 rounded-lg overflow-hidden">
        <VancouverFloodInfraMap onLayersReady={onLayersReady} />
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
                  border: `1px solid ${COLORS.coral}`,
                }}
              >
                {/* Other buttons - only visible when menu is open */}
                {isMenuOpen && (
                  <>
                    {/* Edit/Save button */}
                    <button 
                      onClick={toggleEditMode}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
                      title={isEditing ? "Save edits" : "Edit report"}
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
  title="View Sources"
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

  
                    {/* Download button */}
                    <button 
                      onClick={setShowReportDownloadDialog}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
                      title="Download as PDF"
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
                      <Download size={20} />
                    </button>
                    
                    {/* TOC toggle button */}
                    <button 
                      onClick={toggleSidebar}
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
                      title="Open table of contents"
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
                      className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow mr-2"
                      title="Exit fullscreen"
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
                  </>
                )}
                
                {/* Menu toggle button - always visible and rightmost */}
                <button 
                  onClick={toggleMenu}
                  className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
                  title="Toggle menu"
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
                border: `1px solid ${COLORS.coral}`,
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
  border: `1px solid ${COLORS.coral}`,
  borderRadius: '9999px'
                  }}
                >
                  {isMenuOpen && (
                    <>
                      <button 
                        onClick={toggleEditMode}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
                        title={isEditing ? "Save edits" : "Edit report"}
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
  title="View Sources"
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
                        onClick={setShowReportDownloadDialog}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
                        title="Download as PDF"
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
                        <Download size={20} />
                      </button>
  
                      <button 
                        onClick={toggleSidebar}
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
                        title="Close sidebar"
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
                        className="flex items-center justify-center p-2 rounded-full transition-all hover:shadow"
                        title="Exit fullscreen"
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
                    </>
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
            {/* All sections rendered in a single scrollable document */}
            {sections.map((section) => (
              <div 
                key={`fullscreen-${section.id}`}
                id={`fullscreen-${section.id}`}
                ref={el => sectionRefs.current[`fullscreen-${section.id}`] = el}
                className="mb-16"
              >
                {/* Report title - editable when in edit mode */}
                {section.id === 'intro' && (
                  <div 
                    className={`text-3xl font-bold mb-8 ${isEditing ? 'border-b-2 pb-2' : ''}`}
                    style={{ 
                      color: COLORS.primary,
                      borderColor: isEditing ? COLORS.coral : 'transparent',
                      outline: 'none'
                    }}
                    contentEditable={isEditing}
                    suppressContentEditableWarning={true}
                    onBlur={handleTitleChange}
                  >
                    {reportTitle}
                  </div>
                )}

{section.id === 'map' ? (
      <div className="w-full h-[600px] my-6 rounded-lg overflow-hidden">
        <VancouverFloodInfraMap onLayersReady={onLayersReady} />
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
  <div className="absolute bottom-[60px] right-6 z-[1000]">
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
        onClick={handleReportDownload}
        className="mt-6 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
      >
        Download Report
      </button>
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