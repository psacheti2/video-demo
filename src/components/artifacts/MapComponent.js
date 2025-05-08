import React, { useEffect, useState, useRef, useMemo } from 'react';
import {
  Layers, Maximize2, X, Info, ChevronDown, ChevronUp,
  Download, Wrench, Palette, Share2, BookmarkPlus, Table, Minimize2, ChevronLeft, ArrowLeft, ChevronRight, Pencil, ListFilter
} from 'lucide-react';
import { TbMapSearch } from "react-icons/tb";
import html2canvas from 'html2canvas';
import { useNotificationStore } from '@/store/NotificationsStore';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.js';
import _ from 'lodash';

import { PiPolygon } from "react-icons/pi";
import { FaRegCircle } from "react-icons/fa6";
import { GiPathDistance } from "react-icons/gi";
import { LiaShareAltSolid } from "react-icons/lia";
import { LuMove3D, LuSquiggle } from "react-icons/lu";
import { MdDraw } from "react-icons/md";


const MapComponent = ({ onLayersReady, onSaveMap, savedMaps = [], setSavedArtifacts, title, 
  onBack  }) => {
    const [layerTypes, setLayerTypes] = useState(['flood', 'infrastructure']); // Default layers
    const [layerRefsData, setLayerRefsData] = useState(null);
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const infoRef = useRef(null);
  // Table states
  const [showTable, setShowTable] = useState(false);
  const [tableHeight, setTableHeight] = useState(300);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableTitles, setTableTitles] = useState(['Infrastructure', 'Stormwater Projects', '311 Data', 'Demographics']);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadSelections, setDownloadSelections] = useState({});
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [customSaveName, setCustomSaveName] = useState('');
  const [toolbarVisible, setToolbarVisible] = useState(true);
  const [toolbarPosition, setToolbarPosition] = useState({ top: 100, left: 100 });
  const wrenchRef = useRef(null);
  const [showGeocoder, setShowGeocoder] = useState(false);
  const geocoderRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [slideOut, setSlideOut] = useState(false);
  const [showDrawTools, setShowDrawTools] = useState(false);
  const editControlRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeDrawTool, setActiveDrawTool] = useState(null);
  const snapLayersRef = useRef([]);
  const pencilRef = useRef(null);
  const [drawDialogPos, setDrawDialogPos] = useState({ top: 0, left: 0 });
  const [selectedRowIndex, setSelectedRowIndex] = useState(null);
  const [selectedColIndex, setSelectedColIndex] = useState(null);
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, type: null, index: null,
    columnName: null, });
  const [editingCell, setEditingCell] = useState(null);
  const [cellValue, setCellValue] = useState('');
  const [originalRowsMap, setOriginalRowsMap] = useState({});
  const [showFilterDialog, setShowFilterDialog] = useState(false);
  const [filterColumn, setFilterColumn] = useState(null);
  const [filterOptions, setFilterOptions] = useState([]);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [filterSearch, setFilterSearch] = useState('');
  const [filterDialogPosition, setFilterDialogPosition] = useState({ x: 0, y: 0 });
  const [showFilterIcons, setShowFilterIcons] = useState(false);
  const [attachments, setAttachments] = useState([
    { id: 'map', label: '📍 Vancouver Infrastructure & Flood Assessment Map.jpg' },
    ...tableTitles.map((title, i) => ({
      id: `table-${i}`,
      label: `📊 ${title}.csv`
    }))
  ]);
  const debouncedSearch = useRef(_.debounce((query) => {
    runGeocodeSearch(query);
  }, 300)).current;
  const floodPolygonsRef = useRef([]);
  const streetLinesRef = useRef([]);
  const sewerLinesRef = useRef([]);
  const projectFeaturesRef = useRef([]);
  const demographicPolygonsRef = useRef([]);

  // Drag handle reference
  const dragHandleRef = useRef(null);
  // Enhanced loading states
  const [isFullscreen, setIsFullscreen] = useState(false);
// Count how many layers are active in initial state
const initialActiveLayerCount = Object.values({
  floodZones: true,
  infrastructure: true,
  stormwaterProjects: true,
  infrastructureOutsideProjects: true,
  data311: true,
  demographics: true
}).filter(isActive => isActive).length;

