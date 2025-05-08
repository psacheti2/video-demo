import React, { useRef, useState } from 'react';
import {
  Maximize2, X, Info, ChevronDown, ChevronUp,
  Download, Wrench, Palette, Share2, BookmarkPlus, Table, Minimize2, Layers, Map
} from 'lucide-react';
import { TbMapSearch } from "react-icons/tb";

const ToolbarComponent = ({
  isFullscreen,
  showTable,
  setShowTable,
  onSaveMap,
  savedMaps,
  captureAndDownload,
  setShowLegend,
  setShowSources,
  toggleFullscreen,
  toolbarVisible,
  setToolbarVisible,
  toolbarPosition,
  setToolbarPosition,
  setShowSaveDialog,
  setShowGeocoder,
  showGeocoder,
  setShowDrawTools,
  showDrawTools,
  pencilRef,
  setShowShareDialog,
  tableHeight,
  setMapView,
  activeMapView,
  showTextToolbar = false
}) => {
  const toolbarRef = useRef(null);
  const mapButtonRef = useRef(null);
  const dragStart = useRef({ x: 0, y: 0 });
  const [showMapViewOptions, setShowMapViewOptions] = useState(false);
  
  // Colors config
  const COLORS = {
    coral: '#008080',
    primary: '#2C3E50',
    white: '#FFFFFF'
  };

  const handleMouseDown = (e) => {
    e.preventDefault();
    dragStart.current = {
      x: e.clientX - toolbarPosition.left,
      y: e.clientY - toolbarPosition.top
    };
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const handleMouseMove = (e) => {
    setToolbarPosition({
      top: e.clientY - dragStart.current.y,
      left: e.clientX - dragStart.current.x
    });
  };

  const handleMouseUp = () => {
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
  };

  // Function to render the map view options dialog with position based on table state
  const renderMapViewOptions = () => {
    // Determine positioning based on whether the table is open
    const positionClass = showTable 
      ? "top-16"   // Position above when table is open
      : "bottom-16" // Position below when table is closed
    
    return (
      <div
        className="fixed inset-0 z-40"
        onClick={() => setShowMapViewOptions(false)}
      >
       <div
  className={`absolute left-16 ${positionClass} z-50 w-[220px] rounded-lg bg-white shadow-xl border border-gray-200 p-3 grid grid-cols-2 gap-3 animate-fade-in`}
  onClick={(e) => e.stopPropagation()}
>
  <div className="absolute -top-2 -right-2">
    <button
      className="bg-white p-1 rounded-full border shadow hover:bg-[#008080] hover:text-white transition"
      onClick={() => setShowMapViewOptions(false)}
    >
      <X size={12} />
    </button>
  </div>

  {[
    { id: 'light', label: 'Light', thumbnail: '/tiles/light.png' },
    { id: 'satellite', label: 'Satellite', thumbnail: '/tiles/satellite.png' },
    { id: 'dark', label: 'Dark', thumbnail: '/tiles/dark.png' },
    { id: 'streets', label: 'Streets', thumbnail: '/tiles/streets.png' },
    { id: 'outdoors', label: 'Outdoors', thumbnail: '/tiles/outdoors.png' },
    { id: 'hybrid', label: 'Hybrid', thumbnail: '/tiles/hybrid.png' },
  ].map(({ id, label, thumbnail }) => (
    <button
      key={id}
      onClick={() => setMapView?.(id)}
      className={`flex flex-col items-center rounded-md shadow-sm hover:shadow-md hover:scale-[1.02] border transition-all duration-200 group
        ${activeMapView === id 
          ? 'border-[#008080] ring-2 ring-[#008080] bg-[#f0fdfa]' 
          : 'bg-white border-gray-200 hover:border-[#008080]'
        }`}    >
      <img
        src={thumbnail}
        alt={label}
        className="w-full h-[56px] object-cover rounded-t-md"
      />
<div className={`text-[10px] font-medium py-1 w-full text-center transition-colors ${
  activeMapView === id ? 'text-[#008080]' : 'group-hover:text-[#008080]'
}`}>
        {label}
      </div>
    </button>
  ))}
</div>

      </div>
    );
  };
  if (showTextToolbar) {
    return null; // Don't render the regular toolbar when text toolbar is active
  }
  if (!isFullscreen) {
    return (
      <div
        className="flex justify-center items-center space-x-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 shadow-sm z-30 rounded-full transition-all duration-300"
        style={{
            position: 'absolute',
            ...(showTable 
              ? { bottom: 'auto', top: `auto` } 
              : { bottom: '0px', top: 'auto' }),
            left: '50%',
            transform: 'translateX(-50%)'
          }}
      >
        <button onClick={() => setShowTable(!showTable)} data-tooltip="Toggle Table" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          {showTable ? <Table size={16} /> : <Table size={16} />}
        </button>
        <button onClick={() => setShowSaveDialog(true)} data-tooltip="Save Map" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          <BookmarkPlus size={16} />
        </button>
        <button
          ref={pencilRef}
          onClick={() => setShowDrawTools(!showDrawTools)}
          data-tooltip="Draw & Measure Tools"
          className="p-2 rounded-full border relative"
          style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}
        >
          <Wrench size={16} />
        </button>
        <button onClick={() => setShowLegend(prev => !prev)} data-tooltip="Legend" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          <Layers size={16} />
        </button>
        <button onClick={() => setShowSources(prev => !prev)} data-tooltip="Sources" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          <Info size={16} />
        </button>
        <button onClick={() => setShowShareDialog(true)} data-tooltip="Share" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          <Share2 size={16} />
        </button>
        <button onClick={toggleFullscreen} data-tooltip="Fullscreen" className="p-2 rounded-full border" style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}>
          <Maximize2 size={16} />
        </button>
      </div>
    );
  }

  // 🧰 FULLSCREEN TOOLBAR WITH WRENCH
  return (
    <div
      ref={toolbarRef}
      className="flex flex-col items-center space-y-2 bg-white bg-opacity-80 backdrop-blur-sm p-2 shadow-lg rounded-full z-50 transition-all duration-300"
style={{
    position: 'absolute',
    top: toolbarPosition ? `${toolbarPosition.top}px` : '50px', 
    left: toolbarPosition ? `${toolbarPosition.left}px` : '50px', 
    cursor: 'grab'
  }}
    >
      {/* 🛠️ Wrench (toggle + drag) */}
      <button
        onClick={() => setToolbarVisible(!toolbarVisible)}
        onMouseDown={handleMouseDown}
        data-tooltip={toolbarVisible ? "Collapse tools" : "Expand tools"}
        className="p-2 rounded-full border cursor-move"
        style={{
          color: COLORS.coral,
          border: `1px solid ${COLORS.coral}`,
          transition: 'all 0.2s ease-in-out'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.coral;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = COLORS.coral;
        }}
      >
        {toolbarVisible ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* 👇 Render the rest only if visible */}
      {toolbarVisible && (
        <>
          <button onClick={() => setShowTable(!showTable)} data-tooltip="Toggle Table" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            {showTable ? <Table size={16} /> : <Table size={16} />}
          </button>
          {/* Map Views Button in fullscreen mode */}
          <div className="relative">
            <button 
              ref={mapButtonRef}
              onClick={() => setShowMapViewOptions(!showMapViewOptions)} 
              data-tooltip="Map Views" 
              className="p-2 rounded-full border"
              style={{
                color: COLORS.coral,
                border: `1px solid ${COLORS.coral}`,
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = COLORS.coral;
                e.currentTarget.style.color = 'white';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = COLORS.coral;
              }}
            >
              <Map size={16} />
            </button>
            {showMapViewOptions && renderMapViewOptions()}
          </div>
          <button onClick={() => setShowSaveDialog(true)} data-tooltip="Save Map" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <BookmarkPlus size={16} />
          </button>
          <button
            ref={pencilRef}
            onClick={() => setShowDrawTools(!showDrawTools)}
            data-tooltip="Draw & Measure Tools"
            className="p-2 rounded-full border relative"
            style={{
              color: COLORS.coral,
              border: `1px solid ${COLORS.coral}`,
              transition: 'all 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}
          >
            <Wrench size={16} />
          </button>
          <button onClick={() => setShowLegend(prev => !prev)} data-tooltip="Legend" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <Layers size={16} />
          </button>
          <button onClick={() => setShowSources(prev => !prev)} data-tooltip="Sources" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <Info size={16} />
          </button>
          <button onClick={() => setShowShareDialog(true)} data-tooltip="Share" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <Share2 size={16} />
          </button>
          <button onClick={toggleFullscreen} data-tooltip="Exit Fullscreen" className="p-2 rounded-full border" style={{
            color: COLORS.coral,
            border: `1px solid ${COLORS.coral}`,
            transition: 'all 0.2s ease-in-out'
          }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = COLORS.coral;
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white';
              e.currentTarget.style.color = COLORS.coral;
            }}>
            <Minimize2 size={16} />
          </button>
        </>
      )}
    </div>
  );
};

export default ToolbarComponent;