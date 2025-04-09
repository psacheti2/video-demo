import React, { useState, useRef, useEffect } from "react";
import { Maximize2, Minimize2, Menu, Info } from "lucide-react";

const COLORS = {
  primary: '#2C3E50',
  secondary: '#34495E',
  neutral: '#F5F5F5',
  white: '#FFFFFF',
  coral: '#008080',
};

const SevenExtract = ({onLayersReady}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [activeExtract, setActiveExtract] = useState(0);
  const extractRefs = useRef({});
    const infoRef = useRef(null);
  
  const [showSources, setShowSources] = useState(false);
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
  const extracts = [
    {
      id: 1,
      title: 'Infrastructure Improvements & Complete Streets',
      source: 'Vickery Meadow Strategic Action Plan',
      page: 'Page 31',
      date: 'Apr 8, 2025',
      content: `The plan recommends a Complete Streets design to increase pedestrian safety, walkability, and accessibility. Specific upgrades include wider sidewalks, improved street lighting, and enhanced bus stop infrastructure. Infrastructure investments should align with future city bond packages, ensuring high-need areas like Vickery Meadow receive adequate prioritization.`,
      tags: ['Infrastructure', 'Mobility', 'Urban Design']
    },
    {
      id: 2,
      title: 'Crime Prevention through Environmental Design (CPTED)',
      source: 'Vickery Meadow Strategic Action Plan',
      page: 'Page 33',
      date: 'Apr 8, 2025',
      content: `The safety strategy includes better lighting, activation of public spaces, and enforcement partnerships. The plan supports CPTED principles, encouraging visibility, maintenance, and territorial reinforcement through neighborhood branding and streetscape design. Lighting improvements were a top priority from community feedback.`,
      tags: ['Safety', 'Lighting', 'CPTED']
    },
    {
      id: 3,
      title: 'Affordable Housing Strategy and Zoning Reform',
      source: 'Vickery Meadow Strategic Action Plan',
      page: 'Page 35',
      date: 'Apr 8, 2025',
      content: `Vickery Meadow's housing stock is primarily multifamily, renter-occupied, and aging. The plan encourages mixed-use zoning and incentives for affordable housing development. Feasibility studies and right-to-return policies are proposed to prevent displacement of long-term residents while improving housing quality.`,
      tags: ['Housing', 'Zoning', 'Affordability']
    },
    {
      id: 4,
      title: 'Economic Development and Workforce Partnerships',
      source: 'Vickery Meadow Strategic Action Plan',
      page: 'Page 38',
      date: 'Apr 8, 2025',
      content: `The plan recommends attracting small business investment and creating training partnerships with nonprofits. Job training and employment services should be offered in multiple languages, addressing language barriers faced by refugees. There is also emphasis on developing mixed-use corridors that provide local employment.`,
      tags: ['Workforce', 'Jobs', 'Small Business']
    },
    {
      id: 5,
      title: 'Rebranding and Cultural Promotion for Identity Building',
      source: 'Vickery Meadow Strategic Action Plan',
      page: 'Page 41',
      date: 'Apr 8, 2025',
      content: `Residents identify stigma and negative media portrayal as a barrier to community pride. The plan recommends coordinated marketing, signage, murals, and cultural events that celebrate the area’s diversity. A “Brand the Meadow” campaign is proposed to build unity and counter misperceptions.`,
      tags: ['Community Identity', 'Branding', 'Culture']
    }
  ];
  

  useEffect(() => {
    if (isSidebarOpen) {
      setSidebarVisible(true);
      setTimeout(() => {
        const sidebar = document.getElementById('policies-sidebar');
        const width = window.innerWidth < 640 ? '180px' : '260px';
        sidebar.style.width = width;
              }, 10);
    } else {
      const sidebar = document.getElementById('policies-sidebar');
      if (sidebar) sidebar.style.width = '0px';
      setTimeout(() => setSidebarVisible(false), 300);
    }
  }, [isSidebarOpen]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.dataset.index);
          if (!isNaN(index)) setActiveExtract(index);
        }
      });
    }, { threshold: 0.3 });

    Object.values(extractRefs.current).forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      Object.values(extractRefs.current).forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, []);

  const toggleFullscreen = () => setIsFullscreen(prev => !prev);
  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  

  const renderPanel = (fullscreen = false) => (
<div className={`${fullscreen ? 'fixed inset-0 z-50' : ''} flex flex-col h-full overflow-hidden`} style={{ backgroundColor: COLORS.white, zIndex: 10, position: 'relative' }}>
<div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        {sidebarVisible && (
          <div
            id="policies-sidebar"
            className="border-r overflow-auto text-sm"
            style={{
              width: '0px',
              transition: 'width 300ms ease-in-out',
              backgroundColor: COLORS.white,
              borderColor: '#e5e7eb',
              overflowX: 'hidden'
            }}
          >
            <div className="p-4">
              {extracts.map((extract, index) => (
                <button
                  key={extract.id}
                  onClick={() => {
                    setActiveExtract(index);
                    const el = document.getElementById(`${fullscreen ? 'fullscreen' : 'regular'}-extract-${index}`);
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'nearest' });
                    }
                  }}
                  className="w-full text-left px-4 py-2 mb-2 rounded-full"
                  style={{
                    backgroundColor: activeExtract === index ? COLORS.coral : COLORS.white,
                    color: activeExtract === index ? COLORS.white : COLORS.secondary,
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    if (activeExtract !== index) e.currentTarget.style.backgroundColor = '#f0f0f0';
                  }}
                  onMouseLeave={(e) => {
                    if (activeExtract !== index) e.currentTarget.style.backgroundColor = COLORS.white;
                  }}
                >
                  {extract.title}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1 overflow-auto p-4 sm:p-6 text-sm sm:text-base" style={{ backgroundColor: COLORS.white }}>
        <div className="max-w-full sm:max-w-4xl mx-auto">
        {extracts.map((extract, index) => (
              <div
                key={extract.id}
                id={`${fullscreen ? 'fullscreen' : 'regular'}-extract-${index}`}
                data-index={index}
                ref={el => extractRefs.current[`${fullscreen ? 'fullscreen' : 'regular'}-${index}`] = el}
                className="mb-10 border-b pb-6"
                style={{ scrollMarginTop: window.innerWidth < 640 ? '4rem' : '6rem' }}
                >
<h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: COLORS.coral }}>{extract.title}</h2>
<div className="text-sm text-gray-600 mb-2">{extract.source} • {extract.page} • {extract.date}</div>
                <div className="mb-2 flex flex-wrap gap-2">
                  {extract.tags.map(tag => (
                    <span key={tag} className="px-2 py-1 text-xs rounded-full" style={{
                      backgroundColor: `${COLORS.coral}10`,
                      color: COLORS.coral
                    }}>{tag}</span>
                  ))}
                </div>
                {/* Split paragraphs by newlines */}
                <div className="space-y-4 text-gray-800 text-base leading-relaxed">
                  {extract.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx}>{paragraph}</p>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Buttons */}
      <div className="fixed top-20 right-6 z-50">
        <div className="flex space-x-3 bg-white px-4 py-2 rounded-full shadow-md border">
          <button onClick={toggleSidebar} title="Toggle sidebar" style={{ 
              color: COLORS.coral,
              backgroundColor: 'white',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              borderRadius: '50%',  // Makes the button circular
              width: window.innerWidth < 640 ? '28px' : '36px',
height: window.innerWidth < 640 ? '28px' : '36px',

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
            <Menu size={20}  />
          </button>
          <button onClick={() => setShowSources(prev => !prev)} title="View Sources" style={{ 
              color: COLORS.coral,
              backgroundColor: 'white',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              borderRadius: '50%',  // Makes the button circular
              width: '36px',        // Fixed width
              height: '36px',       // Fixed height
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

          <button onClick={toggleFullscreen} title="Toggle fullscreen" style={{ 
              color: COLORS.coral,
              backgroundColor: 'white',
              border: 'none',
              transition: 'all 0.2s ease-in-out',
              borderRadius: '50%',  // Makes the button circular
              width: '36px',        // Fixed width
              height: '36px',       // Fixed height
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
            {fullscreen
              ? <Minimize2 size={20}  />
              : <Maximize2 size={20}  />
            }
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
    {showSources && (
    <div ref={infoRef}className="absolute top-full right-0 mt-2 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-[1000]" style={{top:'90px'}}>
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
          <a
          >
Building Condition data(contains building footprints, maintenance details, conditions, and year built)          </a>
        </div>
        <div>
          
          <a
            href="https://data.austintexas.gov/Locations-and-Maps/Neighborhoods/a7ap-j2yt/about_data"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline hover:text-blue-800"
          >
Neighborhoods          </a>
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
            Flood Mitigation Task Force-Final Report to Austin City Council
Codes
          </a>
        </div>
      </div>
    </div>
  )}

      {!isFullscreen && renderPanel(false)}
      {isFullscreen && renderPanel(true)}
    </>
  );
};

export default SevenExtract;