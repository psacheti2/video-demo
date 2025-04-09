import React, { useEffect, useState, useRef } from 'react';
import {
  Layers, Maximize2, X, Info, ChevronDown, ChevronUp,
  Download, Wrench, Palette, Share2, BookmarkPlus, Table, Minimize2
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { useNotificationStore } from '@/store/NotificationsStore';

import _ from 'lodash';

const FourMap = ({ onLayersReady, onSaveMap, savedMaps = [] }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const infoRef = useRef(null);
  // Table states
  const [showTable, setShowTable] = useState(false);
  const [tableHeight, setTableHeight] = useState(300);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableTitles, setTableTitles] = useState(['Infrastructure', 'Stormwater Projects', '311 Data', 'Demographics', 'Risk Index']);
  const [showShareDialog, setShowShareDialog] = useState(false);
const [emailSubject, setEmailSubject] = useState('');
const [emailBody, setEmailBody] = useState('');
const [showEmailNotification, setShowEmailNotification] = useState(false);
const [emailTo, setEmailTo] = useState('');
const addNotification = useNotificationStore((state) => state.addNotification);
const [showDownloadDialog, setShowDownloadDialog] = useState(false);
const [downloadSelections, setDownloadSelections] = useState({});
const [notificationMessage, setNotificationMessage] = useState('');
// Add to the existing tableTitles array:

// Add this with your other useRef declarations:
const indexPolygonsRef = useRef([]);

// Add these new state variables for the priority breakdown panel
const [showPriorityBreakdown, setShowPriorityBreakdown] = useState(false);
const [selectedPriorityArea, setSelectedPriorityArea] = useState(null);

const [attachments, setAttachments] = useState([
  { id: 'map', label: '📍 Vancouver Infrastructure & Flood Assessment Map.jpg' },
  ...tableTitles.map((title, i) => ({
    id: `table-${i}`,
    label: `📊 ${title}.csv`
  }))
]);

  const floodPolygonsRef = useRef([]);
const streetLinesRef = useRef([]);
const sewerLinesRef = useRef([]);
const projectFeaturesRef = useRef([]);
const demographicPolygonsRef = useRef([]);

  // Drag handle reference
  const dragHandleRef = useRef(null);
  // Enhanced loading states
  const [loadingStage, setLoadingStage] = useState('initializing');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const [showSymbologyEditor, setShowSymbologyEditor] = useState(false);

 
  const [activeLayers, setActiveLayers] = useState({
    floodZones: true,
    infrastructure: true,
    stormwaterProjects: true,
    infrastructureOutsideProjects: true,
    data311: true,
    demographics: true,
    riskIndex: true  
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

    //Risk Index
    riskVeryHigh: '#FF0000',
  riskHigh: '#FF5722',
  riskMedium: '#FFC107',
  riskLow: '#8BC34A',
  riskVeryLow: '#4CAF50',

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
    data311Low: COLORS.data311Low,
  riskVeryHigh: COLORS.riskVeryHigh,
  riskHigh: COLORS.riskHigh,
  riskMedium: COLORS.riskMedium,
  riskLow: COLORS.riskLow,
  riskVeryLow: COLORS.riskVeryLow
  });
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const container = isFullScreen
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

  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
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
        html2canvas(mapContainerRef.current, {
          backgroundColor: 'white',
          scale: 2,
          useCORS: true
        }).then(canvas => {
          const mimeType = format === '.png' ? 'image/png' : 'image/jpeg';
          const imageData = canvas.toDataURL(mimeType, 0.9);
          const link = document.createElement('a');
          link.href = imageData;
          link.download = fullName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        });
      } else if (key.startsWith('table-')) {
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
  
    // ✅ Push notification
    if (downloadedFiles.length > 0) {
      const fileList = downloadedFiles.join(', ');
      setShowDownloadDialog(false);
      setNotificationMessage(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
      setShowEmailNotification(true);
      addNotification(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
    }
  };
  
  

  useEffect(() => {
    const initializeMap = async () => {
      setLoadingStage('initializing');
      setLoadingProgress(5);

      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');

      if (map || !mapContainerRef.current) return;

      // Load heatmap plugin
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet.heat/0.2.0/leaflet-heat.js';
      document.head.appendChild(script);
      await new Promise(resolve => script.onload = resolve);

      setLoadingStage('map');
      setLoadingProgress(15);

      // Initialize base map
      const leafletMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 11,
        maxZoom: 18
      }).setView([49.269, -123.107], 13); // Vancouver coordinates

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);

      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);


      // Store map reference early so user can see the base map
      setMap(leafletMap);
      setLoadingProgress(15);

      await new Promise(r => setTimeout(r, 500));

      // 1. Add Flood Zones Layer
      setLoadingStage('floodZones');
      floodPolygonsRef.current = [];


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

      const { floodLayer: floodZoneLayer, floodData } = await fetchFloodZones();
      floodZoneLayer.addTo(leafletMap);
      leafletMap.floodZoneLayer = floodZoneLayer;

      setLoadingProgress(30);
      await new Promise(r => setTimeout(r, 4000));


      // 2. Infrastructure Conditions (streets, sewer lines, etc.)
      setLoadingStage('infrastructure');
      setLoadingProgress(35); // Start at 35%
      streetLinesRef.current = [];


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


      const { infraLayer: infrastructureLayer, streetData, sewerData } = await fetchInfrastructureData();
      infrastructureLayer.addTo(leafletMap);
      leafletMap.infrastructureLayer = infrastructureLayer;
      // Combine street and sewer data for the infrastructure table
      const combinedInfraData = {
        features: []
      };
      if (streetData && streetData.features) {
        streetData.features.forEach(feature => {
          combinedInfraData.features.push({
            ...feature,
            properties: { ...feature.properties, type: 'Street' }
          });
        });
      }
      if (sewerData && sewerData.features) {
        sewerData.features.forEach(feature => {
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
      setLoadingProgress(50); // End at 50%
      // Visual transition
      await new Promise(r => setTimeout(r, 4000));

      // 3. Current Stormwater Projects
      setLoadingStage('stormwaterProjects');
      setLoadingProgress(55); // Start at 55%
      sewerLinesRef.current = [];

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
                  projectFeaturesRef.current.push({ element: marker});
                  projectsLayer.addLayer(marker);

                } else if (feature.geometry.type === 'LineString') {
                  // For linestring features
                  projectCoords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

                  const line = L.polyline(projectCoords, {
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

      const { projectsLayer: stormwaterProjectsLayer, projectsData } = await fetchStormwaterProjects();
      stormwaterProjectsLayer.addTo(leafletMap);
      leafletMap.stormwaterProjectsLayer = stormwaterProjectsLayer;
      const stormwaterProjectsTable = convertGeoJSONToTable(projectsData, 'stormwaterProjects');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[1] = stormwaterProjectsTable;
        return newData;
      });
      setLoadingProgress(65); // End at 65%
      // Visual transition
      await new Promise(r => setTimeout(r, 4000));

      // 4. Infrastructure Outside Project Boundaries
      setLoadingStage('infrastructureOutsideProjects');
      setLoadingProgress(70);

      const createInfrastructureOutsideLayer = async (map) => {
        try {
          if (!map.infrastructureLayer || !map.stormwaterProjectsLayer) {
            console.error("Required layers not available for spatial analysis");
            return L.layerGroup();
          }
      
          // This is a simplified approach since we can't easily do true GIS operations in the browser
          // For a production app, you would use a server-side GIS library or service
      
          // 1. First we need to get all the infrastructure items
          const infraItems = [];
          map.infrastructureLayer.eachLayer(layer => {
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
          map.stormwaterProjectsLayer.eachLayer(layer => {
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
      infrastructureOutsideLayer.addTo(leafletMap);
      leafletMap.infrastructureOutsideLayer = infrastructureOutsideLayer;
      setLoadingProgress(80); // End at 80%
      // Visual transition
      await new Promise(r => setTimeout(r, 4000));

      

      // 5. Map 311 Data
      setLoadingStage('data311');
      setLoadingProgress(85);
      projectFeaturesRef.current = [];


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

      const { data311Layer, data311 } = await fetch311Data();
      data311Layer.addTo(leafletMap);
      leafletMap.data311Layer = data311Layer;
      const data311Table = convertGeoJSONToTable(data311, 'data311');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[2] = data311Table;
        return newData;
      });
      setLoadingProgress(92); // End at 92%
      // Visual transition
      await new Promise(r => setTimeout(r, 4000));
      // 6. Map Demographics
      setLoadingStage('demographics');
      setLoadingProgress(95); // Start at 95%
      demographicPolygonsRef.current = [];

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

      const { demographicsLayer, demographicsData } = await fetchDemographics();
      demographicsLayer.addTo(leafletMap);
      leafletMap.demographicsLayer = demographicsLayer;
      const demographicsTable = convertGeoJSONToTable(demographicsData, 'demographics');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[3] = demographicsTable;
        return newData;
      });
      setLoadingProgress(92);
      setLoadingStage('complete');

      await new Promise(r => setTimeout(r, 4000));

      // Add this after loading the demographics data, before completing loading:
setLoadingStage('riskIndex');
setLoadingProgress(97);

// Modify the fetchRiskIndex function to handle LineString geometries
const fetchRiskIndex = async () => {
    try {
      const res = await fetch('/data/index-data.geojson');
      const indexData = await res.json();
      const indexLayer = L.layerGroup();
  
      if (indexData.features && indexData.features.length > 0) {
        indexData.features.forEach(feature => {
          if (feature.geometry) {
            // Get risk index properties
            const riskIndex = feature.properties?.['Risk Index'] || 50;
            const bca = feature.properties?.['BCA'] || 1;
  
            // Determine color based on risk index
            let color;
            if (riskIndex >= 90) {
              color = layerColors.riskVeryHigh;
            } else if (riskIndex >= 80) {
              color = layerColors.riskHigh;
            } else if (riskIndex >= 70) {
              color = layerColors.riskMedium;
            } else if (riskIndex >= 60) {
              color = layerColors.riskLow;
            } else {
              color = layerColors.riskVeryLow;
            }
  
            // Handle different geometry types
            if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
              // Original polygon handling
              let coordinates;
              if (feature.geometry.type === 'Polygon') {
                coordinates = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
              } else {
                coordinates = feature.geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
              }
  
              const polygon = L.polygon(coordinates, {
                color: COLORS.primary,
                fillColor: color,
                weight: 2,
                opacity: 0.8,
                fillOpacity: 0.7
              });
  
              addPopupAndEvents(polygon, feature, riskIndex, bca, color);
              indexPolygonsRef.current.push({ polygon, riskIndex });
              indexLayer.addLayer(polygon);
            } 
            // Handle LineString geometries (which your data actually contains)
            else if (feature.geometry.type === 'LineString') {
              // Convert LineString to points
              const coords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);
              
              // Create a buffer around the line to make it more visible
              // (This is a simplified approach since Leaflet doesn't natively support true buffers)
              const line = L.polyline(coords, {
                color: color,
                weight: 8, // Make lines thicker to be more visible
                opacity: 0.8,
                lineCap: 'round'
              });
  
              addPopupAndEvents(line, feature, riskIndex, bca, color);
              indexPolygonsRef.current.push({ polygon: line, riskIndex });
              indexLayer.addLayer(line);
              
              // Add markers at the endpoints for better visibility
              const startPoint = coords[0];
              const endPoint = coords[coords.length - 1];
              
              const startMarker = L.circleMarker(startPoint, {
                radius: 6,
                fillColor: color,
                color: COLORS.primary,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              });
              
              const endMarker = L.circleMarker(endPoint, {
                radius: 6,
                fillColor: color,
                color: COLORS.primary,
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              });
              
              addPopupAndEvents(startMarker, feature, riskIndex, bca, color);
              addPopupAndEvents(endMarker, feature, riskIndex, bca, color);
              
              indexLayer.addLayer(startMarker);
              indexLayer.addLayer(endMarker);
            }
          }
        });
      }
  
      return { indexLayer, indexData };
    } catch (error) {
      console.error("Error fetching risk index data:", error);
      return { indexLayer: L.layerGroup(), indexData: { features: [] } };
    }
  };

  setLoadingProgress(100); // Finish at 100%
setLoadingStage('complete');
  
  // Helper function to add popups and event handlers
  function addPopupAndEvents(element, feature, riskIndex, bca, color) {
    // Create popup with risk index information
    let popupContent = `<strong>Risk Priority Area</strong><br>
                       <span style="font-size: 14px; color: ${color};">Composite Risk Score: ${riskIndex}</span><br>
                       Benefit-Cost Ratio: ${bca}<br><br>
                       <button class="priority-details-btn" style="background-color: #008080; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer;">
                         Show Breakdown
                       </button>`;
  
    element.bindPopup(popupContent);
    
    // Add click handler for the "Show Breakdown" button
    element.on('popupopen', function() {
      setTimeout(() => {
        const btn = document.querySelector('.priority-details-btn');
        if (btn) {
          btn.addEventListener('click', function() {
            setSelectedPriorityArea({
              name: feature.properties?.name || 'Area ' + (Math.floor(Math.random() * 1000) + 1),
              riskIndex: riskIndex,
              bca: bca,
              floodRisk: Math.floor(riskIndex * 0.35),
              infrastructureCondition: Math.floor(riskIndex * 0.25),
              calls311: Math.floor(riskIndex * 0.15),
              populationDensity: Math.floor(riskIndex * 0.15),
              socialVulnerability: Math.floor(riskIndex * 0.10)
            });
            setShowPriorityBreakdown(true);
          });
        }
      }, 100);
    });
  }

const { indexLayer, indexData } = await fetchRiskIndex();
indexLayer.addTo(leafletMap);
leafletMap.indexLayer = indexLayer;

const indexTable = convertGeoJSONToTable(indexData, 'riskIndex');
setTableData(prevData => {
  const newData = [...prevData];
  newData[4] = indexTable;
  return newData;
});

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

    // Add to your useEffect that handles layer toggling:
// Toggle risk index layer
if (map.indexLayer) {
    if (activeLayers.riskIndex) {
      map.addLayer(map.indexLayer);
    } else {
      map.removeLayer(map.indexLayer);
    }
  }
  }, [map, activeLayers]);

  useEffect(() => {
    if (!map) return;
  
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
      polygon.setStyle({ color, fillColor });
    });
  
    // Streets
    streetLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.streetMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.streetGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.streetMedium;
      else color = layerColors.streetPoor;
      line.setStyle({ color });
    });
  
    // Sewer Lines
    sewerLinesRef.current.forEach(({ line, condition }) => {
      let color = layerColors.sewerMedium;
      if (condition === 'A' || condition === 'B') color = layerColors.sewerGood;
      else if (condition === 'C' || condition === 'D') color = layerColors.sewerMedium;
      else color = layerColors.sewerPoor;
      line.setStyle({ color });
    });
  
    // Projects (just reapply color)
    projectFeaturesRef.current.forEach(({ element }) => {
      if (element.setStyle) {
        element.setStyle({ color: layerColors.projectActive });
      } else if (element.setIcon) {
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
    });

    // Add to your useEffect that handles color changes:
// Risk Index Areas
indexPolygonsRef.current.forEach(({ polygon, riskIndex }) => {
    let fillColor;
    if (riskIndex >= 90) {
      fillColor = layerColors.riskVeryHigh;
    } else if (riskIndex >= 80) {
      fillColor = layerColors.riskHigh;
    } else if (riskIndex >= 70) {
      fillColor = layerColors.riskMedium;
    } else if (riskIndex >= 60) {
      fillColor = layerColors.riskLow;
    } else {
      fillColor = layerColors.riskVeryLow;
    }
    polygon.setStyle({ fillColor });
  });
  
  }, [layerColors, map]);
  

  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initializing': return 'Initializing map...';
      case 'map': return 'Loading base map...';
      case 'floodZones': return 'Loading flood zones...';
      case 'infrastructure': return 'Loading infrastructure data...';
      case 'stormwaterProjects': return 'Loading stormwater projects...';
      case 'infrastructureOutsideProjects': return 'Analyzing infrastructure outside projects...';
      case 'data311': return 'Loading 311 data...';
      case 'demographics': return 'Loading demographic data...';
      case 'riskIndex': return 'Loading risk index data...';
      case 'complete': return 'Map ready';
      default: return 'Loading...';
    }
  };

  const Toolbar = ({ isFullScreen, showTable, setShowTable, onSaveMap, savedMaps, captureAndDownload, setShowLegend, setShowSources, toggleFullScreen }) => {
    return (
      <div
        className={`flex justify-center items-center space-x-2 bg-white bg-opacity-70 backdrop-blur-sm p-2 shadow-sm z-30 transition-all duration-300
    ${showTable ? 'absolute bottom-[calc(var(--table-height)_+_4px)] left-0 right-0' : 'absolute bottom-0 left-0 right-0'}
  `}
        style={{
          bottom: showTable ? `${tableHeight + 4}px` : '0px'
        }}
      >
        {/* Toggle Table button */}
        <button
          onClick={() => setShowTable(!showTable)}
          className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          title={showTable ? "Hide table" : "Show table"}
          style={{
            color: COLORS.coral,
            border: 'none',
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
          {showTable ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        {/* Save Map button */}
      <button
        onClick={() => {
          const newArtifactNumber = savedMaps?.length + 1 || 1;
          const artifactName = `Risk Index Map`;
          
          // Show toast and notification without actually saving
          const message = `${artifactName} has been saved`;
          setNotificationMessage(message);
          setShowEmailNotification(true);
          addNotification(message);
        }}          
        className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm"
        title="Save map"
        style={{ color: COLORS.coral, border: 'none' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = COLORS.coral;
          e.currentTarget.style.color = 'white';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'white';
          e.currentTarget.style.color = COLORS.coral;
        }}
      >
        <BookmarkPlus size={20} />
      </button>
      

        {/* Symbology button */}
        <button
  onClick={() => setShowSymbologyEditor(true)}
  className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          title="Symbology"
          style={{ color: COLORS.coral, border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}
        >
          <Palette size={20} />
        </button>


        {/* Legend button (same as your layers button) */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          title="Layers & Legend"
          className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          style={{ color: COLORS.coral, border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}
        >
          <Layers size={20} />
        </button>

        {/* Info / Sources button */}
        <button
          onClick={() => setShowSources(prev => !prev)}
          title="View sources"
          className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          style={{ color: COLORS.coral, border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}
        >
          <Info size={20} />
        </button>


        {/* Share button */}
        <button
  onClick={() => setShowShareDialog(true)}
  className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
  title="Share"
  style={{ color: COLORS.coral, border: 'none' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'white';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Share2 size={20} />
</button>


        {/* Download button */}
        <button
  onClick={() => setShowDownloadDialog(true)}
  className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
  title="Download map or tables"
  style={{ color: COLORS.coral, border: 'none' }}
  onMouseEnter={(e) => {
    e.currentTarget.style.backgroundColor = COLORS.coral;
    e.currentTarget.style.color = 'white';
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.backgroundColor = 'white';
    e.currentTarget.style.color = COLORS.coral;
  }}
>
  <Download size={20} />
</button>

        {/* Fullscreen button */}
        <button
          onClick={toggleFullScreen}
          className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          title="Fullscreen"
          style={{ color: COLORS.coral, border: 'none' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = COLORS.coral;
            e.currentTarget.style.color = 'white';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'white';
            e.currentTarget.style.color = COLORS.coral;
          }}
        >
          {isFullScreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
        </button>
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
    <div className={`flex flex-col h-full max-h-screen overflow-hidden ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      
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

{showSymbologyEditor && (
  <div className="absolute top-16 right-4 z-[1000]">
    <div className="bg-white p-5 rounded-xl w-[380px] max-h-[75vh] overflow-y-auto shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800">Customize Layer Colors</h3>
        <button onClick={() => setShowSymbologyEditor(false)}>
          <X size={20} className="text-gray-500 hover:text-gray-700" />
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
            setShowSymbologyEditor(false);
            setLayerColors(prev => ({ ...prev })); 
          }}
          className="px-4 py-1 bg-[#008080] text-white rounded hover:bg-teal-700 text-sm"
        >
          Done
        </button>
      </div>
    </div>
  </div>
)}

{showDownloadDialog && (
  <div className="absolute bottom-[60px] right-6 z-[1000]">
    <div className="bg-white w-[320px] rounded-xl shadow-2xl p-6 border border-gray-200 relative">
      <button
        onClick={() => setShowDownloadDialog(false)}
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
      >
        <X size={20} />
      </button>

      <h2 className="text-lg font-semibold text-gray-800 mb-4">Download Map</h2>

      <div className="space-y-4">
        <div className="space-y-1">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={!!downloadSelections['map']}
              onChange={() =>
                setDownloadSelections(prev => ({
                  map: prev['map']
                    ? undefined
                    : { filename: 'vancouver_flood_map', format: '.jpg' }
                }))
              }
            />
            <span className="text-sm font-medium text-gray-800">📍 Vancouver Flood Assessment Map</span>
          </label>

          {downloadSelections['map'] && (
            <div className="flex space-x-2 ml-6">
              <input
                type="text"
                className="border px-3 py-1 rounded w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
                value={downloadSelections['map']?.filename || ''}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    map: { ...prev.map, filename: e.target.value }
                  }))
                }
                placeholder="File name"
              />
              <select
                value={downloadSelections['map']?.format}
                onChange={(e) =>
                  setDownloadSelections(prev => ({
                    map: { ...prev.map, format: e.target.value }
                  }))
                }
                className="border px-2 py-1 rounded text-sm focus:outline-none"
              >
                 <option value=".jpg">.jpg</option>
                <option value=".png">.png</option>
                <option value=".shp">.shp</option>
                <option value=".gdb">.gdb</option>
                <option value=".csv">.csv</option>
                <option value=".pdf">.pdf</option> 
              </select>
            </div>
          )}
        </div>
      </div>

      <button
        onClick={() => {
          handleDownloadAll();
          setShowDownloadDialog(false);
        }}
        className={`mt-6 w-full py-2 rounded-md text-sm font-semibold 
          ${downloadSelections['map']
            ? 'bg-[#008080] text-white hover:bg-teal-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
        `}
        disabled={!downloadSelections['map']}
      >
        Download Map
      </button>
    </div>
  </div>
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
            <Toolbar showTable={true} />
            <div className="flex justify-between items-center p-1 bg-white text-gray-800 border-b border-gray-200 h-10 px-4">
              <div className="flex space-x-1">
                {tableTitles.map((title, index) => (
                  <button
                  key={index}
                  className={`px-2 py-1 border rounded-t-md text-xs font-medium transition-all duration-200
                  ${currentTableIndex === index
                    ? 'bg-[#008080] text-white border-[#008080]'
                    : 'bg-white text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white'}
                  `}
                  onClick={() => setCurrentTableIndex(index)}
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
                    <tr className="bg-gray-50">
                      {tableData[currentTableIndex].headers?.map((header, idx) => (
                        <th
                          key={idx}
                          className="px-3 py-1 text-left text-[10px] font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {tableData[currentTableIndex].rows?.map((row, rowIdx) => (
                      <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        {tableData[currentTableIndex].headers?.map((header, cellIdx) => (
                          <td
                            key={cellIdx}
                            className="px-3 py-1 text-xs text-gray-700 border-r border-gray-200 last:border-r-0"
                          >
                            {row[header]}
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

{showShareDialog && (
  <div className="absolute bottom-[20px] right-6 z-[1000]">
    <div className="bg-white w-[300px] rounded-xl shadow-xl p-6 border border-gray-200 relative">
      <button
        className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
        onClick={() => setShowShareDialog(false)}
      >
        <X size={20} />
      </button>

      <h2 className="text-xl font-semibold text-gray-800 mb-4">Share This Map</h2>

      <div className="mb-4">
        <label className="text-sm font-medium text-gray-700 mb-1 block">Search Teammate</label>
        <input
          type="text"
          placeholder="Type a name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-[#008080] focus:outline-none"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="max-h-48 overflow-y-auto mb-4 space-y-1">
        {filteredTeammates.map(teammate => (
          <div
            key={teammate}
            onClick={() => setSelectedTeammate(teammate)}
            className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border 
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
              <span className="text-xs font-medium text-[#008080]">✓ Selected</span>
            )}
          </div>
        ))}
        {filteredTeammates.length === 0 && (
          <div className="text-sm text-gray-500 text-center py-3">No teammates found</div>
        )}
      </div>

      <button
        disabled={!selectedTeammate}
        onClick={() => {
          setShowShareDialog(false);
          const msg = `Map shared with ${selectedTeammate}`;
          setNotificationMessage(msg);
          setShowEmailNotification(true);
          addNotification(msg);
        }}
        className={`w-full py-2 rounded-md text-sm font-semibold transition-all duration-200
          ${selectedTeammate
            ? 'bg-[#008080] text-white hover:bg-teal-700'
            : 'bg-gray-200 text-gray-500 cursor-not-allowed'}
        `}
      >
        Share Map
      </button>
    </div>
  </div>
)}


        <Toolbar
          isFullScreen={isFullScreen}
          showTable={showTable}
          setShowTable={setShowTable}
          onSaveMap={onSaveMap}
          savedMaps={savedMaps}
          captureAndDownload={captureAndDownload}
          setShowLegend={setShowLegend}
          setShowSources={setShowSources}
          toggleFullScreen={toggleFullScreen}
        />
        {/* Enhanced loading indicator that shows the current stage */}
        {loadingStage !== 'complete' && (
  <div className="absolute bottom-12 right-4 flex flex-col items-center bg-white bg-opacity-90 z-10 p-4 rounded-lg shadow-lg max-w-xs border border-gray-200">
    <div className="flex items-center space-x-2 mb-2">
      <div className="w-6 h-6 border-3 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
      <p className="text-sm font-medium text-gray-800">{getLoadingMessage()}</p>
    </div>

    {/* Progress bar */}
    <div className="w-full h-2 bg-gray-200 rounded-full">
      <div
        className="h-full bg-blue-500 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${loadingProgress}%` }}
      ></div>
    </div>

    {/* Layer indicators - first row */}
    <div className="grid grid-cols-3 gap-1 mt-2 w-full">
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'map' || loadingStage === 'floodZones' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Base Map
      </div>
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'floodZones' || loadingStage === 'infrastructure' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Flood Zones
      </div>
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'infrastructure' || loadingStage === 'stormwaterProjects' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Infrastructure
      </div>
    </div>
    
    {/* Layer indicators - second row */}
    <div className="grid grid-cols-4 gap-1 mt-1 w-full">
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'stormwaterProjects' || loadingStage === 'infrastructureOutsideProjects' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Projects
      </div>
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'data311' || loadingStage === 'demographics' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        311 Data
      </div>
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'demographics' || loadingStage === 'riskIndex' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Demographics
      </div>
      <div className={`text-center p-1 rounded text-xs ${loadingStage === 'riskIndex' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
        Risk Index
      </div>
    </div>
  </div>
)}

        {showLegend && (
          <div className="absolute bottom-4 left-4 w-64 bg-white border rounded shadow-md p-3 text-sm"
            style={{ zIndex: 1000, overflow: 'auto', maxHeight: '70vh' }}
          >
            <div className="mb-4">
              <h3 className="font-semibold mb-2 text-primary">Map Layers</h3>

              {/* Layers section with collapsible groups */}
              <div className="space-y-1">
                {/* Flood Zones section */}
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('floodZones')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.floodZones}
                        onChange={() => toggleLayer('floodZones')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Flood Zones</span>
                    </label>
                    {expandedSections.floodZones ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.floodZones && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.floodLight }}></div>
                        <span className="text-xs">Low Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.floodMedium }}></div>
                        <span className="text-xs">Medium Risk</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.floodDark }}></div>
                        <span className="text-xs">High Risk</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Infrastructure section */}
                <div className="border-b py-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('infrastructure')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.infrastructure}
                        onChange={() => toggleLayer('infrastructure')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Infrastructure</span>
                    </label>
                    {expandedSections.infrastructure ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.infrastructure && (
                    <div className="mt-2 pl-6 space-y-2">
                      <div>
                        <p className="text-xs font-medium">Streets</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.streetGood }}></div>
                          <span className="text-xs">Good Condition</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.streetMedium }}></div>
                          <span className="text-xs">Fair Condition</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.streetPoor }}></div>
                          <span className="text-xs">Poor Condition</span>
                        </div>
                      </div>

                      <div>
                        <p className="text-xs font-medium">Sewer Lines</p>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.sewerGood, borderTop: '1px dashed #000' }}></div>
                          <span className="text-xs">Good Condition</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.sewerMedium, borderTop: '1px dashed #000' }}></div>
                          <span className="text-xs">Fair Condition</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-4 h-2" style={{ backgroundColor: layerColors.sewerPoor, borderTop: '1px dashed #000' }}></div>
                          <span className="text-xs">Poor Condition</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Projects section */}
                <div className="border-b py-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('projects')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.stormwaterProjects}
                        onChange={() => toggleLayer('stormwaterProjects')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Stormwater Projects</span>
                    </label>
                    {expandedSections.projects ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.projects && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.projectActive }}></div>
                        <span className="text-xs">Active Projects</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.projectPlanned }}></div>
                        <span className="text-xs">Planned Projects</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Infrastructure Outside Projects */}
                <div className="border-b py-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={activeLayers.infrastructureOutsideProjects}
                      onChange={() => toggleLayer('infrastructureOutsideProjects')}
                    />
                    <span>Critical Infrastructure Outside Projects</span>
                  </label>
                </div>

                {/* 311 Data */}
                <div className="border-b py-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('data311')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.data311}
                        onChange={() => toggleLayer('data311')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>311 Service Requests</span>
                    </label>
                    {expandedSections.data311 ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.data311 && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="mb-2">
                        <div style={{ height: '10px', background: `linear-gradient(to right, ${COLORS.data311Low}, ${COLORS.data311Medium}, ${COLORS.data311High})` }} />
                        <div className="flex justify-between text-xs"><span>Low</span><span>High</span></div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'red' }}></div>
                        <span className="text-xs">Open Requests</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'green' }}></div>
                        <span className="text-xs">Closed Requests</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Demographics */}
                <div className="py-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('demographics')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.demographics}
                        onChange={() => toggleLayer('demographics')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Demographics</span>
                    </label>
                    {expandedSections.demographics ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.demographics && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="mb-2">
                        <div style={{ height: '10px', background: `linear-gradient(to right, ${COLORS.demoLow}, ${COLORS.demoMedium}, ${COLORS.demoHigh})` }} />
                        <div className="flex justify-between text-xs"><span>Low</span><span>High</span></div>
                        <p className="text-xs mt-1">Socio-economic index by neighborhood</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add this in your legend section */}
{/* Risk Index */}
<div className="border-b py-2">
  <div className="flex items-center justify-between cursor-pointer"
    onClick={() => toggleSection('riskIndex')}>
    <label className="flex items-center space-x-2">
      <input
        type="checkbox"
        checked={activeLayers.riskIndex}
        onChange={() => toggleLayer('riskIndex')}
        onClick={(e) => e.stopPropagation()}
      />
      <span>Composite Risk-Need Index</span>
    </label>
    {expandedSections.riskIndex ?
      <ChevronUp size={16} /> :
      <ChevronDown size={16} />
    }
  </div>

  {expandedSections.riskIndex && (
    <div className="mt-2 pl-6 space-y-1">
      <div className="flex items-center space-x-2">
        <div className="w-4 h-3" style={{ backgroundColor: layerColors.riskVeryHigh }}></div>
        <span className="text-xs">Very High Priority (90-100)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-3" style={{ backgroundColor: layerColors.riskHigh }}></div>
        <span className="text-xs">High Priority (80-89)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-3" style={{ backgroundColor: layerColors.riskMedium }}></div>
        <span className="text-xs">Medium Priority (70-79)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-3" style={{ backgroundColor: layerColors.riskLow }}></div>
        <span className="text-xs">Low Priority (60-69)</span>
      </div>
      <div className="flex items-center space-x-2">
        <div className="w-4 h-3" style={{ backgroundColor: layerColors.riskVeryLow }}></div>
        <span className="text-xs">Very Low Priority (60)</span>
      </div>
      <div className="mt-2">
        <p className="text-xs">Based on flood risk (35%), infrastructure condition (25%), 311 calls (15%), population density (15%), and social vulnerability (10%)</p>
      </div>
    </div>
  )}
</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {showEmailNotification && (
  <div className="fixed top-6 right-6 z-[9999] animate-slide-in group">
    <div className="relative bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg flex items-center">
      <span className="text-sm font-medium">
        {notificationMessage}
      </span>
      <button
        onClick={() => setShowEmailNotification(false)}
        className="absolute top-1 right-1 w-5 h-5 rounded-full text-[#008080] hover:bg-[#008080]/10 hidden group-hover:flex items-center justify-center"
        title="Dismiss"
      >
        ×
      </button>
    </div>
  </div>
)}
{/* Add this near the end of your JSX, inside the map container */}
{showPriorityBreakdown && selectedPriorityArea && (
  <div className="absolute top-16 right-4 z-[1000]">
    <div className="bg-white p-5 rounded-xl w-[350px] shadow-xl border border-gray-200">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-base font-semibold text-gray-800">Risk Index Breakdown: {selectedPriorityArea.name}</h3>
        <button onClick={() => setShowPriorityBreakdown(false)}>
          <X size={20} className="text-gray-500 hover:text-gray-700" />
        </button>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium">Overall Risk Score:</span>
          <span className="text-lg font-bold" style={{ 
            color: selectedPriorityArea.riskIndex >= 90 ? layerColors.riskVeryHigh : 
                  selectedPriorityArea.riskIndex >= 80 ? layerColors.riskHigh : 
                  selectedPriorityArea.riskIndex >= 70 ? layerColors.riskMedium : 
                  selectedPriorityArea.riskIndex >= 60 ? layerColors.riskLow : 
                  layerColors.riskVeryLow 
          }}>
            {selectedPriorityArea.riskIndex}
          </span>
        </div>
        
        <div className="pt-2 border-t">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Flood Risk (35%)</span>
            <span className="text-sm font-medium">{selectedPriorityArea.floodRisk}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${selectedPriorityArea.floodRisk}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Infrastructure Condition (25%)</span>
            <span className="text-sm font-medium">{selectedPriorityArea.infrastructureCondition}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${selectedPriorityArea.infrastructureCondition}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">311 Calls (15%)</span>
            <span className="text-sm font-medium">{selectedPriorityArea.calls311}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-purple-500 h-2.5 rounded-full" style={{ width: `${selectedPriorityArea.calls311}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Population Density (15%)</span>
            <span className="text-sm font-medium">{selectedPriorityArea.populationDensity}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-yellow-500 h-2.5 rounded-full" style={{ width: `${selectedPriorityArea.populationDensity}%` }}></div>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs">Social Vulnerability (10%)</span>
            <span className="text-sm font-medium">{selectedPriorityArea.socialVulnerability}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div className="bg-orange-500 h-2.5 rounded-full" style={{ width: `${selectedPriorityArea.socialVulnerability}%` }}></div>
          </div>
        </div>
        
        <div className="pt-2 border-t flex justify-between items-center">
          <span className="text-sm font-medium">Benefit-Cost Ratio:</span>
          <span className="text-sm font-bold">{selectedPriorityArea.bca}:1</span>
        </div>
      </div>
      
      <button 
        onClick={() => setShowPriorityBreakdown(false)}
        className="mt-4 w-full bg-[#008080] text-white py-2 rounded hover:bg-teal-700 text-sm"
      >
        Close
      </button>
    </div>
  </div>
)}

    </div>
  );
};

export default FourMap;