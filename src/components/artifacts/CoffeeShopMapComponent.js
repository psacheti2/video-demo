import React, { useEffect, useState, useRef, useMemo } from 'react';
import {X, ArrowLeft, MousePointerSquareDashed, TextCursorInput
} from 'lucide-react';
import { TbMapSearch } from "react-icons/tb";
import html2canvas from 'html2canvas';
import { useNotificationStore } from '@/store/NotificationsStore';
import 'leaflet-control-geocoder/dist/Control.Geocoder.css';
import L from 'leaflet';
import 'leaflet-control-geocoder';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.js';
import MapDownloader from '../MapDownloader'
import TextToolbar from '../TextToolbar'
import _ from 'lodash';
import {
    createPolygonDrawTool,
    createFreehandTool,
    createSelectTool,
    setupClickToEdit,
    createTextTool
} from '../drawTools';
import { IconMapPinSearch } from '@tabler/icons-react';
import { MdDraw } from "react-icons/md";
import VirtualizedTable from './VirtualizedTable';
import ToolbarComponent from '../ToolbarComponent';
import DraggableLegend from './DraggableLegend';

const CoffeeShopMapComponent = ({ onLayersReady, onSaveMap, savedMaps = [], setSavedArtifacts, title,
    onBack, center = [-73.9866, 40.7589], radius = 0.8, onSendMessage }) => {
    const [layerZIndexes, setLayerZIndexes] = useState({
        coffeeShops: 30,
        footTraffic: 50,
        radius: 10
    });
    const [topInteractiveLayer, setTopInteractiveLayer] = useState('footTraffic');
    const [showTextToolbar, setShowTextToolbar] = useState(false);
    const [activeTextMarker, setActiveTextMarker] = useState(null);
    const [textToolbarPosition, setTextToolbarPosition] = useState({ top: 50, left: 50 });
    const [textFormat, setTextFormat] = useState({
      fontFamily: 'Arial, sans-serif',
      fontSize: 18,
      fontWeight: 'normal',
      fontStyle: 'normal',
      textDecoration: 'none',
      textAlign: 'center',
      color: '#000000'
    });
    
    const mapContainerRef = useRef(null);
    const [map, setMap] = useState(null);
    const infoRef = useRef(null);
    const [currentMapView, setCurrentMapView] = useState('light');
    const [baseMapLayer, setBaseMapLayer] = useState(null);
    // Table states
    const [showTable, setShowTable] = useState(false);
    const [tableHeight, setTableHeight] = useState(300);
    const [currentTableIndex, setCurrentTableIndex] = useState(0);
    const [tableData, setTableData] = useState([]);
    const [tableTitles, setTableTitles] = useState(['Coffee Shops', 'Foot Traffic Data']);
    const [showShareDialog, setShowShareDialog] = useState(false);
    const [showEmailNotification, setShowEmailNotification] = useState(false);
    const addNotification = useNotificationStore((state) => state.addNotification);
    const [downloadSelections, setDownloadSelections] = useState({});
    const [notificationMessage, setNotificationMessage] = useState('');
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [customSaveName, setCustomSaveName] = useState('');
    const [toolbarVisible, setToolbarVisible] = useState(true);
    const [toolbarPosition, setToolbarPosition] = useState(null);
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
    const [selectedRowIndices, setSelectedRowIndices] = useState([]);
    const [selectedColIndex, setSelectedColIndex] = useState(null);
    const footTrafficPointsRef = useRef([]);
    const [showMapDownloader, setShowMapDownloader] = useState(false);
    const [scrollToRowIndex, setScrollToRowIndex] = useState(null);
    const [contextMenu, setContextMenu] = useState({
        visible: false, x: 0, y: 0, type: null, index: null,
        columnName: null,
    });

    const [customLayerNames, setCustomLayerNames] = useState(() => {
        const stored = localStorage.getItem('customLayerNames');
        return stored ? JSON.parse(stored) : {};
    });

    useEffect(() => {
        localStorage.setItem('customLayerNames', JSON.stringify(customLayerNames));
    }, [customLayerNames]);

    
    const [originalRowsMap, setOriginalRowsMap] = useState({});
    
    const [originalData, setOriginalData] = useState({});
    
    const coffeeShopsRef = useRef([]);
    const footTrafficHeatmapRef = useRef(null);
    const radiusCircleRef = useRef(null);

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
    const [expandedSections, setExpandedSections] = useState({
        drawnShapes: true 
      });    
    const [isModified, setIsModified] = useState(false);

    const [showSymbologyEditor, setShowSymbologyEditor] = useState(false);


    const [activeLayers, setActiveLayers] = useState({
        coffeeShops: true,
        footTraffic: true,
        radius: true
    });

    const fallbackMapStyles = {
        light: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png',
        dark: 'https://cartodb-basemaps-{s}.global.ssl.fastly.net/dark_all/{z}/{x}/{y}.png',
        satellite: 'https://{s}.aerial.maps.ls.hereapi.com/maptile/2.1/maptile/newest/satellite.day/{z}/{x}/{y}/256/png8?apiKey=',
        streets: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        outdoors: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
        hybrid: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}'
    };

    // Add an error handler for tile loading errors
    const setupTileErrorHandler = (layer) => {
        layer.on('tileerror', function (error) {
            console.log('Tile error occurred:', error);

            // If we have a fallback URL for this style, try to use it
            if (fallbackMapStyles[currentMapView]) {
                console.log('Attempting to use fallback tile source:', fallbackMapStyles[currentMapView]);

                // Remove the failed layer
                map.removeLayer(layer);

                // Create and add the fallback layer
                const fallbackLayer = L.tileLayer(fallbackMapStyles[currentMapView], {
                    attribution: attributions[currentMapView],
                    subdomains: 'abcd',
                    maxZoom: 19
                });

                fallbackLayer.addTo(map);
                setBaseMapLayer(fallbackLayer);

                // Only try the fallback once
                layer.off('tileerror');
            }
        });

        return layer;
    };

    const handleMapViewChange = (viewType) => {
        if (!map) return;
      
        mapContainerRef.current.style.backgroundColor = '#FFFFFF';
        mapContainerRef.current.style.background = '#FFFFFF';
        // First, remove the existing base layer if it exists
        if (baseMapLayer && baseMapLayer.main) {
            map.removeLayer(baseMapLayer.main);
            if (baseMapLayer.labels) {
                map.removeLayer(baseMapLayer.labels);
            }
        } else if (baseMapLayer) {
            map.removeLayer(baseMapLayer);
        }



        // Define tile URLs for different map styles
        const mapStyles = {
            light: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
            dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', // Re-add dark map style
            cadastral: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', // ESRI street map with property lines
            satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', // Using Carto's Voyager style for better reliability
            outdoors: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', // ESRI World Topo Map - high quality, modern terrain styling
            hybrid: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryTopo/MapServer/tile/{z}/{y}/{x}' // USGS Imagery with Topo
        };

        // Define attribution for different map styles
        const attributions = {
            light: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            dark: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>', // Re-add dark map attribution
            cadastral: '&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            satellite: '&copy; <a href="https://www.esri.com/">Esri</a>',
            streets: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            outdoors: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community',
            hybrid: 'Tiles &copy; USGS National Map'
        };

        // Create and add the new base layer
        const newBaseLayer = L.tileLayer(mapStyles[viewType], {
            attribution: attributions[viewType],
            subdomains: 'abcd',
            maxZoom: 19
        });
        
        newBaseLayer.addTo(map);
        setBaseMapLayer(newBaseLayer);

        // Update the current map view state
        setCurrentMapView(viewType);

        // Force a refresh of the map
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 100);
    };

    const [drawnLayers, setDrawnLayers] = useState({});
const [drawnLayersOrder, setDrawnLayersOrder] = useState([]);
const drawnLayersRef = useRef([]);

const [nextShapeIds, setNextShapeIds] = useState({
  polygon: 1,
  circle: 1,
  polyline: 1,
  marker: 1,
  triangle: 1,
  text: 1
});

    const COLORS = {
        // Coffee shops
        existingShop: '#D2691E',

        // Foot traffic
        highTraffic: '#8B0000',
        mediumTraffic: '#CD5C5C',
        lowTraffic: '#FFB6C1',

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
        existingShop: COLORS.existingShop,
        highTraffic: COLORS.highTraffic,
        mediumTraffic: COLORS.mediumTraffic,
        lowTraffic: COLORS.lowTraffic
    });


    const getTrafficColor = (intensity) => {
        if (intensity > 0.7) return layerColors.highTraffic;
        if (intensity > 0.4) return layerColors.mediumTraffic;
        return layerColors.lowTraffic;
    };

    // 3. Add CSS for custom popups - Add this to your component or a separate CSS file
    useEffect(() => {
        // Add custom CSS for popups
        const style = document.createElement('style');
        style.textContent = `
            .custom-popup .leaflet-popup-content-wrapper {
                background-color: white;
                border-radius: 8px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .custom-popup .leaflet-popup-tip {
                background-color: white;
            }
            .custom-popup .leaflet-popup-content {
                margin: 10px;
            }
        `;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    const updateLayerInteractivity = (layer, layerId) => {
        if (!layer) return;

        const isTopLayer = topInteractiveLayer === layerId;

        if (layer.eachLayer) {
            // For layer groups
            layer.eachLayer(subLayer => {
                if (subLayer.options) {
                    subLayer.options.interactive = isTopLayer;
                }
            });
        } else if (layer.options) {
            // For individual layers
            layer.options.interactive = isTopLayer;
        }
    };

    const resetLayerHighlighting = () => {
        // Reset coffee shops
        coffeeShopsRef.current.forEach(({ marker, potential }) => {
            const color = COLORS.existingShop;
            marker.setIcon(L.divIcon({
                html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                className: '',
                iconSize: [14, 14]
            }));

            // Close any open popups
            if (marker.isPopupOpen()) {
                marker.closePopup();
            }
        });        
    };

      
    const handleCellEdit = (selectedRowIndices, columnName, newValue) => {
        setTableData(prev => {
            const updated = [...prev];
            updated[currentTableIndex].rows[selectedRowIndices][columnName] = newValue;
            return updated;
        });
    };

    const closeContextMenu = () => {
        setContextMenu({ visible: false, x: 0, y: 0, type: null, index: null });
    };

    useEffect(() => {
        const handleClick = () => closeContextMenu();
        window.addEventListener("click", handleClick);
        return () => window.removeEventListener("click", handleClick);
    }, []);


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
            let rowIndex = -1;

            // First try to match by Feature ID if available
            if (properties.id || properties['Feature ID']) {
                const featureId = properties.id || properties['Feature ID'];
                rowIndex = tableData[i]?.rows?.findIndex(row =>
                    row['Feature ID']?.toString() === featureId?.toString()
                );
            }

            // If no match by ID, fall back to property matching
            if (rowIndex < 0) {
                rowIndex = tableData[i]?.rows?.findIndex(row =>
                    Object.keys(properties).some(key => row[key] === properties[key])
                );
            }

            if (rowIndex >= 0) {
                console.log(`Found matching row at index ${rowIndex} in table ${i}`);

                // Important: First make the table visible before any scrolling attempts
                setShowTable(true);

                // Delay other operations to ensure the table is fully rendered
                setTimeout(() => {
                    // Set the correct table view
                    setCurrentTableIndex(i);

                    // Set selected row
                    setSelectedRowIndices([rowIndex]);

                    // Clear any previous scrollToRowIndex value first
                    // This ensures the effect will trigger even if selecting the same row again
                    setScrollToRowIndex(null);

                    // Then set the new value in the next render cycle
                    setTimeout(() => {
                        setScrollToRowIndex(rowIndex);
                        console.log(`Set scrollToRowIndex to ${rowIndex}`);
                    }, 50);
                }, 100);

                break;
            }
        }
    };

