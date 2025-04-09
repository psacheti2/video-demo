import React, { useEffect, useState, useRef } from 'react';
import {
  Layers, Maximize2, X, Info, ChevronDown, ChevronUp,
  Download, Wrench, Palette, Share2, BookmarkPlus, Table, Minimize2
} from 'lucide-react';
import _ from 'lodash';
import { useNotificationStore } from '@/store/NotificationsStore';

const AffordableHousingMap = ({ onLayersReady, onSaveMap, savedMaps = [] }) => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  const infoRef = useRef(null);
  // Table states
  const [showTable, setShowTable] = useState(false);
  const [tableHeight, setTableHeight] = useState(300);
  const [currentTableIndex, setCurrentTableIndex] = useState(0);
  const [tableData, setTableData] = useState([]);
  const [tableTitles, setTableTitles] = useState(['Housing Units', 'Reinvestment Zones']);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [emailTo, setEmailTo] = useState('');
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [showDownloadDialog, setShowDownloadDialog] = useState(false);
  const [downloadSelections, setDownloadSelections] = useState({});
  const [notificationMessage, setNotificationMessage] = useState('');

  const [attachments, setAttachments] = useState([
    { id: 'map', label: '📍 Dallas Affordable Housing Map.jpg' },
    ...tableTitles.map((title, i) => ({
      id: `table-${i}`,
      label: `📊 ${title}.csv`
    }))
  ]);

  // Layer references
  const housingUnitsRef = useRef([]);
  const reinvestmentZonesRef = useRef([]);
  const demographicPolygonsRef = useRef([]);
  const cityServicesRef = useRef([]);

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
    housingUnits: true,
    reinvestmentZones: true
  });

  const COLORS = {
    // Housing units
    housingLarge: '#1E88E5',
    housingMedium: '#42A5F5',
    housingSmall: '#90CAF9',

    // Reinvestment zones
    reinvestmentHigh: '#E64A19',
    reinvestmentMedium: '#FF7043',
    reinvestmentLow: '#FFAB91',

    // Demographics
    demoHigh: '#FF5722',
    demoMedium: '#FF9800',
    demoLow: '#FFC107',

    // City Services
    servicesHigh: '#607D8B',
    servicesMedium: '#90A4AE',
    servicesLow: '#CFD8DC',

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
    housingLarge: COLORS.housingLarge,
    housingMedium: COLORS.housingMedium,
    housingSmall: COLORS.housingSmall,
    reinvestmentHigh: COLORS.reinvestmentHigh,
    reinvestmentMedium: COLORS.reinvestmentMedium,
    reinvestmentLow: COLORS.reinvestmentLow,
    demoHigh: COLORS.demoHigh,
    demoMedium: COLORS.demoMedium,
    demoLow: COLORS.demoLow,
    servicesHigh: COLORS.servicesHigh,
    servicesMedium: COLORS.servicesMedium,
    servicesLow: COLORS.servicesLow
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
          link.download = `dallas_housing_map_${new Date().toISOString().slice(0, 10)}.jpg`;
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
        link.download = `dallas_housing_map_${new Date().toISOString().slice(0, 10)}.jpg`;
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
  
    // Push notification
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
        minZoom: 9,
        maxZoom: 18
      }).setView([32.7767, -96.797], 11); // Dallas coordinates

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);

      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);

      // Store map reference early so user can see the base map
      setMap(leafletMap);
      setLoadingProgress(20);

      await new Promise(r => setTimeout(r, 500));

      // 1. Add Housing Units Layer
      setLoadingStage('housingUnits');
      setLoadingProgress(25);
      housingUnitsRef.current = [];

      const fetchHousingData = async () => {
        try {
          const res = await fetch('/data/six-data-one.geojson');
          const housingData = await res.json();
          const housingLayer = L.layerGroup();

          housingData.features.forEach(feature => {
            if (feature.properties) {
              const { x, y, project, li_units, company, credit } = feature.properties;
              
              // Determine size/color based on units
              let size = 6;
              let color = layerColors.housingMedium;
              
              if (li_units > 100) {
                size = 10;
                color = layerColors.housingLarge;
              } else if (li_units < 50) {
                size = 4;
                color = layerColors.housingSmall;
              }
              
              const marker = L.circleMarker([parseFloat(y), parseFloat(x)], {
                radius: size,
                fillColor: color,
                color: '#fff',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
              });
              
              marker.bindPopup(
                `<strong>${project}</strong><br/>Affordable Units: ${li_units}<br/>Developer: ${company}<br/>Credit Type: ${credit}`
              );
              
              housingLayer.addLayer(marker);
              housingUnitsRef.current.push({ marker, properties: feature.properties });
            }
          });

          return { housingLayer, housingData };
        } catch (error) {
          console.error("Error fetching housing data:", error);
          return { housingLayer: L.layerGroup(), housingData: { features: [] } };
        }
      };

      const { housingLayer, housingData } = await fetchHousingData();
      housingLayer.addTo(leafletMap);
      leafletMap.housingLayer = housingLayer;
      
      const housingTable = convertGeoJSONToTable(housingData, 'housing');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[0] = housingTable;
        return newData;
      });
      
      setLoadingProgress(40);
      await new Promise(r => setTimeout(r, 4000));

      // 2. Add Reinvestment Zones
      setLoadingStage('reinvestmentZones');
      setLoadingProgress(45);
      reinvestmentZonesRef.current = [];

      const fetchReinvestmentZones = async () => {
        try {
          const res = await fetch('/data/six-data-two.geojson');
          const zoneData = await res.json();
          const zoneLayer = L.layerGroup();

          zoneData.features.forEach(feature => {
            if (feature.geometry) {
              let color = layerColors.reinvestmentMedium;
              let fillColor = layerColors.reinvestmentLow;
              
              if (feature.properties?.priority === 'high') {
                color = layerColors.reinvestmentHigh;
                fillColor = layerColors.reinvestmentMedium;
              } else if (feature.properties?.priority === 'low') {
                color = layerColors.reinvestmentLow;
                fillColor = layerColors.reinvestmentLow;
              }
              
              const polygon = L.geoJSON(feature, {
                style: {
                  color: color,
                  fillColor: fillColor,
                  weight: 2,
                  opacity: 0.8,
                  fillOpacity: 0.3
                }
              });

              // Create popup with zone information
              let popupContent = `<strong>${feature.properties?.name || 'Reinvestment Zone'}</strong>`;
              if (feature.properties) {
                if (feature.properties.description) {
                  popupContent += `<br>${feature.properties.description}`;
                }
                if (feature.properties.status) {
                  popupContent += `<br>Status: ${feature.properties.status}`;
                }
                if (feature.properties.established) {
                  popupContent += `<br>Established: ${feature.properties.established}`;
                }
              }

              polygon.bindPopup(popupContent);
              zoneLayer.addLayer(polygon);
              reinvestmentZonesRef.current.push({ polygon, properties: feature.properties });
            }
          });

          return { zoneLayer, zoneData };
        } catch (error) {
          console.error("Error fetching reinvestment zones:", error);
          return { zoneLayer: L.layerGroup(), zoneData: { features: [] } };
        }
      };

      const { zoneLayer, zoneData } = await fetchReinvestmentZones();
      zoneLayer.addTo(leafletMap);
      leafletMap.zoneLayer = zoneLayer;
      
      const zoneTable = convertGeoJSONToTable(zoneData, 'zones');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[1] = zoneTable;
        return newData;
      });
      
      setLoadingProgress(60);
      await new Promise(r => setTimeout(r, 4000));

      // 3. Add Demographics Layer
      setLoadingStage('demographics');
      setLoadingProgress(65);
      demographicPolygonsRef.current = [];

      const fetchDemographics = async () => {
        try {
          // Note: Using a placeholder endpoint - replace with actual data source
          const res = await fetch('/data/demographic-data.geojson');
          const demographicsData = await res.json();
          const demographicsLayer = L.layerGroup();

          if (demographicsData.features && demographicsData.features.length > 0) {
            demographicsData.features.forEach(feature => {
              if (feature.geometry && feature.geometry.type === 'Polygon') {
                // Get demographic information from properties
                const name = feature.properties?.name || 'Neighborhood';
                const socioEconomicValue = feature.properties?.socioEconomicValue || 50;

                // Normalize value to determine color
                const normalized = socioEconomicValue / 100;

                const color = normalized > 0.8 ? layerColors.demoHigh :
                  normalized > 0.5 ? layerColors.demoMedium : layerColors.demoLow;

                const polygon = L.geoJSON(feature, {
                  style: {
                    color: COLORS.primary,
                    fillColor: color,
                    weight: 1,
                    opacity: 0.5,
                    fillOpacity: 0.3
                  }
                }).bindPopup(`<strong>${name}</strong><br>Socio-Economic Index: ${socioEconomicValue}`);

                demographicsLayer.addLayer(polygon);
                demographicPolygonsRef.current.push({ polygon, socioEconomicValue });
              }
            });
          }

          return { demographicsLayer, demographicsData };
        } catch (error) {
          console.error("Error fetching demographics data:", error);
          return { demographicsLayer: L.layerGroup(), demographicsData: { features: [] } };
        }
      };

      const { demographicsLayer, demographicsData } = await fetchDemographics();
      demographicsLayer.addTo(leafletMap);
      leafletMap.demographicsLayer = demographicsLayer;
      
      const demographicsTable = convertGeoJSONToTable(demographicsData, 'demographics');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[2] = demographicsTable;
        return newData;
      });
      
      setLoadingProgress(80);
      await new Promise(r => setTimeout(r, 4000));

      // 4. Add City Services Layer
      setLoadingStage('cityServices');
      setLoadingProgress(85);
      cityServicesRef.current = [];

      const fetchCityServices = async () => {
        try {
          // Note: Using a placeholder endpoint - replace with actual data source
          const res = await fetch('/data/city-services.geojson');
          const servicesData = await res.json();
          const servicesLayer = L.layerGroup();

          // Process the city services data
          const heatData = [];

          // Filter for features with valid geometry
          const validFeatures = servicesData.features.filter(feature =>
            feature.geometry && feature.geometry.type === 'Point' &&
            feature.geometry.coordinates &&
            feature.geometry.coordinates.length === 2
          );

          // Add markers for valid points
          validFeatures.forEach(feature => {
            const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

            // Determine priority based on service type
            let priority = "Medium";
            if (feature.properties.service_type.includes("Emergency")) {
              priority = "High";
            } else if (feature.properties.service_type.includes("Information")) {
              priority = "Low";
            }

            // Calculate intensity for heatmap
            const intensity = priority === "High" ? 1.0 :
              priority === "Medium" ? 0.7 : 0.4;

            heatData.push([coords[0], coords[1], intensity]);

            // Determine colors
            const color = priority === "High" ? layerColors.servicesHigh :
              priority === "Medium" ? layerColors.servicesMedium : layerColors.servicesLow;

            // Create marker
            const marker = L.marker(coords, {
              icon: L.divIcon({
                html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                className: '',
                iconSize: [16, 16]
              })
            });

            // Create popup content
            let popupContent = `<strong>${feature.properties.service_type}</strong>`;
            if (feature.properties.address) popupContent += `<br>Address: ${feature.properties.address}`;
            if (feature.properties.phone) popupContent += `<br>Phone: ${feature.properties.phone}`;
            if (feature.properties.hours) popupContent += `<br>Hours: ${feature.properties.hours}`;

            marker.bindPopup(popupContent);
            
            servicesLayer.addLayer(marker);
            cityServicesRef.current.push({ marker, properties: feature.properties });
          });

          // Add heatmap for service density
          if (window.L.heatLayer && heatData.length > 0) {
            const heatmap = window.L.heatLayer(heatData, {
              radius: 30,
              blur: 15,
              maxZoom: 17,
              gradient: {
                0.2: layerColors.servicesLow,
                0.5: layerColors.servicesMedium,
                0.8: layerColors.servicesHigh
              }
            });

            servicesLayer.addLayer(heatmap);
          }

          return { servicesLayer, servicesData };
        } catch (error) {
          console.error("Error fetching city services data:", error);
          return { servicesLayer: L.layerGroup(), servicesData: { features: [] } };
        }
      };

      const { servicesLayer, servicesData } = await fetchCityServices();
      servicesLayer.addTo(leafletMap);
      leafletMap.servicesLayer = servicesLayer;
      
      const servicesTable = convertGeoJSONToTable(servicesData, 'services');
      setTableData(prevData => {
        const newData = [...prevData];
        newData[3] = servicesTable;
        return newData;
      });
      
      setLoadingProgress(100);
      setLoadingStage('complete');

      await new Promise(r => setTimeout(r, 800));

      if (onLayersReady) {
        onLayersReady();
      }
    };

    initializeMap();

    return () => map?.remove();
  }, []);

  useEffect(() => {
    if (!map) return;

    // Toggle housing units layer
    if (map.housingLayer) {
      if (activeLayers.housingUnits) {
        map.addLayer(map.housingLayer);
      } else {
        map.removeLayer(map.housingLayer);
      }
    }

    // Toggle reinvestment zones layer
    if (map.zoneLayer) {
      if (activeLayers.reinvestmentZones) {
        map.addLayer(map.zoneLayer);
      } else {
        map.removeLayer(map.zoneLayer);
      }
    }

    
  }, [map, activeLayers]);

  useEffect(() => {
    if (!map) return;
  
    // Update Housing Units colors
    housingUnitsRef.current.forEach(({ marker, properties }) => {
      let color = layerColors.housingMedium;
      let size = 6;
      
      if (properties?.li_units > 100) {
        color = layerColors.housingLarge;
        size = 10;
      } else if (properties?.li_units < 50) {
        color = layerColors.housingSmall;
        size = 4;
      }
      
      marker.setStyle({ 
        fillColor: color,
        radius: size 
      });
    });
  
    // Update Reinvestment Zones colors
    reinvestmentZonesRef.current.forEach(({ polygon, properties }) => {
      let color = layerColors.reinvestmentMedium;
      let fillColor = layerColors.reinvestmentLow;
      
      if (properties?.priority === 'high') {
        color = layerColors.reinvestmentHigh;
        fillColor = layerColors.reinvestmentMedium;
      } else if (properties?.priority === 'low') {
        color = layerColors.reinvestmentLow;
        fillColor = layerColors.reinvestmentLow;
      }
      
      polygon.setStyle({ 
        color: color,
        fillColor: fillColor
      });
    });
  
    // Update Demographics colors
    demographicPolygonsRef.current.forEach(({ polygon, socioEconomicValue }) => {
      const normalized = socioEconomicValue / 100;
      const fillColor = normalized > 0.8
        ? layerColors.demoHigh
        : normalized > 0.5
          ? layerColors.demoMedium
          : layerColors.demoLow;
      polygon.setStyle({ fillColor });
    });
    
    // Update City Services colors
    cityServicesRef.current.forEach(({ marker, properties }) => {
      let color = layerColors.servicesMedium;
      
      if (properties?.service_type?.includes('Emergency')) {
        color = layerColors.servicesHigh;
      } else if (properties?.service_type?.includes('Information')) {
        color = layerColors.servicesLow;
      }
      
      if (marker.setIcon) {
        marker.setIcon(L.divIcon({
          html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: '',
          iconSize: [16, 16]
        }));
      }
    });
  }, [layerColors, map]);

  // Get loading status message
  const getLoadingMessage = () => {
    switch (loadingStage) {
      case 'initializing': return 'Initializing map...';
      case 'map': return 'Loading base map...';
      case 'housingUnits': return 'Loading affordable housing data...';
      case 'reinvestmentZones': return 'Loading reinvestment zones...';
      case 'demographics': return 'Loading demographic data...';
      case 'cityServices': return 'Loading city services...';
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
          {showTable ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </button>

        <button
          onClick={() => {
            const newArtifactNumber = savedMaps?.length + 1 || 1;
            const artifactName = `Housing Map`;
            
            // Show toast and notification without actually saving
            const message = `${artifactName} has been saved`;
            setNotificationMessage(message);
            setShowEmailNotification(true);
            addNotification(message);
          }}          
          className="flex items-center justify-center p-2 rounded-full bg-white hover:bg-neutral transition-all shadow-sm"
          title="Save map"
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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


        {/* Legend button */}
        <button
          onClick={() => setShowLegend(!showLegend)}
          title="Layers & Legend"
          className="flex items-center justify-center p-2 rounded-full bg-white transition-all shadow-sm"
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
          style={{ color: COLORS.coral, border: `1px solid ${COLORS.coral}` }}
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
                  Dallas Affordable Housing
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Reinvestment Zones
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  Community Demographics
                </a>
              </div>
              <div>
                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                  City Services
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
        <div className="space-y-2">
          <div className="text-sm font-medium text-gray-800 mb-2">📍 Vancouver Flood Assessment Map</div>
          
          <div className="flex space-x-2">
            <input
              type="text"
              className="border px-3 py-1 rounded w-[140px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
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
        </div>
      </div>

      <button
        onClick={() => {
          // Initialize map selection if not already set
          if (!downloadSelections['map']) {
            setDownloadSelections(prev => ({
              ...prev,
              map: { filename: 'vancouver_flood_map', format: '.jpg' }
            }));
          }
          handleDownloadAll();
          setShowDownloadDialog(false);
        }}
        className="mt-6 w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
      >
        Download Map
      </button>
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

            {/* Layer indicators */}
            <div className="grid grid-cols-2 gap-1 mt-2 w-full">
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'map' || loadingStage === 'housingUnits' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Base Map
              </div>
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'housingUnits' || loadingStage === 'reinvestmentZones' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Housing Units
              </div>
            </div>
            <div className="grid grid-cols-2 gap-1 mt-1 w-full">
              <div className={`text-center p-1 rounded text-xs ${loadingStage === 'reinvestmentZones' || loadingStage === 'demographics' || loadingStage === 'complete' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'}`}>
                Reinvestment Zones
              </div>
            </div>
          </div>
        )}

        {showLegend && (
          <div className="absolute bottom-4 left-4 w-64 bg-white border rounded shadow-md p-3 text-sm"
            style={{ zIndex: 1000, overflow: 'auto', maxHeight: '70vh' }}
          >
    <div className="flex justify-between items-center mb-2">
    <h3 className="font-semibold mb-2 text-primary">Map Layers</h3>
    <button
        onClick={() => setShowLegend(false)}
        className="text-gray-400 hover:text-gray-600"
      >
        <X size={16} />
      </button>
    </div>

              {/* Layers section with collapsible groups */}
              <div className="space-y-1">
                {/* Housing Units section */}
                <div className="border-b pb-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('housingUnits')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.housingUnits}
                        onChange={() => toggleLayer('housingUnits')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Affordable Housing Units</span>
                    </label>
                    {expandedSections.housingUnits ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.housingUnits && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.housingLarge }}></div>
                        <span className="text-xs">Large (100+ units)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: layerColors.housingMedium }}></div>
                        <span className="text-xs">Medium (50-99 units)</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: layerColors.housingSmall }}></div>
                        <span className="text-xs">Small (50 units)</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reinvestment Zones section */}
                <div className="border-b py-2">
                  <div className="flex items-center justify-between cursor-pointer"
                    onClick={() => toggleSection('reinvestmentZones')}>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={activeLayers.reinvestmentZones}
                        onChange={() => toggleLayer('reinvestmentZones')}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span>Reinvestment Zones</span>
                    </label>
                    {expandedSections.reinvestmentZones ?
                      <ChevronUp size={16} /> :
                      <ChevronDown size={16} />
                    }
                  </div>

                  {expandedSections.reinvestmentZones && (
                    <div className="mt-2 pl-6 space-y-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.reinvestmentHigh }}></div>
                        <span className="text-xs">High Priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.reinvestmentMedium }}></div>
                        <span className="text-xs">Medium Priority</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-3" style={{ backgroundColor: layerColors.reinvestmentLow }}></div>
                        <span className="text-xs">Low Priority</span>
                      </div>
                    </div>
                  )}
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
    </div>
  );
};

export default AffordableHousingMap;