// Set showLegend to true if more than 4 layers are active
const [showLegend, setShowLegend] = useState(initialActiveLayerCount > 4);
  const [showSources, setShowSources] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [isModified, setIsModified] = useState(false);

  const [showSymbologyEditor, setShowSymbologyEditor] = useState(false);


  const [activeLayers, setActiveLayers] = useState({
    floodZones: true,
    infrastructure: true,
    stormwaterProjects: true,
    infrastructureOutsideProjects: true,
    data311: true,
    demographics: true
  });

  const COLORS = {
    // Flood zones
    floodLight: '#ADD8E6',
    floodMedium: '#4682B4',
    floodDark: '#000080',

    // Infrastructure conditions
    streetGood: '#2ECC71',
    streetMedium: '#F1C40F',
    streetPoor: '#E74C3C',

    sewerGood: '#3498DB',
    sewerMedium: '#85C1E9',
    sewerPoor: '#E67E22',

    // Projects
    projectActive: '#9C27B0',
    projectPlanned: '#673AB7',

    // Demographics
    demoHigh: '#FF5722',
    demoMedium: '#FF9800',
    demoLow: '#FFC107',

    // 311 Data
    data311High: '#607D8B',
    data311Medium: '#90A4AE',
    data311Low: '#CFD8DC',

    // UI Colors
    primary: '#2C3E50',
    coral: '#008080',
    white: '#FFFFFF'
  };
  const dragState = useRef({
    isDragging: false,
    startY: 0,
    startHeight: 0,
    containerHeight: 0,
    rafId: null,
    lastY: 0
  });
  const [layerColors, setLayerColors] = useState({
    floodLight: COLORS.floodLight,
    floodMedium: COLORS.floodMedium,
    floodDark: COLORS.floodDark,
    streetGood: COLORS.streetGood,
    streetMedium: COLORS.streetMedium,
    streetPoor: COLORS.streetPoor,
    sewerGood: COLORS.sewerGood,
    sewerMedium: COLORS.sewerMedium,
    sewerPoor: COLORS.sewerPoor,
    projectActive: COLORS.projectActive,
    demoHigh: COLORS.demoHigh,
    demoMedium: COLORS.demoMedium,
    demoLow: COLORS.demoLow,
    data311High: COLORS.data311High,
    data311Medium: COLORS.data311Medium,
    data311Low: COLORS.data311Low
  });

  const evaluateCell = (value, table) => {
    if (typeof value !== 'string' || !value.startsWith('=')) return value;
  
    const match = value.match(/^=(SUM|AVERAGE)\(([^)]+)\)$/i);
    if (!match) return value;
  
    const [, fn, colName] = match;
    const nums = table.rows.map(row => parseFloat(row[colName])).filter(n => !isNaN(n));
    if (nums.length === 0) return 0;
  
    if (fn.toUpperCase() === 'SUM') return nums.reduce((a, b) => a + b, 0).toFixed(2);
    if (fn.toUpperCase() === 'AVERAGE') return (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2);
    return value;
  };
  
  const resetFeatureHighlighting = () => {
    // Reset Street Lines
    streetLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.streetMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.streetGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.streetMedium;
      else color = layerColors.streetPoor;
  
      line.setStyle({ color, weight: 4, opacity: 0.8 });
    });
  
    // Reset Sewer Lines
    sewerLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.sewerMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.sewerGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.sewerMedium;
      else color = layerColors.sewerPoor;
  
      line.setStyle({ color, weight: 3, opacity: 0.8 });
    });
  
    // Reset Project Features
    projectFeaturesRef.current.forEach(({ element }) => {
      if (element.setStyle) {
        element.setStyle({ color: layerColors.projectActive, weight: 4, opacity: 0.8 });
      }
    });
  
    // Reset Demographics
    demographicPolygonsRef.current.forEach(({ polygon, socioEconomicValue }) => {
      const normalized = socioEconomicValue / 100;
      const fillColor = normalized > 0.8 ? layerColors.demoHigh :
                        normalized > 0.5 ? layerColors.demoMedium :
                        layerColors.demoLow;
  
      polygon.setStyle({ fillColor, opacity: 0.5 });
    });
  };
  
  const handleCellEdit = (selectedRowIndex, columnName, newValue) => {
    setTableData(prev => {
      const updated = [...prev];
      updated[currentTableIndex].rows[selectedRowIndex][columnName] = newValue;
      return updated;
    });
  };  
  
  const handleRightClick = (e, type, index) => {
    e.preventDefault();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, type, index });
  };
  
  const closeContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null });
  };

  useEffect(() => {
    const handleClick = () => closeContextMenu();
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, []);
  
  
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = isFullscreen
      ? document.querySelector('.fullscreen-container')
      : mapContainerRef.current;

    if (!container) return;

    if (dragState.current.rafId) {
      cancelAnimationFrame(dragState.current.rafId);
    }

    dragState.current = {
      isDragging: true,
      startY: e.clientY,
      lastY: e.clientY,
      startHeight: showTable ? tableHeight : 0,
      containerHeight: container.clientHeight,
      wasCollapsed: !showTable,
      rafId: null
    };

    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'row-resize';

    if (dragHandleRef.current) {
      dragHandleRef.current.classList.add('dragging');
    }
  };
  const runGeocodeSearch = async (query) => {
    if (!query) {
      setSearchResults([]);
      return;
    }
  
    try {
      const res = await fetch(
        `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`
      );
      const data = await res.json();
      const formattedResults = data.features.map(feature => ({
        name: feature.properties.name || feature.properties.street || feature.properties.city,
        fullName: [
          feature.properties.name,
          feature.properties.street,
          feature.properties.city,
          feature.properties.state,
          feature.properties.country
        ].filter(Boolean).join(', '),
        center: [feature.geometry.coordinates[1], feature.geometry.coordinates[0]],
        // Create a small bounding box around the point if no bbox is provided
        bbox: L.latLngBounds(
          [feature.geometry.coordinates[1] - 0.01, feature.geometry.coordinates[0] - 0.01],
          [feature.geometry.coordinates[1] + 0.01, feature.geometry.coordinates[0] + 0.01]
        )
      }));
      setSearchResults(formattedResults);
    } catch (err) {
      console.error("Geocoding error:", err);
      setSearchResults([]);
    }
  };
  
  const selectRowByFeatureProperties = (properties) => {
    if (!properties || !tableData.length) return;
  
    // Loop through each table to find the matching row
    for (let i = 0; i < tableData.length; i++) {
      const rowIndex = tableData[i]?.rows?.findIndex(row =>
        Object.keys(properties).some(key => row[key] === properties[key])
      );
  
      if (rowIndex >= 0) {
        // Set the correct table view and show table
        setCurrentTableIndex(i);
        setShowTable(true);
        setSelectedRowIndex(rowIndex);
  
        // Delay scroll slightly after table is visible
        setTimeout(() => {
          const tableElement = document.querySelector('table');
          if (tableElement) {
            const rowElement = tableElement.querySelector(`tbody tr:nth-child(${rowIndex + 1})`);
            if (rowElement) {
              rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }, 200);
  
        break;
      }
    }
  };  

  const highlightFeatureByRowProperties = (rowIndex) => {
    if (rowIndex === null || !map) return;
    
    const row = tableData[currentTableIndex]?.rows[rowIndex];
    if (!row) return;
    
    // Reset any previous highlighting
    resetFeatureHighlighting();
    
    // Check which table we're on and highlight the appropriate feature
    switch (currentTableIndex) {
      case 0: // Infrastructure
        highlightInfrastructureFeature(row);
        break;
      case 1: // Stormwater Projects
        highlightProjectFeature(row);
        break;
      case 2: // 311 Data
        highlight311Feature(row);
        break;
      case 3: // Demographics
        highlightDemographicFeature(row);
        break;
    }
  };

  const highlightInfrastructureFeature = (row) => {
    if (!row || !row.type) return;
  
    const isStreet = row.type === 'Street';
    const matchValue = row.hblock || row.location;
  
    if (!matchValue) return;
  
    const targetRef = isStreet ? streetLinesRef : sewerLinesRef;
  
    targetRef.current.forEach(({ line }) => {
      const content = line.getPopup()?.getContent();
      if (content && content.includes(matchValue)) {
        line.setStyle({ weight: 6, opacity: 1, color: '#ffff00' });
        if (map) {
          line.openPopup();
          map.panTo(line.getCenter());
        }
      }
    });
  };

  const highlightProjectFeature = (row) => {
    if (!row) return;
    const matchValue = row.project || row.location;
    if (!matchValue) return;
  
    projectFeaturesRef.current.forEach(({ element }) => {
      const popupContent = element.getPopup()?.getContent();
      if (popupContent && popupContent.includes(matchValue)) {
        if (element.setStyle) {
          element.setStyle({ color: '#ffff00', weight: 5, opacity: 1 });
        }
        if (map) {
          element.openPopup();
          map.panTo(element.getLatLng?.() || element.getBounds?.().getCenter());
        }
      }
    });
  };

  const highlight311Feature = (row) => {
    if (!row) return;
    const matchValue = row.address || row.service_request_type;
    if (!matchValue) return;
  
    if (map && map.data311Layer) {
      map.data311Layer.eachLayer((layer) => {
        const popupContent = layer.getPopup?.()?.getContent();
        if (popupContent && popupContent.includes(matchValue)) {
          map.panTo(layer.getLatLng?.() || layer.getBounds?.().getCenter());
          layer.openPopup();
        }
      });
    }
  };
  
  const highlightDemographicFeature = (row) => {
    if (!row) return;
  
    const name = row.name || row["Neighborhood"] || row["name"];
    if (!name) return;
  
    // Reset previous highlighting
    resetFeatureHighlighting();
  
    demographicPolygonsRef.current.forEach(({ polygon }) => {
      const popupContent = polygon.getPopup()?.getContent() || '';
  
      if (popupContent.includes(name)) {
        polygon.setStyle({
          fillColor: '#ffff00',
          fillOpacity: 0.8,
          color: '#000',
          weight: 2,
          opacity: 1
        });
  
        if (map) {
          polygon.openPopup();
          map.panTo(polygon.getBounds().getCenter());
        }
      }
    });
  };
  

  useEffect(() => {
    if (selectedRowIndex !== null) {
      highlightFeatureByRowProperties(selectedRowIndex);
    }
  }, [selectedRowIndex, currentTableIndex]);

  const handleResultClick = (result) => {
    setSearchResults([]);
    setSearchQuery(result.fullName || result.name);
    
    // Add marker and fit bounds as before
    map.fitBounds(result.bbox);
    L.marker(result.center, {
      icon: L.divIcon({
        html: `<div style="
          width: 20px;
          height: 20px;
          background-color: #FF5747;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          border: 2px solid white;
          box-shadow: 0 0 2px rgba(0,0,0,0.3);
        "></div>`,
        className: '',
        iconSize: [20, 20],
        iconAnchor: [10, 20]
      })
    }).addTo(map);
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

    if (showTable) {
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

  const captureAndDownload = () => {
    if (!map) return;

    const mapNode = mapContainerRef.current;

    if (!mapNode) {
      console.error('Map element not found');
      return;
    }

    // If html2canvas is not loaded, load it
    if (typeof html2canvas === 'undefined') {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => {
        html2canvas(mapNode, {
          backgroundColor: 'white',
          scale: 2,
          logging: false,
          allowTaint: true,
          useCORS: true
        }).then(canvas => {
          const imgData = canvas.toDataURL('image/jpeg', 0.9);
          const link = document.createElement('a');
          link.href = imgData;
          link.download = `vancouver_flood_map_${new Date().toISOString().slice(0, 10)}.jpg`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      };
      document.head.appendChild(script);
    } else {
      html2canvas(mapNode, {
        backgroundColor: 'white',
        scale: 2,
        logging: false,
        allowTaint: true,
        useCORS: true
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        const link = document.createElement('a');
        link.href = imgData;
        link.download = `vancouver_flood_map_${new Date().toISOString().slice(0, 10)}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      });
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
    if (map) {
      setTimeout(() => map.invalidateSize(), 300);
    }
  };

  const toggleLayer = (layerName) => {
    setActiveLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      // Prevent deselect if clicking on context menu or header
      if (e.target.closest('th') || e.target.closest('.context-menu')) return;
      setSelectedRowIndex(null);
      setSelectedColIndex(null);
    };
  
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  useEffect(() => {
    if (showDrawTools && pencilRef.current) {
      const rect = pencilRef.current.getBoundingClientRect();

      const top = isFullscreen
        ? rect.bottom + window.scrollY + 12
        : rect.top + window.scrollY + 12;

      const left = rect.left + window.scrollX - 120 + rect.width / 2;

      setDrawDialogPos({ top, left });
    }
  }, [showDrawTools, isFullscreen]);


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
    if (!map) return;
  
    map.on(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      map.drawnItems.addLayer(layer);
    });
  }, [map]);
  

  useEffect(() => {
    if (isFullscreen) {
      // Position on the left side, vertically centered
      const windowHeight = window.innerHeight;
      
      setToolbarPosition({
        top: windowHeight / 2 - 330, 
        left: 20 // Left margin
      });
    }
  }, [isFullscreen]);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!wrenchRef.current || !wrenchRef.current.dataset.dragging) return;
      setToolbarPosition({
        top: e.clientY - 20,
        left: e.clientX - 20,
      });
    };

    const handleMouseUp = () => {
      if (wrenchRef.current) {
        delete wrenchRef.current.dataset.dragging;
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  useEffect(() => {
    if (map) {
      // Give it a moment to paint/render first
      const timeout = setTimeout(() => {
        map.invalidateSize();
      }, 500);

      return () => clearTimeout(timeout);
    }
  }, [map]);

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
    return () => {
      if (dragState.current.rafId) {
        cancelAnimationFrame(dragState.current.rafId);
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
    };
  }, []);

  const convertGeoJSONToTable = (data, layerType) => {
    if (!data || !data.features || !data.features.length) return [];

    // Get all possible properties across features
    const allProperties = new Set();
    data.features.forEach(feature => {
      if (feature.properties) {
        Object.keys(feature.properties).forEach(key => allProperties.add(key));
      }
    });

    // Create table headers
    const headers = ["Feature ID", "Geometry Type", ...Array.from(allProperties)];

    // Create table rows
    const rows = data.features.map((feature, index) => {
      const row = {
        "Feature ID": index + 1,
        "Geometry Type": feature.geometry?.type || "Unknown"
      };

      // Add all properties
      allProperties.forEach(prop => {
        const value = feature.properties ? feature.properties[prop] : "";
        row[prop] = typeof value === 'object' && value !== null
          ? JSON.stringify(value)
          : value ?? "";
      });


      return row;
    });

    return { headers, rows };
  };
  
  const handleDownloadAll = () => {
    const downloadedFiles = [];
  
    Object.entries(downloadSelections).forEach(([key, { filename, format }]) => {
      const fullName = `${filename}${format}`;
      downloadedFiles.push(fullName);
  
      if (key === 'map') {
        // Get the map container element
        const mapElement = mapContainerRef.current;
        
        if (!mapElement) {
          console.error("Map element not found");
          return;
        }
        
        if (format === '.pdf') {
          // For PDF format
          html2canvas(mapElement, {
            backgroundColor: 'white',
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true
          }).then(canvas => {
            try {
              // Convert canvas to image
              const imgData = canvas.toDataURL('image/jpeg', 1.0);
              
              // Initialize PDF
              const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm'
              });
              
              // Get canvas dimensions
              const imgWidth = 280; // mm
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              // Add image to PDF
              pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
              
              // Save PDF
              pdf.save(`${filename}.pdf`);
            } catch (err) {
              console.error("Error creating PDF:", err);
            }
          }).catch(err => {
            console.error("Error rendering canvas for PDF:", err);
          });
        } else {
          // For JPG and PNG formats
          html2canvas(mapElement, {
            backgroundColor: 'white',
            scale: 2,
            logging: true,
            useCORS: true,
            allowTaint: true
          }).then(canvas => {
            try {
              const mimeType = format === '.png' ? 'image/png' : 'image/jpeg';
              const imageData = canvas.toDataURL(mimeType, 0.9);
              const link = document.createElement('a');
              link.href = imageData;
              link.download = fullName;
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            } catch (err) {
              console.error("Error creating download:", err);
            }
          }).catch(err => {
            console.error("Error rendering canvas:", err);
          });
        }
      } else if (key.startsWith('table-')) {
        // Existing table download functionality
        const tableIndex = parseInt(key.split('-')[1], 10);
        const data = tableData[tableIndex];
  
        if (!data || !data.headers || !data.rows) return;
  
        const csvRows = [
          data.headers.join(','),
          ...data.rows.map(row => data.headers.map(h => `"${(row[h] ?? '').toString().replace(/"/g, '""')}"`).join(','))
        ];
        const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.setAttribute('download', fullName);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    });
  
    // Push notification
    if (downloadedFiles.length > 0) {
      const fileList = downloadedFiles.join(', ');
      setShowShareDialog(false);
      setNotificationMessage(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
      setShowEmailNotification(true);
      addNotification(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
    }
  };
  useEffect(() => {
    if (tableData.length > 0 && !isModified) {
      setOriginalRowsMap(prev => ({
        ...prev,
        [currentTableIndex]: JSON.parse(JSON.stringify(tableData[currentTableIndex].rows))
      }));
    }
  }, [tableData, currentTableIndex, isModified]);  
  
  useEffect(() => {
    if (!map) return;

    const drawnItems = new L.FeatureGroup();
    drawnItems.setZIndex(1000);
    map.addLayer(drawnItems);
    map.drawnItems = drawnItems;


    const drawControl = new L.Control.Draw({
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: true,
          drawError: {
            color: '#e1e100',
            message: '<strong>Error:</strong> shape cannot intersect itself!'
          },
          shapeOptions: {
            color: '#FF5733',
            weight: 2
          }
        },
        polyline: false,
        rectangle: false,
        circle: false,
        marker: false,
        circlemarker: false
      },
      edit: {
        featureGroup: drawnItems
      }
    });
    
    map.drawControl = drawControl;
    map.drawnItems = drawnItems;
  }, [map]);

  const insertCellReferenceIntoFormula = (cellRef) => {
    if (!formulaInputRef.current) return;
  
    // Force focus into the formula cell
    formulaInputRef.current.focus();
  
    setTimeout(() => {
      const selection = window.getSelection();
      const formulaDiv = formulaInputRef.current;
  
      // If no child, insert a text node
      if (!formulaDiv.firstChild) {
        formulaDiv.innerText = editingFormula;
      }
  
      const textNode = formulaDiv.firstChild;
      if (!textNode || !selection) return;
  
      let range;
      try {
        range = selection.getRangeAt(0);
      } catch (err) {
        // If there's no range (e.g., no caret yet), set one at the end
        range = document.createRange();
        range.setStart(textNode, textNode.textContent?.length || 0);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
      }
  
      const startOffset = range.startOffset;
      const before = editingFormula.slice(0, startOffset);
      const after = editingFormula.slice(startOffset);
  
      const newFormula = `${before}${cellRef}${after}`;
      setEditingFormula(newFormula);
  
      // Update innerText manually
      formulaDiv.innerText = newFormula;
  
      // Restore caret position after inserted ref
      const newPos = startOffset + cellRef.length;
      const newRange = document.createRange();
      newRange.setStart(formulaDiv.firstChild, newPos);
      newRange.setEnd(formulaDiv.firstChild, newPos);
      selection.removeAllRanges();
      selection.addRange(newRange);
    }, 0);
  };
  
  
  const fetchFloodZones = async () => {
    try {
      const res = await fetch('/data/floodplains-data.geojson');
      const floodData = await res.json();
      const floodLayer = L.layerGroup();

      floodData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
          // Convert GeoJSON coordinates to Leaflet format
          let coordinates;

          if (feature.geometry.type === 'Polygon') {
            // For simple polygons
            coordinates = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
          } else {
            // For multipolygons (first polygon in the collection)
            coordinates = feature.geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
          }

          // Determine color based on feature properties (if available)
          // Assuming there's a risk_level or similar property
          let color = layerColors.floodMedium;
          let fillColor = layerColors.floodLight;

          if (feature.properties) {
            if (feature.properties.risk_level === 'high') {
              color = layerColors.floodDark;
              fillColor = layerColors.floodMedium;
            } else if (feature.properties.risk_level === 'low') {
              color = layerColors.floodLight;
              fillColor = layerColors.floodLight;
            }
          }

          const polygon = L.polygon(coordinates, {
            color: color,
            fillColor: fillColor,
            weight: 2,
            opacity: 0.8,
            fillOpacity: 0.5
          });
          snapLayersRef.current.push(polygon);
          // Create popup with relevant information
          let popupContent = '<strong>Flood Zone</strong>';
          if (feature.properties) {
            if (feature.properties.risk_level) {
              popupContent += `<br>Risk Level: ${feature.properties.risk_level}`;
            }
            if (feature.properties.elevation) {
              popupContent += `<br>Elevation: ${feature.properties.elevation}m above sea level`;
            }
          }

          polygon.bindPopup(popupContent);
          floodPolygonsRef.current.push({ polygon, properties: feature.properties });
          floodLayer.addLayer(polygon);
        }
      });

      return { floodLayer, floodData };
    } catch (error) {
      console.error("Error fetching flood zones:", error);
      return L.layerGroup(); // Return empty layer on error
    }
  };

  const fetchInfrastructureData = async () => {
    try {
      // Create a layerGroup to hold all infrastructure
      const infraLayer = L.layerGroup();

      // Fetch street data
      const streetRes = await fetch('/data/streetcondition-data.geojson');
      const streetData = await streetRes.json();

      // Process street data
      if (streetData.features && streetData.features.length > 0) {
        streetData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            // Convert GeoJSON linestring coordinates to Leaflet format
            const coords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // Determine color based on condition
            let color = layerColors.streetMedium;
            const condition = feature.properties?.condition || 'C';

            if (condition === 'A' || condition === 'B') {
              color = layerColors.streetGood;
            } else if (condition === 'C' || condition === 'D') {
              color = layerColors.streetMedium;
            } else {
              color = layerColors.streetPoor;
            }

            // Create polyline for street
            const streetLine = L.polyline(coords, {
              color: color,
              weight: 4,
              opacity: 0.8
            });
            snapLayersRef.current.push(streetLine);

            // Create popup with street information
            let popupContent = '<strong>Street</strong>';
            if (feature.properties) {
              if (feature.properties.hblock) {
                popupContent += `<br>Location: ${feature.properties.hblock}`;
              }
              if (feature.properties.streetuse) {
                popupContent += `<br>Type: ${feature.properties.streetuse}`;
              }
              if (feature.properties.condition) {
                popupContent += `<br>Condition: ${feature.properties.condition}`;
              }
            }

            streetLine.bindPopup(popupContent);
            streetLine.on('click', () => {
              selectRowByFeatureProperties(feature.properties);
            });            
            streetLinesRef.current.push({ line: streetLine, condition: feature.properties?.condition });
            infraLayer.addLayer(streetLine);
          }
        });
      }

      // Fetch sewer/stormwater data
      const sewerRes = await fetch('/data/stormwaste-data.geojson');
      const sewerData = await sewerRes.json();

      // Process sewer data
      if (sewerData.features && sewerData.features.length > 0) {
        sewerData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.coordinates) {
            // Convert GeoJSON linestring coordinates to Leaflet format
            const coords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

            // Determine color based on condition
            let color = layerColors.sewerMedium;
            const condition = feature.properties?.condition || 'C';

            if (condition === 'A' || condition === 'B') {
              color = layerColors.sewerGood;
            } else if (condition === 'C' || condition === 'D') {
              color = layerColors.sewerMedium;
            } else {
              color = layerColors.sewerPoor;
            }

            // Create polyline for sewer line
            const sewerLine = L.polyline(coords, {
              color: color,
              weight: 3,
              opacity: 0.8,
              dashArray: '5, 5'
            });
            snapLayersRef.current.push(sewerLine);


            // Create popup with sewer information
            let popupContent = `<strong>${feature.properties?.effluent_type || 'Sewer'} Line</strong>`;
            if (feature.properties) {
              if (feature.properties.diameter_mm) {
                popupContent += `<br>Diameter: ${feature.properties.diameter_mm}mm`;
              }
              if (feature.properties.material) {
                popupContent += `<br>Material: ${feature.properties.material}`;
              }
              if (feature.properties.condition) {
                popupContent += `<br>Condition: ${feature.properties.condition}`;
              }
              if (feature.properties.install_yr) {
                popupContent += `<br>Installed: ${feature.properties.install_yr}`;
              }
            }

            sewerLine.bindPopup(popupContent);
            sewerLinesRef.current.push({ line: sewerLine, condition: feature.properties?.condition });
            infraLayer.addLayer(sewerLine);
          }
        });
      }

      return { infraLayer, streetData, sewerData };
    } catch (error) {
      console.error("Error fetching infrastructure data:", error);
      return L.layerGroup(); // Return empty layer on error
    }
  };

  const fetchStormwaterProjects = async () => {
    try {
      const res = await fetch('/data/projects-data.geojson');
      const projectsData = await res.json();
      const projectsLayer = L.layerGroup();

      if (projectsData.features && projectsData.features.length > 0) {
        projectsData.features.forEach(feature => {
          if (feature.geometry) {
            // Convert coordinates based on geometry type
            let projectCoords = [];

            if (feature.geometry.type === 'Point') {
              // For point features, create a marker
              const marker = L.marker([feature.geometry.coordinates[1], feature.geometry.coordinates[0]], {
                icon: L.divIcon({
                  html: `<div style="background-color: ${layerColors.projectActive}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                  className: '',
                  iconSize: [16, 16]
                })
              });

              // Create popup content
              let popupContent = '<strong>Project</strong>';
              if (feature.properties) {
                if (feature.properties.project) {
                  popupContent += `<br>${feature.properties.project}`;
                }
                if (feature.properties.location) {
                  popupContent += `<br>Location: ${feature.properties.location}`;
                }
                if (feature.properties.comp_date) {
                  popupContent += `<br>Completion Date: ${feature.properties.comp_date}`;
                }
              }

              marker.bindPopup(popupContent);
              marker.on('click', () => {
                selectRowByFeatureProperties(feature.properties);
              });
              
              projectFeaturesRef.current.push({ element: marker });
              projectsLayer.addLayer(marker);

            } else if (feature.geometry.type === 'LineString') {
              // For linestring features
              projectCoords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

              const line = L.polyline(projectCoords, {
                color: layerColors.projectActive,
                weight: 4,
                opacity: 0.8
              });
              snapLayersRef.current.push(line);

              // Create popup content
              let popupContent = '<strong>Project</strong>';
              if (feature.properties) {
                if (feature.properties.project) {
                  popupContent += `<br>${feature.properties.project}`;
                }
                if (feature.properties.location) {
                  popupContent += `<br>Location: ${feature.properties.location}`;
                }
                if (feature.properties.comp_date) {
                  popupContent += `<br>Completion Date: ${feature.properties.comp_date}`;
                }
              }

              line.bindPopup(popupContent);
              line.on('click', () => {
                selectRowByFeatureProperties(feature.properties);
              });
              
              projectFeaturesRef.current.push({ element: line });
              projectsLayer.addLayer(line);

            } else if (feature.geometry.type === 'MultiLineString') {
              // For multilinestring features
              feature.geometry.coordinates.forEach(lineCoords => {
                const line = L.polyline(lineCoords.map(coord => [coord[1], coord[0]]), {
                  color: layerColors.projectActive,
                  weight: 4,
                  opacity: 0.8
                });

                // Create popup content
                let popupContent = '<strong>Project</strong>';
                if (feature.properties) {
                  if (feature.properties.project) {
                    popupContent += `<br>${feature.properties.project}`;
                  }
                  if (feature.properties.location) {
                    popupContent += `<br>Location: ${feature.properties.location}`;
                  }
                  if (feature.properties.comp_date) {
                    popupContent += `<br>Completion Date: ${feature.properties.comp_date}`;
                  }
                }

                line.bindPopup(popupContent);
                projectFeaturesRef.current.push({ element: line });
                projectsLayer.addLayer(line);
              });
            }
          }
        });
      }

      return { projectsLayer, projectsData };
    } catch (error) {
      console.error("Error fetching stormwater projects:", error);
      return L.layerGroup(); // Return empty layer on error
    }
  };


  const fetch311Data = async () => {
    try {
      const res = await fetch('/data/311-data.geojson');
      const data311 = await res.json();
      const data311Layer = L.layerGroup();

      // Process the actual 311 data
      const heatData = [];
      const neighborhoodCountMap = new Map(); // We'll still count requests by neighborhood for heatmap data

      // Filter for features with valid geometry
      const validFeatures = data311.features.filter(feature =>
        feature.geometry && feature.geometry.type === 'Point' &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length === 2
      );

      // Count features by neighborhood for those without geometry (still needed for heatmap)
      data311.features.forEach(feature => {
        if (feature.properties && feature.properties.local_area) {
          const area = feature.properties.local_area;
          neighborhoodCountMap.set(area, (neighborhoodCountMap.get(area) || 0) + 1);
        }
      });

      // Add markers for valid points
      validFeatures.forEach(feature => {
        const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

        // Determine priority based on request type
        let priority = "Medium";
        if (feature.properties.service_request_type.includes("Damage")) {
          priority = "High";
        } else if (feature.properties.service_request_type.includes("Locate")) {
          priority = "Low";
        }

        // Calculate intensity for heatmap
        const intensity = priority === "High" ? 1.0 :
          priority === "Medium" ? 0.7 : 0.4;

        heatData.push([coords[0], coords[1], intensity]);

        // Determine colors
        const color = priority === "High" ? layerColors.data311High :
          priority === "Medium" ? layerColors.data311Medium : layerColors.data311Low;

        const statusColor = feature.properties.status === "Open" ? "red" : "green";

        // Create marker
        const marker = L.marker(coords, {
          icon: L.divIcon({
            html: `<div style="background-color: ${color}; color: white; width: 10px; height: 10px; border-radius: 50%; border: 2px solid ${statusColor};"></div>`,
            className: '',
            iconSize: [14, 14]
          })
        });

        // Create popup content
        let popupContent = `<strong>311 Request: ${feature.properties.service_request_type}</strong>`;
        if (feature.properties.address) popupContent += `<br>Address: ${feature.properties.address}`;
        popupContent += `<br>Status: ${feature.properties.status}`;
        popupContent += `<br>Department: ${feature.properties.department}`;
        if (feature.properties.local_area) popupContent += `<br>Area: ${feature.properties.local_area}`;
        if (feature.properties.service_request_open_timestamp) {
          const openDate = new Date(feature.properties.service_request_open_timestamp);
          popupContent += `<br>Opened: ${openDate.toLocaleDateString()}`;
        }

        marker.bindPopup(popupContent);
        marker.on('click', () => {
          selectRowByFeatureProperties(feature.properties);
        });
        
        data311Layer.addLayer(marker);
      });

      // For neighborhoods without specific coordinates but with counts
      // We still need these coordinates for the heatmap data
      const neighborhoodCenters = {
        "Downtown": [49.281, -123.120],
        "Fairview": [49.265, -123.135],
        "Marpole": [49.210, -123.130],
        "Dunbar-Southlands": [49.240, -123.185],
        "Grandview-Woodland": [49.275, -123.070],
        "Hastings-Sunrise": [49.281, -123.039],
        "Renfrew-Collingwood": [49.240, -123.040],
        "Sunset": [49.223, -123.090],
        "Oakridge": [49.230, -123.120]
      };

      // Only add heatmap data from neighborhoods (not the marker circles)
      neighborhoodCountMap.forEach((count, neighborhood) => {
        if (neighborhoodCenters[neighborhood] && count > 0) {
          const coords = neighborhoodCenters[neighborhood];
          // Add to heatmap with intensity based on count
          const intensity = Math.min(count / 5, 1.0); // Normalize, max at 5+ requests
          heatData.push([coords[0], coords[1], intensity]);

          // We remove the cluster marker creation here
          // No more gray circles with numbers
        }
      });

      // Add heatmap for 311 calls
      if (window.L.heatLayer && heatData.length > 0) {
        const heatmap = window.L.heatLayer(heatData, {
          radius: 30,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: layerColors.data311Low,
            0.5: layerColors.data311Medium,
            0.8: layerColors.data311High
          }
        });

        data311Layer.addLayer(heatmap);
      }

      return { data311Layer, data311 };
    } catch (error) {
      console.error("Error fetching 311 data:", error);
      return { data311Layer: L.layerGroup(), data311: { features: [] } };
    }
  };

  const fetchDemographics = async () => {
    try {
      const res = await fetch('/data/demographic-data.geojson');
      const demographicsData = await res.json();
      const demographicsLayer = L.layerGroup();

      if (demographicsData.features && demographicsData.features.length > 0) {
        demographicsData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.type === 'Polygon') {
            // Convert GeoJSON coordinates to Leaflet format
            const coords = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);

            // Get demographic information from properties
            const name = feature.properties?.name || 'Neighborhood';
            const socioEconomicValue = feature.properties?.socioEconomicValue || 50;

            // Normalize value to determine color
            const normalized = socioEconomicValue / 100;

            const color = normalized > 0.8 ? layerColors.demoHigh :
              normalized > 0.5 ? layerColors.demoMedium : layerColors.demoLow;

            const polygon = L.polygon(coords, {
              color: COLORS.primary,
              fillColor: color,
              weight: 1,
              opacity: 0.5,
              fillOpacity: 0.3
            }).bindPopup(`<strong>${name}</strong><br>Socio-Economic Index: ${socioEconomicValue}`);

            snapLayersRef.current.push(polygon);

            demographicsLayer.addLayer(polygon);
            demographicPolygonsRef.current.push({ polygon, socioEconomicValue });


          }
        });
      }

      return { demographicsLayer, demographicsData };
    } catch (error) {
      console.error("Error fetching demographics data:", error);
      return L.layerGroup(); // Return empty layer on error
    }
  };
  
  useEffect(() => {
    const initializeMap = async () => {
      
  
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
  
      if (map || !mapContainerRef.current) return;
  
      // Load heatmap plugin
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);
  
    
      // Initialize base map
      const leafletMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 3,
        maxZoom: 18,
        doubleClickZoom: false
      }).setView([49.24, -123.119], 12);
      leafletMap.createPane('drawPane');
      leafletMap.getPane('drawPane').style.zIndex = 100000000000;
  
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);
  
      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);
  
      setMap(leafletMap);
      
      // Initialize geocoder
      const geocoderControl = L.Control.geocoder({
        defaultMarkGeocode: false
      });
      geocoderRef.current = geocoderControl;
  
      geocoderControl.on('markgeocode', function (e) {
        const bbox = e.geocode.bbox;
        const poly = L.polygon([
          bbox.getSouthEast(),
          bbox.getNorthEast(),
          bbox.getNorthWest(),
          bbox.getSouthWest()
        ]);
        leafletMap.fitBounds(poly.getBounds());
        L.marker(e.geocode.center).addTo(leafletMap);
      });
  
      
      
      // Fetch all data in parallel
      const [
        floodZonesResult,
        infrastructureResult,
        stormwaterResult,
        data311Result,
        demographicsResult
      ] = await Promise.all([
        fetchFloodZones(),
        fetchInfrastructureData(),
        fetchStormwaterProjects(),
        fetch311Data(),
        fetchDemographics()
      ]);
      
      
      // Process tables if needed
      if (infrastructureResult.streetData && infrastructureResult.sewerData) {
        const combinedInfraData = {
          features: []
        };
        if (infrastructureResult.streetData.features) {
          infrastructureResult.streetData.features.forEach(feature => {
            combinedInfraData.features.push({
              ...feature,
              properties: { ...feature.properties, type: 'Street' }
            });
          });
        }
        if (infrastructureResult.sewerData.features) {
          infrastructureResult.sewerData.features.forEach(feature => {
            combinedInfraData.features.push({
              ...feature,
              properties: { ...feature.properties, type: 'Sewer Line' }
            });
          });
        }
        const infrastructureTable = convertGeoJSONToTable(combinedInfraData, 'infrastructure');
        setTableData(prevData => {
          const newData = [...prevData];
          newData[0] = infrastructureTable;
          return newData;
        });
      }
      
      if (stormwaterResult.projectsData) {
        const stormwaterProjectsTable = convertGeoJSONToTable(stormwaterResult.projectsData, 'stormwaterProjects');
        setTableData(prevData => {
          const newData = [...prevData];
          newData[1] = stormwaterProjectsTable;
          return newData;
        });
      }
      
      if (data311Result.data311) {
        const data311Table = convertGeoJSONToTable(data311Result.data311, 'data311');
        setTableData(prevData => {
          const newData = [...prevData];
          newData[2] = data311Table;
          return newData;
        });
      }
      
      if (demographicsResult.demographicsData) {
        const demographicsTable = convertGeoJSONToTable(demographicsResult.demographicsData, 'demographics');
        setTableData(prevData => {
          const newData = [...prevData];
          newData[3] = demographicsTable;
          return newData;
        });
      }
      
      // Create infrastructure outside layer
      const createInfrastructureOutsideLayer = async (map) => {
        try {
          if (!infrastructureResult.infraLayer || !stormwaterResult.projectsLayer) {
            console.error("Required layers not available for spatial analysis");
            return L.layerGroup();
          }
  
          // This is a simplified approach since we can't easily do true GIS operations in the browser
          // For a production app, you would use a server-side GIS library or service
  
          // 1. First we need to get all the infrastructure items
          const infraItems = [];
          infrastructureResult.infraLayer.eachLayer(layer => {
            if (layer instanceof L.Polyline) {
              infraItems.push({
                layer: layer,
                bounds: layer.getBounds(),
                center: layer.getBounds().getCenter(),
                type: layer.options.dashArray ? 'Sewer Line' : 'Street',
                condition: layer._popup ? (layer._popup._content.includes('Condition: F') ? 'F' :
                  layer._popup._content.includes('Condition: E') ? 'E' :
                    layer._popup._content.includes('Condition: D') ? 'D' : 'C') : 'Unknown'
              });
            }
          });
  
          // 2. Now we need to get all project areas
          const projectAreas = [];
          stormwaterResult.projectsLayer.eachLayer(layer => {
            if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
              projectAreas.push({
                layer: layer,
                bounds: layer.getBounds(),
                buffer: 0.001 // Small buffer (about 100m) around project areas
              });
            }
          });
  
          // 3. Find infrastructure that doesn't intersect with any project area
          // and prioritize poor condition infrastructure
          const outsideLayer = L.layerGroup();
          const criticalInfra = infraItems.filter(item => {
            // Check if the infrastructure is in poor condition
            const isPoorCondition = item.condition === 'E' || item.condition === 'F' || item.condition === 'D';
  
            // Check if it's outside of all project areas
            const isOutside = projectAreas.every(project => {
              // Create buffered bounds
              const bufferedBounds = L.latLngBounds(
                [project.bounds.getSouth() - project.buffer, project.bounds.getWest() - project.buffer],
                [project.bounds.getNorth() + project.buffer, project.bounds.getEast() + project.buffer]
              );
  
              // Check if infrastructure is outside the buffered project area
              return !bufferedBounds.contains(item.center);
            });
  
            return isPoorCondition && isOutside;
          });
  
          // 4. Add the critical infrastructure as markers only (no lines)
          criticalInfra.forEach(item => {
            // Create popup with infrastructure information
            let popupContent = `<strong>Warning: ${item.type}</strong><br>Condition: ${item.condition}<br>Priority: High<br>Status: Outside Current Project Areas`;
  
            // Create a marker at the center point of the infrastructure
            const marker = L.marker(item.center, {
              icon: L.divIcon({
                html: '<div style="background-color: red; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>',
                className: '',
                iconSize: [14, 14]
              })
            }).bindPopup(popupContent);
  
            outsideLayer.addLayer(marker);
          });
  
          return outsideLayer;
        } catch (error) {
          console.error("Error creating infrastructure outside projects layer:", error);
          return L.layerGroup(); // Return empty layer on error
        }
      };
      
      const infrastructureOutsideLayer = await createInfrastructureOutsideLayer(leafletMap);
      
      
      
      
      // Create a layer group to hold all layers
      const allLayers = L.layerGroup();
      
      // Add all layers to the group
      allLayers.addLayer(floodZonesResult.floodLayer);
      allLayers.addLayer(infrastructureResult.infraLayer);
      allLayers.addLayer(stormwaterResult.projectsLayer);
      allLayers.addLayer(infrastructureOutsideLayer);
      allLayers.addLayer(data311Result.data311Layer);
      allLayers.addLayer(demographicsResult.demographicsLayer);
      
      // Add the layer group to the map (this makes all layers appear at once)
      allLayers.addTo(leafletMap);
      
      // Store references to layers in the map object for later use
      leafletMap.floodZoneLayer = floodZonesResult.floodLayer;
      leafletMap.infrastructureLayer = infrastructureResult.infraLayer;
      leafletMap.stormwaterProjectsLayer = stormwaterResult.projectsLayer;
      leafletMap.infrastructureOutsideLayer = infrastructureOutsideLayer;
      leafletMap.data311Layer = data311Result.data311Layer;
      leafletMap.demographicsLayer = demographicsResult.demographicsLayer;
      
      
      
      if (onLayersReady) {
        onLayersReady();
      }
  
      if (window.setResponseReady) {
        window.setResponseReady(true);
      }
    };
  
    initializeMap();
  
    return () => map?.remove();
  }, []);

  useEffect(() => {
    if (!map) return;

    // Toggle flood zones layer
    if (map.floodZoneLayer) {
      if (activeLayers.floodZones) {
        map.addLayer(map.floodZoneLayer);
      } else {
        map.removeLayer(map.floodZoneLayer);
      }
    }

    // Toggle infrastructure layer
    if (map.infrastructureLayer) {
      if (activeLayers.infrastructure) {
        map.addLayer(map.infrastructureLayer);
      } else {
        map.removeLayer(map.infrastructureLayer);
      }
    }

    // Toggle stormwater projects layer
    if (map.stormwaterProjectsLayer) {
      if (activeLayers.stormwaterProjects) {
        map.addLayer(map.stormwaterProjectsLayer);
      } else {
        map.removeLayer(map.stormwaterProjectsLayer);
      }
    }

    // Toggle infrastructure outside projects layer
    if (map.infrastructureOutsideLayer) {
      if (activeLayers.infrastructureOutsideProjects) {
        map.addLayer(map.infrastructureOutsideLayer);
      } else {
        map.removeLayer(map.infrastructureOutsideLayer);
      }
    }

    // Toggle 311 data layer
    if (map.data311Layer) {
      if (activeLayers.data311) {
        map.addLayer(map.data311Layer);
      } else {
        map.removeLayer(map.data311Layer);
      }
    }

    // Toggle demographics layer
    if (map.demographicsLayer) {
      if (activeLayers.demographics) {
        map.addLayer(map.demographicsLayer);
      } else {
        map.removeLayer(map.demographicsLayer);
      }
    }
  }, [map, activeLayers]);

  useEffect(() => {
    if (!map) return;

    // Helper function for debugging
    const debugLayers = () => {
      console.log('Updating layers with new colors:');
      console.log('Flood polygons:', floodPolygonsRef.current.length);
      console.log('Street lines:', streetLinesRef.current.length);
      console.log('Sewer lines:', sewerLinesRef.current.length);
      console.log('Project features:', projectFeaturesRef.current.length);
      console.log('Demographic polygons:', demographicPolygonsRef.current.length);
    };

    // Log current state for debugging
    debugLayers();

    // Force map to redraw by invalidating size
    map.invalidateSize();

    // Flood Zones
    floodPolygonsRef.current.forEach(({ polygon, properties }) => {
      let color = layerColors.floodMedium;
      let fillColor = layerColors.floodLight;

      if (properties?.risk_level === 'high') {
        color = layerColors.floodDark;
        fillColor = layerColors.floodMedium;
      } else if (properties?.risk_level === 'low') {
        color = layerColors.floodLight;
        fillColor = layerColors.floodLight;
      }

      // Use both setStyle and options approach for maximum compatibility
      polygon.setStyle({ color, fillColor });
      polygon.options.color = color;
      polygon.options.fillColor = fillColor;
    });

    // Streets
    streetLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.streetMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.streetGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.streetMedium;
      else color = layerColors.streetPoor;

      line.setStyle({ color });
      line.options.color = color;
    });

    // Sewer Lines 
    sewerLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.sewerMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.sewerGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.sewerMedium;
      else color = layerColors.sewerPoor;

      if (line && typeof line.setStyle === 'function') {
        line.setStyle({ color });
        line.options.color = color;
      }
    });

    // Projects
    projectFeaturesRef.current.forEach(({ element }) => {
      if (element && element.setStyle) {
        element.setStyle({ color: layerColors.projectActive });
        element.options.color = layerColors.projectActive;
      } else if (element && element.setIcon) {
        element.setIcon(L.divIcon({
          html: `<div style="background-color: ${layerColors.projectActive}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: '',
          iconSize: [16, 16]
        }));
      }
    });

    // Demographics
    demographicPolygonsRef.current.forEach(({ polygon, socioEconomicValue }) => {
      const normalized = socioEconomicValue / 100;
      const fillColor = normalized > 0.8
        ? layerColors.demoHigh
        : normalized > 0.5
          ? layerColors.demoMedium
          : layerColors.demoLow;

      polygon.setStyle({ fillColor });
      polygon.options.fillColor = fillColor;
    });

    // 311 Data - We don't try to update heatmap colors dynamically
    // Instead, let's just make sure the existing layer is visible
    if (map.data311Layer && activeLayers.data311) {
      // Simply make sure the layer is added (it may already be)
      if (!map.hasLayer(map.data311Layer)) {
        map.addLayer(map.data311Layer);
      }
    }

    // Force redraw after updates
    setTimeout(() => {
      if (map) {
        map.invalidateSize();
      }
    }, 100);

  }, [layerColors, map]);


  const getLayerKeyFromLegend = (layerId, label) => {
    const clean = (str) => str.toLowerCase().replace(/[^a-z]/g, '');
  
    if (layerId === 'floodZones') {
      if (label.includes('Low')) return 'floodLight';
      if (label.includes('Medium')) return 'floodMedium';
      if (label.includes('High')) return 'floodDark';
    }
  
    if (layerId === 'infrastructure') {
      if (label.includes('Street') && label.includes('Good')) return 'streetGood';
      if (label.includes('Street') && label.includes('Fair')) return 'streetMedium';
      if (label.includes('Street') && label.includes('Poor')) return 'streetPoor';
      if (label.includes('Sewer') && label.includes('Good')) return 'sewerGood';
      if (label.includes('Sewer') && label.includes('Fair')) return 'sewerMedium';
      if (label.includes('Sewer') && label.includes('Poor')) return 'sewerPoor';
    }
  
    if (layerId === 'stormwaterProjects') {
      if (label.includes('Active')) return 'projectActive';
      if (label.includes('Planned')) return 'projectPlanned';
    }
  
    if (layerId === 'data311') {
      if (label.includes('Low')) return 'data311Low';
      if (label.includes('Medium')) return 'data311Medium';
      if (label.includes('High')) return 'data311High';
    }
  
    if (layerId === 'demographics') {
      if (label.includes('Low')) return 'demoLow';
      if (label.includes('Medium')) return 'demoMedium';
      if (label.includes('High')) return 'demoHigh';
    }
  
    return '';
  };
  


  const Toolbar = ({
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
    setToolbarPosition
  }) => {
    const toolbarRef = useRef(null);
    const dragStart = useRef({ x: 0, y: 0 });

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

    // 🌐 REGULAR VIEW TOOLBAR
    if (!isFullscreen) {
      return (
        <div
          className="flex justify-center items-center space-x-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 shadow-sm z-30 rounded-full transition-all duration-300"
          style={{
            position: 'absolute',
            bottom: showTable ? `${tableHeight + 4}px` : '0px',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
          {/* your normal buttons here... */}
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
          top: `${toolbarPosition.top}px`,
          left: `${toolbarPosition.left}px`,
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



  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeammate, setSelectedTeammate] = useState(null);

  const teammateList = [
    "Alice Johnson", "Bob Smith", "Catherine Nguyen", "David Li", "Emma Patel"
  ];

  const filteredTeammates = teammateList.filter(name =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`flex flex-col overflow-visible transition-all duration-300 ${isFullscreen
      ? 'fixed top-12 bottom-4 left-4 right-4 z-50 bg-transparent rounded-2xl shadow-2xl border border-gray-300'
      : 'h-full max-h-screen'
      }`}>
        {isFullscreen && title && (
  <div className="absolute top-4 left-4 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 backdrop-blur-md shadow-md border border-gray-200">
    {onBack && (
      <button
        onClick={onBack}
        className="p-1 rounded-full border border-[#008080] hover:bg-[#008080] bg-white group transition-colors"
        aria-label="Back to List"
      >
        <ArrowLeft className="h-4 w-4 text-[#008080] group-hover:text-white" />
      </button>
    )}
    <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
  </div>
)}
      <div className="flex-1 relative">
        {showSources && (
          <div ref={infoRef} className="absolute top-4 right-4 w-[280px] bg-white border border-gray-200 rounded-xl shadow-lg p-5 z-50 animate-fade-in">
            <div className="space-y-2 text-sm text-gray-700">
              <h3 className="font-semibold text-primary">Data Sources</h3>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Vancouver Flood Maps
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Infrastructure Database
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Stormwater Projects
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  311 Service Requests
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Demographic Statistics
                </a>
              </div>
            </div>
          </div>
        )}

        {showSaveDialog && (
          <div className="absolute bottom-[60px] right-6 z-[1000]">
            <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
              <button
                onClick={() => setShowSaveDialog(false)}
                className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>

              <h2 className="text-lg font-semibold text-gray-800 mb-4">Save Map</h2>
              <input
                type="text"
                placeholder="Enter a name"
                value={customSaveName}
                onChange={(e) => setCustomSaveName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
              />
              <button
                className="mt-4 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
                onClick={() => {
                  const name = customSaveName.trim() || 'Untitled Map';
                  const artifact = {
                    id: Date.now().toString(),
                    title: name,
                    type: 'map',
                    component: 'MapComponent',
                    data: {
                      conversationId: localStorage.getItem('activeConversationId') || '',
                    },
                    date: new Date().toLocaleDateString(),
                  };

                  if (typeof setSavedArtifacts === 'function') {
                    setSavedArtifacts((prev) => {
                      const updated = [...prev, artifact];
                      localStorage.setItem('savedArtifacts', JSON.stringify(updated));
                      return updated;
                    });
                  }

                  const msg = `${name} has been saved`;
                  setShowSaveDialog(false);
                  setCustomSaveName('');
                  setNotificationMessage(msg);
                  setShowEmailNotification(true);
                  addNotification(msg);
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

        {showSymbologyEditor && (
          <div className="absolute top-16 right-4 z-[1000]">
            <div className="bg-white p-5 rounded-xl w-[380px] max-h-[75vh] overflow-y-auto shadow-xl border border-gray-200">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-base font-semibold text-gray-800">Customize Layer Colors</h3>
                <button onClick={() => setShowSymbologyEditor(false)}>
                  <X size={16} className="text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <div className="space-y-3">
                {Object.entries(layerColors).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center">
                    <label className="capitalize text-sm text-gray-700">{key.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) =>
                        setLayerColors((prev) => ({
                          ...prev,
                          [key]: e.target.value
                        }))
                      }
                      className="w-10 h-6 border rounded"
                    />
                  </div>
                ))}
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    const updatedColors = { ...layerColors };
                    setLayerColors(updatedColors);
                    setShowSymbologyEditor(false);

                    if (map) {
                      setTimeout(() => map.invalidateSize(), 100);
                    }
                  }}
                  className="px-4 py-1 bg-[#008080] text-white rounded hover:bg-teal-700 text-sm"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
        {showGeocoder && (
          <div className="absolute top-6 left-6 z-[999999] w-[300px] overflow-visible">
<div className="relative w-full max-w-xs z-10">
<input
              type="text"
              placeholder="Search a location..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                runGeocodeSearch(e.target.value);
              }}
              className="w-full px-4 pr-10 py-2 text-sm rounded-full shadow-md border"
              style={{
                backgroundColor: 'white',
                borderColor: '#008080',
                outline: 'none',
                boxShadow: '0 0 0 2px rgba(0,128,128,0.1)',
                transition: 'border 0.2s ease-in-out'
              }}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 0 3px rgba(0,128,128,0.3)')}
              onBlur={(e) => (e.target.style.boxShadow = '0 0 0 2px rgba(0,128,128,0.1)')}
              
            />
     



            </div>
            {searchResults.length > 0 && (
  <div className="bg-white border border-gray-200 rounded-lg shadow-md mt-1 max-h-48 overflow-y-auto divide-y divide-gray-100">
    {searchResults.map((result, idx) => (
      <div
        key={idx}
        onClick={() => handleResultClick(result)}
        className="px-4 py-2 hover:bg-[#008080]/10 cursor-pointer text-sm transition-colors duration-150"
      >
        <div className="font-medium text-gray-800">{result.name}</div>
        <div className="text-xs text-gray-500 truncate">{result.fullName}</div>
      </div>
    ))}
  </div>
)}
          </div>
        )}



        {showDrawTools && (
          <div
            className="absolute z-[9999] w-[260px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 transition-all animate-fade-in"
            style={{
              top: isFullscreen ? '80px' : '280px',
              left: isFullscreen ? '100px' : '60px',
            }}
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-base font-semibold text-gray-800">Drawing Tools</h3>
              <button onClick={() => setShowDrawTools(false)}>
                <X size={16} className="text-gray-500 hover:text-gray-700" />
              </button>
            </div>
            <div className="grid gap-2">


          <button
            onClick={() => setShowGeocoder(!showGeocoder)}
            data-tooltip="Search Location"
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
            <TbMapSearch size={16} />
          </button>
              <button
                className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"


// This is a complete replacement for your polygon drawing button's click handler
// Find the "PiPolygon" button click handler and replace its entire function with this code:

onClick={() => {
  if (!map) return;
  setShowDrawTools(false);
  
  // Prevent duplicate draw tools
  if (map._drawControl) {
    map._drawControl.disable();
  }

  // Ensure draw handler is removed before adding a new one
  map.off(L.Draw.Event.CREATED);
  
  // Initialize the polygon drawing with proper settings
  const drawPolygon = new L.Draw.Polygon(map, {
    allowIntersection: false,
    showArea: true,
    repeatMode: false,
    finishOnDoubleClick: true,
    shapeOptions: {
      color: '#008080',
      weight: 2,
      opacity: 0.8,
      fillOpacity: 0.3
    },
    showLength: true,
    // Make sure markers are visible and clickable
    zIndexOffset: 2000,
    icon: new L.DivIcon({
      iconSize: new L.Point(16, 16),
      className: 'leaflet-div-icon leaflet-editing-icon'
    })
  });
  
  // Enable drawing
  drawPolygon.enable();
  map._drawControl = drawPolygon;
  setActiveDrawTool('polygon');
  
  // THIS IS THE CRITICAL PART
  // We need to wait a moment for the drawing handler to initialize fully
  setTimeout(() => {
    if (!map._drawControl || !map._drawControl._markers) return;
    
    // Store reference to original marker click handler
    const originalMarkerClickHandler = map._drawControl._onMarkerClick;
    
    // Override the marker click handler
    map._drawControl._onMarkerClick = function(e) {
      // Check if this is the first marker AND we have enough points for a valid polygon
      if (e.target === map._drawControl._markers[0] && map._drawControl._markers.length >= 3) {
        // Complete the polygon when first marker is clicked
        map._drawControl._finishShape();
        return;
      }
      
      // Otherwise, use original handler
      if (originalMarkerClickHandler) {
        originalMarkerClickHandler.call(map._drawControl, e);
      }
    };
    
    // Make first marker visually distinctive so users know they can click it
    if (map._drawControl._markers && map._drawControl._markers.length > 0) {
      const firstMarker = map._drawControl._markers[0];
      if (firstMarker && firstMarker._icon) {
        // Make the first marker more visible to indicate it can be clicked
        firstMarker._icon.style.backgroundColor = '#008080';
        firstMarker._icon.style.border = '2px solid white';
        firstMarker._icon.style.zIndex = '1000';
      }
    }
  }, 200); // Slight delay to ensure drawing handler is fully initialized
  
  // Enhanced snap functionality
  const handleSnap = (e) => {
    if (!map._drawControl || !map._drawControl._poly) return;
    
    const currentPoint = e.latlng;
    let closestPoint = null;
    let minDistance = 20; // Snap threshold in pixels
    
    // Search all snap layers for closest point
    snapLayersRef.current.forEach(layer => {
      if (typeof layer.getLatLngs !== 'function') return;
      
      const points = layer.getLatLngs();
      // Handle both simple polylines and polygons (potentially nested arrays)
      const flatPoints = points.flat ? points.flat(Infinity) : 
                        Array.isArray(points[0]) ? points[0] : points;
      
      flatPoints.forEach(pt => {
        const dist = map.latLngToLayerPoint(currentPoint)
                       .distanceTo(map.latLngToLayerPoint(pt));
        if (dist < minDistance) {
          minDistance = dist;
          closestPoint = pt;
        }
      });
    });
    
    // Apply snap if we found a close enough point
    if (closestPoint) {
      // Update the cursor position on screen
      if (map._drawControl._mouseMarker) {
        map._drawControl._mouseMarker.setLatLng(closestPoint);
      }
    }
  };
  
  // Add mousemove handler for snapping
  map.on('mousemove', handleSnap);
  
  // Watch for the first marker to be created and set up a click handler on it
  map.on('draw:drawvertex', function(e) {
    if (!map._drawControl || !map._drawControl._markers) return;
    
    // For each draw:drawvertex event, check if we need to update our click handler
    // This helps ensure our custom handler is in place even as new vertices are added
    setTimeout(() => {
      if (map._drawControl && map._drawControl._markers && map._drawControl._markers.length > 0) {
        const firstMarker = map._drawControl._markers[0];
        if (firstMarker && firstMarker._icon) {
          // Make the first marker visually distinctive
          firstMarker._icon.style.backgroundColor = '#008080';
          firstMarker._icon.style.border = '2px solid white';
          firstMarker._icon.style.zIndex = '1000';
        }
      }
    }, 10);
  });
  
  // Clean up after drawing is complete
  map.once(L.Draw.Event.CREATED, function(e) {
    const layer = e.layer;
    map.drawnItems.addLayer(layer);
    map.off('mousemove', handleSnap);
    map._drawControl = null;
    setActiveDrawTool(null);
    
    // Calculate and display the area
    try {
      const latlngs = layer.getLatLngs()[0];
      let area = 0;
      
      // Calculate area (using Leaflet's utility if available)
      if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
        area = L.GeometryUtil.geodesicArea(latlngs);
      } else {
        // Fallback calculation
        for (let i = 0, len = latlngs.length, j = len - 1; i < len; j = i++) {
          const p1 = latlngs[i];
          const p2 = latlngs[j];
          area += (p2.lng + p1.lng) * (p2.lat - p1.lat);
        }
        // Rough conversion to square meters (depends on latitude)
        area = Math.abs(area * 111319.9 * 111319.9 / 2);
      }
      
      // Format area for display
      const readableArea = area > 1000000 ? 
                          `${(area/1000000).toFixed(2)} km²` : 
                          `${Math.round(area)} m²`;
      
      // Show area in a popup
      L.popup()
       .setLatLng(layer.getBounds().getCenter())
       .setContent(`<strong>Area:</strong> ${readableArea}`)
       .openOn(map);
    } catch (err) {
      console.error("Error calculating area:", err);
    }
  });
}}

              >
  <PiPolygon size={16}/>
  </button>
              <button
                className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                onClick={() => {
                  if (!map) return;
                  setShowDrawTools(false);
                  if (map._drawControl) {
                    map._drawControl.disable();
                  }

                  const drawCircle = new L.Draw.Circle(map, {
                    shapeOptions: {
                      color: '#008080',
                      weight: 2,
                      opacity: 0.8,
                      fillColor: '#008080',
                      fillOpacity: 0.2,
                      pane: 'drawPane',
                    }
                  });

                  drawCircle.enable();
                  map._drawControl = drawCircle;

                  map.on(L.Draw.Event.CREATED, function (e) {
                    const layer = e.layer;
                    map.drawnItems.addLayer(layer);
                    map._drawControl = null;
                  });
                }}
              >
  <FaRegCircle size={16}/>
  </button>
              <button
                className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                onClick={() => {
                  if (!map) return;
                  setShowDrawTools(false);
                  // Disable existing draw control if any
                  if (map._drawControl) {
                    map._drawControl.disable();
                  }

                  // Create dashed polyline draw tool
                  const drawPolyline = new L.Draw.Polyline(map, {
                    shapeOptions: {
                      color: '#008080',
                      weight: 3,
                      opacity: 0.8,
                      dashArray: '6, 6', // <-- dashed line
                    },
                    repeatMode: false,
                  });

                  drawPolyline.enable();
                  map._drawControl = drawPolyline;

                  // Handle completed line
                  map.once(L.Draw.Event.CREATED, function (e) {
                    const layer = e.layer;
                    const latlngs = layer.getLatLngs();

                    let totalDistance = 0;
                    for (let i = 0; i < latlngs.length - 1; i++) {
                      totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
                    }

                    const popup = L.popup()
                      .setLatLng(latlngs[Math.floor(latlngs.length / 2)])
                      .setContent(`<strong>Total Distance:</strong> ${totalDistance.toFixed(2)} meters`)
                      .openOn(map);

                    // Add the line to map temporarily
                    layer.addTo(map);

                    // Remove line after popup shows (1.5s delay for smoother UX)
                    setTimeout(() => {
                      map.removeLayer(layer);
                    }, 1500);

                    map._drawControl = null;
                  });
                }}
              >
  <GiPathDistance size={16}/>
  </button>

              <button
                className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                onClick={() => {
                  if (!map) return;
                  setShowDrawTools(false);
                  // Disable any active drawing tool
                  if (map._drawControl) {
                    map._drawControl.disable();
                  }

                  const drawPolygon = new L.Draw.Polygon(map, {
                    allowIntersection: false,
                    showArea: true,
                    repeatMode: false,
                    finishOnDoubleClick: true,
                    shapeOptions: {
                      color: '#008080',
                      weight: 2,
                      opacity: 0.8,
                      fillOpacity: 0.3
                    },
                    // This allows the polygon to be completed by clicking on the first point
                    showLength: true,
                  });
                  const mapContainer = map.getContainer();
                  mapContainer.addEventListener('dblclick', function (e) {
                    if (map._drawControl && map._drawControl instanceof L.Draw.Polygon) {
                      // This will trigger the finishShape method internally
                      map._drawControl._finishShape();
                      e.stopPropagation();
                    }
                  }, { once: true });

                  drawPolygon.enable();
                  map.once('click', function checkFirstPoint(e) {
                    const firstMarker = document.querySelector('.leaflet-draw-tooltip-end'); // marker for first point
                    if (!firstMarker) return;
                  
                    firstMarker.addEventListener('click', () => {
                      if (map._drawControl && map._drawControl._finishShape) {
                        map._drawControl._finishShape();
                      }
                    });
                  });
                  
                  const handleSnap = (e) => {
                    if (!map._drawControl || !map._drawControl._shape) return;
                  
                    const drawnShape = map._drawControl._shape;
                    const latlngs = drawnShape.getLatLngs()[0]; // For polygon
                    if (!latlngs || latlngs.length === 0) return;
                  
                    const currentPoint = e.latlng;
                  
                    let closestPoint = null;
                    let minDistance = Infinity;
                  
                    snapLayersRef.current.forEach(layer => {
                      if (typeof layer.getLatLngs !== 'function') return;
                      const points = layer.getLatLngs().flat(Infinity);
                  
                      points.forEach(pt => {
                        const dist = currentPoint.distanceTo(pt);
                        if (dist < 20 && dist < minDistance) {
                          minDistance = dist;
                          closestPoint = pt;
                        }
                      });
                    });
                  
                    if (closestPoint) {
                      latlngs[latlngs.length - 1] = closestPoint;
                      drawnShape.setLatLngs([latlngs]);
                    }
                  };
                  
                  map.on('mousemove', handleSnap);
                  
                  // Clean up after drawing
                  map.once(L.Draw.Event.CREATED, function (e) {
                    map.drawnItems.addLayer(e.layer);
                    map.off('mousemove', handleSnap); // remove snap listener
                    map._drawControl = null;
                    setActiveDrawTool(null);
                  });
                  
                  map._drawControl = drawPolygon;
                  map.on('mousemove', function (e) {
                    if (!map._drawControl || !map._drawControl._shape) return;

                    const drawnShape = map._drawControl._shape;
                    const currentPoint = e.latlng;

                    let closestPoint = null;
                    let minDistance = Infinity;

                    snapLayersRef.current.forEach(layer => {
                      if (typeof layer.getLatLngs !== 'function') return;

                      const latlngs = layer.getLatLngs().flat(Infinity); // flatten nested arrays
                      latlngs.forEach(pt => {
                        const dist = currentPoint.distanceTo(pt);
                        if (dist < 20 && dist < minDistance) { // Snap threshold: 20 meters
                          minDistance = dist;
                          closestPoint = pt;
                        }
                      });
                    });

                    if (closestPoint) {
                      const shape = drawnShape.getLatLngs();
                      if (shape.length > 0) {
                        shape[shape.length - 1] = closestPoint;
                        drawnShape.setLatLngs(shape);
                      }
                    }
                  });

                  map.once(L.Draw.Event.CREATED, function (e) {
                    const layer = e.layer;
                    const latlngs = layer.getLatLngs()[0];

                    let area = 0;

                    // Option 1: Leaflet.GeometryUtil
                    if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
                      area = L.GeometryUtil.geodesicArea(latlngs);
                    }

                    // Option 2: Turf.js
                    else if (window.turf && window.turf.polygon && window.turf.area) {
                      const coords = latlngs.map(p => [p.lng, p.lat]);
                      const polygon = window.turf.polygon([[...coords, coords[0]]]);
                      area = window.turf.area(polygon);
                    }

                    // Option 3: Approximate planar method (not geodesic, fallback)
                    else {
                      for (let i = 0, len = latlngs.length, j = len - 1; i < len; j = i++) {
                        const p1 = latlngs[i];
                        const p2 = latlngs[j];
                        area += (p2.lng + p1.lng) * (p2.lat - p1.lat);
                      }
                      area = Math.abs(area / 2) * 12365; // Rough multiplier to convert to m²
                    }

                    const readable =
                      area > 1_000_000
                        ? `${(area / 1_000_000).toFixed(2)} km²`
                        : `${area.toFixed(0)} m²`;

                    const popup = L.popup()
                      .setLatLng(layer.getBounds().getCenter())
                      .setContent(`<strong>Area:</strong> ${readable}`)
                      .openOn(map);

                    layer.addTo(map);
                    map._drawControl = null;
                  });
                }}
              >
  <LiaShareAltSolid size={16}/>
  </button>
              <button
                className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                onClick={() => {
                  if (!map || !map.drawnItems) return;
                  setShowDrawTools(false);
                  // Disable previous draw tools if any
                  if (map._drawControl) {
                    map._drawControl.disable();
                  }

                  // Create a higher z-index pane specifically for editing vertices if needed
                  if (!map.getPane('editPane')) {
                    map.createPane('editPane');
                    map.getPane('editPane').style.zIndex = 700; // Even higher than drawPane
                  }

                  // Configure the edit options with high z-index for vertices
                  const editControl = new L.EditToolbar.Edit(map, {
                    featureGroup: map.drawnItems,
                    edit: {
                      selectedPathOptions: {
                        pane: 'editPane',
                        maintainColor: true,
                        opacity: 0.8,
                        fillOpacity: 0.3,
                        dashArray: null
                      }
                    }
                  });

                  // Force the edit markers to appear on top
                  editControl.options.editLayer = new L.LayerGroup(null, { pane: 'editPane' });

                  editControl.enable();
                  map._drawControl = editControl;
                  editControlRef.current = editControl;
                  setIsEditing(true);

                  // When editing is complete
                  map.once('draw:edited', () => {
                    map._drawControl = null;
                    setIsEditing(false);
                  });
                }}
              >
  <LuMove3D size={16}/>
  </button>

              <button
  className="w-full px-3 py-2 rounded-md border text-sm font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
  onClick={() => {
    if (!map) return;
    setShowDrawTools(false);

    if (map._drawControl) {
      map._drawControl.disable();
    }

    // Set up Freehand Polyline
    const freehandPolyline = new L.Draw.Polyline(map, {
      shapeOptions: {
        color: '#ff6600',
        weight: 3,
        opacity: 0.8,
      },
      freehand: true // ✅ key setting
    });

    freehandPolyline.enable();
    map._drawControl = freehandPolyline;
    setActiveDrawTool('freehand');

    map.once(L.Draw.Event.CREATED, function (e) {
      const layer = e.layer;
      map.drawnItems.addLayer(layer);
      map._drawControl = null;
      setActiveDrawTool(null);
    });
  }}
>
<MdDraw size={16}/>
</button>
            </div>
          </div>
        )}
        {isEditing && (
          <button
            className="block w-full text-left font-semibold text-[#008080] border-t border-gray-200 pt-2 mt-2"
            onClick={() => {
              if (editControlRef.current) {
                editControlRef.current.disable();
                editControlRef.current = null;
              }
              setIsEditing(false);
            }}
          >
            Done Editing
          </button>
        )}







        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full" style={{ zIndex: 0 }} />


        {/* Drag handle */}
        {showTable && (
          <div
            ref={dragHandleRef}
            className="cursor-row-resize transition-all"
            onMouseDown={handleMouseDown}
            style={{
              height: "4px",
              backgroundColor: "#e0e0e0",
              position: "absolute",
              bottom: tableHeight,
              left: 0,
              right: 0,
              zIndex: 21
            }}
          />
        )}

        {/* Table section */}
        {showTable && (
          <div
            className="absolute bottom-0 left-0 right-0 bg-white shadow-inner border-t border-gray-300 z-20"
            style={{ height: `${tableHeight}px` }}
          >
            {/* Table header with tabs */}
            {!isFullscreen && <Toolbar showTable={true} />}
            <div className="flex justify-between items-center p-1 bg-white text-gray-800 border-b border-gray-200 h-10 px-4">
  {/* Tabs on the left */}
  <div className="flex space-x-1">
    {tableTitles.map((title, index) => (
      <button
        key={index}
        className={`px-2 py-1 border rounded-t-md text-xs font-medium transition-all duration-200
          ${currentTableIndex === index
            ? 'bg-[#008080] text-white border-[#008080]'
            : 'bg-white text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'}
        `}
        onClick={() => {
          setCurrentTableIndex(index);
          setOriginalRowsMap(prev => ({
            ...prev,
            [index]: JSON.parse(JSON.stringify(tableData[index].rows)) // deep clone
          }));
          setIsModified(false);
        }}
              >
        {title}
      </button>
    ))}
  </div>

</div>

            {/* Table content */}
            <div className="h-[calc(100%-40px)] overflow-auto p-2">
              {tableData[currentTableIndex] ? (
                <table className="min-w-full border-collapse">
                <thead>
  {/* Excel-style A/B/C header row */}
  <tr key="header-row">

    <th className="w-8 text-[10px] bg-gray-100"></th>
    {tableData[currentTableIndex].headers.map((_, colIdx) => (
      <th
        key={`abc-${colIdx}`}
        onClick={() =>
          setSelectedColIndex((prev) => (prev === colIdx ? null : colIdx))
        }
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            visible: true,
            x: e.clientX,
            y: e.clientY,
            type: 'column',
            index: colIdx,
            columnName: tableData[currentTableIndex].headers[colIdx],
          });
        }}        
        className={`px-3 py-1 text-center text-[10px] font-semibold text-gray-700 uppercase border border-gray-300
          ${selectedColIndex === colIdx ? 'bg-[#ccecec]' : 'bg-gray-100'}`}
      >
        {String.fromCharCode(65 + colIdx)}
      </th>
    ))}
  </tr>
  {/* Actual column names */}
  <tr key="column-names-row">

  <th className="w-8 bg-white"></th>
  {tableData[currentTableIndex].headers.map((header, idx) => (
    <th
      key={`label-${idx}`}
      className="px-3 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
    >
      <div className="flex items-center justify-between">
        <span>{header}</span>
        {showFilterIcons && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              const rect = e.currentTarget.getBoundingClientRect();
              const uniqueVals = [...new Set(tableData[currentTableIndex].rows.map(row => row[header]))];
              setFilterOptions(uniqueVals);
              setSelectedFilters(prev => ({
                ...prev,
                [header]: new Set(uniqueVals) // default: all selected
              }));
              setFilterColumn(header);
              setShowFilterDialog(true);
              // Position the filter dialog near the icon
              setFilterDialogPosition({ x: rect.right, y: rect.bottom });
            }}
            className="ml-1 text-gray-400 hover:text-gray-600 focus:outline-none"
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="10" 
              height="10" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
          </button>
        )}
      </div>
    </th>
  ))}
</tr>
</thead>

                <tbody>
                  {tableData[currentTableIndex].rows.map((row, selectedRowIndex) => (
  <tr key={`row-${selectedRowIndex}`}>
  <th
onClick={() =>
  setSelectedRowIndex((prev) => (prev === selectedRowIndex ? null : selectedRowIndex))
}
                        onContextMenu={(e) => handleRightClick(e, 'row', selectedRowIndex)}
                        className={`text-center text-[11px] font-semibold border border-gray-300 bg-gray-100
                          ${selectedRowIndex === selectedRowIndex ? 'bg-[#ccecec]' : ''}`}
                      >
                        {selectedRowIndex + 1}
                      </th>
                      {tableData[currentTableIndex].headers.map((header, colIdx) => (
                       <td
                       key={colIdx}
                       contentEditable
                       suppressContentEditableWarning
                       onBlur={(e) => {
                         const value = e.target.innerText.trim();
                         const header = tableData[currentTableIndex].headers[colIdx];
                         setTableData(prev => {
                           const updated = [...prev];
                           updated[currentTableIndex].rows[selectedRowIndex][header] = value;
                           return updated;
                         });
                       }}
                       className="px-2 py-1 text-xs border border-gray-200 min-w-[80px] whitespace-nowrap align-top hover:bg-[#f0fdfa]"
                       style={{ outline: 'none' }}
                     >
                       {
                         tableData[currentTableIndex].rows[selectedRowIndex][
                           tableData[currentTableIndex].headers[colIdx]
                         ]
                       }
                     </td>
                     
                     
                     
                      
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              
                
              ) : (
                <div className="h-full flex flex-col items-center justify-center">
                  <Table className="h-8 w-8 text-coral/50 mb-2" />
                  <p className="text-sm text-gray-500">No data available for this layer</p>
                </div>
              )}
            </div>
          

          </div>
        )}
        {contextMenu.visible && (
  <div
    className="fixed z-[9999] w-28 rounded-md border border-gray-200 bg-white shadow-xl text-xs font-medium"
    style={{ top: contextMenu.y, left: contextMenu.x }}
  >
    <div className="py-1 text-gray-800">
      {contextMenu.type === 'row' && (
        <button
          onClick={() => {
            setTableData(prev => {
              const updated = [...prev];
              updated[currentTableIndex].rows.splice(contextMenu.index, 1);
              return updated;
            });
            setSelectedRowIndex(null);
            closeContextMenu();
          }}
          className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Delete Row
        </button>
      )}

      {contextMenu.type === 'column' && (
        <>
          <button
            onClick={() => {
              setTableData(prev => {
                const updated = [...prev];
                const table = { ...updated[currentTableIndex] };
                table.headers = table.headers.filter(h => h !== contextMenu.columnName);
                table.rows = table.rows.map(row => {
                  const { [contextMenu.columnName]: _, ...rest } = row;
                  return rest;
                });
                updated[currentTableIndex] = table;
                return updated;
              });
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
          >
            Delete Column
          </button>

          <hr className="my-1 border-gray-200" />

          <button
            onClick={() => {
              setShowFilterIcons(true);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            Filter
          </button>

          <button
            onClick={() => {
              setTableData(prev => {
                const updated = [...prev];
                updated[currentTableIndex].rows.sort((a, b) =>
                  String(a[contextMenu.columnName] || '').localeCompare(String(b[contextMenu.columnName] || ''))
                );
                return updated;
              });
              setIsModified(true);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            Sort A → Z
          </button>

          <button
            onClick={() => {
              setTableData(prev => {
                const updated = [...prev];
                updated[currentTableIndex].rows.sort((a, b) =>
                  String(b[contextMenu.columnName] || '').localeCompare(String(a[contextMenu.columnName] || ''))
                );
                return updated;
              });
              setIsModified(true);
              closeContextMenu();
            }}
            className="w-full text-left px-3 py-1.5 hover:bg-gray-100 rounded transition-colors"
          >
            Sort Z → A
          </button>

          {isModified && (
            <>
              <hr className="my-1 border-gray-200" />
              <button
                onClick={() => {
                  const original = originalRowsMap[currentTableIndex];
                  if (!original) return;
                  setTableData(prev => {
                    const updated = [...prev];
                    updated[currentTableIndex].rows = JSON.parse(JSON.stringify(original));
                    return updated;
                  });
                  setIsModified(false);
                  closeContextMenu();
                }}
                className="w-full text-left px-3 py-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
              >
                Reset
              </button>
            </>
          )}
        </>
      )}
    </div>
  </div>
)}


{showFilterDialog && filterColumn && (
  <div
    className="fixed z-[9999] bg-white rounded-xl p-2"
    style={{
      top: `${filterDialogPosition.y}px`,
      left: `${filterDialogPosition.x}px`,
      transform: 'translate(-90%, 10px)',
      display: 'flex',
      flexDirection: 'column',
      maxHeight: '220px',
      width: '140px',
      border: 'none',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06), 0 0 0 1px rgba(0, 0, 0, 0.05)'
    }}
  >
<div className="flex justify-between items-center mb-1">
  <h3 className="text-[10px] font-semibold text-gray-800">Filter: {filterColumn}</h3>
  <button onClick={() => setShowFilterDialog(false)} className="text-gray-500 hover:text-gray-700">
    <X size={14} />
  </button>
</div>
    
<div className="mb-1">
  <input
    type="text"
    placeholder="Search..."
    value={filterSearch}
    onChange={(e) => setFilterSearch(e.target.value)}
    className="w-full px-1 py-0.5 border border-gray-300 rounded-md text-[9px]"
    style={{ fontSize: '10px' }} 
  />
</div>
    
    {/* Scrollable values area */}
    <div className="space-y-0.5 overflow-y-auto flex-grow" style={{ maxHeight: '110px' }}>
      {filterOptions
        .filter(option =>
          String(option).toLowerCase().includes(filterSearch.toLowerCase())
        )
        .map((option, idx) => (
          <label key={idx} className="flex items-center space-x-1 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={selectedFilters[filterColumn]?.has(option)}
              onChange={() => {
                setSelectedFilters(prev => {
                  const updated = new Set(prev[filterColumn]);
                  if (updated.has(option)) {
                    updated.delete(option);
                  } else {
                    updated.add(option);
                  }
                  return { ...prev, [filterColumn]: updated };
                });
              }}
              className="h-2 w-2"
            />
            <span className="truncate text-[10px]">{String(option)}</span>
          </label>
        ))}
    </div>
    
    {/* Fixed buttons at bottom, side by side */}
    <div className="mt-1 flex justify-between space-x-1">
      <button
        onClick={() => setShowFilterDialog(false)}
        className="py-0.5 px-1 rounded-md bg-gray-200 text-gray-700 text-[10px] font-medium hover:bg-gray-300 flex-1"
      >
        Cancel
      </button>
      <button
        onClick={() => {
          setTableData(prev => {
            const updated = [...prev];
            const original = originalRowsMap[currentTableIndex];
            updated[currentTableIndex].rows = original.filter(row =>
              selectedFilters[filterColumn]?.has(row[filterColumn])
            );
            return updated;
          });
          setIsModified(true);
          setShowFilterDialog(false);
        }}
        className="py-0.5 px-1 rounded-md bg-[#008080] text-white text-[10px] font-medium hover:bg-teal-700 flex-1"
      >
        Apply
      </button>
    </div>
  </div>
)}



        {activeDrawTool && (
          <button
            className="block w-full text-left font-semibold text-[#008080] border-t border-gray-200 pt-2 mt-2"
            onClick={() => {
              if (map._drawControl && map._drawControl._enabled) {
                // Simulate double click by manually triggering the finish action
                const container = map.getContainer();
                const finishBtn = container.querySelector('.leaflet-draw-actions a[data-tooltip="Finish Drawing"]');
                if (finishBtn) {
                  finishBtn.click(); // 🟢 finalize the shape
                } else {
                  // fallback: just disable if no button found
                  map._drawControl.disable();
                }
              }
              map._drawControl = null;
              setActiveDrawTool(null);
            }}
          >
            ✅ Done Drawing
          </button>
        )}
{showShareDialog && (
  <div className="absolute bottom-[20px] right-6 z-[1000]">
    <div className="bg-white w-[340px] rounded-2xl shadow-2xl p-6 border border-gray-200 relative animate-fade-in">
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        onClick={() => setShowShareDialog(false)}
      >
        <X size={16} />
      </button>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Share This Map</h2>

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
        onClick={() => {
          setShowShareDialog(false);
          const msg = `Map shared with ${selectedTeammate}`;
          setNotificationMessage(msg);
          setShowEmailNotification(true);
          addNotification(msg);
        }}
        className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200 mb-6
          ${selectedTeammate
            ? 'bg-[#008080] text-white hover:bg-teal-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
        `}
      >
        Share Map
      </button>

      {/* Divider */}
      <div className="border-t border-gray-200 mb-6" />

      {/* Download Section */}
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Download This Map</h3>

      <div className="flex space-x-2 mb-3">
        <input
          type="text"
          className="border px-3 py-2 rounded-lg w-[160px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
          value={downloadSelections['map']?.filename || 'vancouver_flood_map'}
          onChange={(e) =>
            setDownloadSelections(prev => ({
              ...prev,
              map: {
                filename: e.target.value,
                format: prev['map']?.format || '.jpg'
              }
            }))
          }
          placeholder="File name"
        />
        <select
          value={downloadSelections['map']?.format || '.jpg'}
          onChange={(e) =>
            setDownloadSelections(prev => ({
              ...prev,
              map: {
                filename: prev['map']?.filename || 'vancouver_flood_map',
                format: e.target.value
              }
            }))
          }
          className="border px-2 py-2 rounded-lg text-sm focus:outline-none"
        >
          <option value=".jpg">.jpg</option>
          <option value=".png">.png</option>
          <option value=".shp">.shp</option>
          <option value=".gdb">.gdb</option>
          <option value=".csv">.csv</option>
          <option value=".pdf">.pdf</option>
        </select>
      </div>

      <button
        onClick={() => {
          if (!downloadSelections['map']) {
            setDownloadSelections(prev => ({
              ...prev,
              map: { filename: 'vancouver_flood_map', format: '.jpg' }
            }));
          }
          handleDownloadAll();
          setShowShareDialog(false);
        }}
        className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
      >
        Download Map
      </button>
    </div>
  </div>
)}




        {isFullscreen ? (
          <Toolbar
            isFullscreen={true}
            showTable={showTable}
            setShowTable={setShowTable}
            onSaveMap={onSaveMap}
            savedMaps={savedMaps}
            captureAndDownload={captureAndDownload}
            setShowLegend={setShowLegend}
            setShowSources={setShowSources}
            toggleFullscreen={toggleFullscreen}
            toolbarVisible={toolbarVisible}
            setToolbarVisible={setToolbarVisible}
            toolbarPosition={toolbarPosition}
            setToolbarPosition={setToolbarPosition}
          />
        ) : (
          <Toolbar
            isFullscreen={false}
            showTable={showTable}
            setShowTable={setShowTable}
            onSaveMap={onSaveMap}
            savedMaps={savedMaps}
            captureAndDownload={captureAndDownload}
            setShowLegend={setShowLegend}
            setShowSources={setShowSources}
            toggleFullscreen={toggleFullscreen}
            toolbarVisible={true}
            setToolbarVisible={() => { }}
            toolbarPosition={{ top: 0, left: 0 }}
            setToolbarPosition={() => { }}
          />
        )}


        
        {showLegend && (
          <div className="absolute bottom-4 left-4 w-[300px] bg-white border border-gray-200 rounded-xl shadow-xl p-4 z-[1000] overflow-y-auto max-h-[70vh]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold text-[#2C3E50] flex items-center">
                <Layers className="mr-2 text-[#008080]" size={18} /> Layers & Legend
              </h3>
              <button
                onClick={() => setShowLegend(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            </div>
            <div className="space-y-4">
              {[
                {
                  id: 'floodZones',
                  name: 'Flood Zones',
                  icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.floodMedium }} />,
                  legend: [
                    { label: 'Low Risk', color: layerColors.floodLight },
                    { label: 'Medium Risk', color: layerColors.floodMedium },
                    { label: 'High Risk', color: layerColors.floodDark }
                  ]
                },
                {
                  id: 'infrastructure',
                  name: 'Infrastructure',
                  icon: <div className="w-4 h-0.5 rounded-sm bg-gray-600" />,
                  legend: [
                    { label: 'Street - Good', color: layerColors.streetGood },
                    { label: 'Street - Fair', color: layerColors.streetMedium },
                    { label: 'Street - Poor', color: layerColors.streetPoor },
                    { label: 'Sewer - Good', color: layerColors.sewerGood, dashed: true },
                    { label: 'Sewer - Fair', color: layerColors.sewerMedium, dashed: true },
                    { label: 'Sewer - Poor', color: layerColors.sewerPoor, dashed: true }
                  ]
                },
                {
                  id: 'stormwaterProjects',
                  name: 'Stormwater Projects',
                  icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.projectActive }} />,
                  legend: [
                    { label: 'Active Projects', color: layerColors.projectActive },
                    { label: 'Planned Projects', color: layerColors.projectPlanned }
                  ]
                },
                {
                  id: 'data311',
                  name: '311 Service Requests',
                  icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.data311High }} />,
                  legend: [
                    {
                      label: 'Heatmap Intensity',
                      gradient: [layerColors.data311Low, layerColors.data311Medium, layerColors.data311High]
                    },
                    {
                      label: 'Open/Closed',
                      markers: [
                        { color: 'red', label: 'Open' },
                        { color: 'green', label: 'Closed' }
                      ]
                    }
                  ]
                },
                {
                  id: 'demographics',
                  name: 'Demographics',
                  icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.demoHigh }} />,
                  legend: [
                    {
                      label: 'Socio-economic Index',
                      gradient: [layerColors.demoLow, layerColors.demoMedium, layerColors.demoHigh]
                    }
                  ]
                }
              ].map(section => (
                <div key={section.id} className="border-t border-gray-200 pt-3 first:border-none first:pt-0">
                  <div
                    onClick={() => toggleSection(section.id)}
                    className="flex justify-between items-center cursor-pointer"
                  >
                    <label className="flex items-center space-x-2 text-sm font-medium text-[#2C3E50]">
                      <input
                        type="checkbox"
                        checked={activeLayers[section.id]}
                        onChange={() => toggleLayer(section.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>{section.name}</span>
                    </label>
                    {expandedSections[section.id] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {expandedSections[section.id] && (
                    <div className="mt-2 pl-6 text-xs space-y-2">
                      {section.legend.map((item, idx) =>
                        item.gradient ? (
                          <div key={idx}>
                            <div
                              className="h-2 rounded"
                              style={{
                                background: `linear-gradient(to right, ${item.gradient.join(', ')})`
                              }}
                            />
                            <div className="flex justify-between text-[10px] mt-1 text-gray-500">
                              <span>Low</span>
                              <span>High</span>
                            </div>
                          </div>
                        ) : item.markers ? (
                          <div key={idx} className="flex space-x-3">
                            {item.markers.map((m, i) => (
                              <div key={i} className="flex items-center space-x-2">
                                <div
                                  className="w-3 h-3 rounded-full"
                                  style={{ backgroundColor: m.color }}
                                ></div>
                                <span>{m.label}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div key={idx} className="flex items-center space-x-2">
                            <input
  type="color"
  value={item.color}
  onChange={(e) => {
    const newColor = e.target.value;
    setLayerColors((prev) => ({
      ...prev,
      [getLayerKeyFromLegend(section.id, item.label)]: newColor
    }));
  }}
  className="w-6 h-4 border rounded cursor-pointer"
/>
                            <span>{item.label}</span>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        )}
      </div>

      {showEmailNotification && (
        <div className="fixed top-6 right-6 z-[9999] animate-slide-in transition-opacity duration-300">
          <div className="bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
            {notificationMessage}
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;