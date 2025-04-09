import React, { useRef, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Maximize2, Download, Edit2, Save, Menu, Minimize2, Info } from "lucide-react";
import VancouverFloodInfraMap from './InfrastructureFloodMap';
import VancouverPriorityDashboard from './BudgetDashboard';
import VancouverBCAChart from './BenefitCostAnalysisDashboard';


const ReportComponentVancouver = ({ onLayersReady, reportName = "Downtown Austin Resilience Assessment: Infrastructure, Risk & Opportunity", artifacts = [],
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
    { id: 'intro', name: 'Introduction' },
    { id: 'methods', name: 'Methodology' },
    { id: 'findings', name: 'Key Findings' },
    { id: 'analysis', name: 'Composite Risk-Need Index' },
    { id: 'map', name: 'Infrastructure Map' }, 
    { id: 'chart', name: 'Budget Prioritization Chart' }, 
    { id: 'bca', name: 'Benefit-Cost Analysis' },
    { id: 'conclusion', name: 'Recommendations' },
    { id: 'references', name: 'Data Sources' }
  ];


const sampleContent = {
    intro: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Introduction</h2>
      <p class="mb-4" style="color: #34495E;">
        Vancouver faces increasing challenges from flood risk, aging infrastructure, and shifting socio-economic conditions. This report integrates diverse public datasets to support informed infrastructure budgeting decisions. It builds on layered spatial analysis to identify the neighborhoods with the highest risk, the most urgent infrastructure needs, and opportunities for targeted investment.
      </p>
    `,
    methods: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Methodology</h2>
      <p class="mb-4" style="color: #34495E;">We integrated five key data layers to assess infrastructure vulnerability and community need:</p>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li>Floodplain zones from Vancouver’s Designated Floodplain dataset</li>
        <li>Stormwater project data and infrastructure condition reports</li>
        <li>311 call data focused on drainage complaints</li>
        <li>Census demographics: population density, income, renter status</li>
        <li>Composite risk-need index built with weighted factors</li>
      </ul>
      <p style="color: #34495E;">Each factor was assigned a weight and standardized to create a composite score for each neighborhood block.</p>
    `,
    findings: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Key Findings</h2>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li><strong>Eastern neighborhoods</strong> show both high flood risk and aging sewer infrastructure</li>
        <li><strong>Three high-density residential areas</strong> face significant flood risk but have no current mitigation projects</li>
        <li><strong>Northwestern areas</strong> exhibit a cluster of 311 drainage complaints that align with modeled flood risk zones</li>
      </ul>
      <p class="mb-4" style="color: #34495E;">These areas represent strategic opportunities where infrastructure upgrades would yield high social and environmental impact.</p>
    `,
    analysis: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Composite Risk-Need Index</h2>
      <p class="mb-4" style="color: #34495E;">
        The index uses the following weights: Flood risk (35%), Infrastructure condition (25%), 311 calls (15%), Population density (15%), and Social vulnerability (10%).
        Red zones on the map indicate highest priority areas. These scores allow for side-by-side comparisons and transparent prioritization.
      </p>
    `,
    chart: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Benefit-Cost Analysis</h2>
      <p class="mb-4" style="color: #34495E;">
        The chart highlights projects with the highest return on investment:
        <ul class="list-disc pl-5">
          <li>East Vancouver Green Infrastructure (BCA: 4.3)</li>
          <li>Northwest Sewer Upgrades (BCA: 3.8)</li>
          <li>Harbor Detention Basin (BCA: 3.2)</li>
        </ul>
        Projects in the top-right quadrant of the BCA vs. Risk Index chart deliver the greatest impact and cost-efficiency.
      </p>
    `,
    conclusion: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Recommendations</h2>
      <ul class="list-disc pl-5 mb-4" style="color: #34495E;">
        <li>Prioritize upgrades in East Vancouver, Northwest, and harbor districts</li>
        <li>Use the composite index to guide infrastructure investments citywide</li>
        <li>Integrate 311 and demographic data into long-term capital planning</li>
        <li>Align upcoming stormwater projects with high-risk zones lacking coverage</li>
      </ul>
    `,
    references: `
      <h2 class="text-xl font-bold mb-4" style="color: #008080;">Data Sources</h2>
      <ul class="list-disc pl-5 mb-4 text-sm text-gray-700">
        <li><a href="https://opendata.vancouver.ca/explore/dataset/road-ahead-projects-under-construction/information/" target="_blank" class="text-blue-600 underline">Road Ahead Projects</a></li>
        <li><a href="https://opendata.vancouver.ca/explore/dataset/designated-floodplain/" target="_blank" class="text-blue-600 underline">Designated Floodplain</a></li>
        <li><a href="https://opendata.vancouver.ca/explore/dataset/public-streets/information/" target="_blank" class="text-blue-600 underline">Public Streets</a></li>
        <li><a href="https://opendata.vancouver.ca/explore/dataset/sewer-mains/information/" target="_blank" class="text-blue-600 underline">Sewer Mains</a></li>
        <li><a href="https://www.tbs-sct.canada.ca/rtrap-parfa/analys/analys-eng.pdf" target="_blank" class="text-blue-600 underline">Benefit-Cost Analysis Methodology</a></li>
      </ul>
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
  
  const handleDownload = () => {
    if (isEditing) {
      setIsEditing(false);
    }
    
    // Dynamically import html2pdf
    import('html2pdf.js').then(html2pdfModule => {
      const html2pdf = html2pdfModule.default;
      
      // Get all section elements
      const sectionElements = sections.map(section => {
        return document.getElementById(section.id) || document.getElementById(`fullscreen-${section.id}`);
      }).filter(el => el); // Filter out any undefined elements
      
      // Create temporary container for the entire report
      const tempContainer = document.createElement('div');
      document.body.appendChild(tempContainer);
      
      // Add each section to the container with a page break after each
      sectionElements.forEach((section, index) => {
        // Clone the section to avoid modifying the original
        const sectionClone = section.cloneNode(true);
        
        // Add page-break-after style to force a new page after each section
        sectionClone.style.pageBreakAfter = 'always';
        sectionClone.style.breakAfter = 'page';
        sectionClone.style.marginBottom = '50px'; // Add some space
        
        // Add a visible separator at the bottom to help force the page break
        const separator = document.createElement('div');
        separator.style.height = '1px';
        separator.style.width = '100%';
        separator.style.marginTop = '40px';
        separator.style.marginBottom = '40px';
        
        // Add the section to the container
        tempContainer.appendChild(sectionClone);
        
        // Don't add a separator after the last section
        if (index < sectionElements.length - 1) {
          tempContainer.appendChild(separator);
        }
      });
      
      // Set PDF generation options with explicit page break settings
      const options = {
        margin: [25, 25, 25, 25], // Increased margins
        filename: `${reportName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2, 
          useCORS: true,
          letterRendering: true,
          logging: true
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4', 
          orientation: 'portrait',
          compress: true
        },
        pagebreak: { 
          mode: ['css', 'legacy'],
          before: '.page-break-before',
          after: ['.page-break-after', 'section'],
          avoid: ['.avoid-break']
        }
      };
      
      // Use html2pdf to convert temp container to PDF
      html2pdf()
        .from(tempContainer)
        .set(options)
        .toPdf()
        .get('pdf')
        .then(pdf => {
          // Clean up the temp container
          document.body.removeChild(tempContainer);
          
          // Save the PDF
          pdf.save(`${reportName.replace(/\s+/g, '_')}.pdf`);
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
            border: `1px solid ${COLORS.neutral}`,
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
              onClick={handleDownload}
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
      top: '6rem',
      right: '2rem'
    }}
  >
    <div 
      className="flex px-3 py-2 rounded-full"
      style={{ 
        backgroundColor: 'transparent',
        boxShadow: 'none)',
        border: 'none'
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
            onClick={handleDownload}
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
        <VancouverPriorityDashboard onLayersReady={onLayersReady} />
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
                  border: 'none'
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
                      onClick={handleDownload}
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
  border: `1px solid ${COLORS.neutral}`,
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
                        onClick={handleDownload}
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
        <VancouverPriorityDashboard onLayersReady={onLayersReady} />
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
            Austin Office of Resilience 2023, A path to create a Resilience Hub Network in Austin
          </a>
        </div>
        <div>
          <a
            href="https://www.austintexas.gov/sites/default/files/files/Sustainability/Climate%20Equity%20Plan/Climate%20Equity%20Plan%20Full%20Document__FINAL.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Austin Climate Equity Plan
          </a>
        </div>
        <div>
          <a
            href="https://www.opengovpartnership.org/documents/inception-report-action-plan-austin-united-states-2024-2028/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Inception Report – Action plan – Austin, United States, 2024 – 2028
          </a>
        </div>
        <div>
          <a
            href="https://services.austintexas.gov/edims/document.cfm?id=254319"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
            Flood Mitigation Task Force-Final Report to Austin City Council Codes
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
export default ReportComponentVancouver;