const highlightMultipleFeatures = (rowIndices) => {
    if (!rowIndices || rowIndices.length === 0 || !map) return;
    
    // Reset any previous highlighting
    resetLayerHighlighting();
    
    // Highlight each selected row's corresponding feature
    rowIndices.forEach(rowIndex => {
      const row = tableData[currentTableIndex]?.rows[rowIndex];
      if (!row) return;
      
      // Check which table we're on and highlight the appropriate feature
      switch (currentTableIndex) {
        case 0: // Coffee Shops
          highlightCoffeeShop(row, true); // Add 'isMultiSelect' parameter
          break;
        case 1: // Foot Traffic
          highlightFootTrafficArea(row, true); // Add 'isMultiSelect' parameter
          break;
      }
    });
    
    // If we have multiple points selected, fit the map to show all of them
    if (rowIndices.length > 1) {
      const bounds = L.latLngBounds([]);
      const markers = [];
      
      // Collect all marker positions for bounds calculation
      rowIndices.forEach(rowIndex => {
        const row = tableData[currentTableIndex]?.rows[rowIndex];
        if (!row || !row['Feature ID']) return;
        
        if (currentTableIndex === 0) { // Coffee Shops
          const shop = coffeeShopsRef.current.find(s => s.featureId === row['Feature ID']);
          if (shop && shop.marker) {
            markers.push(shop.marker);
            bounds.extend(shop.marker.getLatLng());
          }
        } else if (currentTableIndex === 1) { // Foot Traffic
          const point = footTrafficPointsRef.current.find(p => p.featureId === row['Feature ID']);
          if (point) {
            bounds.extend(point.latlng);
          }
        }
      });
      
      // Only fit bounds if we found valid markers
      if (!bounds.isValid()) return;
      
      // Fit the map to show all selected points with some padding
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 16,
        animate: true
      });
    }
  };

    
    const highlightFeatureByRowProperties = (rowIndices) => {
        if (!rowIndices || (Array.isArray(rowIndices) && rowIndices.length === 0) || !map) return;
        
        // Reset any previous highlighting
        resetLayerHighlighting();
        
        // Handle both single index and array of indices
        if (Array.isArray(rowIndices)) {
          highlightMultipleFeatures(rowIndices);
        } else {
          // Single selection case - use existing behavior
          const row = tableData[currentTableIndex]?.rows[rowIndices];
          if (!row) return;
          
          // Check which table we're on and highlight the appropriate feature
          switch (currentTableIndex) {
            case 0: // Coffee Shops
              highlightCoffeeShop(row);
              break;
            case 1: // Foot Traffic
              highlightFootTrafficArea(row);
              break;
          }
        }
      };

    const highlightCoffeeShop = (row, isMultiSelect = false) => {        if (!row || !map) return;

        // Look for the Feature ID first - this is the most reliable way to match
        const featureId = row['Feature ID'];

        if (featureId) {
            // Try to find a direct match by feature ID
            const matchedShop = coffeeShopsRef.current.find(shop => shop.featureId === featureId);

            if (matchedShop) {
                // Direct match found - highlight this marker
                highlightMarker(matchedShop.marker);
                return;
            }
        }

        // Fallback to other matching methods if feature ID didn't match
        let foundMarker = false;

        // Try to match by name or other properties
        coffeeShopsRef.current.forEach(({ marker }) => {
            const popupContent = marker.getPopup()?.getContent() || '';

            // Match by name/dba if available
            const nameMatch = row.name && popupContent.includes(row.name);
            const dbaMatch = row.dba && popupContent.includes(row.dba);

            if (nameMatch || dbaMatch) {
                highlightMarker(marker);
                foundMarker = true;
            }
        });

        // Last resort: try using coordinates
        if (!foundMarker) {
            highlightByCoordinates(row);
        }
    };

    const highlightMarker = (marker, isMultiSelect = false) => {
        // Change the marker's icon to make it stand out
        marker.setIcon(L.divIcon({
            html: `
              <div style="
                position: relative;
                width: 28px;
                height: 28px;
                display: flex;
                align-items: center;
                justify-content: center;
              ">
                <div style="
                  position: absolute;
                  width: 24px;
                  height: 24px;
                  border: 3px solid #008080;
                  border-radius: 50%;
                  background-color: transparent;
                  box-sizing: border-box;
                "></div>
                <div style="
                  width: 12px;
                  height: 12px;
                  background-color: #CC6600;
                  border-radius: 50%;
                  z-index: 2;
                "></div>
              </div>
            `,
            className: '',
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          }));
          
          
        if (!isMultiSelect) {
            // Calculate visible map area when table is showing
            const containerHeight = mapContainerRef.current.clientHeight;
        
            // Get marker position and calculate offset to center it in the visible area
            const markerLatLng = marker.getLatLng();
        
            // Create a point that will be centered in the visible map area
            // The offset calculation moves the point up to account for the table
            const targetPoint = showTable
              ? map.project(markerLatLng).add([0, tableHeight/1.6])
              : map.project(markerLatLng);
        
            // Convert back to LatLng and pan the map to center on this point
            const targetLatLng = map.unproject(targetPoint);
        
            // Zoom and pan to the adjusted center
            map.setView(targetLatLng, 16, {
              animate: true,
              duration: 0.5
            });
          }
        };
        
    // Extract the coordinate-based highlighting into a separate function
    const highlightByCoordinates = (row) => {
        // Try to extract coordinates from the row data
        let lat, lng;

        // Check various possible property names for coordinates
        if (row.latitude && row.longitude) {
            lat = parseFloat(row.latitude);
            lng = parseFloat(row.longitude);
        } else if (row.lat && row.lng) {
            lat = parseFloat(row.lat);
            lng = parseFloat(row.lng);
        } else if (row.y && row.x) {
            lat = parseFloat(row.y);
            lng = parseFloat(row.x);
        } else if (row.coordinates) {
            try {
                // Try to parse a coordinates string like "40.7589, -73.9866"
                const coords = row.coordinates.split(',').map(c => parseFloat(c.trim()));
                if (coords.length >= 2) {
                    lat = coords[0];
                    lng = coords[1];
                }
            } catch (e) {
                // Ignore parsing errors
            }
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            const latlng = L.latLng(lat, lng);

            // Calculate visible map area when table is showing
            const containerHeight = mapContainerRef.current.clientHeight;
            const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;

            // Get projected point and calculate offset
            const point = map.project(latlng);
            const offsetPoint = showTable
                ? point.add([0, tableHeight / 1.6])
                : point;
            // Convert back to LatLng and pan the map
            const targetLatLng = map.unproject(offsetPoint);

            // Set view with animation
            map.setView(targetLatLng, 16, {
                animate: true,
                duration: 0.5
            });

        }
    };

    const highlightFootTrafficArea = (row, isMultiSelect = false) => {
        if (!row) return;

        // First try to match by Feature ID
        const featureId = row['Feature ID'];

        if (featureId) {
            // Try to find the point with the matching Feature ID
            const matchedPoint = footTrafficPointsRef.current.find(point => point.featureId === featureId);

            if (matchedPoint) {
                highlightFootTrafficPoint(matchedPoint.latlng);
                return;
            }
        }

        // Fallback: Try to highlight by coordinates from row
        let lat, lng;

        // Try to get coordinates from various properties
        if (row.location) {
            const [rowLat, rowLng] = row.location.split(',').map(coord => parseFloat(coord.trim()));
            if (!isNaN(rowLat) && !isNaN(rowLng)) {
                lat = rowLat;
                lng = rowLng;
            }
        } else if (row.latitude && row.longitude) {
            lat = parseFloat(row.latitude);
            lng = parseFloat(row.longitude);
        } else if (row.lat && row.lng) {
            lat = parseFloat(row.lat);
            lng = parseFloat(row.lng);
        } else if (row.y && row.x) {
            lat = parseFloat(row.y);
            lng = parseFloat(row.x);
        }

        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
            highlightFootTrafficPoint(L.latLng(lat, lng), isMultiSelect);
          }
    };

    const highlightFootTrafficPoint = (feature, isMultiSelect = false) => {
        if (!map || !feature) return;
      
        // Parse latlng from various possible formats
        let latlng;
        if (feature.geometry?.coordinates) {
          latlng = L.latLng(feature.geometry.coordinates[1], feature.geometry.coordinates[0]);
        } else if (feature.lat && feature.lng) {
          latlng = L.latLng(feature.lat, feature.lng);
        } else if (typeof feature.getLatLng === 'function') {
          latlng = feature.getLatLng();
        } else {
          console.error('Invalid feature format in highlightFootTrafficPoint:', feature);
          return;
        }
      
        const coralColor = '#008080';
      
        // Create simple coral dot
        const tempCircle = L.circleMarker(latlng, {
          radius: 10,
          color: coralColor,
          fillColor: coralColor,
          fillOpacity: 1,
          weight: 1,
        }).addTo(map);
      
        // Pan the map if not in multi-select
        if (!isMultiSelect) {
          const containerHeight = mapContainerRef.current.clientHeight;
          const point = map.project(latlng);
          const offsetPoint = showTable ? point.add([0, tableHeight / 1.6]) : point;
          const targetLatLng = map.unproject(offsetPoint);
          map.setView(targetLatLng, 16, { animate: true, duration: 0.5 });
        }
      
        // Remove after 2s
        setTimeout(() => {
          if (map && tempCircle) map.removeLayer(tempCircle);
        }, 2000);
      };
      

    // Add this effect to properly clean up map styles when component unmounts
    useEffect(() => {
        // This cleanup function will run when the component unmounts
        return () => {
            if (map && baseMapLayer) {
                // Check if baseMapLayer is a composite layer (for hybrid view)
                if (baseMapLayer.main && baseMapLayer.labels) {
                    map.removeLayer(baseMapLayer.main);
                    map.removeLayer(baseMapLayer.labels);
                } else {
                    // Single layer case
                    map.removeLayer(baseMapLayer);
                }
            }
        };
    }, [map, baseMapLayer]);

    // Add a useEffect to handle changes to the currentMapView
    useEffect(() => {
        if (map && currentMapView) {
            // You could add any additional logic here that needs to run
            // when the map style changes, such as adjusting other visual elements

            // For example, for dark mode you might want to adjust some UI colors
            if (currentMapView === 'dark') {
                // Adjust any UI elements that need to change for dark backgrounds
                // Example: change popup styling for better contrast
                const style = document.createElement('style');
                style.id = 'dark-map-adjustments';
                style.textContent = `
          .custom-popup .leaflet-popup-content-wrapper {
            background-color: rgba(40, 40, 40, 0.9);
            color: white;
          }
          .custom-popup .leaflet-popup-tip {
            background-color: rgba(40, 40, 40, 0.9);
          }
        `;
                document.head.appendChild(style);

                return () => {
                    // Clean up when view changes
                    const styleElement = document.getElementById('dark-map-adjustments');
                    if (styleElement) document.head.removeChild(styleElement);
                };
            }
        }
    }, [map, currentMapView]);

 
    useEffect(() => {
        if (!map) return;
      
        // Assign callback functions for showing/hiding the text toolbar
        map._showTextToolbar = ({ marker, format }) => {
          setActiveTextMarker(marker);
          setTextFormat(format);
          // Position is now fixed at the top center of the map, regardless of where the marker is
          setTextToolbarPosition({ 
            top: 16, 
            left: mapContainerRef.current ? mapContainerRef.current.clientWidth / 2 : window.innerWidth / 2 
          });
          setShowTextToolbar(true);
        };
      
        map._hideTextToolbar = () => {
          setShowTextToolbar(false);
          setActiveTextMarker(null);
        };
      
        return () => {
          // Clean up when component unmounts
          if (map) {
            map._showTextToolbar = null;
            map._hideTextToolbar = null;
          }
        };
      }, [map]);

      useEffect(() => {
        if (Array.isArray(selectedRowIndices) && selectedRowIndices.length > 0) {
          highlightFeatureByRowProperties(selectedRowIndices);
        }
      }, [selectedRowIndices, currentTableIndex]);
      
    useEffect(() => {
        console.log("drawnLayersOrder changed:", drawnLayersOrder);
        console.log("drawnLayers state:", drawnLayers);
      }, [drawnLayersOrder, drawnLayers]);
    useEffect(() => {
        if (map) {
            // Set up click-to-edit for automatically editing shapes when clicked
            const cleanup = setupClickToEdit(
                map,
                editControlRef,
                setIsEditing,
                setActiveDrawTool
            );

            // Debug listener to verify clicks are being detected
            map.on('click', function (e) {
                console.log('Map clicked at:', e.latlng);
                console.log('Map has drawnItems:', !!map.drawnItems);
                console.log('Number of drawn items:', map.drawnItems ? map.drawnItems.getLayers().length : 0);
            });
            if (map.drawControl) {
                // Add listener for delete events
                const originalOnDeleted = L.EditToolbar.Delete.prototype._removeLayer;
                
                L.EditToolbar.Delete.prototype._removeLayer = function(e) {
                  const layer = e.layer || e;
                  
                  // Call original method
                  originalOnDeleted.call(this, e);
                  
                  // Check if this is one of our tracked layers
                  if (layer.layerId) {
                    // Remove from drawn layers state
                    setDrawnLayers(prev => {
                      const updated = { ...prev };
                      delete updated[layer.layerId];
                      return updated;
                    });
                    
                    setDrawnLayersOrder(prev => {
                        // Ensure prev is an array
                        const prevArray = Array.isArray(prev) ? prev : [];
                        const newOrder = [...prevArray, layer.layerId];
                        drawnLayersRef.current = newOrder; // Store in a ref for debugging
                        console.log("Updated drawn layers order:", newOrder);
                        return newOrder;
                      });         }
                };
              }
            return cleanup;
        }
    }, [map]);

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

    
    const sendQuestionToChat = (question) => {
        if (typeof onSendMessage === 'function') {
            onSendMessage({ text: question, file: null });
        } else {
            console.warn('No onSendMessage function available to send question to chat');
            // Fallback: Alert the user their question can't be sent
            alert(`Unable to send question: "${question}" to chat. The chat functionality may not be available.`);
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
    const handleTextFormatChange = (formatChanges) => {
        if (!activeTextMarker) return;
      
        // Update the text format state
        const newFormat = { ...textFormat, ...formatChanges };
        setTextFormat(newFormat);
      
        // Apply formatting to the marker
        if (activeTextMarker._textContent) {
          // Apply font properties
          if (formatChanges.fontFamily) {
            activeTextMarker._textContent.style.fontFamily = formatChanges.fontFamily;
          }
          
          if (formatChanges.fontSize) {
            activeTextMarker._textContent.style.fontSize = `${formatChanges.fontSize}px`;
          }
          
          if (formatChanges.fontWeight) {
            activeTextMarker._textContent.style.fontWeight = formatChanges.fontWeight;
          }
          
          if (formatChanges.fontStyle) {
            activeTextMarker._textContent.style.fontStyle = formatChanges.fontStyle;
          }
          
          if (formatChanges.textDecoration) {
            activeTextMarker._textContent.style.textDecoration = formatChanges.textDecoration;
          }
          
          if (formatChanges.textAlign) {
            activeTextMarker._textContent.style.textAlign = formatChanges.textAlign;
          }
          
          if (formatChanges.color) {
            activeTextMarker._textContent.style.color = formatChanges.color;
          }
      
          // Update marker state
          activeTextMarker._state = { ...activeTextMarker._state, ...formatChanges };
      
          // Update marker icon to refresh display
          if (activeTextMarker._icon && activeTextMarker.setIcon) {
            const el = activeTextMarker._textElement;
            const state = activeTextMarker._state;
            
            const width = el.offsetWidth || state.width || 100;
            const height = el.offsetHeight || state.height || 40;
            
            const icon = L.divIcon({
              html: el,
              className: '',
              iconSize: [width, height],
              iconAnchor: [width / 2, height / 2]
            });
            
            activeTextMarker.setIcon(icon);
          }
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
                    link.download = `nyc_coffee_map_${new Date().toISOString().slice(0, 10)}.jpg`;
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
    
    const toggleDrawnLayer = (layerId) => {
        // First, check if we have the layer
        if (!drawnLayers || !drawnLayers[layerId] || !map) return;
        
        const layerInfo = drawnLayers[layerId];
        const layer = layerInfo.layer;
        const newVisibility = !layerInfo.visible;
        
        // Directly manipulate the visibility immediately
        if (newVisibility) {
          // Show the layer
          if (map.drawnItems && !map.drawnItems.hasLayer(layer)) {
            map.drawnItems.addLayer(layer);
          }
        } else {
          // Hide the layer
          if (map.drawnItems && map.drawnItems.hasLayer(layer)) {
            map.drawnItems.removeLayer(layer);
          }
        }
        
        // Then update the state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          if (updated[layerId]) {
            updated[layerId] = {
              ...updated[layerId],
              visible: newVisibility
            };
          }
          return updated;
        });
      };

    const toggleLayer = (layerName) => {
        console.log('Toggling layer:', layerName, 'Current state:', activeLayers[layerName]);
    
        setActiveLayers(prev => {
            const newActiveLayers = {
                ...prev,
                [layerName]: !prev[layerName]
            };
    
            console.log('New active layers state:', newActiveLayers);
    
            // If we're turning this layer on, make it the top interactive layer
            if (!prev[layerName] && newActiveLayers[layerName]) {
                console.log('Setting new top layer after toggle on:', layerName);
                setTopInteractiveLayer(layerName);
            } else if (prev[layerName] && !newActiveLayers[layerName] && topInteractiveLayer === layerName) {
                // If we're turning off the top layer, find a new top layer
                const sorted = Object.entries(layerZIndexes)
                    .filter(([key]) => newActiveLayers[key]) // Only consider active layers
                    .sort(([, a], [, b]) => b - a); // Sort by Z-index, highest first
    
                if (sorted.length > 0) {
                    console.log('Setting new top layer after toggle off:', sorted[0][0]);
                    setTopInteractiveLayer(sorted[0][0]);
                }
            }
    
            return newActiveLayers;
        });
    };
    

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    
    useEffect(() => {
    if (!map) return;

    // Toggle coffee shops layer
    if (map.coffeeShopsLayer) {
        if (activeLayers.coffeeShops) {
            map.addLayer(map.coffeeShopsLayer);
            // Set z-index based on current order
            map.coffeeShopsLayer.setZIndex(layerZIndexes.coffeeShops);

            // Ensure interactivity is set correctly when adding the layer
            coffeeShopsRef.current.forEach(({ marker }) => {
                marker.options.interactive = (topInteractiveLayer === 'coffeeShops');
                // Make sure popups are bound even if not initially interactive
                if (!marker.getPopup() && marker.featureId) {
                    let popupContent = '<strong>Coffee Shop</strong>';
                    popupContent += `<br>Feature ID: ${marker.featureId}`;
                    marker.bindPopup(popupContent);
                }
            });
        } else {
            map.removeLayer(map.coffeeShopsLayer);
        }
    }

    // Toggle foot traffic layer
    if (map.footTrafficLayer) {
        if (activeLayers.footTraffic) {
            map.addLayer(map.footTrafficLayer);
            // Set z-index based on current order
            map.footTrafficLayer.setZIndex(layerZIndexes.footTraffic);

            // Ensure interactivity is set correctly when adding the layer
            if (footTrafficHeatmapRef.current) {
                footTrafficHeatmapRef.current.options.interactive = (topInteractiveLayer === 'footTraffic');
                
                // For heatmap layers, we need to set the CSS pointer-events property
                if (footTrafficHeatmapRef.current._heatmap) {
                    footTrafficHeatmapRef.current._heatmap.style.pointerEvents = 
                        (topInteractiveLayer === 'footTraffic') ? 'auto' : 'none';
                }
            }
        } else {
            map.removeLayer(map.footTrafficLayer);
        }
    }

    // Toggle radius circle layer
    if (map.radiusCircleLayer) {
        if (activeLayers.radius) {
            map.addLayer(map.radiusCircleLayer);
            // Set z-index based on current order
            map.radiusCircleLayer.setZIndex(layerZIndexes.radius);

            // Ensure interactivity is set correctly when adding the layer
            if (radiusCircleRef.current) {
                radiusCircleRef.current.options.interactive = (topInteractiveLayer === 'radius');
            }
        } else {
            map.removeLayer(map.radiusCircleLayer);
        }
    }

    // Force a refresh of the map
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 10);
}, [map, activeLayers, layerZIndexes, topInteractiveLayer]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            // Prevent deselect if clicking on context menu or header
            if (e.target.closest('th') || e.target.closest('.context-menu')) return;
            setSelectedRowIndices([]);
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
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setSelectedRowIndices([]);
                setSelectedColIndex(null);

                // Clear selection highlights from the map
                if (map) {
                    map.eachLayer(layer => {
                        if (layer._icon) {
                            layer._icon.style.backgroundColor = '';
                            layer._icon.style.border = '';
                            layer._icon.style.boxShadow = '';
                        }
                    });

                    // Also close any open popups
                    map.closePopup();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
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




    const convertGeoJSONToTable = (data, layerType) => {
        if (!data || !data.features || !data.features.length) return { headers: [], rows: [] };

        // Get all possible properties across features
        const allProperties = new Set();
        data.features.forEach(feature => {
            if (feature.properties) {
                Object.keys(feature.properties).forEach(key => allProperties.add(key));
            }
        });

        // Create table headers - put Feature ID first for clarity
        const headers = ["Feature ID", "Geometry Type", ...Array.from(allProperties).filter(prop => prop !== 'Feature ID')];

        // Create table rows
        const rows = data.features.map((feature) => {
            // Use the same Feature ID that was set on the feature
            const featureId = feature.properties && feature.properties['Feature ID']
                ? feature.properties['Feature ID']
                : null;

            const row = {
                "Feature ID": featureId, // Use the consistent Feature ID
                "Geometry Type": feature.geometry?.type || "Unknown"
            };

            // Add all properties
            allProperties.forEach(prop => {
                if (prop !== 'Feature ID') { // Skip Feature ID since we already added it
                    const value = feature.properties ? feature.properties[prop] : "";
                    row[prop] = typeof value === 'object' && value !== null
                        ? JSON.stringify(value)
                        : value ?? "";
                }
            });

            return row;
        });

        return { headers, rows };
    };

    const handleDownloadAll = () => {
        const downloadedFiles = [];
        // Add at the beginning of your handleDownloadAll function
        console.log('Debug - footTrafficPointsRef:', footTrafficPointsRef);
        console.log('Debug - footTrafficPointsRef?.current:', footTrafficPointsRef?.current);
        console.log('Debug - Selected layers:', selectedLayers);
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

                            // Check if jsPDF is available
                            if (typeof jsPDF === 'undefined') {
                                // Load jsPDF if not available
                                const script = document.createElement('script');
                                script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
                                script.onload = () => {
                                    const { jsPDF } = window.jspdf;
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
                                };
                                document.head.appendChild(script);
                            } else {
                                // jsPDF is already available
                                const pdf = new jsPDF({
                                    orientation: 'landscape',
                                    unit: 'mm'
                                });
                                const imgWidth = 280; // mm
                                const imgHeight = (canvas.height * imgWidth) / canvas.width;
                                pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
                                pdf.save(`${filename}.pdf`);
                            }
                        } catch (err) {
                            console.error("Error creating PDF:", err);
                        }
                    }).catch(err => {
                        console.error("Error rendering canvas for PDF:", err);
                    });
                } else if (format === '.shp' || format === '.gdb' || format === '.csv') {
                    // For GIS formats that need server-side processing
                    // First show loading notification
                    setNotificationMessage(`Processing ${format} export...`);
                    setShowEmailNotification(true);

                    // Collect map data
                    const mapData = {
                        coffeeShops: [],
                        radius: null
                    };

                    // Gather coffee shop data
                    if (map && coffeeShopsRef.current.length > 0) {
                        coffeeShopsRef.current.forEach(({ marker, potential }) => {
                            const position = marker.getLatLng();
                            const popupContent = marker.getPopup()?.getContent() || '';

                            // Extract name from popup if available
                            let name = "Coffee Shop";
                            const nameMatch = popupContent.match(/Name: ([^<]+)/);
                            if (nameMatch && nameMatch[1]) {
                                name = nameMatch[1].trim();
                            }

                            mapData.coffeeShops.push({
                                lat: position.lat,
                                lng: position.lng,
                                name: name,
                                potential: potential,
                                type: 'Coffee Shop'
                            });
                        });
                    }

                    // Gather radius data
                    if (map && radiusCircleRef.current) {
                        const circle = radiusCircleRef.current;
                        mapData.radius = {
                            center: circle.getLatLng(),
                            radius: circle.getRadius()
                        };
                    }

                    // Send to server for processing
                    fetch('/api/export-map', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            format,
                            mapData
                        }),
                    })
                        .then(response => {
                            if (!response.ok) {
                                throw new Error('Network response was not ok');
                            }

                            // Get filename from content-disposition header if available
                            let serverFilename = fullName;
                            const contentDisposition = response.headers.get('content-disposition');
                            if (contentDisposition) {
                                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                                if (filenameMatch && filenameMatch[1]) {
                                    serverFilename = filenameMatch[1];
                                }
                            }

                            // Different handling based on the response type
                            if (format === '.csv') {
                                return response.text().then(text => ({
                                    data: text,
                                    type: 'text/csv',
                                    filename: serverFilename || `${filename}.csv`
                                }));
                            } else {
                                return response.arrayBuffer().then(buffer => ({
                                    data: buffer,
                                    type: 'application/zip',
                                    filename: serverFilename || `${filename}${format}.zip`
                                }));
                            }
                        })
                        .then(({ data, type, filename }) => {
                            // Create blob and trigger download
                            const blob = new Blob([data], { type });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = filename;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);

                            // Success notification
                            setNotificationMessage(`Successfully exported as ${format}`);
                            setShowEmailNotification(true);
                        })
                        .catch(error => {
                            console.error('Error exporting map:', error);
                            setNotificationMessage(`Error exporting as ${format}. See console for details.`);
                            setShowEmailNotification(true);
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
    const safeSetDrawnLayersOrder = (value) => {
        if (value !== null && typeof value !== 'undefined') {
          setDrawnLayersOrder(value);
        }
      };
      
    useEffect(() => {
        if (tableData.length > 0 && !isModified &&
            tableData[currentTableIndex] &&
            tableData[currentTableIndex].rows) {
            setOriginalRowsMap(prev => ({
                ...prev,
                [currentTableIndex]: JSON.parse(JSON.stringify(tableData[currentTableIndex].rows))
            }));
        }
    }, [tableData, currentTableIndex, isModified]);

    useEffect(() => {
        if (!map) return;

        // ✅ Only create and add drawnItems if it doesn't already exist
        if (!map.drawnItems) {
            const drawnItems = new L.FeatureGroup();
            drawnItems.setZIndex(1000);
            map.addLayer(drawnItems);
            map.drawnItems = drawnItems;

            const drawControl = new L.Control.Draw({
                draw: {
                    polygon: false,
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
        }
    }, [map]);


    useEffect(() => {
        if (!map) return;

        // Set z-index for all layers to ensure proper stacking
        Object.entries(layerZIndexes).forEach(([layerId, zIndex]) => {
            // Get the appropriate layer based on ID
            let layer;
            if (layerId === 'coffeeShops') layer = map.coffeeShopsLayer;
            else if (layerId === 'footTraffic') layer = map.footTrafficLayer;
            else if (layerId === 'radius') layer = map.radiusCircleLayer;

            if (layer) {
                // Set z-index properly
                layer.setZIndex(zIndex);

                // Also update individual markers for coffee shops
                if (layerId === 'coffeeShops') {
                    coffeeShopsRef.current.forEach(({ marker }) => {
                        // For markers, we need to set z-index on their icons
                        if (marker._icon) {
                            marker._icon.style.zIndex = zIndex + 10; // Add offset to ensure they're above the layer
                        }
                    });
                }
            }
        });

        // Force a refresh of the map
        setTimeout(() => {
            if (map) map.invalidateSize();
        }, 10);
    }, [map, layerZIndexes]);

    // For debugging: Add this function and call it in your useEffect after map initialization
    const addDebugClickHandler = () => {
        if (!map) return;

        // Add a click handler to log all events
        map.on('click', function (e) {
            console.log('Map clicked at:', e.latlng);
            console.log('Current topInteractiveLayer:', topInteractiveLayer);

            // Get all layers at this point
            const clickedPoint = e.latlng;
            let clickableLayers = [];

            map.eachLayer(function (layer) {
                // For markers
                if (layer.getLatLng) {
                    const distance = clickedPoint.distanceTo(layer.getLatLng());
                    if (distance < 20) { // Within 20 pixels
                        clickableLayers.push({
                            type: 'marker',
                            distance: distance,
                            interactive: layer.options.interactive,
                            layer: layer
                        });
                    }
                }

                // For circles
                if (layer.getRadius) {
                    const distance = clickedPoint.distanceTo(layer.getLatLng());
                    if (distance < layer.getRadius()) {
                        clickableLayers.push({
                            type: 'circle',
                            distance: distance,
                            interactive: layer.options.interactive,
                            layer: layer
                        });
                    }
                }
            });

            console.log('Clickable layers at this point:', clickableLayers);
        });
    };

    const fetchCoffeeShops = async () => {
        try {
            const res = await fetch('/data/coffeeshop-data.geojson');
            const shopData = await res.json();
            const coffeeLayer = L.layerGroup();

            // Times Square coordinates
            const timesSquare = L.latLng(40.7589, -73.9866);
            const radiusInMeters = radius * 1609.34;

            // Create a filtered version of the shop data for the table
            const filteredShopData = {
                type: "FeatureCollection",
                features: []
            };

            if (shopData.features && shopData.features.length > 0) {
                // First pass: Ensure all features have a consistent Feature ID
                shopData.features.forEach((feature, index) => {
                    if (!feature.properties) {
                        feature.properties = {};
                    }

                    // Create a consistent Feature ID that will be used in both map and table
                    feature.properties['Feature ID'] = feature.properties['Feature ID'] ||
                        feature.properties.id ||
                        `${index + 1}`;
                });

                // Second pass: Create markers and populate filtered data
                shopData.features.forEach((feature) => {
                    let coords;

                    // Get coordinates either from geometry or from properties
                    if (feature.geometry && feature.geometry.type === 'Point') {
                        coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                    } else if (feature.properties && feature.properties.latitude && feature.properties.longitude) {
                        coords = [
                            parseFloat(feature.properties.latitude),
                            parseFloat(feature.properties.longitude)
                        ];
                    } else {
                        // Skip features without coordinates
                        return;
                    }

                    // Create a Leaflet LatLng object for distance calculation
                    const shopLocation = L.latLng(coords[0], coords[1]);

                    // Calculate distance from Times Square
                    const distanceToTimesSquare = timesSquare.distanceTo(shopLocation);

                    // Skip shops outside the radius
                    if (distanceToTimesSquare > radiusInMeters) {
                        return;
                    }

                    // Get the consistent Feature ID
                    const featureId = feature.properties['Feature ID'];

                    // Add this feature to our filtered data for the table
                    filteredShopData.features.push(feature);

                    // Determine the coffee shop type and potential
                    let color = layerColors.existingShop;
                    let potential = feature.properties?.potential || 'existing';

                    // Create marker with appropriate styling
                    const marker = L.marker(coords, {
                        icon: L.divIcon({
                            html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                            className: '',
                            iconSize: [14, 14]
                        }),
                        // IMPORTANT: Set interactive based on topInteractiveLayer rather than hard-coding it
                        interactive: topInteractiveLayer === 'coffeeShops'
                    });

                    // Store the Feature ID directly on the marker for easy access
                    marker.featureId = featureId;

                    // Create popup content with Feature ID prominently displayed
                    let popupContent = '<strong>Coffee Shop</strong>';
                    popupContent += `<br>Feature ID: ${featureId}`;

                    if (feature.properties) {
                        if (feature.properties.dba || feature.properties.name) {
                            popupContent += `<br>Name: ${feature.properties.dba || feature.properties.name}`;
                        }
                        if (feature.properties.street && feature.properties.building) {
                            popupContent += `<br>Address: ${feature.properties.building} ${feature.properties.street}`;
                        }
                        if (feature.properties.grade) {
                            popupContent += `<br>Grade: ${feature.properties.grade}`;
                        }
                        if (feature.properties.score) {
                            popupContent += `<br>Score: ${feature.properties.score}`;
                        }
                        if (feature.properties.cuisine_description) {
                            popupContent += `<br>Type: ${feature.properties.cuisine_description}`;
                        }
                    }

                    // IMPORTANT: Always bind the popup, not conditionally
                    marker.bindPopup(popupContent, { className: 'custom-popup' });

                    // IMPORTANT: Clicking a marker should always work if it's interactive
                    marker.on('click', function (e) {
                        console.log('Coffee shop clicked:', featureId);
                        if (e) L.DomEvent.stopPropagation(e); // Prevent event bubbling
                        selectRowByFeatureProperties(feature.properties);
                    });

                    // Store reference to marker with its feature ID for easier lookup
                    coffeeShopsRef.current.push({ marker, potential, featureId });
                    coffeeLayer.addLayer(marker);
                });
            }

            return { coffeeLayer, shopData: filteredShopData };
        } catch (error) {
            console.error("Error fetching coffee shop data:", error);
            return { coffeeLayer: L.layerGroup(), shopData: { features: [] } };
        }
    };


useEffect(() => {
    if (!map) return;

    console.log('Top interactive layer changed to:', topInteractiveLayer);

    // First make all layers non-interactive
    map.eachLayer(layer => {
        if (layer._icon || layer._path || (layer.options && !layer._url)) {
            // Skip tile layers (they have _url)
            layer.options.interactive = false;

            // For leaflet-heat layers, we need special handling
            if (layer._heat && layer._heatmap) {
                layer._heatmap.style.pointerEvents = 'none';
            }

            // Close any open popups
            if (layer.closePopup && layer.isPopupOpen && layer.isPopupOpen()) {
                layer.closePopup();
            }
        }
    });

    // Coffee shops layer - make only these interactive if they're the top layer
    if (topInteractiveLayer === 'coffeeShops') {
        coffeeShopsRef.current.forEach(({ marker }) => {
            // Make the marker interactive
            marker.options.interactive = true;

            // Ensure popups are correctly bound
            if (!marker._popup && marker.featureId) {
                let popupContent = '<strong>Coffee Shop</strong>';
                popupContent += `<br>Feature ID: ${marker.featureId}`;
                marker.bindPopup(popupContent);
            }

            // Make sure click events are properly bound
            marker.off('click');
            marker.on('click', function (e) {
                console.log('Coffee shop clicked:', marker.featureId);
                if (e) L.DomEvent.stopPropagation(e);
                selectRowByFeatureProperties({ 'Feature ID': marker.featureId });
            });
        });
    }

    // Foot traffic layer - special handling for heatmap
    if (topInteractiveLayer === 'footTraffic') {
        if (footTrafficHeatmapRef.current) {
            // Direct DOM manipulation for heatmap layers
            if (footTrafficHeatmapRef.current._heatmap) {
                footTrafficHeatmapRef.current._heatmap.style.pointerEvents = 'auto';
            }

            // Ensure click handler is set
            footTrafficHeatmapRef.current.off('click');
            footTrafficHeatmapRef.current.on('click', function (e) {
                console.log('Foot traffic heatmap clicked', e.latlng);

                let nearest = null;
                let minDist = Infinity;

                footTrafficPointsRef.current.forEach(point => {
                    const dist = e.latlng.distanceTo(point.latlng);
                    if (dist < minDist) {
                        minDist = dist;
                        nearest = point;
                    }
                });

                // Create popup content
                let popupContent;

                if (nearest && minDist < 50) {
                    popupContent = `
                  <div class="p-2">
                    <h3 class="text-sm font-semibold">Foot Traffic Point</h3>
                    <p class="text-xs text-gray-700">ID: ${nearest.featureId}</p>
                    <p class="text-xs text-gray-700">Intensity: ${(nearest.properties.intensity * 10 || 5).toFixed(1)}/10</p>
                    ${nearest.properties.time ? `<p class="text-xs text-gray-700">Time: ${nearest.properties.time}</p>` : ''}
                    ${nearest.properties.count ? `<p class="text-xs text-gray-700">Count: ${nearest.properties.count} people/hour</p>` : ''}
                  </div>
                `;
                }

                // Create and open a popup at the clicked location
                L.popup({ className: 'custom-popup' })
                    .setLatLng(e.latlng)
                    .setContent(popupContent)
                    .openOn(map);
            });
        }

        // Also make individual foot traffic points interactive
        footTrafficPointsRef.current.forEach(point => {
            if (point.marker) {
                point.marker.options.interactive = true;

                // Ensure popups are bound
                if (!point.marker._popup) {
                    const popupContent = `
                  <div class="p-2">
                    <h3 class="text-sm font-semibold">Foot Traffic Point</h3>
                    <p class="text-xs text-gray-700">ID: ${point.featureId}</p>
                    <p class="text-xs text-gray-700">Intensity: ${(point.properties.intensity * 10 || 5).toFixed(1)}/10</p>
                    ${point.properties.time ? `<p class="text-xs text-gray-700">Time: ${point.properties.time}</p>` : ''}
                    ${point.properties.count ? `<p class="text-xs text-gray-700">Count: ${point.properties.count} people/hour</p>` : ''}
                  </div>
                `;
                    point.marker.bindPopup(popupContent);
                }

                // Ensure click handler is bound
                point.marker.off('click');
                point.marker.on('click', function (e) {
                    console.log('Foot traffic point clicked:', point.featureId);
                    if (e) L.DomEvent.stopPropagation(e);
                    selectRowByFeatureProperties({ 'Feature ID': point.featureId });
                });
            }
        });
    }

    // Radius circle layer
    if (topInteractiveLayer === 'radius' && radiusCircleRef.current) {
        radiusCircleRef.current.options.interactive = true;

        // Ensure popup is bound
        if (!radiusCircleRef.current._popup) {
            radiusCircleRef.current.bindPopup(`
              <div class="p-2">
                <h3 class="text-lg font-semibold text-[#4169E1] mb-2">Times Square Area</h3>
                <p class="text-sm text-gray-700 mb-1">Center: Times Square, New York</p>
                <p class="text-sm text-gray-700 mb-1">Radius: ${radius} miles</p>
                <p class="text-sm text-gray-700">This area represents the primary zone of analysis for coffee shop potential.</p>
              </div>
            `, {
                maxWidth: 250,
                className: 'custom-popup'
            });
        }

        // Ensure click handler is bound
        radiusCircleRef.current.off('click');
        radiusCircleRef.current.on('click', function (e) {
            console.log('Radius circle clicked');
            if (e) L.DomEvent.stopPropagation(e);
        });
    }

    // Force Leaflet to update by invalidating size
    setTimeout(() => {
        if (map) map.invalidateSize();
    }, 10);

}, [map, topInteractiveLayer, radius]);


    useEffect(() => {
        const sorted = Object.entries(layerZIndexes)
            .filter(([key]) => activeLayers[key]) // Only consider active layers
            .sort(([, a], [, b]) => b - a); // Sort by Z-index, highest first

        if (sorted.length > 0) {
            setTopInteractiveLayer(sorted[0][0]);
        }
    }, [layerZIndexes, activeLayers]);

    // Add this function in your CoffeeShopMapComponent
const updateDrawnLayerColor = (layerId, newColor) => {
    // First update the state
    setDrawnLayers(prev => {
      const updated = { ...prev };
      if (updated[layerId]) {
        updated[layerId] = {
          ...updated[layerId],
          color: newColor
        };
      }
      return updated;
    });
    
    // Then apply the color to the actual layer
    if (map && drawnLayers[layerId] && drawnLayers[layerId].layer) {
      const layer = drawnLayers[layerId].layer;
      const layerType = drawnLayers[layerId].type;
      
      // Apply color based on layer type
      if (layerType === 'polygon' || layerType === 'triangle') {
        layer.setStyle({
          color: newColor,
          fillColor: newColor,
          fillOpacity: 0.3
        });
      } else if (layerType === 'polyline') {
        layer.setStyle({
          color: newColor
        });
      } else if (layerType === 'circle') {
        layer.setStyle({
          color: newColor,
          fillColor: newColor,
          fillOpacity: 0.2
        });
      } else if (layerType === 'marker') {
        // For markers with icons, we may need custom handling
        if (layer._icon) {
          const icon = layer._icon;
          // Apply color to the marker's icon if it has a background color
          const iconElement = icon.querySelector('div');
          if (iconElement) {
            iconElement.style.backgroundColor = newColor;
          }
        }
      } else if (layerType === 'text') {
        // For text markers
        if (layer._textContent) {
          // Store the new color in the marker's state
          if (layer._state) {
            layer._state.color = newColor;
          }
          // Apply the color to the text content
          layer._textContent.style.color = newColor;
        }
      }
    }
  };
    const fetchFootTraffic = async () => {
        try {
            const res = await fetch('/data/pedestrian-data.geojson');
            const trafficData = await res.json();
            const trafficLayer = L.layerGroup();

            // Process for heatmap
            const heatPoints = [];

            // Times Square coordinates for distance calculation
            const timesSquare = L.latLng(40.7589, -73.9866);
            const radiusInMeters = radius * 1609.34; // Convert miles to meters

            // Ensure all features have Feature IDs
            if (trafficData.features && trafficData.features.length > 0) {
                // First pass: Assign Feature IDs to all features
                trafficData.features.forEach((feature, index) => {
                    if (!feature.properties) {
                        feature.properties = {};
                    }

                    // Create a consistent Feature ID
                    feature.properties['Feature ID'] = feature.properties['Feature ID'] ||
                        feature.properties.id ||
                        `ft-${index + 1}`; // Prefix with 'ft-' to distinguish from coffee shops
                });

                // Second pass: Process features for display and create the filtered dataset
                const footTrafficPoints = [];

                trafficData.features.forEach(feature => {
                    if (feature.geometry && feature.geometry.type === 'Point') {
                        const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                        const intensity = feature.properties?.intensity || 0.5;
                        const featureId = feature.properties['Feature ID'];

                        // Create a point for distance calculation
                        const point = L.latLng(coords[0], coords[1]);

                        // Check if the point is within the radius
                        const distanceToTimesSquare = timesSquare.distanceTo(point);

                        // Only add points that are within the radius
                        if (distanceToTimesSquare <= radiusInMeters) {
                            // Add to heatmap data
                            heatPoints.push([coords[0], coords[1], intensity * 5]);

                            // Create individual markers for foot traffic points with popups
                            const marker = L.circleMarker(point, {
                                radius: 4,
                                fillColor: getTrafficColor(intensity),
                                color: '#fff',
                                weight: 1,
                                opacity: 0.8,
                                fillOpacity: 0.8
                            });

                            // Add popup with information
                            const popupContent = `
                                <div class="p-2">
                                    <h3 class="text-sm font-semibold">Foot Traffic Point</h3>
                                    <p class="text-xs text-gray-700">ID: ${featureId}</p>
                                    <p class="text-xs text-gray-700">Intensity: ${(intensity * 10).toFixed(1)}/10</p>
                                    ${feature.properties.time ? `<p class="text-xs text-gray-700">Time: ${feature.properties.time}</p>` : ''}
                                    ${feature.properties.count ? `<p class="text-xs text-gray-700">Count: ${feature.properties.count} people/hour</p>` : ''}
                                </div>
                            `;

                            marker.bindPopup(popupContent);

                            // Store the point with its Feature ID for potential lookup
                            footTrafficPoints.push({
                                latlng: point,
                                featureId: featureId,
                                properties: feature.properties,
                                marker // Store reference to the marker
                            });
                        }
                    }
                });

                // Store the foot traffic points for later reference
                footTrafficPointsRef.current = footTrafficPoints;
            }

            // Create heatmap layer if we have points
            if (heatPoints.length > 0 && window.L.heatLayer) {
                const heatmap = window.L.heatLayer(heatPoints, {
                    radius: 20,
                    blur: 8,
                    maxZoom: 17,
                    gradient: {
                        0.2: layerColors.lowTraffic,
                        0.5: layerColors.mediumTraffic,
                        0.8: layerColors.highTraffic
                    }
                });

                if (topInteractiveLayer === 'footTraffic') {
                    heatmap.options.interactive = true;

                    // Use 'on' method properly and handle all events correctly
                    heatmap.on('click', function (e) {
                        let nearest = null;
                        let minDist = Infinity;

                        footTrafficPointsRef.current.forEach(point => {
                            const dist = e.latlng.distanceTo(point.latlng);
                            if (dist < minDist) {
                                minDist = dist;
                                nearest = point;
                            }
                        });

                        // Create popup content based on nearest point or general info
                        let popupContent;

                        if (nearest && minDist < 50) {
                            // Create custom popup for the nearest point
                            popupContent = `
                                <div class="p-2">
                                    <h3 class="text-sm font-semibold">Foot Traffic Point</h3>
                                    <p class="text-xs text-gray-700">ID: ${nearest.featureId}</p>
                                    <p class="text-xs text-gray-700">Intensity: ${(nearest.properties.intensity * 10 || 5).toFixed(1)}/10</p>
                                    ${nearest.properties.time ? `<p class="text-xs text-gray-700">Time: ${nearest.properties.time}</p>` : ''}
                                    ${nearest.properties.count ? `<p class="text-xs text-gray-700">Count: ${nearest.properties.count} people/hour</p>` : ''}
                                </div>
                            `;
                        }

                        // Display the popup at the clicked location with the right options
                        L.popup({ className: 'custom-popup' })
                            .setLatLng(e.latlng)
                            .setContent(popupContent)
                            .openOn(map);
                    });
                } else {
                    heatmap.options.interactive = false;
                }


                footTrafficHeatmapRef.current = heatmap;
                trafficLayer.addLayer(heatmap);
            }

            return { trafficLayer, trafficData };
        } catch (error) {
            console.error("Error fetching foot traffic data:", error);
            return { trafficLayer: L.layerGroup(), trafficData: { features: [] } };
        }
    };

    const createRadiusCircle = () => {
        const timesSquare = L.latLng(40.7589, -73.9866);
        const radiusInMeters = radius * 1609.34;

        const circleLayer = L.layerGroup();

        // Create the circle with interactive property set based on topInteractiveLayer
        const circle = L.circle(timesSquare, {
            radius: radiusInMeters,
            color: '#4169E1',
            fillColor: '#4169E1',
            fillOpacity: 0.05,
            weight: 2,
            dashArray: '5, 5',
            interactive: topInteractiveLayer === 'radius' // Set based on current top layer
        });

        // Add a popup to the circle
        circle.bindPopup(`
        <div class="p-2">
            <h3 class="text-lg font-semibold text-[#4169E1] mb-2">Times Square Area</h3>
            <p class="text-sm text-gray-700 mb-1">Center: Times Square, New York</p>
            <p class="text-sm text-gray-700 mb-1">Radius: ${radius} miles (${Math.round(radiusInMeters)} meters)</p>
            <p class="text-sm text-gray-700">This area represents the primary zone of analysis for coffee shop potential.</p>
        </div>
    `, {
            maxWidth: 250,
            className: 'custom-popup'
        });

        radiusCircleRef.current = circle;
        circleLayer.addLayer(circle);

        return { circleLayer };
    };


    useEffect(() => {
        const sorted = Object.entries(layerZIndexes)
            .filter(([key]) => activeLayers[key] && key !== 'radius') // ignore radius
            .sort(([, a], [, b]) => b - a); // highest zIndex first

        if (sorted.length > 0) {
            setTopInteractiveLayer(sorted[0][0]);
        }
    }, [layerZIndexes, activeLayers]);


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
                minZoom: 5,
                maxZoom: 18,
                doubleClickZoom: false
            }).setView([40.7589, -73.9866], 13.8);

            mapContainerRef.current.style.backgroundColor = '#FFFFFF';
mapContainerRef.current.style.background = '#FFFFFF';

// Optional: Add a white background tile layer
const whiteBackground = L.tileLayer('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=', {
  attribution: '',
  minZoom: 0,
  maxZoom: 22
});
whiteBackground.addTo(leafletMap);
whiteBackground.setZIndex(-1000);

            // Initialize drawnItems and other setup code...
            const drawnItems = new L.FeatureGroup();
            drawnItems.setZIndex(650);
            leafletMap.addLayer(drawnItems);
            leafletMap.drawnItems = drawnItems;
            leafletMap.createPane('drawPane');
            leafletMap.getPane('drawPane').style.zIndex = 100000000000;

            const drawControl = new L.Control.Draw({
                draw: {
                    polygon: false,
                    polyline: false,
                    rectangle: false,
                    circle: false,
                    marker: false,
                    circlemarker: false
                },
                edit: {
                    featureGroup: drawnItems,
                    remove: true
                }
            });

            leafletMap.drawControl = drawControl;
// Set up event handlers for layer deletion
leafletMap.on(L.Draw.Event.DELETED, function(e) {
    const layers = e.layers;
    
    layers.eachLayer(layer => {
      if (layer.layerId) {
        // Remove from drawn layers state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          delete updated[layer.layerId];
          return updated;
        });
        
        // Remove from order array instead of adding
        setDrawnLayersOrder(prev => {
          // Ensure prev is an array
          const prevArray = Array.isArray(prev) ? prev : [];
          const newOrder = prevArray.filter(id => id !== layer.layerId);
          drawnLayersRef.current = newOrder; // Store in a ref for debugging
          console.log("Updated drawn layers order:", newOrder);
          return newOrder;
        });
      }
    });
  });
            // In the main map event handler:
leafletMap.on(L.Draw.Event.CREATED, function(e) {
    const layer = e.layer;
    const layerType = e.layerType || (layer.layerType || 'shape');
    
    // Generate a unique ID for this shape if not already present
    if (!layer.layerId) {
      const nextId = nextShapeIds[layerType] || 1;
      const layerId = `${layerType}-${nextId}`;
      layer.layerId = layerId;
      
      // Update next IDs
      setNextShapeIds(prev => ({
        ...prev,
        [layerType]: nextId + 1
      }));
    }
    
    // Safely add to drawn items if available
    if (leafletMap.drawnItems) {
      if (!leafletMap.drawnItems.hasLayer(layer)) {
        leafletMap.drawnItems.addLayer(layer);
      }
    }
    
    console.log("Shape created:", {
      layerId: layer.layerId,
      layerType: layerType,
      shape: layer
    });
  
    // Update drawn layers state
    setDrawnLayers(prev => {
      const updated = { ...prev };
      updated[layer.layerId] = {
        layer: layer,
        type: layerType,
        visible: true,
        name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextShapeIds[layerType] || 1}`
      };
      return updated;
    });
    
    // Add to the order array
    setDrawnLayersOrder(prev => {
      // Ensure prev is an array
      const prevArray = Array.isArray(prev) ? prev : [];
      const newOrder = [...prevArray, layer.layerId];
      return newOrder;
    });
  });
  
  // Add handler for when layers are removed
  leafletMap.on(L.Draw.Event.DELETED, function(e) {
    const layers = e.layers;
    
    layers.eachLayer(layer => {
      if (layer.layerId) {
        // Remove from drawn layers state
        setDrawnLayers(prev => {
          const updated = { ...prev };
          delete updated[layer.layerId];
          return updated;
        });
        
        // Remove from order array instead of adding
        setDrawnLayersOrder(prev => {
          // Ensure prev is an array
          const prevArray = Array.isArray(prev) ? prev : [];
          const newOrder = prevArray.filter(id => id !== layer.layerId);
          drawnLayersRef.current = newOrder; // Store in a ref for debugging
          console.log("Updated drawn layers order:", newOrder);
          return newOrder;
        });
      }
    });
  });
  

            // Add the initial base tile layer - light theme by default
            const initialBaseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
                subdomains: 'abcd',
                maxZoom: 19
            }).addTo(leafletMap);

            // Store the base layer reference for later replacement
            setBaseMapLayer(initialBaseLayer)
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
            });

            const [
                coffeeShopsResult,
                footTrafficResult
            ] = await Promise.all([
                fetchCoffeeShops(),
                fetchFootTraffic()
            ]);
            const radiusCircleResult = createRadiusCircle();


            if (coffeeShopsResult.shopData) {
                const coffeeShopsTable = convertGeoJSONToTable(coffeeShopsResult.shopData, 'coffeeShops');
                setTableData(prevData => {
                    const newData = [...prevData];
                    newData[0] = coffeeShopsTable;
                    return newData;
                });
            }

            if (footTrafficResult.trafficData) {
                // Filter the trafficData to only include points within the radius
                const timesSquare = L.latLng(40.7589, -73.9866);
                const radiusInMeters = radius * 1609.34;

                const filteredTrafficData = {
                    type: "FeatureCollection",
                    features: footTrafficResult.trafficData.features.filter(feature => {
                        if (feature.geometry && feature.geometry.type === 'Point') {
                            const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
                            const point = L.latLng(coords[0], coords[1]);
                            const distanceToTimesSquare = timesSquare.distanceTo(point);
                            return distanceToTimesSquare <= radiusInMeters;
                        }
                        return false;
                    })
                };

                const footTrafficTable = convertGeoJSONToTable(filteredTrafficData, 'footTraffic');
                setTableData(prevData => {
                    const newData = [...prevData];
                    newData[1] = footTrafficTable;
                    return newData;
                });
            }





            const allLayers = L.layerGroup();
            coffeeShopsResult.coffeeLayer.setZIndex(layerZIndexes.coffeeShops);
            footTrafficResult.trafficLayer.setZIndex(layerZIndexes.footTraffic);
            radiusCircleResult.circleLayer.setZIndex(layerZIndexes.radius)
            // Add all layers to the group
            allLayers.addLayer(coffeeShopsResult.coffeeLayer);
            allLayers.addLayer(footTrafficResult.trafficLayer);
            allLayers.addLayer(radiusCircleResult.circleLayer);

            // Add the layer group to the map (this makes all layers appear at once)
            allLayers.addTo(leafletMap);

            // Store references to layers in the map object for later use
            leafletMap.coffeeShopsLayer = coffeeShopsResult.coffeeLayer;
            leafletMap.footTrafficLayer = footTrafficResult.trafficLayer;
            leafletMap.radiusCircleLayer = radiusCircleResult.circleLayer;

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

    // Add this code immediately after your map initialization
    useEffect(() => {
        if (!map) return;

        // Add a global click handler to the map to catch all clicks
        map.on('click', function (e) {
            console.log('Map clicked at:', e.latlng);

            // Determine which layer is top based on current state
            const currentTopLayer = topInteractiveLayer;
            console.log('Current top layer:', currentTopLayer);

            if (currentTopLayer === 'coffeeShops') {
                // Find the nearest coffee shop marker within 20 pixels
                let nearestMarker = null;
                let minDistance = Infinity;

                coffeeShopsRef.current.forEach(({ marker }) => {
                    const distance = e.latlng.distanceTo(marker.getLatLng());
                    if (distance < 20 && distance < minDistance) {
                        minDistance = distance;
                        nearestMarker = marker;
                    }
                });

                if (nearestMarker) {
                    console.log('Nearest coffee shop found:', nearestMarker.featureId);
                    // Force open the popup
                    nearestMarker.openPopup();
                    // Select the corresponding row
                    selectRowByFeatureProperties({ 'Feature ID': nearestMarker.featureId });
                    return; // Prevent further processing
                }
            }

            if (currentTopLayer === 'footTraffic') {
                // For foot traffic, check if we're clicking on the heatmap
                let nearestPoint = null;
                let minDistance = 50; // Use a larger radius for heatmap (50 pixels)

                footTrafficPointsRef.current.forEach(point => {
                    const distance = e.latlng.distanceTo(point.latlng);
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestPoint = point;
                    }
                });

                if (nearestPoint) {
                    console.log('Near a foot traffic point:', nearestPoint.featureId);
                    // Create and show a popup manually
                    const popupContent = `
            <div class="p-2">
              <h3 class="text-sm font-semibold">Foot Traffic Point</h3>
              <p class="text-xs text-gray-700">ID: ${nearestPoint.featureId}</p>
              <p class="text-xs text-gray-700">Intensity: ${(nearestPoint.properties.intensity * 10 || 5).toFixed(1)}/10</p>
              ${nearestPoint.properties.time ? `<p class="text-xs text-gray-700">Time: ${nearestPoint.properties.time}</p>` : ''}
              ${nearestPoint.properties.count ? `<p class="text-xs text-gray-700">Count: ${nearestPoint.properties.count} people/hour</p>` : ''}
            </div>
          `;

                    L.popup({ className: 'custom-popup' })
                        .setLatLng(nearestPoint.latlng)
                        .setContent(popupContent)
                        .openOn(map);

                    // Select the corresponding row if possible
                    selectRowByFeatureProperties({ 'Feature ID': nearestPoint.featureId });
                    return; // Prevent further processing
                } else {


                    return; // Prevent further processing
                }
            }

            if (currentTopLayer === 'radius') {
                // For radius layer, check if we're clicking inside the circle
                if (radiusCircleRef.current) {
                    const distance = e.latlng.distanceTo(radiusCircleRef.current.getLatLng());
                    if (distance < radiusCircleRef.current.getRadius()) {
                        console.log('Clicked inside radius circle');
                        // Create and show a popup manually
                        const popupContent = `
              <div class="p-2">
                <h3 class="text-lg font-semibold text-[#4169E1] mb-2">Times Square Area</h3>
                <p class="text-sm text-gray-700 mb-1">Center: Times Square, New York</p>
                <p class="text-sm text-gray-700 mb-1">Radius: ${radius} miles</p>
                <p class="text-sm text-gray-700">This area represents the primary zone of analysis for coffee shop potential.</p>
              </div>
            `;

                        L.popup({ className: 'custom-popup', maxWidth: 250 })
                            .setLatLng(e.latlng)
                            .setContent(popupContent)
                            .openOn(map);

                        return; // Prevent further processing
                    }
                }
            }
        });
    }, [map, topInteractiveLayer, radius]);

    // Add this at the start of your component to ensure custom popups are styled
    useEffect(() => {
        // First, let's make sure the custom-popup class exists and is properly styled
        if (!document.getElementById('custom-popup-style')) {
            const style = document.createElement('style');
            style.id = 'custom-popup-style';
            style.textContent = `
        .custom-popup .leaflet-popup-content-wrapper {
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
          padding: 5px;
        }
        .custom-popup .leaflet-popup-tip {
          background-color: white;
        }
        .custom-popup .leaflet-popup-content {
          margin: 5px;
          min-width: 150px;
        }
      `;
            document.head.appendChild(style);
        }
    }, []);

    
    const classifyShape = (layer) => {
        if (layer instanceof L.Polygon) {
          // Check if it's a triangle (3 vertices)
          const latlngs = layer.getLatLngs()[0];
          if (latlngs.length === 4 && latlngs[0].equals(latlngs[latlngs.length-1])) {
            // Polygon with 3 points plus closing point
            return 'triangle';
          }
          return 'polygon';
        } else if (layer instanceof L.Circle) {
          return 'circle';
        } else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          return 'polyline';
        } else if (layer instanceof L.Marker) {
          if (layer._textContent) {
            return 'text';
          }
          return 'marker';
        }
        return 'shape';
      };
    useEffect(() => {
        // Expose function to global scope so it can be called from map selection
        window.selectRowsByFeatureIds = (featureIds) => {
            if (!featureIds || featureIds.length === 0) return;

            // First, make sure the table is visible
            setShowTable(true);

            // Process tables sequentially to find all matching rows
            const matchingRows = {};
            let totalFound = 0;
            let firstTable = null;
            let firstIndex = -1;

            // Search through each table for matching rows
            tableData.forEach((table, tableIndex) => {
                if (!table || !table.rows) return;

                const tableMatches = [];

                // Find all rows that match any of the feature IDs
                table.rows.forEach((row, rowIndex) => {
                    if (row['Feature ID'] && featureIds.includes(row['Feature ID'].toString())) {
                        tableMatches.push(rowIndex);
                        totalFound++;

                        // Keep track of first match for initial focus
                        if (firstTable === null) {
                            firstTable = tableIndex;
                            firstIndex = rowIndex;
                        }
                    }
                });

                if (tableMatches.length > 0) {
                    matchingRows[tableIndex] = tableMatches;
                }
            });

            // If we found matches, process them
            if (totalFound > 0) {
                // Switch to the table with the first match
                setCurrentTableIndex(firstTable);

                // Create sorted table data with matching rows at the top
                const updatedTableData = [...tableData];

                // For each table with matches, move those rows to the top
                Object.entries(matchingRows).forEach(([tableIndex, rowIndices]) => {
                    const tableIdx = parseInt(tableIndex);
                    const table = { ...updatedTableData[tableIdx] };

                    // Extract the matching rows
                    const matchedRows = rowIndices.map(idx => table.rows[idx]);

                    // Remove the matched rows from their original positions
                    const remainingRows = table.rows.filter((_, idx) => !rowIndices.includes(idx));

                    // Combine matched rows at the top with remaining rows
                    table.rows = [...matchedRows, ...remainingRows];

                    // Update the table data
                    updatedTableData[tableIdx] = table;
                });

                // Update table data with new ordering
                setTableData(updatedTableData);

                // Update selectedRowIndices to highlight the rows
                // Since we've moved them to the top, their indices are now 0 to matchedRows.length-1
                const selectedIndices = Array.from(
                    { length: matchingRows[firstTable]?.length || 0 },
                    (_, i) => i
                );

                setSelectedRowIndices(selectedIndices);

                // Ensure the table scrolls to show the first selected row
                setScrollToRowIndex(0);
            }
        };

        return () => {
            // Clean up global function when component unmounts
            delete window.selectRowsByFeatureIds;
        };
    }, [tableData, setShowTable, setCurrentTableIndex, setTableData, setSelectedRowIndices, setScrollToRowIndex]);


    useEffect(() => {
        if (map) {
            addDebugClickHandler();
        }
    }, [map]);
    useEffect(() => {
        if (!map) return;

        // Helper function for debugging
        const debugLayers = () => {
            console.log('Updating layers with new colors:');
            console.log('Coffee shops:', coffeeShopsRef.current.length);
            console.log('Foot traffic heatmap:', footTrafficHeatmapRef.current ? 'present' : 'absent');
            console.log('Radius circle:', radiusCircleRef.current ? 'present' : 'absent');
        };

        // Log current state for debugging
        debugLayers();

        // Force map to redraw by invalidating size
        map.invalidateSize();

        // Update Coffee Shop markers
        coffeeShopsRef.current.forEach(({ marker, potential }) => {
            const color = layerColors.existingShop;
            marker.setIcon(L.divIcon({
                html: `<div style="background-color: ${color}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                className: '',
                iconSize: [14, 14]
            }));
        });

        // Update Foot Traffic heatmap gradient if it exists
        if (footTrafficHeatmapRef.current) {
            footTrafficHeatmapRef.current.setOptions({
                gradient: {
                    0.2: layerColors.lowTraffic,
                    0.5: layerColors.mediumTraffic,
                    0.8: layerColors.highTraffic
                }
            });
        }

        // Force redraw after updates
        setTimeout(() => {
            if (map) {
                map.invalidateSize();
            }
        }, 100);

    }, [layerColors, map]);
    useEffect(() => {
        // Only store original data when it's first loaded
        tableData.forEach((table, index) => {
            if (table && table.rows && !originalData[index]) {
                setOriginalData(prev => ({
                    ...prev,
                    [index]: JSON.parse(JSON.stringify(table.rows))
                }));
            }
        });
    }, [tableData]);



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
                                    NYC Open Data
                                </a>
                            </div>
                            <div>
                                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                                    Coffee Shop Database
                                </a>
                            </div>
                            <div>
                                <a href="#" className="text-blue-600 underline hover:text-blue-800">
                                    Manhattan Pedestrian Counts
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
                                        component: 'CoffeeShopMapComponent',
                                        props: {
                                            center: [40.7589, -73.9866],
                                            radius: radius,
                                            activeLayers: activeLayers,
                                            layerColors: layerColors,
                                        },
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
{showTextToolbar && (
    <TextToolbar
    position={textToolbarPosition}
    currentTextFormat={textFormat}
      onFormatChange={handleTextFormatChange}
      onClose={() => map._hideTextToolbar?.()}
      isFullscreen={isFullscreen}
    />
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
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setShowGeocoder(false);
            setSearchQuery('');
            setSearchResults([]);
          }
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
<button
  onClick={() => {
    setShowGeocoder(false);
    setSearchQuery('');
    setSearchResults([]);
  }}
  className="absolute right-2 top-1/2 transform -translate-y-1/2"
  aria-label="Close search"
>
  <X size={16} className="text-gray-500 hover:text-[#008080] transition-colors" />
</button>

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
                        className="absolute z-[9999] w-[130px] bg-white border border-gray-200 rounded-xl shadow-lg p-2 transition-all animate-fade-in"
                        style={{
                            top: isFullscreen ? '80px' : '360px',
                            left: isFullscreen ? '80px' : '130px',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-xs font-semibold text-gray-800">Drawing Tools</h3>
                            <button onClick={() => setShowDrawTools(false)}>
                                <X size={16} className=" text-gray-500 hover:text-[#008080]" />
                            </button>
                        </div>
                        <div className="grid gap-1">
                            <button
                                onClick={() => { 
                                    setShowDrawTools(false); 
                                    setShowGeocoder(!showGeocoder)
                                }}
                                data-tooltip="Search Location"
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
                                <div className="flex items-center">
                                    <TbMapSearch className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Search</span>
                                </div>
                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createSelectTool(map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder);
                                }}
                            >
                                <div className="flex items-center">
                                    <MousePointerSquareDashed className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Select</span>
                                </div>
                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createPolygonDrawTool(
                                        map,
                                        snapLayersRef,
                                        setActiveDrawTool,
                                        sendQuestionToChat,
                                        nextShapeIds,
                                        setNextShapeIds,
                                        setDrawnLayers,
                                        setDrawnLayersOrder
                                      );                                }}
                            >
                                <div className="flex items-center">
                                    <IconMapPinSearch className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Insights</span>
                                </div>
                            </button>
                            {/* Replace the existing Measurement button onClick handler with this: */}
                          

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createFreehandTool(map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder);
                                }}
                            >
                                <div className="flex items-center">
                                    <MdDraw className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Freehand</span>
                                </div></button>

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    setShowDrawTools(false);
                                    createTextTool(
                                        map, 
                                        setActiveDrawTool, 
                                        nextShapeIds, 
                                        setNextShapeIds, 
                                        setDrawnLayers, 
                                        setDrawnLayersOrder
                                      );                                }}>
                                <div className="flex items-center">
                                    <TextCursorInput className="mr-1" size={12} style={{ minWidth: '12px' }} />
                                    <span>Text</span>
                                </div>
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







                <div ref={mapContainerRef} className="absolute inset-0 w-full h-full map-container" style={{ zIndex: 0 }} />

                {/* Table section */}
                {showTable && (
                    <VirtualizedTable
                        tableData={tableData}
                        setTableData={setTableData} // Pass the setter function
                        currentTableIndex={currentTableIndex}
                        setCurrentTableIndex={setCurrentTableIndex}
                        tableTitles={tableTitles}
                        selectedRowIndices={selectedRowIndices}
                        setSelectedRowIndices={setSelectedRowIndices}
                        selectedColIndex={selectedColIndex}
                        setSelectedColIndex={setSelectedColIndex}
                        highlightFeatureByRowProperties={highlightFeatureByRowProperties}
                        resetLayerHighlighting={resetLayerHighlighting}
                        handleCellEdit={handleCellEdit}
                        tableHeight={tableHeight}
                        setTableHeight={setTableHeight}
                        showTable={showTable}
                        setIsModified={setIsModified} // Pass the setIsModified function
                        originalRowsMap={originalData} // Pass this instead of originalRowsMap
                        setOriginalRowsMap={setOriginalData}  // Pass the setter for original data
                        scrollToRowIndex={scrollToRowIndex}

                    />
                )}
                {showMapDownloader && (
                    <MapDownloader
                        isOpen={showMapDownloader}
                        onClose={() => setShowMapDownloader(false)}
                        mapContainerRef={mapContainerRef}
                        coffeeShopsRef={coffeeShopsRef}
                        footTrafficPointsRef={footTrafficPointsRef}
                        radiusCircleRef={radiusCircleRef}
                        radius={radius}
                        activeLayers={activeLayers}
                        layerColors={layerColors}
                        addNotification={addNotification}
                    />
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
                            <button
                                onClick={() => {
                                    setShowShareDialog(false);
                                    setShowMapDownloader(true);
                                }}
                                className="w-full py-2 rounded-md text-sm font-semibold bg-[#008080] text-white hover:bg-teal-700"
                            >
                                Download Map
                            </button>


                        </div>
                    </div>
                )}


                <ToolbarComponent
                    isFullscreen={isFullscreen}
                    showTable={showTable}
                    setShowTable={setShowTable}
                    onSaveMap={onSaveMap}
                    savedMaps={savedMaps}
                    captureAndDownload={() => setShowMapDownloader(true)}
                    setShowLegend={setShowLegend}
                    setShowSources={setShowSources}
                    toggleFullscreen={toggleFullscreen}
                    toolbarVisible={toolbarVisible}
                    setToolbarVisible={setToolbarVisible}
                    toolbarPosition={toolbarPosition}
                    setToolbarPosition={setToolbarPosition}
                    setShowSaveDialog={setShowSaveDialog}
                    setShowGeocoder={setShowGeocoder}
                    showGeocoder={showGeocoder}
                    setShowDrawTools={setShowDrawTools}
                    showDrawTools={showDrawTools}
                    pencilRef={pencilRef}
                    setShowShareDialog={setShowShareDialog}
                    setMapView={handleMapViewChange}
                    activeMapView={currentMapView}
                    showTextToolbar={showTextToolbar}
                />


                {showLegend && (
                    <DraggableLegend
                    showLegend={showLegend}
                    setShowLegend={setShowLegend}
                    activeLayers={activeLayers}
                    toggleLayer={toggleLayer}
                    expandedSections={expandedSections}
                    toggleSection={toggleSection}
                    layerColors={layerColors}
                    setLayerColors={setLayerColors}
                    layerZIndexes={layerZIndexes}
                    setLayerZIndexes={setLayerZIndexes}
                    customLayerNames={customLayerNames}
                    setCustomLayerNames={setCustomLayerNames}
                    setTopInteractiveLayer={setTopInteractiveLayer}
                    currentMapView={currentMapView}
                    handleMapViewChange={handleMapViewChange}
                    baseMapLayer={baseMapLayer}
                    toggleBaseMap={(visible) => {
                        if (visible && map && !map.hasLayer(baseMapLayer)) {
                            map.addLayer(baseMapLayer);
                        } else if (!visible && map && map.hasLayer(baseMapLayer)) {
                            map.removeLayer(baseMapLayer);
                        }
                    }}
                    drawnLayers={drawnLayers || {}}
                    drawnLayersOrder={drawnLayersOrder || []}
                    toggleDrawnLayer={toggleDrawnLayer}    
                    setDrawnLayers={setDrawnLayers} 
                    updateDrawnLayerColor={updateDrawnLayerColor}
                />
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

export default CoffeeShopMapComponent;