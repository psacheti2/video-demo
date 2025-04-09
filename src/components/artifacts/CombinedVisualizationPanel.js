import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Map, Table, Maximize2, Minimize2, ChevronDown, ChevronUp, Download,
  Wrench, Layers, Palette, Share2, X, BookmarkPlus
} from "lucide-react";
import { TbMapSearch } from "react-icons/tb";


export default function CombinedVisualizationPanel({ mapContent, tableContent, hideHeader = false, onSaveMap, savedMaps = [],artifacts = [], // Add this
  currentArtifactId = null 
}) {
  // State variables
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isTableCollapsed, setIsTableCollapsed] = useState(true);
  const [tableHeight, setTableHeight] = useState(300);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [areToolsVisible, setAreToolsVisible] = useState(true);
  const [toggleButtonPosition, setToggleButtonPosition] = useState({ x: 20, y: 20 });
  const [isDraggingToggle, setIsDraggingToggle] = useState(false);
  const [resizeTooltip, setResizeTooltip] = useState({ visible: false, text: '', x: 0, y: 0 });
const mapContainerRef = useRef(null);
  
  // Refs
  const containerRef = useRef(null);
  const dragHandleRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const toolbarRef = useRef(null);
  const tooltipRef = useRef(null);
  
  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
    containerHeight: 0,
    rafId: null,
    lastY: 0
  });
  

  const captureAndDownload = () => {
    // Get the map container element
    const mapElement = document.querySelector('.overflow-auto.w-full');
    
    if (!mapElement) {
      console.error('Map element not found');
      return;
    }
    
    // First try to see if there's an iframe in the map content
    const iframe = mapElement.querySelector('iframe');
    
    if (iframe) {
      // If there's an iframe, we need a different approach
      alert("The map contains external content that cannot be directly captured. Please use your browser's screenshot tool instead.");
      return;
    }
    
    // Check if there's any content with security restrictions
    const hasSecurityNotice = mapElement.textContent.includes('Make this Notebook Trusted');
    
    if (hasSecurityNotice) {
      alert("Please trust this notebook to load and capture the map content. Go to File -> Trust Notebook if you're in a Jupyter environment.");
      return;
    }
    
    // For maps using canvas or SVG elements, try this approach
    const mapCanvas = mapElement.querySelector('canvas');
    const mapSvg = mapElement.querySelector('svg');
    
    if (mapCanvas) {
      try {
        // If it's a canvas-based map, we can directly get the data
        const imgData = mapCanvas.toDataURL('image/jpeg', 0.9);
        
        // Create download link
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `map_export_${new Date().toISOString().slice(0,10)}.jpg`;
        
        // Append, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      } catch (err) {
        console.error('Error capturing canvas map:', err);
        // Fall back to html2canvas if direct canvas capture fails
      }
    }
    
    // If it's an SVG map, try a different approach
    if (mapSvg) {
      try {
        const serializer = new XMLSerializer();
        let svgString = serializer.serializeToString(mapSvg);
        
        // Add namespaces if they're missing
        if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
          svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
        }
        
        // Convert SVG to data URL
        const svgBlob = new Blob([svgString], {type: 'image/svg+xml;charset=utf-8'});
        const url = URL.createObjectURL(svgBlob);
        
        // Create an image to draw on canvas
        const img = new Image();
        img.onload = function() {
          // Create canvas to convert SVG to JPEG
          const canvas = document.createElement('canvas');
          canvas.width = img.width || 800;
          canvas.height = img.height || 600;
          const ctx = canvas.getContext('2d');
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0);
          
          try {
            // Convert to JPEG and download
            const imgData = canvas.toDataURL('image/jpeg', 0.9);
            const link = document.createElement('a');
            link.href = imgData;
            link.download = `map_export_${new Date().toISOString().slice(0,10)}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
          } catch (e) {
            console.error('Error creating JPEG from SVG:', e);
            alert('Could not create JPEG from map. Please try a screenshot instead.');
          }
          
          // Clean up the object URL
          URL.revokeObjectURL(url);
        };
        
        img.onerror = function() {
          console.error('Error loading SVG image');
          // Fall back to html2canvas
          captureWithHtml2Canvas();
        };
        
        img.src = url;
        return;
      } catch (err) {
        console.error('Error capturing SVG map:', err);
        // Fall back to html2canvas
      }
    }
    
    // If none of the above methods work, try html2canvas
    captureWithHtml2Canvas();
    
    function captureWithHtml2Canvas() {
      // Use html2canvas as a fallback
      html2canvas(mapElement, {
        backgroundColor: 'white',
        scale: 2, // Increase quality
        logging: false,
        allowTaint: true, // Allow cross-origin images
        useCORS: true // Try to use CORS for cross-origin images
      }).then(canvas => {
        // Convert canvas to JPG
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        
        // Create download link
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `map_export_${new Date().toISOString().slice(0,10)}.jpg`;
        
        // Append, click and remove
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }).catch(err => {
        console.error('Error capturing map with html2canvas:', err);
        alert('Could not capture the map. Please try using your browser\'s screenshot function instead.');
      });
    }
  };
  
  const handleDownloadMap = () => {
    // Check if html2canvas is available
    if (typeof html2canvas === 'undefined') {
      // If not available, dynamically load it
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = captureAndDownload;
      document.head.appendChild(script);
    } else {
      captureAndDownload();
    }
  };
  
  
  // Handle table resizing logic
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = isFullscreen
      ? document.querySelector('.fullscreen-container')
      : containerRef.current;

    if (!container) return;

    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
    }

    dragState.current = {
      isDragging: true,
      startY: e.clientY,
      lastY: e.clientY,
      startHeight: isTableCollapsed ? 0 : tableHeight,
      containerHeight: container.clientHeight,
      wasCollapsed: isTableCollapsed,
      rafId: null
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';

    if (dragHandleRef.current) {
      dragHandleRef.current.classList.add('dragging');
    }
  };

  const handleMouseMove = (e) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();
    dragState.current.lastY = e.clientY;

    if (!dragState.current.rafId) {
      dragState.current.rafId = requestAnimationFrame(updateDragPosition);
    }
  };

  const updateDragPosition = () => {
    dragState.current.rafId = null;

    if (!dragState.current.isDragging) return;

    const deltaY = dragState.current.startY - dragState.current.lastY;
    const containerHeight = dragState.current.containerHeight;
    const minTableHeight = 100;
    const maxTableHeight = containerHeight - 120;

    let newTableHeight = dragState.current.startHeight + deltaY;

    if (!isTableCollapsed) {
      newTableHeight = Math.max(minTableHeight, Math.min(maxTableHeight, newTableHeight));
      setTableHeight(newTableHeight);
    }

    if (dragState.current.isDragging) {
      dragState.current.rafId = requestAnimationFrame(updateDragPosition);
    }
  };

  const handleMouseUp = () => {
    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
    }

    dragState.current.isDragging = false;
    dragState.current.rafId = null;

    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = '';

    if (dragHandleRef.current) {
      dragHandleRef.current.classList.remove('dragging');
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      if (dragState.current.rafId) {
        cancelAnimationFrame(dragState.current.rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  // Toggle fullscreen mode
  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    document.body.style.overflow = isFullscreen ? '' : 'hidden';
  };


  // Create markup from HTML content
  const createMarkup = (htmlContent) => {
    return { __html: htmlContent };
  };

  // Process tables data first
  const tables = useMemo(() => {
    return Array.isArray(tableContent) ? tableContent : [tableContent].filter(Boolean);
  }, [tableContent]);
  
  // Dynamic table titles
  const getDynamicTableTitles = () => {
    if (!Array.isArray(tableContent) || tableContent.length === 0) {
      return ["Data Table"];
    }

    const titles = tableContent.map((table, index) => {
      const headerMatch = table.match(/<th[^>]*>(.*?)<\/th>/);
      if (headerMatch && headerMatch[1]) {
        return headerMatch[1];
      }
      return `Table ${index + 1}`;
    });

    return titles;
  };

  const tableTitles = useMemo(() => getDynamicTableTitles(), [tableContent]);
// Inside CombinedVisualizationPanel component
// Inside CombinedVisualizationPanel component
const renderContent = () => {
  if (React.isValidElement(mapContent)) {
    return mapContent;
  }
  return <div dangerouslySetInnerHTML={{ __html: mapContent }} />;
};
  // Now prepare data for rendering after tables is initialized
  const showMapPlaceholder = !mapContent;
  const showTablePlaceholder = tables.length === 0;
  const hasMultipleTables = tables.length > 1;

  // Map markup for visualization
  const mapMarkup = useMemo(() => {
    return { __html: mapContent };
  }, [mapContent]);
  
  // Get the current table based on the index
  const processedTableContent = tables[currentTableIndex] || '';

  // Reset resizable state if table content changes
  useEffect(() => {
    // Remove initialized markers when table content changes
    const tables = document.querySelectorAll('.regular-table-container table');
    tables.forEach(table => {
      if (table.dataset && table.dataset.resizableInitialized) {
        delete table.dataset.resizableInitialized;
      }
    });
  }, [processedTableContent]);

  // Table resizing implementation directly inside the component
  const addResizableBehaviorToTables = () => {
    // Exit early if table is collapsed
    if (isTableCollapsed) return;
    
    // Implementation directly in the component
    setTimeout(() => {
      // Add styles first
      if (!document.getElementById('table-resize-styles')) {
        const resizeStyles = `
          /* Resize handles */
          .column-resizer {
            position: absolute;
            top: 0;
            right: 0;
            width: 6px;
            height: 100%;
            cursor: col-resize;
            z-index: 15;
            background-color: transparent;
            transition: background-color 0.15s ease;
          }
          
          .column-resizer:hover {
            background-color: rgba(0, 128, 128, 0.5);
          }
          
          .row-resizer {
            position: absolute;
            right: 0;
            bottom: 0;
            width: 100%;
            height: 6px;
            cursor: row-resize;
            z-index: 15;
            background-color: transparent;
            transition: background-color 0.15s ease;
          }
          
          .row-resizer:hover {
            background-color: rgba(0, 128, 128, 0.5);
          }
          
          /* Visual feedback during resizing */
          .resizing {
            background-color: rgba(0, 128, 128, 0.1) !important;
          }
        `;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'table-resize-styles';
        styleElement.textContent = resizeStyles;
        document.head.appendChild(styleElement);
      }
      
      // Find all tables
      const tables = document.querySelectorAll('.regular-table-container table');
      
      if (!tables.length) {
        console.log('No tables found to apply resizing behavior');
        return;
      }
      
      tables.forEach(table => {
        // Skip if already initialized
        if (table.dataset && table.dataset.resizableInitialized === 'true') return;
        
        // Mark as initialized
        table.dataset.resizableInitialized = 'true';
        
        // Force table-layout: fixed for Excel-like behavior
        table.style.tableLayout = 'fixed';
        
        // Initialize column resizing
        const headerCells = table.querySelectorAll('thead th');
        
        if (headerCells.length) {
          headerCells.forEach((th, index) => {
            // Set initial width if not already set
            if (!th.style.width) {
              const computedWidth = Math.max(th.offsetWidth, 100);
              th.style.width = `${computedWidth}px`;
              th.style.minWidth = `${computedWidth}px`;
            }
            
            // Ensure positioning context
            th.style.position = 'relative';
            
            // Create resizer if it doesn't exist
            if (!th.querySelector('.column-resizer')) {
              const resizer = document.createElement('div');
              resizer.className = 'column-resizer';
              th.appendChild(resizer);
              
              // Add resize event handler
              resizer.addEventListener('mousedown', (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Store initial values
                const startX = e.clientX;
                const startWidth = th.getBoundingClientRect().width;
                const colIndex = index;
                
                // Add visual indicator
                th.classList.add('resizing');
                
                // Create tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'resize-tooltip';
                tooltip.textContent = `${Math.round(startWidth)}px`;
                tooltip.style.position = 'fixed';
                tooltip.style.left = `${e.clientX}px`;
                tooltip.style.top = `${e.clientY - 20}px`;
                tooltip.style.backgroundColor = '#008080';
                tooltip.style.color = 'white';
                tooltip.style.padding = '4px 8px';
                tooltip.style.borderRadius = '4px';
                tooltip.style.fontSize = '12px';
                tooltip.style.fontWeight = 'bold';
                tooltip.style.pointerEvents = 'none';
                tooltip.style.zIndex = '9999';
                tooltip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                document.body.appendChild(tooltip);
                
                // Handle mouse movement
                const handleMouseMove = (moveEvent) => {
                  const deltaX = moveEvent.clientX - startX;
                  const newWidth = Math.max(50, startWidth + deltaX);
                  
                  // Apply new width to header cell
                  th.style.width = `${newWidth}px`;
                  th.style.minWidth = `${newWidth}px`;
                  
                  // Update all cells in this column
                  const bodyCells = table.querySelectorAll(`tbody tr td:nth-child(${colIndex + 1})`);
                  bodyCells.forEach(cell => {
                    cell.style.width = `${newWidth}px`;
                    cell.style.minWidth = `${newWidth}px`;
                  });
                  
                  // Update tooltip
                  tooltip.textContent = `${Math.round(newWidth)}px`;
                  tooltip.style.left = `${moveEvent.clientX}px`;
                  tooltip.style.top = `${moveEvent.clientY - 20}px`;
                  
                  // Show resize tooltip in React state
                  setResizeTooltip({
                    visible: true,
                    text: `${Math.round(newWidth)}px`,
                    x: moveEvent.clientX,
                    y: moveEvent.clientY - 20
                  });
                };
                
                // Handle mouse up to clean up
                const handleMouseUp = () => {
                  // Clean up
                  th.classList.remove('resizing');
                  
                  if (tooltip && tooltip.parentNode) {
                    tooltip.parentNode.removeChild(tooltip);
                  }
                  
                  // Hide resize tooltip in React state
                  setResizeTooltip({
                    visible: false,
                    text: '',
                    x: 0,
                    y: 0
                  });
                  
                  // Remove event listeners
                  document.removeEventListener('mousemove', handleMouseMove);
                  document.removeEventListener('mouseup', handleMouseUp);
                };
                
                // Add temporary event listeners
                document.addEventListener('mousemove', handleMouseMove);
                document.addEventListener('mouseup', handleMouseUp);
              });
            }
          });
        }
        
        // Initialize row resizing
        const rows = table.querySelectorAll('tbody tr');
        
        if (rows.length) {
          rows.forEach((row) => {
            // Set initial height if not already set
            if (!row.style.height) {
              const computedHeight = Math.max(row.offsetHeight, 30);
              row.style.height = `${computedHeight}px`;
            }
            
            // Get the last cell to add the resize handle
            const lastCell = row.cells[row.cells.length - 1];
            
            if (lastCell) {
              // Ensure positioning context
              lastCell.style.position = 'relative';
              
              // Create row resizer if it doesn't exist
              if (!lastCell.querySelector('.row-resizer')) {
                const resizer = document.createElement('div');
                resizer.className = 'row-resizer';
                lastCell.appendChild(resizer);
                
                // Add resize event handler
                resizer.addEventListener('mousedown', (e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  
                  // Store initial values
                  const startY = e.clientY;
                  const startHeight = row.getBoundingClientRect().height;
                  
                  // Add visual indicator
                  row.classList.add('resizing');
                  
                  // Create tooltip
                  const tooltip = document.createElement('div');
                  tooltip.className = 'resize-tooltip';
                  tooltip.textContent = `${Math.round(startHeight)}px`;
                  tooltip.style.position = 'fixed';
                  tooltip.style.left = `${e.clientX}px`;
                  tooltip.style.top = `${e.clientY + 20}px`;
                  tooltip.style.backgroundColor = '#008080';
                  tooltip.style.color = 'white';
                  tooltip.style.padding = '4px 8px';
                  tooltip.style.borderRadius = '4px';
                  tooltip.style.fontSize = '12px';
                  tooltip.style.fontWeight = 'bold';
                  tooltip.style.pointerEvents = 'none';
                  tooltip.style.zIndex = '9999';
                  tooltip.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
                  document.body.appendChild(tooltip);
                  
                  // Handle mouse movement
                  const handleMouseMove = (moveEvent) => {
                    const deltaY = moveEvent.clientY - startY;
                    const newHeight = Math.max(20, startHeight + deltaY);
                    
                    // Apply new height to row
                    row.style.height = `${newHeight}px`;
                    
                    // Update tooltip
                    tooltip.textContent = `${Math.round(newHeight)}px`;
                    tooltip.style.left = `${moveEvent.clientX}px`;
                    tooltip.style.top = `${moveEvent.clientY + 20}px`;
                    
                    // Show resize tooltip in React state
                    setResizeTooltip({
                      visible: true,
                      text: `${Math.round(newHeight)}px`,
                      x: moveEvent.clientX,
                      y: moveEvent.clientY + 20
                    });
                  };
                  
                  // Handle mouse up to clean up
                  const handleMouseUp = () => {
                    // Clean up
                    row.classList.remove('resizing');
                    
                    if (tooltip && tooltip.parentNode) {
                      tooltip.parentNode.removeChild(tooltip);
                    }
                    
                    // Hide resize tooltip in React state
                    setResizeTooltip({
                      visible: false,
                      text: '',
                      x: 0,
                      y: 0
                    });
                    
                    // Remove event listeners
                    document.removeEventListener('mousemove', handleMouseMove);
                    document.removeEventListener('mouseup', handleMouseUp);
                  };
                  
                  // Add temporary event listeners
                  document.addEventListener('mousemove', handleMouseMove);
                  document.addEventListener('mouseup', handleMouseUp);
                });
              }
            }
          });
        }
      });
    }, 300); // Delay to ensure DOM is ready
  };

  // Call the resizable behavior when appropriate
  useEffect(() => {
    if (!isTableCollapsed) {
      addResizableBehaviorToTables();
    }
  }, [isTableCollapsed, currentTableIndex, processedTableContent]);

  // Regular panel view
  const regularPanelView = (
    <div ref={containerRef} className="flex flex-col h-full bg-white rounded-lg shadow-sm overflow-hidden relative">
      {!hideHeader && (
        <div className="flex items-center py-2 px-4 bg-coral text-white">
          <div className="flex items-center">
            <Map className="h-5 w-5 mr-2" />
            <span className="font-medium">Visualizations</span>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        <div
          className="flex-1 min-h-0 overflow-hidden relative"
          style={{ height: isTableCollapsed ? '100%' : `calc(100% - ${tableHeight}px)` }}
        >
          {showMapPlaceholder ? (
            <div className="h-full w-full flex flex-col items-center justify-center bg-neutral">
              {/* Placeholder content */}
            </div>
          ) : (
            <div className="h-full w-full flex flex-col overflow-hidden relative">
              {/* Map content takes available space with flex-grow */}
              <div className="overflow-auto w-full" style={{ height: isTableCollapsed ? 'calc(100% - 100px)' : 'calc(100% - 50px)' }}>
  {renderContent()}
</div>

              {/* Map control bar as a non-absolute element at the bottom of the flex container */}
              <div
                className="p-2 flex justify-center items-center space-x-2 w-full shrink-0"
                style={{
                  background: 'transparent',
                  padding: '8px 16px',
                  zIndex: '20'
                }}
              >
                {/* Show/Hide Table button */}
                
                <button
                  onClick={() => setIsTableCollapsed(!isTableCollapsed)}
                  className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
                  title={isTableCollapsed ? "Show table" : "Hide table"}
                  style={{
                    color: '#008080',
                    border: 'none',
                    transition: 'all 0.2s ease-in-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  {isTableCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>

                {/* Save Map button */}
                <button
                  onClick={() => {
                    const newArtifactNumber = savedMaps.length + 1;
                    const artifactName = `Artifact ${newArtifactNumber}`;
                    if (onSaveMap && typeof onSaveMap === 'function') {
                      onSaveMap(artifactName, mapContent);
                    }
                  }}
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Save map"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <BookmarkPlus size={20} />
                </button>

                {/* Symbology button */}
                <button
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Symbology"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <Palette size={20} />
                </button>

                {/* Search button */}
                <button
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Search"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <TbMapSearch size={20} />
                </button>

                {/* Legend button */}
                <button
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Legend"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <Layers size={20} />
                </button>

                {/* Share button */}
                <button
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Share"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <Share2 size={20} />
                </button>

                {/* Download button */}
                {/* Download button */}
<button
  onClick={handleDownloadMap}
  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
  title="Download map as JPG"
  style={{ color: '#008080', border: 'none' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#008080';
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'white';
    e.currentTarget.style.color = '#008080';
  }}
>
  <Download size={20} />
</button>

                {/* Fullscreen button */}
                <button
                  onClick={toggleFullscreen}
                  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
                  title="Fullscreen"
                  style={{ color: '#008080', border: 'none' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#008080'; // coral
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#008080';
                  }}
                >
                  <Maximize2 size={20} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Enhanced drag handle with better visibility */}
        <div
            ref={dragHandleRef}
            className="cursor-row-resize transition-all"
            onMouseDown={handleMouseDown}
            style={{
              height: "4px", // Small but visible 
              backgroundColor: "#e0e0e0", // Light gray to see it
              position: "relative",
              zIndex: "20",
              marginBottom: "-1px" // Connect to the container below
            }}
        >
          {/* Remove the visible grip icon */}
        </div>

        <div
  className="relative mt-0 bg-neutral shadow-inner"
  style={{ 
    height: isTableCollapsed ? '0px' : `${tableHeight}px`,
    marginTop: "0px", // No margin, directly connected to handle
    borderTop: "1px solid #ccc" // Add a border to visually connect
  }}
>
          <div className="h-full flex flex-col rounded-b-lg overflow-hidden">
          <div className="flex justify-between items-center p-1 bg-white text-gray-800 border-b border-gray-200 shrink-0 px-2" 
   style={{ 
    height: "24px", // Fixed height instead of min-height
    lineHeight: "24px", // Match the height for proper alignment
    padding: "0px 4px", // Minimal padding
    overflow: "hidden" // Prevent content from expanding it
  }}>            <div className="flex-1 flex">
                {/* Table tabs with better styling */}
                {!isTableCollapsed && hasMultipleTables && (
                  <div className="flex space-x-1">
                    {tableTitles.map((title, index) => (
                      <button
                        key={index}
                        className={`table-tab-button ${currentTableIndex === index ? 'active' : ''}`}
                        onClick={() => setCurrentTableIndex(index)}
                      >
                        {title}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Table Content with Fixed Header */}
            {!isTableCollapsed && (
              <div className="flex-1 overflow-hidden bg-white">
                {showTablePlaceholder ? (
                  <div className="h-full flex flex-col items-center justify-center py-6 bg-white rounded-md shadow-sm">
                    <Table className="h-8 w-8 text-coral/50 mb-2" />
                    <p className="text-sm text-secondary">No table data available</p>
                  </div>
                ) : (
                  <div className="h-full relative overflow-hidden">
                    {/* Add style for fixed header */}
                    <style dangerouslySetInnerHTML={{
                      __html: `
                        /* Table styling for regular panel view */
                        .regular-table-container {
                          position: relative;
                          width: 100%;
                          height: 100%;
                          overflow: auto;
                          border: 1px solid #e2e8f0;
                          margin-left: 0 !important;
                            margin-top: 0 !important;
  padding-top: 0 !important;
                        }
                          .flex.space-x-1.ml-2 {
  margin-left: 0 !important; /* Reduce the ml-2 class margin */
  padding-left: 4px; /* Add minimal padding */
}
  .flex.justify-between.items-center.bg-white.text-gray-800.border-b.border-gray-200.shrink-0.h-10 {
  padding-top: 0 !important;
  padding-bottom: 0 !important;
  height: auto !important; /* Adjust height to be smaller */
  min-height: 32px !important; /* Set a smaller min-height instead of fixed height */
}

.relative.flex-1.bg-white.overflow-hidden.mt-16 {
  margin-top: 8px !important; /* Reduce from 16px */
}
.border-b.border-gray-200 {
  border-bottom-width: 1px !important;
  border-bottom-color: #e5e7eb !important;
}
                        /* Critical for resizing stability */
                        .regular-table-container table {
                          border-collapse: separate; 
                          border-spacing: 0;
                          width: 100%;
                          font-size: 14px;
                          table-layout: fixed !important; /* Most important for Excel-like behavior */
                        }

                        /* Fixed header styles */
                        .regular-table-container thead th {
                          position: sticky;
                          top: 0;
                          z-index: 10;
                          background-color: #f8fafc;
                          box-shadow: 0 2px 3px rgba(0,0,0,0.1);
                          font-weight: 600;
                          padding: 12px 16px;
                          text-align: left;
                          border-bottom: 2px solid #cbd5e1;
                          height: 46px;
                          overflow: hidden;
                          white-space: nowrap;
                          text-overflow: ellipsis;
                        }

                        /* Cell styling - Excel-like appearance */
                        .regular-table-container td {
                          padding: 8px 12px;
                          border-bottom: 1px solid #e2e8f0;
                          border-right: 1px solid #e2e8f0;
                          text-align: left;
                          vertical-align: top;
                          overflow: hidden;
                          white-space: nowrap;
                          text-overflow: ellipsis;
                          background-color: white;
                        }

                        /* First column styling without sticky behavior */
                        .regular-table-container tr th:first-child,
                        .regular-table-container tr td:first-child {
                          background-color: #f3f4f6;
                          max-width: 200px; /* Limit width of the first column */
                        }

                        .regular-table-container tr:nth-child(even) td {
                          background-color: #f9fafb;
                        }

                        /* Background for first column in even rows */
                        .regular-table-container tr:nth-child(even) td:first-child {
                          background-color: #f3f4f6;
                        }

                        /* Style for text wrapping */
                        .regular-table-container td, 
                        .regular-table-container th {
                          white-space: normal;
                          word-break: normal;
                          overflow-wrap: anywhere;
                        }

                        .regular-table-container tr:hover td {
                          background-color: #f0f9ff;
                        }

                        /* Background for first column when hovering */
                        .regular-table-container tr:hover td:first-child {
                          background-color: #e1f0ff;
                        }

                        /* Rounded styling for table tab buttons - add this new section */
                        .table-tab-button {
  border-radius: 4px !important;
  border: none !important;
  transition: all 0.2s ease-in-out;
  margin-right: 4px !important;
  padding: 1px 12px !important; 
  background-color: white;
  color: #008080;
  font-weight: 500;
  margin-bottom: 0 !important;
  margin-top: 0 !important; 
}


                        .table-tab-button:hover {
  background-color: #008080 !important;
  color: white !important;
}

                       .table-tab-button.active {
  background-color: #008080 !important;
  color: white !important;
}

.table-tab-button.active:hover {
  background-color: #006666 !important;
}


                        /* Table resizing styles */
                        .regular-table-container table {
                          table-layout: fixed; /* Changed to fixed for predictable column resizing */
                        }

                        .regular-table-container th,
                        .regular-table-container td {
                          position: relative; /* Required for resize handles */
                          overflow: hidden;
                          text-overflow: ellipsis;
                        }

                        .column-resizer {
                          position: absolute;
                          top: 0;
                          right: 0;
                          width: 5px;
                          height: 100%;
                          background-color: transparent;
                          cursor: col-resize;
                          z-index: 15;
                          transition: background-color 0.15s ease;
                        }
                        
                        /* Make the resize handle more visible on hover */
                        .column-resizer:hover {
                          background-color: #0ea5e9 !important;
                        }
                        
                        .column-resizer:active {
                          background-color: #0284c7 !important;
                        }

                        /* Row resizer styles */
                        .row-resizer {
                          position: absolute;
                          right: 0;
                          bottom: 0;
                          width: 100%;
                          height: 5px;
                          background-color: transparent;
                          cursor: row-resize;
                          z-index: 15;
                          transition: background-color 0.15s ease;
                        }

                        .row-resizer:hover {
                          background-color: #0ea5e9 !important;
                        }

                        /* Active state when actually dragging */
                        .row-resizer:active {
                          background-color: #0284c7 !important;
                        }

                        /* Visual indication for currently resizing elements */
                        .resizing-column th.resizing,
                        .resizing-column td.resizing {
                          background-color: rgba(0, 128, 128, 0.1) !important;
                        }

                        .resizing-row tr.resizing td {
                          background-color: rgba(0, 128, 128, 0.1) !important;
                        }

                        /* Resize tooltip */
                        .resize-tooltip {
                          position: fixed;
                          background-color: #0284c7;
                          color: white;
                          padding: 4px 8px;
                          border-radius: 4px;
                          font-size: 12px;
                          font-weight: bold;
                          pointer-events: none;
                          z-index: 9999;
                          white-space: nowrap;
                          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.3);
                          transform: translate(-50%, -100%);
                          margin-top: -8px;
                        }
` }} />


                    {/* Table wrapper with fixed header */}
                    <div className="regular-table-wrapper h-full">
                      <div className="regular-table-container">
                        <div dangerouslySetInnerHTML={createMarkup(processedTableContent)} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Resize tooltip */}
{resizeTooltip.visible && (
  <div 
    className="resize-tooltip"
    style={{ 
      left: `${resizeTooltip.x}px`, 
      top: `${resizeTooltip.y}px` 
    }}
    ref={tooltipRef}
  >
    {resizeTooltip.text}
  </div>
)}
    </div>
  );
  <div style={{ position: 'fixed', top: 10, right: 10, zIndex: 9999, background: 'white', padding: '4px' }}>
  Fullscreen: {isFullscreen ? 'ON' : 'OFF'}
</div>

// Updated fullscreen panel view with fixed toolbar drag functionality
const fullscreenPanelView = (
  
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex flex-col fullscreen-container">
    {/* Main content container */}
    <div className="flex-1 bg-neutral flex flex-col h-screen overflow-hidden">
      {/* Draggable toolbar container with FIXED drag functionality */}
      <div
        ref={toolbarRef}
        style={{
          position: 'absolute',
          left: '50%', // Center horizontally
          transform: 'translateX(-50%)', // Offset by half width to truly center
          top: `${toggleButtonPosition.y}px`,
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'center', // Center the buttons within the container
          alignItems: 'center',
          gap: '8px',
          background: areToolsVisible ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
          padding: '8px',
          zIndex: '9999',
          borderRadius: '24px',
          backdropFilter: areToolsVisible ? 'blur(4px)' : 'none',
          cursor: isDraggingToggle ? 'grabbing' : 'grab'
        }}
        onMouseDown={(e) => {
          console.log('Dragging started');
          console.log("Mouse down on toolbar");

          // Ignore clicks on actual buttons
          if (e.target.closest('button')) return;
        
          e.preventDefault();
        
          const startX = e.clientX;
          const startY = e.clientY;
        
          const rect = toolbarRef.current.getBoundingClientRect();
          const offsetX = startX - rect.left;
          const offsetY = startY - rect.top;
        
          setIsDraggingToggle(true);
          document.body.style.cursor = 'grabbing';
        
          const handleMouseMove = (moveEvent) => {
            console.log('Dragging to', moveEvent.clientX, moveEvent.clientY);
            const newX = Math.max(0, moveEvent.clientX - offsetX);
            const newY = Math.max(0, moveEvent.clientY - offsetY);
          
            setToggleButtonPosition({
              x: newX,
              y: newY
            });
          };
          
        
          const handleMouseUp = () => {
            setIsDraggingToggle(false);
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
          };
        
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
        
      >
        {/* Toggle Tools Visibility button - always visible */}
        <button
          ref={toggleButtonRef}
          onClick={(e) => {
            // Explicitly stop propagation to prevent toolbar's onMouseDown from firing
            e.stopPropagation();
            setAreToolsVisible(!areToolsVisible);
          }}
          className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
          title={areToolsVisible ? "Hide map tools" : "Show map tools"}
          style={{ 
            color: '#008080', 
            border: 'none',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            position: 'relative',
            zIndex: 2
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#008080';
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = '#008080';
          }}
        >
          {areToolsVisible ? <X size={20} /> : <Wrench size={20} />}
        </button>
        
        {/* Other buttons - only shown when tools are visible */}
        {areToolsVisible && (
          <>
            {/* Show/Hide Table button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setIsTableCollapsed(!isTableCollapsed);
              }}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title={isTableCollapsed ? "Show table" : "Hide table"}
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              {isTableCollapsed ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>

            {/* Save Map button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                const newArtifactNumber = savedMaps.length + 1;
                const artifactName = `Artifact ${newArtifactNumber}`;
                if (onSaveMap && typeof onSaveMap === 'function') {
                  onSaveMap(artifactName, mapContent);
                }
              }}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Save map"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <BookmarkPlus size={20} />
            </button>

            {/* Symbology button */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Symbology"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <Palette size={20} />
            </button>

            {/* Search button */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Search"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <TbMapSearch size={20} />
            </button>

            {/* Legend button */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Legend"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <Layers size={20} />
            </button>

            {/* Share button */}
            <button
              onClick={(e) => e.stopPropagation()}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Share"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <Share2 size={20} />
            </button>

            {/* Download button */}
            {/* Download button */}
<button
  onClick={(e) => {
    e.stopPropagation();
    handleDownloadMap();
  }}
  className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
  title="Download map as JPG"
  style={{ 
    color: '#008080', 
    border: 'none',
    position: 'relative',
    zIndex: 2
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = '#008080';
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'white';
    e.currentTarget.style.color = '#008080';
  }}
>
  <Download size={20} />
</button>

            {/* Exit Fullscreen button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleFullscreen();
              }}
              className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm hover:shadow"
              title="Exit fullscreen"
              style={{ 
                color: '#008080', 
                border: 'none',
                position: 'relative',
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#008080';
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#008080';
              }}
            >
              <Minimize2 size={20} />
            </button>
          </>
        )}
      </div>

      {/* Map Section - using React state directly for more reliable updates */}
      <div
        className="relative flex-1 bg-white overflow-hidden"
        style={{ 
          height: `calc(100% - 56px - ${isTableCollapsed ? 0 : tableHeight}px)`
        }}
      >
        {!showMapPlaceholder ? (
          <div className="h-full w-full flex flex-col overflow-hidden relative">
            {/* Map content */}
            <div
              className="flex-1 overflow-auto"
              dangerouslySetInnerHTML={mapMarkup}
            />
          </div>
        ) : (
          <div className="h-full w-full flex flex-col items-center justify-center bg-neutral p-4 text-center">
            <div className="bg-white p-4 rounded-full mb-4 shadow-md">
              <Map className="h-8 w-8 text-coral" />
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No map to display yet</h3>
            <p className="text-secondary max-w-md">
              Ask me to create a map for you.
            </p>
          </div>
        )}
      </div>

      {/* Improved drag handle with better event capturing */}
      {!isTableCollapsed && (
        <div
        ref={dragHandleRef}
        className="cursor-row-resize transition-all"
        onMouseDown={handleMouseDown}
        style={{
          height: "4px", // Small but visible 
          backgroundColor: "#e0e0e0", // Light gray to see it
          position: "relative",
          zIndex: "20",
          marginBottom: "-1px" // Connect to the container below
        }}
        />
      )}

      {/* Table section with direct height setting for more responsive resizing */}
      <div
        className="relative bg-white overflow-hidden"
        style={{ 
          height: isTableCollapsed ? '0px' : `${tableHeight}px`
        }}
      >
        <div className="h-full flex flex-col rounded-b-lg overflow-hidden">
          {/* Table header with tabs */}
          {!isTableCollapsed && hasMultipleTables && (
            <div className="flex items-center bg-white text-gray-800 border-b border-gray-200 shrink-0 h-10 px-4">
              <div className="flex space-x-1">
                {tableTitles.map((title, index) => (
                  <button
                    key={index}
                    className={`table-tab-button ${currentTableIndex === index ? 'active' : ''}`}
                    onClick={() => setCurrentTableIndex(index)}
                  >
                    {title}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Table Content with Fixed Header */}
          {!isTableCollapsed && (
            <div className="flex-1 overflow-hidden bg-white">
              {showTablePlaceholder ? (
                <div className="h-full flex flex-col items-center justify-center py-6 bg-white rounded-md shadow-sm">
                  <Table className="h-8 w-8 text-coral/50 mb-2" />
                  <p className="text-sm text-secondary">No table data available</p>
                </div>
              ) : (
                <div className="h-full relative overflow-hidden">
                  {/* Table styling CSS */}
                  <style dangerouslySetInnerHTML={{
__html: `
/* Table styling for fullscreen panel view */
.regular-table-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: auto;
  margin-left: 0 !important;
   margin-top: 0 !important;
  padding-top: 0 !important;
}

.flex.space-x-1.ml-2 {
  margin-left: 0 !important; /* Reduce the ml-2 class margin */
  padding-left: 4px; /* Add minimal padding */
}

.regular-table-container table {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  font-size: 14px;
  table-layout: auto;
}

/* Fixed header styles - improved visibility */
.regular-table-container thead th {
  position: sticky;
  top: 0;
  z-index: 10;
  background-color: #f3f4f6;
  box-shadow: 0 4px 6px rgba(0,0,0,0.15);
}

/* First column styling without sticky behavior */
.regular-table-container tr th:first-child,
.regular-table-container tr td:first-child {
  background-color: #f3f4f6;
  max-width: 200px; /* Limit width of the first column */
}

.regular-table-container th {
  color: #1e293b;
  font-weight: 600;
  padding: 12px 16px; /* Increased vertical padding for taller headers */
  text-align: left;
  border-bottom: 2px solid #008080; /* Teal colored border */
  min-width: 120px;
  height: 50px; /* Increased height for header row */
  font-size: 15px; /* Slightly larger font size */
}

.regular-table-container td {
  padding: 12px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  vertical-align: top;
  min-width: 120px;
  max-width: 600px;
  background-color: white;
}

.regular-table-container tr:nth-child(even) td {
  background-color: #f9fafb;
}

/* Background for first column in even rows */
.regular-table-container tr:nth-child(even) td:first-child {
  background-color: #f3f4f6;
}

/* Style for text wrapping */
.regular-table-container td, 
.regular-table-container th {
  white-space: normal;
  word-break: normal;
  overflow-wrap: anywhere;
}

.regular-table-container tr:hover td {
  background-color: #f0f7ff;
}

/* Background for first column when hovering */
.regular-table-container tr:hover td:first-child {
  background-color: #e1f0ff;
}

/* Rounded styling for table tab buttons - matching regular panel view */
.table-tab-button {
  border-radius: 4px !important; /* Less rounded corners instead of 9999px */
  border: none !important;
  transition: all 0.2s ease-in-out;
  margin-right: 4px !important; /* Reduced from 8px */
  padding: 6px 12px !important; /* Reduced from 8px 16px */
  background-color: white;
  color: #008080;
  font-weight: 500;
}

.table-tab-button:hover {
  background-color: #008080 !important;
  color: white !important;
}

.table-tab-button.active {
  background-color: #008080 !important;
  color: white !important;
}

.table-tab-button.active:hover {
  background-color: #006666 !important;
}
  /* Table resizing styles */
.regular-table-container table {
  table-layout: fixed; /* Changed to fixed for predictable column resizing */
}

.regular-table-container th,
.regular-table-container td {
  position: relative; /* Required for resize handles */
  overflow: hidden;
  text-overflow: ellipsis;
}

/* Column resizer styles */
.column-resizer {
  position: absolute;
  top: 0;
  right: 0;
  width: 8px;
  height: 100%;
  background-color: transparent;
  cursor: col-resize;
  z-index: 15;
}

.column-resizer:hover,
.column-resizer:active {
  background-color: rgba(0, 128, 128, 0.3);
}

/* Row resizer styles */
.row-resizer {
  position: absolute;
  left: 0;
  bottom: 0;
  width: 100%;
  height: 8px;
  background-color: transparent;
  cursor: row-resize;
  z-index: 15;
}

.row-resizer:hover,
.row-resizer:active {
  background-color: rgba(0, 128, 128, 0.3);
}

/* Visual indication for currently resizing elements */
.resizing-column th.resizing,
.resizing-column td.resizing {
  background-color: rgba(0, 128, 128, 0.1) !important;
}

.resizing-row tr.resizing td {
  background-color: rgba(0, 128, 128, 0.1) !important;
}

/* Resize tooltip */
.resize-tooltip {
  position: absolute;
  background-color: #008080;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  pointer-events: none;
  z-index: 1000;
  white-space: nowrap;
}
` }} />

                  {/* Table wrapper with fixed header */}
                  <div className="regular-table-wrapper h-full">
                    <div className="regular-table-container">
                      <div dangerouslySetInnerHTML={createMarkup(processedTableContent)} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
    {/* Resize tooltip */}
{resizeTooltip.visible && (
  <div 
    className="resize-tooltip"
    style={{ 
      left: `${resizeTooltip.x}px`, 
      top: `${resizeTooltip.y}px` 
    }}
    ref={tooltipRef}
  >
    {resizeTooltip.text}
  </div>
)}
  </div>
);
  // IMPORTANT: Include all three views in the return statement
  return (
    <>
      {regularPanelView}
      {isFullscreen && fullscreenPanelView}
      
    </>
  );
}