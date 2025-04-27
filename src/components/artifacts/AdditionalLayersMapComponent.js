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


const AdditionalLayersMapComponent = ({ onLayersReady, onSaveMap, savedMaps = [], setSavedArtifacts, title,
    onBack, center = [-73.9866, 40.7589], radius = 3 }) => {

    const mapContainerRef = useRef(null);
    const [map, setMap] = useState(null);
    const infoRef = useRef(null);
    // Table states
    const [showTable, setShowTable] = useState(false);
    const [tableHeight, setTableHeight] = useState(300);
    const [currentTableIndex, setCurrentTableIndex] = useState(0);
    const [tableData, setTableData] = useState([]);
    const [tableTitles, setTableTitles] = useState(['Coffee Shops', 'Foot Traffic Data', 'Subway Stations', 'Available Storefronts']);
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
    const [contextMenu, setContextMenu] = useState({
        visible: false, x: 0, y: 0, type: null, index: null,
        columnName: null,
    });
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
    const storefrontDataRef = useRef({ features: [] });
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
    const [expandedSections, setExpandedSections] = useState({});
    const [isModified, setIsModified] = useState(false);

    const [showSymbologyEditor, setShowSymbologyEditor] = useState(false);


    const [activeLayers, setActiveLayers] = useState({
        coffeeShops: false,
        footTraffic: true,
        radius: false,
        subwayStations: true,
        storefronts: true
    });

    const COLORS = {
        // Coffee shops
        existingShop: '#D2691E',
        highPotential: '#006400',
        mediumPotential: '#4caf50',
        lowPotential: '#DC143C',

        // Foot traffic
        highTraffic: '#2e7d32',
        mediumTraffic: '#FF6B6B',
        lowTraffic: '#FFCCCB',

        // Subway stations
        subwayStation: '#0039A6',

        // Storefronts
        lowRent: '#2e7d32',
        mediumRent: '#4caf50',
        highRent: '#2e7d32',

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
        highPotential: COLORS.highPotential,
        mediumPotential: COLORS.mediumPotential,
        lowPotential: COLORS.lowPotential,
        highTraffic: COLORS.highTraffic,
        mediumTraffic: COLORS.mediumTraffic,
        lowTraffic: COLORS.lowTraffic
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

    const resetLayerHighlighting = () => {
        // Reset coffee shops
        coffeeShopsRef.current.forEach(({ marker }) => {
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
        
        // Close any popups on the map
        if (map) {
          map.closePopup();
          
          // Remove any pulse markers or highlighting markers
          map.eachLayer(layer => {
            if (layer._icon && layer._icon.innerHTML && 
               (layer._icon.innerHTML.includes('pulse-animation') || 
                layer._icon.innerHTML.includes('border: 3px solid yellow'))) {
              map.removeLayer(layer);
            }
          });
        }
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
        if (!map) return;

        // Set up click handler for storefronts heatmap
        const handleMapClick = function (e) {
            // Only process clicks if storefronts layer is active
            if (!activeLayers.storefronts) return;

            const clickLatLng = e.latlng;
            const radius = 100; // Search radius in meters

            // Find the closest point in the original data
            let closestFeature = null;
            let closestDistance = Infinity;

            storefrontDataRef.current.features.forEach(feature => {
                if (feature.geometry && feature.geometry.type === 'Point') {
                    const featureLatLng = L.latLng(
                        feature.geometry.coordinates[1],
                        feature.geometry.coordinates[0]
                    );

                    const distance = clickLatLng.distanceTo(featureLatLng);

                    if (distance < radius && distance < closestDistance) {
                        closestDistance = distance;
                        closestFeature = feature;
                    }
                }
            });

            // Show popup for the closest feature
            if (closestFeature) {
                const coords = [
                    closestFeature.geometry.coordinates[1],
                    closestFeature.geometry.coordinates[0]
                ];

                let popupContent = '<strong>Available Storefront</strong>';
                if (closestFeature.properties) {
                    if (closestFeature.properties.property_street_address_or) {
                        popupContent += `<br>Address: ${closestFeature.properties.property_street_address_or}`;
                    }
                    if (closestFeature.properties.nbhd) {
                        popupContent += `<br>Neighborhood: ${closestFeature.properties.nbhd}`;
                    }
                    if (closestFeature.properties.rentalPrice) {
                        popupContent += `<br>Estimated Rent: $${closestFeature.properties.rentalPrice}/sq ft annually`;
                        popupContent += `<br>Price Category: ${closestFeature.properties.priceCategory}`;
                    }
                    if (closestFeature.properties.vacant_on_12_31 === "YES") {
                        popupContent += `<br>Vacancy Status: Currently Vacant`;
                    }
                }

                L.popup()
                    .setLatLng(coords)
                    .setContent(popupContent)
                    .openOn(map);

                selectRowByFeatureProperties(closestFeature.properties);
            }
        };

        map.on('click', handleMapClick);

        return () => {
            map.off('click', handleMapClick);
        };
    }, [map, activeLayers.storefronts]);

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
        resetLayerHighlighting();
    
        // Check which table we're on and highlight the appropriate feature
        switch (currentTableIndex) {
            case 0: 
                highlightCoffeeShop(row);
                break;
            case 1: 
                highlightFootTrafficArea(row);
                break;
            case 2: 
                highlightSubwayStation(row);
                break;
            case 3: 
                highlightStorefront(row);
                break;
        }
    };
    
    const highlightCoffeeShop = (row) => {
        if (!row || !map) return;
      
        let foundMarker = false;
        
        // Try to find the marker by checking all possible identifiers
        coffeeShopsRef.current.forEach(({ marker }) => {
          const popupContent = marker.getPopup()?.getContent() || '';
          
          // First try to match by name/dba if available
          const nameMatch = row.name && popupContent.includes(row.name);
          const dbaMatch = row.dba && popupContent.includes(row.dba);
          const idMatch = row['Feature ID'] && popupContent.includes(`Feature ID: ${row['Feature ID']}`);
          
          if (nameMatch || dbaMatch || idMatch) {
            // Change the marker's icon to make it stand out
            marker.setIcon(L.divIcon({
              html: `<div style="background-color: #ffff00; width: 14px; height: 14px; border-radius: 50%; border: 2px solid black; box-shadow: 0 0 4px white;"></div>`,
              className: '',
              iconSize: [18, 18]
            }));
              
            // Calculate visible map area when table is showing
            const containerHeight = mapContainerRef.current.clientHeight;
            const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;
            const visibleMapCenter = showTable ? 
              ((containerHeight - tableHeight) / 2) : 
              (containerHeight / 2);
                  
            // Get marker position and calculate offset to center it in the visible area
            const markerLatLng = marker.getLatLng();
            
            // Create a point that will be centered in the visible map area
            // The offset calculation moves the point up to account for the table
            const targetPoint = showTable ? 
              map.project(markerLatLng).subtract([0, visibleMapHeight * 0.5]) : 
              map.project(markerLatLng);
            
            // Convert back to LatLng and pan the map to center on this point
            const targetLatLng = map.unproject(targetPoint);
            
            // Zoom and pan to the adjusted center
            map.setView(targetLatLng, 16, {
              animate: true,
              duration: 0.5
            });
            
            // Add a pulsing animation effect around the marker
            const pulseMarker = L.marker(markerLatLng, {
              icon: L.divIcon({
                html: `<div class="pulse-animation" style="width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffff00; box-shadow: 0 0 8px #ffff00;"></div>`,
                className: '',
                iconSize: [30, 30]
              })
            }).addTo(map);
            
            // Remove the pulse animation after 3 seconds
            setTimeout(() => {
              if (map) map.removeLayer(pulseMarker);
            }, 3000);
            
            foundMarker = true;
          }
        });
        
        // If we couldn't find a marker based on name, try to use coordinates
        if (!foundMarker) {
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
            const offsetPoint = showTable ? 
              point.subtract([0, visibleMapHeight * 0.1]) : 
              point;
            
            // Convert back to LatLng and pan the map
            const targetLatLng = map.unproject(offsetPoint);
            
            // Set view with animation
            map.setView(targetLatLng, 16, {
              animate: true,
              duration: 0.5
            });
            
            // Create a temporary highlight marker
            const pulseMarker = L.marker(latlng, {
              icon: L.divIcon({
                html: `<div class="pulse-animation" style="width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffff00; box-shadow: 0 0 8px #ffff00;"></div>`,
                className: '',
                iconSize: [30, 30]
              })
            }).addTo(map);
            
            // Remove after 3 seconds
            setTimeout(() => {
              if (map) map.removeLayer(pulseMarker);
            }, 3000);
          }
        }
      };
      
      // Similarly update the highlightFootTrafficArea function
      const highlightFootTrafficArea = (row) => {
        if (!row || !row.location) return;
        
        if (map) {
          const [lat, lng] = row.location.split(',').map(coord => parseFloat(coord.trim()));
          if (!isNaN(lat) && !isNaN(lng)) {
            const latlng = L.latLng(lat, lng);
            
            const containerHeight = mapContainerRef.current.clientHeight;
            const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;
                  
            const point = map.project(latlng);
            const offsetPoint = showTable ? 
              point.subtract([0, visibleMapHeight * 0.25]) : 
              point;
            
            const targetLatLng = map.unproject(offsetPoint);
            
            map.setView(targetLatLng, 16, {
              animate: true,
              duration: 0.5
            });
            
            const highlightMarker = L.marker(latlng, {
              icon: L.divIcon({
                html: `<div class="pulse-animation" style="width: 30px; height: 30px; border-radius: 50%; border: 3px solid #ffff00; box-shadow: 0 0 8px #ffff00;"></div>`,
                className: '',
                iconSize: [30, 30]
              })
            }).addTo(map);
            
            setTimeout(() => {
              if (map) map.removeLayer(highlightMarker);
            }, 3000);
          }
        }
      };

      const highlightSubwayStation = (row) => {
        if (!row || !map) return;
        
        // Try to find coordinates from the row data
        let lat, lng;
        
        if (row.STATIONLOC) {
          // If coordinates are stored in a combined field, parse them
          try {
            const coords = row.STATIONLOC.split(',').map(c => parseFloat(c.trim()));
            if (coords.length >= 2) {
              lat = coords[0];
              lng = coords[1];
            }
          } catch (e) {
          }
        } else if (row.y && row.x) {
          lat = parseFloat(row.y);
          lng = parseFloat(row.x);
        } else if (row.latitude && row.longitude) {
          lat = parseFloat(row.latitude);
          lng = parseFloat(row.longitude);
        } else if (row.geometry && typeof row.geometry === 'string') {
          try {
            const geom = JSON.parse(row.geometry);
            if (geom && geom.coordinates) {
              lng = geom.coordinates[0];
              lat = geom.coordinates[1];
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // If we found coordinates, highlight and zoom to the station
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const latlng = L.latLng(lat, lng);
          
          // Calculate visible map area when table is showing
          const containerHeight = mapContainerRef.current.clientHeight;
          const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;
                
          // Get projected point and calculate offset for centering
          const point = map.project(latlng);
          const offsetPoint = showTable ? 
            point.subtract([0, visibleMapHeight * 0.1]) : 
            point;
          
          // Convert back to LatLng and pan the map
          const targetLatLng = map.unproject(offsetPoint);
          
          // Set view with animation
          map.setView(targetLatLng, 16, {
            animate: true,
            duration: 0.5
          });
          
          // Create a highlighted marker with subway-specific styling
          const highlightMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: `<div style="background-color: #0039A6; width: 16px; height: 16px; border-radius: 50%; border: 3px solid yellow; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
              className: '',
              iconSize: [22, 22]
            })
          }).addTo(map);
          
          // Create a pulsing highlight effect
          const pulseMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: `<div class="pulse-animation" style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffff00; box-shadow: 0 0 10px #ffff00;"></div>`,
              className: '',
              iconSize: [36, 36]
            })
          }).addTo(map);
          
          // Create a popup with station information
          let popupContent = '<strong>Subway Station</strong>';
          if (row.STATIONLABEL || row.name) {
            popupContent += `<br>Name: ${row.STATIONLABEL || row.name}`;
          }
          if (row.LINE) {
            popupContent += `<br>Line: ${row.LINE}`;
          }
          if (row.DIVISION) {
            popupContent += `<br>Division: ${row.DIVISION}`;
          }
          
          // Add popup
          L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(map);
          
          // Remove highlight markers after 3 seconds
          setTimeout(() => {
            if (map) {
              map.removeLayer(highlightMarker);
              map.removeLayer(pulseMarker);
            }
          }, 3000);
        }
      };
      
      // Function to highlight storefronts
      const highlightStorefront = (row) => {
        if (!row || !map) return;
        
        // Try to find coordinates in the row data
        let lat, lng;
        
        if (row.property_street_address_or && row.nbhd) {
          // Try to find the matching storefront in the original data
          const matchingStorefront = storefrontDataRef.current.features.find(feature => 
            feature.properties && 
            feature.properties.property_street_address_or === row.property_street_address_or &&
            feature.properties.nbhd === row.nbhd
          );
          
          if (matchingStorefront && matchingStorefront.geometry && matchingStorefront.geometry.coordinates) {
            lng = matchingStorefront.geometry.coordinates[0];
            lat = matchingStorefront.geometry.coordinates[1];
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
        } else if (row.coordinates) {
          try {
            const coords = row.coordinates.split(',').map(c => parseFloat(c.trim()));
            if (coords.length >= 2) {
              lat = coords[0];
              lng = coords[1];
            }
          } catch (e) {
            // Ignore parsing errors
          }
        }
        
        // If we found coordinates, highlight and zoom to the storefront
        if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
          const latlng = L.latLng(lat, lng);
          
          // Calculate visible map area when table is showing
          const containerHeight = mapContainerRef.current.clientHeight;
          const visibleMapHeight = showTable ? containerHeight - tableHeight : containerHeight;
                
          // Get projected point and calculate offset for centering
          const point = map.project(latlng);
          const offsetPoint = showTable ? 
            point.subtract([0, visibleMapHeight * 0.15]) : 
            point;
          
          // Convert back to LatLng and pan the map
          const targetLatLng = map.unproject(offsetPoint);
          
          // Set view with animation
          map.setView(targetLatLng, 17, { // Slightly higher zoom for storefronts
            animate: true,
            duration: 0.5
          });
          
          // Determine color based on price category
          let markerColor = '#4caf50'; // Default color (medium)
          if (row.priceCategory === 'Low') {
            markerColor = '#2e7d32'; // Green for low rent
          } else if (row.priceCategory === 'High') {
            markerColor = '#2e7d32'; // Red for high rent
          }
          
          // Create a highlighted marker with price-specific styling
          const highlightMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: `<div style="background-color: ${markerColor}; width: 18px; height: 18px; border-radius: 3px; transform: rotate(45deg); border: 3px solid yellow; box-shadow: 0 0 6px rgba(0,0,0,0.5);"></div>`,
              className: '',
              iconSize: [24, 24]
            })
          }).addTo(map);
          
          // Create a pulsing highlight effect
          const pulseMarker = L.marker(latlng, {
            icon: L.divIcon({
              html: `<div class="pulse-animation" style="width: 36px; height: 36px; border-radius: 50%; border: 3px solid #ffff00; box-shadow: 0 0 10px #ffff00;"></div>`,
              className: '',
              iconSize: [36, 36]
            })
          }).addTo(map);
          
          // Create a popup with storefront information
          let popupContent = '<strong>Available Storefront</strong>';
          if (row.property_street_address_or) {
            popupContent += `<br>Address: ${row.property_street_address_or}`;
          }
          if (row.nbhd) {
            popupContent += `<br>Neighborhood: ${row.nbhd}`;
          }
          if (row.rentalPrice) {
            popupContent += `<br>Estimated Rent: $${row.rentalPrice}/sq ft annually`;
            popupContent += `<br>Price Category: ${row.priceCategory}`;
          }
          if (row.vacant_on_12_31 === "YES") {
            popupContent += `<br>Vacancy Status: Currently Vacant`;
          }
          
          // Add popup
          L.popup()
            .setLatLng(latlng)
            .setContent(popupContent)
            .openOn(map);
          
          // Remove highlight markers after 3 seconds
          setTimeout(() => {
            if (map) {
              map.removeLayer(highlightMarker);
              map.removeLayer(pulseMarker);
            }
          }, 3000);
        }
      };
      
    
    const addPulseAnimation = () => {
        // Check if the style already exists
        if (document.getElementById('pulse-animation-style')) return;
        
        const styleElement = document.createElement('style');
        styleElement.id = 'pulse-animation-style';
        styleElement.textContent = `
          @keyframes pulse {
            0% { transform: scale(0.8); opacity: 1; }
            70% { transform: scale(1.2); opacity: 0.7; }
            100% { transform: scale(0.8); opacity: 1; }
          }
          .pulse-animation {
            animation: pulse 1.5s infinite;
          }
        `;
        document.head.appendChild(styleElement);
        
        return () => {
          const existingStyle = document.getElementById('pulse-animation-style');
          if (existingStyle) document.head.removeChild(existingStyle);
        };
      };
    
      useEffect(() => {
        const cleanup = addPulseAnimation();
        return () => {
          if (cleanup) cleanup();
        };
      }, []);
    
    
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
          background-color: #008080;
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
                        coffeeShopsRef.current.forEach(({marker, potential}) => {
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

        const drawnItems = new L.FeatureGroup();
        drawnItems.setZIndex(1000);
        map.addLayer(drawnItems);
        map.drawnItems = drawnItems;


        const drawControl = new L.Control.Draw({
            draw: {
                polygon: false, // we'll enable it manually per tool
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

    const fetchCoffeeShops = async () => {
        try {
            const res = await fetch('/data/coffeeshop-data.geojson');
            const shopData = await res.json();
            const coffeeLayer = L.layerGroup();

            // Times Square coordinates
            const timesSquare = L.latLng(40.7589, -73.9866);
            // 3 miles in meters (3 * 1609.34)
            const radiusInMeters = radius * 1609.34;

            // Create a filtered version of the shop data for the table
            const filteredShopData = {
                type: "FeatureCollection",
                features: []
            };

            if (shopData.features && shopData.features.length > 0) {
                shopData.features.forEach(feature => {
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
                        })
                    });

                    // Create popup content
                    let popupContent = '<strong>Coffee Shop</strong>';
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

                    marker.bindPopup(popupContent);
                    marker.on('click', () => {
                        selectRowByFeatureProperties(feature.properties);
                    });

                    coffeeShopsRef.current.push({ marker, potential });
                    coffeeLayer.addLayer(marker);
                });
            }

            return { coffeeLayer, shopData: filteredShopData };
        } catch (error) {
            console.error("Error fetching coffee shop data:", error);
            return { coffeeLayer: L.layerGroup(), shopData: { features: [] } };
        }
    };

    // Find the fetchFootTraffic function (around line 790)
const fetchFootTraffic = async () => {
    try {
      const res = await fetch('/data/pedestrian-data.geojson');
      const trafficData = await res.json();
      const trafficLayer = L.layerGroup();
      
      // Process for heatmap
      const heatPoints = [];
      
      if (trafficData.features && trafficData.features.length > 0) {
        trafficData.features.forEach(feature => {
          if (feature.geometry && feature.geometry.type === 'Point') {
            const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];
            // Increase the intensity by multiplying the original value
            // Original: const intensity = feature.properties?.intensity || 0.5;
            const baseIntensity = feature.properties?.intensity || 0.5;
            const intensity = Math.min(baseIntensity * 4, 1.0); 
            
            // Add to heatmap data
            heatPoints.push([coords[0], coords[1], intensity]);
          }
        });
      }
      
      // Create heatmap layer if we have points
      if (heatPoints.length > 0 && window.L.heatLayer) {
        const heatmap = window.L.heatLayer(heatPoints, {
          radius: 50,     
          blur: 40,       
          maxZoom: 17,
          gradient: {
            0.2: layerColors.lowTraffic,
            0.5: layerColors.mediumTraffic,
            0.8: layerColors.highTraffic
          }
        });
        
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
        // Times Square coordinates
        const timesSquare = L.latLng(40.7589, -73.9866);
        // 3 miles in meters (3 * 1609.34)
        const radiusInMeters = radius * 1609.34;

        const circleLayer = L.layerGroup();

        // Create the circle
        const circle = L.circle(timesSquare, {
            radius: radiusInMeters,
            color: '#4169E1',
            fillColor: '#4169E1',
            fillOpacity: 0.05,
            weight: 2,
            dashArray: '5, 5'
        });

        // Add a marker at Times Square
        const marker = L.marker(timesSquare, {
            icon: L.divIcon({
                html: `<div style="background-color: #4169E1; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
                className: '',
                iconSize: [16, 16]
            })
        }).bindPopup('<strong>Times Square</strong><br>Center point');

        radiusCircleRef.current = circle;
        circleLayer.addLayer(circle);
        circleLayer.addLayer(marker);

        return { circleLayer };
    };

    const fetchStorefrontData = async () => {
        try {
            const res = await fetch('/data/vacated-data.geojson');
            const storefrontData = await res.json();
            const storefrontLayer = L.layerGroup();
            const heatPoints = [];
            // Times Square coordinates
            const timesSquare = L.latLng(40.7589, -73.9866);
            // 3 miles in meters (3 * 1609.34)
            const radiusInMeters = radius * 1609.34;

            // Price range in NYC for storefronts (per sq ft annually)
            const minRent = 75;  // cheaper areas
            const maxRent = 3000; // premium Times Square locations

            // Create a table-friendly version with added rental prices
            const enhancedData = {
                type: "FeatureCollection",
                features: []
            };

            // Process each storefront
            if (storefrontData.features && storefrontData.features.length > 0) {
                for (const feature of storefrontData.features) {
                    if (!feature.properties) continue;

                    // Skip entries without geometry/coordinates
                    if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
                        continue;
                    }

                    const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

                    // Create a Leaflet LatLng object for distance calculation
                    const storefrontLocation = L.latLng(coords[0], coords[1]);

                    // Calculate distance from Times Square
                    const distanceToTimesSquare = timesSquare.distanceTo(storefrontLocation);

                    // Skip storefronts outside the radius
                    if (distanceToTimesSquare > radiusInMeters) {
                        continue;
                    }

                    // Generate a random rental price
                    const rentalPrice = Math.floor(Math.random() * (maxRent - minRent) + minRent);

                    // Determine color based on price
                    let priceColor;
                    if (rentalPrice < 200) {
                        priceColor = '#2e7d32'; // green for cheapest
                    } else if (rentalPrice < 1000) {
                        priceColor = '#4caf50'; // orange for mid-range
                    } else {
                        priceColor = '#2e7d32'; // red for expensive
                    }

                    // Add rental price to properties
                    feature.properties.rentalPrice = rentalPrice;
                    feature.properties.priceCategory = rentalPrice < 200 ? 'Low' : (rentalPrice < 1000 ? 'Medium' : 'High');
                    heatPoints.push([
                        coords[0], // latitude
                        coords[1], // longitude
                        rentalPrice / 3000  // normalize rent to [0,1] scale for heatmap intensity
                    ]);
                    // Add the feature to our enhanced data collection
                    enhancedData.features.push(feature);
                    storefrontDataRef.current = enhancedData;

                }
            }
            if (heatPoints.length > 0 && window.L.heatLayer) {
                const storefrontHeatmap = window.L.heatLayer(heatPoints, {
                    radius: 10,
                    blur: 20,
                    maxZoom: 17,
                    gradient: {
                        0.2: '#2e7d32', // green (cheap rent)
                        0.5: '#4caf50', // orange (mid-range rent)
                        0.8: '#2e7d32'  // red (expensive rent)
                    }
                });

                storefrontLayer.addLayer(storefrontHeatmap);
            }
            return { storefrontLayer, storefrontData: enhancedData };

        } catch (error) {
            console.error("Error fetching storefront data:", error);
            return { storefrontLayer: L.layerGroup(), storefrontData: { features: [] } };
        }
    };

    const fetchSubwayStations = async () => {
        try {
            const res = await fetch('/data/subway-data.geojson');
            const stationData = await res.json();
            const stationLayer = L.layerGroup();

            // Times Square coordinates
            const timesSquare = L.latLng(40.7589, -73.9866);
            // 3 miles in meters (3 * 1609.34)
            const radiusInMeters = radius * 1609.34;

            // Create a filtered version of the station data for the table
            const filteredStationData = {
                type: "FeatureCollection",
                features: []
            };

            if (stationData.features && stationData.features.length > 0) {
                stationData.features.forEach(feature => {
                    // Skip entries without geometry/coordinates
                    if (!feature.geometry || feature.geometry.type !== 'Point' || !feature.geometry.coordinates) {
                        return;
                    }

                    const coords = [feature.geometry.coordinates[1], feature.geometry.coordinates[0]];

                    // Create a Leaflet LatLng object for distance calculation
                    const stationLocation = L.latLng(coords[0], coords[1]);

                    // Calculate distance from Times Square
                    const distanceToTimesSquare = timesSquare.distanceTo(stationLocation);

                    // Skip stations outside the radius
                    if (distanceToTimesSquare > radiusInMeters) {
                        return;
                    }

                    // Add this feature to our filtered data for the table
                    filteredStationData.features.push(feature);

                    // Create subway icon
                    const marker = L.marker(coords, {
                        icon: L.divIcon({
                            html: `<div style="background-color: #0039A6; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                            className: '',
                            iconSize: [16, 16]
                        })
                    });

                    // Create popup content
                    let popupContent = '<strong>Subway Station</strong>';
                    if (feature.properties) {
                        if (feature.properties.STATIONLABEL) {
                            popupContent += `<br>Name: ${feature.properties.STATIONLABEL}`;
                        }
                        if (feature.properties.LINE) {
                            popupContent += `<br>Line: ${feature.properties.LINE}`;
                        }
                        if (feature.properties.DIVISION) {
                            popupContent += `<br>Division: ${feature.properties.DIVISION}`;
                        }
                    }

                    marker.bindPopup(popupContent);
                    marker.on('click', () => {
                        selectRowByFeatureProperties(feature.properties);
                    });

                    stationLayer.addLayer(marker);
                });
            }

            return { stationLayer, stationData: filteredStationData };
        } catch (error) {
            console.error("Error fetching subway station data:", error);
            return { stationLayer: L.layerGroup(), stationData: { features: [] } };
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
                minZoom: 11,
                maxZoom: 18,
                doubleClickZoom: false
            }).setView([40.7589, -73.9866], 13);
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

            const [
                coffeeShopsResult,
                footTrafficResult,
                subwayStationsResult,
                storefrontResult
            ] = await Promise.all([
                fetchCoffeeShops(),
                fetchFootTraffic(),
                fetchSubwayStations(),
                fetchStorefrontData()
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
                const footTrafficTable = convertGeoJSONToTable(footTrafficResult.trafficData, 'footTraffic');
                setTableData(prevData => {
                    const newData = [...prevData];
                    newData[1] = footTrafficTable;
                    return newData;
                });
            }

            if (subwayStationsResult.stationData) {
                const subwayStationsTable = convertGeoJSONToTable(subwayStationsResult.stationData, 'subwayStations');
                setTableData(prevData => {
                    const newData = [...prevData];
                    newData[2] = subwayStationsTable;
                    return newData;
                });
            }

            if (storefrontResult.storefrontData) {
                const storefrontsTable = convertGeoJSONToTable(storefrontResult.storefrontData, 'storefronts');
                setTableData(prevData => {
                    const newData = [...prevData];
                    newData[3] = storefrontsTable;
                    return newData;
                });
            }



            const allLayers = L.layerGroup();

            // Add the layer group to the map (this makes all layers appear at once)
            allLayers.addTo(leafletMap);

            // Store layer references on the map object
            leafletMap.coffeeShopsLayer = coffeeShopsResult.coffeeLayer;
            leafletMap.footTrafficLayer = footTrafficResult.trafficLayer;
            leafletMap.radiusCircleLayer = radiusCircleResult.circleLayer;
            leafletMap.subwayStationsLayer = subwayStationsResult.stationLayer;
            leafletMap.storefrontsLayer = storefrontResult.storefrontLayer;

            // Then conditionally add layers based on initial state
            if (activeLayers.coffeeShops) {
                leafletMap.addLayer(coffeeShopsResult.coffeeLayer);
            }
            if (activeLayers.footTraffic) {
                leafletMap.addLayer(footTrafficResult.trafficLayer);
            }
            if (activeLayers.radius) {
                leafletMap.addLayer(radiusCircleResult.circleLayer);
            }
            if (activeLayers.subwayStations) {
                leafletMap.addLayer(subwayStationsResult.stationLayer);
            }
            if (activeLayers.storefronts) {
                leafletMap.addLayer(storefrontResult.storefrontLayer);
            }

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

        // Toggle coffee shops layer
        if (map.coffeeShopsLayer) {
            if (activeLayers.coffeeShops) {
                map.addLayer(map.coffeeShopsLayer);
            } else {
                map.removeLayer(map.coffeeShopsLayer);
            }
        }

        // Toggle foot traffic layer
        if (map.footTrafficLayer) {
            if (activeLayers.footTraffic) {
                map.addLayer(map.footTrafficLayer);
            } else {
                map.removeLayer(map.footTrafficLayer);
            }
        }

        // Toggle radius circle layer
        if (map.radiusCircleLayer) {
            if (activeLayers.radius) {
                map.addLayer(map.radiusCircleLayer);
            } else {
                map.removeLayer(map.radiusCircleLayer);
            }
        }

        // Toggle subway stations layer
        if (map.subwayStationsLayer) {
            if (activeLayers.subwayStations) {
                map.addLayer(map.subwayStationsLayer);
            } else {
                map.removeLayer(map.subwayStationsLayer);
            }
        }

        // Toggle storefronts layer
        if (map.storefrontsLayer) {
            if (activeLayers.storefronts) {
                map.addLayer(map.storefrontsLayer);
            } else {
                map.removeLayer(map.storefrontsLayer);
            }
        }
    }, [map, activeLayers]);

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


    const getLayerKeyFromLegend = (layerId, label) => {
        const clean = (str) => str.toLowerCase().replace(/[^a-z]/g, '');

        if (layerId === 'coffeeShops') {
            if (label.includes('Existing')) return 'existingShop';
            if (label.includes('High Potential')) return 'highPotential';
            if (label.includes('Medium Potential')) return 'mediumPotential';
            if (label.includes('Low Potential')) return 'lowPotential';
        }

        if (layerId === 'footTraffic') {
            if (label.includes('High')) return 'highTraffic';
            if (label.includes('Medium')) return 'mediumTraffic';
            if (label.includes('Low')) return 'lowTraffic';
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
                    <button onClick={() => setShowTable(!showTable)} title="Toggle Table" className="p-2 rounded-full border" style={{
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
                    <button onClick={() => setShowSaveDialog(true)} title="Save Map" className="p-2 rounded-full border" style={{
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
                        title="Draw & Measure Tools"
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



                    <button onClick={() => setShowLegend(prev => !prev)} title="Legend" className="p-2 rounded-full border" style={{
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
                    <button onClick={() => setShowSources(prev => !prev)} title="Sources" className="p-2 rounded-full border" style={{
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
                    <button onClick={() => setShowShareDialog(true)} title="Share" className="p-2 rounded-full border" style={{
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

                    <button onClick={toggleFullscreen} title="Fullscreen" className="p-2 rounded-full border" style={{
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
                    title={toolbarVisible ? "Collapse tools" : "Expand tools"}
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
                        <button onClick={() => setShowTable(!showTable)} title="Toggle Table" className="p-2 rounded-full border" style={{
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
                        <button onClick={() => setShowSaveDialog(true)} title="Save Map" className="p-2 rounded-full border" style={{
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
                            title="Draw & Measure Tools"
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



                        <button onClick={() => setShowLegend(prev => !prev)} title="Legend" className="p-2 rounded-full border" style={{
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
                        <button onClick={() => setShowSources(prev => !prev)} title="Sources" className="p-2 rounded-full border" style={{
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
                        <button onClick={() => setShowShareDialog(true)} title="Share" className="p-2 rounded-full border" style={{
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

                        <button onClick={toggleFullscreen} title="Exit Fullscreen" className="p-2 rounded-full border" style={{
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
                                        component: 'AdditionalLayersMapComponent',
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
                        className="absolute z-[9999] w-[150px] bg-white border border-gray-200 rounded-xl shadow-lg p-2 transition-all animate-fade-in"
                        style={{
                            top: isFullscreen ? '80px' : '360px',
                            left: isFullscreen ? '80px' : '130px',
                        }}
                    >
                        <div className="flex justify-between items-center mb-3">
                        <h3 className="text-xs font-semibold text-gray-800">Drawing Tools</h3>
                        <button onClick={() => setShowDrawTools(false)}>
                                <X size={16} className="text-gray-500 hover:text-gray-700" />
                            </button>
                        </div>
                        <div className="grid gap-1">


                            <button
                            
                                onClick={() => setShowGeocoder(!showGeocoder)}
                                title="Search Location"
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
Search                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
                                onClick={() => {
                                    if (!map) return;
                                    setShowDrawTools(false);
                                    // Prevent duplicate draw tools
                                    if (map._drawControl) {
                                        map._drawControl.disable();
                                    }

                                    // Ensure draw handler is removed before adding a new one
                                    map.off(L.Draw.Event.CREATED);

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
                                        }
                                    });

                                    // Enable the tool after configuration
                                    drawPolygon.enable();
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
                                    setActiveDrawTool('polygon');
                                    map.on('draw:drawvertex', function (e) {
                                        const layer = e.layers?.getLayers?.()?.[0];
                                        if (!layer) return;

                                        const latlngs = layer.getLatLngs?.()?.[0];
                                        if (!latlngs || latlngs.length === 0) return;

                                        const lastIndex = latlngs.length - 1;
                                        const currentPoint = latlngs[lastIndex];

                                        let closestPoint = null;
                                        let minDistance = Infinity;

                                        snapLayersRef.current.forEach((snapLayer) => {
                                            if (typeof snapLayer.getLatLngs !== 'function') return;
                                            const snapPoints = snapLayer.getLatLngs().flat(Infinity);

                                            snapPoints.forEach((pt) => {
                                                const dist = currentPoint.distanceTo(pt);
                                                if (dist < 20 && dist < minDistance) {
                                                    minDistance = dist;
                                                    closestPoint = pt;
                                                }
                                            });
                                        });

                                        if (closestPoint) {
                                            latlngs[lastIndex] = closestPoint;
                                            layer.setLatLngs([latlngs]);
                                        }
                                    });

                                    // Add explicit double click handler to the map
                                    const mapContainer = map.getContainer();
                                    mapContainer.addEventListener('dblclick', function (e) {
                                        if (map._drawControl && map._drawControl instanceof L.Draw.Polygon) {
                                            // This will trigger the finishShape method internally
                                            map._drawControl._finishShape();
                                            e.stopPropagation();
                                        }
                                    }, { once: true });

                                    // Handle when polygon drawing is completed
                                    map.on(L.Draw.Event.CREATED, function (e) {
                                        const layer = e.layer;
                                        map.drawnItems.addLayer(layer);
                                        map._drawControl = null; // reset for future draws
                                        setActiveDrawTool(null);
                                    });
                                }}

                            >
Polygon                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
Circle                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
Measure                            </button>

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
                                        finishOnDoubleClick: true, // ✅ ADD THIS LINE
                                        shapeOptions: {
                                            pane: 'drawPane',
                                            color: '#008080'
                                        },
                                        guideLayers: [],
                                        metric: true
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
Area                            </button>
                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
Edit                            </button>

                            <button
                                className="w-full px-2 py-1 rounded-full border text-xs font-medium text-[#008080] border-[#008080] hover:bg-[#008080] hover:text-white transition"
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
Freehand                            </button>
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
                            {tableData[currentTableIndex] && tableData[currentTableIndex].headers ? (
                                <table className="min-w-full border-collapse">
                                    <thead>
                                        {/* Excel-style A/B/C header row */}
                                        <tr key="header-row">
  <th className="w-8 text-[10px] bg-gray-100"></th>
  {tableData[currentTableIndex].headers.map((_, colIdx) => (
    <th
      key={`abc-${colIdx}`}
      onClick={() => setSelectedColIndex((prev) => (prev === colIdx ? null : colIdx))}
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
  {tableData[currentTableIndex].rows.map((row, rowIndex) => (
    <tr 
      key={`row-${rowIndex}`}
      onClick={() => {
        // Set the selected row index in state
        setSelectedRowIndex(rowIndex);
        
        // Directly trigger the highlight function for immediate feedback
        if (row) {
          resetLayerHighlighting();
          if (currentTableIndex === 0) { // Coffee Shops table
            highlightCoffeeShop(row);
          } else if (currentTableIndex === 1) { // Foot Traffic table
            highlightFootTrafficArea(row);
          } else if (currentTableIndex === 2) { // Subway Stations table
            highlightSubwayStation(row);
          } else if (currentTableIndex === 3) { // Storefronts table
            highlightStorefront(row);
          }
        }
      }}
      className={`cursor-pointer transition-colors duration-200 ${selectedRowIndex === rowIndex ? 'bg-[#ccecec]' : 'hover:bg-gray-50'}`}
    >
      <th
        onClick={(e) => {
          e.stopPropagation(); // Prevent row click handler
          setSelectedRowIndex(rowIndex);
          
          // Also trigger highlight directly
          if (tableData[currentTableIndex].rows[rowIndex]) {
            resetLayerHighlighting();
            if (currentTableIndex === 0) {
              highlightCoffeeShop(tableData[currentTableIndex].rows[rowIndex]);
            } else if (currentTableIndex === 1) {
              highlightFootTrafficArea(tableData[currentTableIndex].rows[rowIndex]);
            } else if (currentTableIndex === 2) {
              highlightSubwayStation(tableData[currentTableIndex].rows[rowIndex]);
            } else if (currentTableIndex === 3) {
              highlightStorefront(tableData[currentTableIndex].rows[rowIndex]);
            }
          }
        }}
        onContextMenu={(e) => handleRightClick(e, 'row', rowIndex)}
        className={`text-center text-[11px] font-semibold border border-gray-300 bg-gray-100
          ${selectedRowIndex === rowIndex ? 'bg-[#ccecec]' : ''}`}
      >
        {rowIndex + 1}
      </th>
      {tableData[currentTableIndex].headers.map((header, colIdx) => (
        <td
          key={colIdx}
          contentEditable
          suppressContentEditableWarning
          onClick={(e) => e.stopPropagation()} // Prevent row click handler when editing cells
          onBlur={(e) => {
            const value = e.target.innerText.trim();
            handleCellEdit(rowIndex, header, value);
          }}
          className={`px-2 py-1 text-xs border border-gray-200 min-w-[80px] whitespace-nowrap align-top hover:bg-[#f0fdfa]
            ${selectedRowIndex === rowIndex ? 'bg-[#ccecec]' : ''}
            ${selectedColIndex === colIdx ? 'bg-[#ccecec]' : ''}`}
          style={{ outline: 'none' }}
        >
          {tableData[currentTableIndex].rows[rowIndex][header]}
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
                                const finishBtn = container.querySelector('.leaflet-draw-actions a[title="Finish Drawing"]');
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
                                    value={downloadSelections['map']?.filename || 'nyc_coffee_map'}
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
                                    id: 'coffeeShops',
                                    name: 'Coffee Shops',
                                    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: layerColors.existingShop }} />,
                                    legend: [
                                        { label: 'Existing Shops', color: layerColors.existingShop },
                                        { label: 'High Potential', color: layerColors.highPotential },
                                        { label: 'Medium Potential', color: layerColors.mediumPotential },
                                        { label: 'Low Potential', color: layerColors.lowPotential }
                                    ]
                                },
                                {
                                    id: 'footTraffic',
                                    name: 'Foot Traffic',
                                    icon: <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: layerColors.highTraffic }} />,
                                    legend: [
                                        {
                                            label: 'Heatmap Intensity',
                                            gradient: [layerColors.lowTraffic, layerColors.mediumTraffic, layerColors.highTraffic]
                                        }
                                    ]
                                },
                                {
                                    id: 'radius',
                                    name: '1-Mile Radius',
                                    icon: <div className="w-4 h-4 rounded-full border-2 border-blue-500 border-dashed" style={{ backgroundColor: 'transparent' }} />,
                                    legend: [
                                        { label: 'Times Square Radius', color: '#4169E1', dashed: true }
                                    ]
                                },
                                {
                                    id: 'subwayStations',
                                    name: 'Subway Stations',
                                    icon: <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#0039A6' }} />,
                                    legend: [
                                        { label: 'Subway Station', color: '#0039A6' }
                                    ]
                                },
                                {
                                    id: 'storefronts',
                                    name: 'Available Storefronts',
                                    icon: <div className="w-4 h-4 rounded-sm transform rotate-45" style={{ backgroundColor: '#4caf50' }} />,
                                    legend: [
                                        { label: 'Low Rent (< $200/sqft)', color: '#2e7d32' },
                                        { label: 'Medium Rent ($200-$1000/sqft)', color: '#4caf50' },
                                        { label: 'High Rent (> $1000/sqft)', color: '#2e7d32' }
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

export default AdditionalLayersMapComponent;