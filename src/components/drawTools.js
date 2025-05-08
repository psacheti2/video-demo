import L from 'leaflet';

// Add keyboard shortcut handling to all tools
const addKeyboardShortcuts = (map, setActiveDrawTool) => {
  // Original keyboard shortcut implementation - unchanged
  if (!map) return;

  // Remove any existing handlers to prevent duplicates
  if (map._keyboardHandler) {
    document.removeEventListener('keydown', map._keyboardHandler);
    map._keyboardHandler = null;
  }

  // Create the keyboard handler
  const keyboardHandler = (e) => {
    // Only process if we have an active drawing tool
    if (!map._drawControl) return;

    // Handle Escape key - cancel current tool
    if (e.key === 'Escape') {
      e.preventDefault();
      
      // Different tools may need different cancellation methods
      if (map._drawControl.disable) {
        map._drawControl.disable();
      } else if (map._drawControl.deleteLastVertex) {
        // Some tools like L.Draw.Polygon have specific methods to cancel
        while (map._drawControl._markers && map._drawControl._markers.length > 0) {
          map._drawControl.deleteLastVertex();
        }
        map._drawControl.disable();
      }
      
      // Clear reference and update UI state
      map._drawControl = null;
      setActiveDrawTool(null);
    }
    
    // Handle Enter key - complete shapes where applicable
    if (e.key === 'Enter') {
      e.preventDefault();
      
      // Only attempt to complete if we have an active draw control
      if (map._drawControl) {
        // For polygon tools that need 3+ points
        if (map._drawControl._markers && map._drawControl._markers.length >= 3 &&
            map._drawControl._finishShape) {
          // Check that we have enough points to make a valid shape
          map._drawControl._finishShape();
        }
        // For measurement tools (polylines) that need 2+ points
        else if (map._drawControl._markers && map._drawControl._markers.length >= 2 &&
                 map._drawControl._finishShape && 
                 (map._drawControl instanceof L.Draw.Polyline)) {
          map._drawControl._finishShape();
        }
        // For other tools like circle, we could also finish them
        else if (map._drawControl._shape && map._drawControl._fireCreatedEvent) {
          map._drawControl._fireCreatedEvent();
        }
      }
    }
  };
  
  // Store reference to handler for cleanup
  map._keyboardHandler = keyboardHandler;
  
  // Add event listener
  document.addEventListener('keydown', keyboardHandler);
  
  // Return cleanup function
  return () => {
    if (map._keyboardHandler) {
      document.removeEventListener('keydown', map._keyboardHandler);
      map._keyboardHandler = null;
    }
  };
};


export const setupClickToEdit = (map, editControlRef, setIsEditing, setActiveDrawTool) => {
    console.log("Setting up click-to-edit functionality");
    
    if (!map) {
      console.error("No map provided to setupClickToEdit");
      return;
    }
    
    if (!map.drawnItems) {
      console.error("Map has no drawnItems layer group");
      return;
    }
    
    console.log("Map drawnItems layer contains", map.drawnItems.getLayers().length, "layers");
    
    // Clean up any existing handlers to prevent duplicates
    if (map._shapeClickHandler) {
      console.log("Removing previous click handler");
      map.off('click', map._shapeClickHandler);
      map._shapeClickHandler = null;
    }
    
    // Create the shape click handler
    const shapeClickHandler = (e) => {
      console.log("Shape click handler triggered at", e.latlng);
      
      // Skip if we're already in edit mode or drawing
      if (map._drawControl) {
        console.log("Already in edit/draw mode, ignoring click");
        return;
      }
      
      // Check if the click hit a layer in our drawn items
      let targetLayer = null;
      let layersChecked = 0;
      
      map.drawnItems.eachLayer(layer => {
        layersChecked++;
        if (targetLayer) return; // Already found a target
        
        // For polygons/polylines - check if click is inside or on the shape
        if (layer instanceof L.Polygon) {
          console.log("Checking polygon");
          if (layer.getBounds().contains(e.latlng) || isPointNearPolyline(e.latlng, layer.getLatLngs()[0], map)) {
            console.log("Hit polygon");
            targetLayer = layer;
          }
        } 
        else if (layer instanceof L.Polyline && !(layer instanceof L.Polygon)) {
          console.log("Checking polyline");
          if (isPointNearPolyline(e.latlng, layer.getLatLngs(), map)) {
            console.log("Hit polyline");
            targetLayer = layer;
          }
        }
        else if (layer instanceof L.Circle) {
          console.log("Checking circle");
          const distance = e.latlng.distanceTo(layer.getLatLng());
          if (Math.abs(distance - layer.getRadius()) < 20 || distance < layer.getRadius()) {
            console.log("Hit circle");
            targetLayer = layer;
          }
        }
        // For other types of layers like markers
        else if (layer.getLatLng) {
          console.log("Checking marker");
          if (layer.getLatLng().distanceTo(e.latlng) < 20) {
            console.log("Hit marker");
            targetLayer = layer;
          }
        }
        else {
          console.log("Unknown layer type:", layer.constructor.name);
        }
      });
      
      console.log("Checked", layersChecked, "layers, found target:", !!targetLayer);
      
      // If we found a target layer, enter edit mode for it
      if (targetLayer) {
        console.log("Entering edit mode for layer");
        
        // Disable any existing edit controls
        if (map._drawControl) {
          map._drawControl.disable();
        }
        
        // Enable edit mode just for this layer
        enterEditModeForLayer(map, targetLayer, editControlRef, setIsEditing, setActiveDrawTool);
        
        // Prevent the click from propagating to other handlers
        L.DomEvent.stopPropagation(e);
      }
    };
    
    // Store reference for cleanup
    map._shapeClickHandler = shapeClickHandler;
    
    // Add the click event listener to the map with high priority (true parameter)
    // This ensures our handler runs before other click handlers
    map.on('click', shapeClickHandler, { priority: 'high' });
    
    console.log("Click-to-edit handler set up successfully");

    
    
    // Return cleanup function
    return () => {
      console.log("Cleaning up click-to-edit handler");
      if (map._shapeClickHandler) {
        map.off('click', map._shapeClickHandler);
        map._shapeClickHandler = null;
      }
    };
  };
  


  const enterEditModeForLayer = (map, layer, editControlRef, setIsEditing, setActiveDrawTool) => {
    // Enable editing directly on the layer
    if (layer.editing && typeof layer.editing.enable === 'function') {
      layer.editing.enable();
    }
  
    // Store references
    map._drawControl = {
      disable: () => {
        if (layer.editing && typeof layer.editing.disable === 'function') {
          layer.editing.disable();
        }
        map._drawControl = null;
        setIsEditing(false);
        setActiveDrawTool(null);
        map.dragging.enable();
      }
    };
    
    editControlRef.current = map._drawControl;
    setIsEditing(true);
    setActiveDrawTool('edit');
    map.dragging.disable();
  
    // Add keyboard shortcuts
    addKeyboardShortcuts(map, setActiveDrawTool);
  
    // Handle edit completion
    layer.once('editable:editing', () => {
      map._drawControl.disable();
    });
  };

// Helper function to check if a point is near a polyline
const isPointNearPolyline = (point, latlngs, map) => {
  const threshold = 20; // Pixels
  
  // Handle nested arrays (for polygons)
  if (latlngs[0] instanceof Array) {
    latlngs = latlngs[0];
  }
  
  // Check each segment
  for (let i = 0; i < latlngs.length - 1; i++) {
    const p1 = map.latLngToLayerPoint(latlngs[i]);
    const p2 = map.latLngToLayerPoint(latlngs[i+1]);
    const clickPoint = map.latLngToLayerPoint(point);
    
    // Distance from point to line segment
    const distance = pointToSegmentDistance(clickPoint, p1, p2);
    
    if (distance < threshold) {
      return true;
    }
  }
  
  // For polygons, check the closing segment too
  if (latlngs.length > 2 && latlngs[0].lat === latlngs[latlngs.length-1].lat && 
      latlngs[0].lng === latlngs[latlngs.length-1].lng) {
    return false; // Already checked all segments including closing one
  } else if (latlngs.length > 2) {
    // Check closing segment for open polygons
    const p1 = map.latLngToLayerPoint(latlngs[latlngs.length-1]);
    const p2 = map.latLngToLayerPoint(latlngs[0]);
    const clickPoint = map.latLngToLayerPoint(point);
    
    const distance = pointToSegmentDistance(clickPoint, p1, p2);
    
    if (distance < threshold) {
      return true;
    }
  }
  
  return false;
};

// Calculate distance from point to line segment
const pointToSegmentDistance = (p, p1, p2) => {
  const x = p.x;
  const y = p.y;
  const x1 = p1.x;
  const y1 = p1.y;
  const x2 = p2.x;
  const y2 = p2.y;
  
  const A = x - x1;
  const B = y - y1;
  const C = x2 - x1;
  const D = y2 - y1;
  
  const dot = A * C + B * D;
  const len_sq = C * C + D * D;
  
  let param = -1;
  if (len_sq !== 0) param = dot / len_sq;
  
  let xx, yy;
  
  if (param < 0) {
    xx = x1;
    yy = y1;
  } else if (param > 1) {
    xx = x2;
    yy = y2;
  } else {
    xx = x1 + param * C;
    yy = y1 + param * D;
  }
  
  const dx = x - xx;
  const dy = y - yy;
  
  return Math.sqrt(dx * dx + dy * dy);
};

// Modify the original tools (same as in the input file)

// Keep the enhance tool function the same
const enhanceToolWithKeyboardSupport = (originalFunction) => {
  return function(map, ...args) {
    // Add keyboard shortcuts
    const cleanup = addKeyboardShortcuts(map, args[args.length - 1]);
    
    // Call the original function
    const tool = originalFunction(map, ...args);
    
    // Enhance tool with cleanup
    if (tool) {
      const originalDisable = tool.disable;
      tool.disable = function() {
        if (cleanup) cleanup();
        if (originalDisable) originalDisable.call(this);
      };
    }
    
    return tool;
  };
};

// Replace the fetchExactPointLocation function with this improved version
const fetchExactPointLocation = async (pointCoords) => {
    // Use a wider radius (25 meters) to make sure we catch the building the point is in
    const searchRadius = 25; // meters
    
    // Use a more effective query that will properly find buildings containing the point
    const query = `
      [out:json];
      // Search for buildings and other features within radius
      (
        // Ways (buildings, areas) near the point
        way(around:${searchRadius},${pointCoords.lat},${pointCoords.lng})[name];
        // Nodes at this location (POIs)  
        node(around:${searchRadius},${pointCoords.lat},${pointCoords.lng})[name];
        // Relations (complex features) near the point
        relation(around:${searchRadius},${pointCoords.lat},${pointCoords.lng})[name];
      );
      out body;
      >;
      out skel qt;
    `;
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      // If we get no results with name tags, try again with a more general query
      if (!data.elements || data.elements.length === 0 || 
          !data.elements.some(el => el.tags && el.tags.name)) {
        // Try a more general query without requiring names
        const backupQuery = `
          [out:json];
          (
            way(around:${searchRadius},${pointCoords.lat},${pointCoords.lng});
            node(around:${searchRadius},${pointCoords.lat},${pointCoords.lng});
            relation(around:${searchRadius},${pointCoords.lat},${pointCoords.lng});
          );
          out body;
          >;
          out skel qt;
        `;
        
        const backupResponse = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: backupQuery
        });
        
        data.elements = (await backupResponse.json()).elements;
      }
      
      // Parse and sort the results
      const locations = data.elements
        .filter(el => el.tags) // Filter to items with tags
        .map(el => {
          // Determine the most descriptive name
          let name = el.tags.name;
          if (!name) {
            // Try to construct a descriptive name if no explicit name
            if (el.tags.building) {
              name = el.tags.building === 'yes' ? 'Building' : 
                    `${el.tags.building.charAt(0).toUpperCase() + el.tags.building.slice(1)} Building`;
              
              // Add address if available
              if (el.tags['addr:street']) {
                name += ` at ${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}`;
              }
            } else if (el.tags.amenity) {
              name = el.tags.amenity.charAt(0).toUpperCase() + el.tags.amenity.slice(1);
            } else if (el.tags.shop) {
              name = `${el.tags.shop.charAt(0).toUpperCase() + el.tags.shop.slice(1)} Shop`;
            } else if (el.tags.leisure) {
              name = el.tags.leisure.charAt(0).toUpperCase() + el.tags.leisure.slice(1);
            } else if (el.tags.highway) {
              name = `${el.tags.highway.charAt(0).toUpperCase() + el.tags.highway.slice(1)} ${el.tags.name || ''}`;
            } else {
              name = 'Unnamed Feature';
            }
          }
          
          return {
            id: el.id,
            name: name,
            type: el.tags.amenity || el.tags.building || el.tags.shop || el.tags.leisure || el.tags.tourism || el.type,
            additionalInfo: {
              address: el.tags['addr:street'] ? `${el.tags['addr:housenumber'] || ''} ${el.tags['addr:street']}` : null,
              website: el.tags.website || null,
              phone: el.tags.phone || null,
              description: el.tags.description || null,
            }
          };
        });
      
      // Prioritize buildings and amenities over simple nodes
      return locations.sort((a, b) => {
        // Give precedence to named features first
        if (a.name !== 'Unnamed Feature' && b.name === 'Unnamed Feature') return -1;
        if (a.name === 'Unnamed Feature' && b.name !== 'Unnamed Feature') return 1;
        
        // Then prioritize by feature type
        const aScore = a.type === 'building' ? 4 : 
                       a.type === 'amenity' ? 3 :
                       a.type === 'shop' ? 2 :
                       a.type === 'way' ? 1 : 0;
        const bScore = b.type === 'building' ? 4 : 
                       b.type === 'amenity' ? 3 :
                       b.type === 'shop' ? 2 :
                       b.type === 'way' ? 1 : 0;
        return bScore - aScore;
      });
    } catch (error) {
      console.error('Error fetching exact point location:', error);
      return [];
    }
  };

// Add this function at the top of your file
const fetchLocationsInPolygon = async (polygonPoints) => {
    // Format polygon points for Overpass API
    const polygonString = polygonPoints.map(p => `${p.lat} ${p.lng}`).join(' ');
    
    // Create Overpass query to find buildings, amenities, etc. within the polygon
    const query = `
      [out:json];
      (
        node(poly:"${polygonString}")[name];
        way(poly:"${polygonString}")[name];
        relation(poly:"${polygonString}")[name];
      );
      out body;
      >;
      out skel qt;
    `;
    
    try {
      const response = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: query
      });
      
      const data = await response.json();
      
      // Parse the results to extract location information
      const locations = data.elements
        .filter(el => el.tags && el.tags.name)
        .map(el => ({
          id: el.id,
          name: el.tags.name,
          type: el.tags.amenity || el.tags.building || el.type
        }));
      
      return locations;
    } catch (error) {
      console.error('Error fetching locations:', error);
      return [];
    }
  };

  export const createPolygonDrawTool = enhanceToolWithKeyboardSupport((map, snapLayersRef, setActiveDrawTool, sendQuestionToChat, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder) => {
    if (!map) return;
    
    // Prevent duplicate draw tools
    if (map._drawControl) {
      map._drawControl.disable();
    }
  
    // Ensure draw handler is removed before adding a new one
    map.off(L.Draw.Event.CREATED);
    
    // Store original map dragging state and disable it while the tool is active
    const originalDraggingState = map.dragging.enabled();
    map.dragging.disable();
    
    // Set cursor style
    map.getContainer().style.cursor = 'crosshair';
    
    // Track state for multi-function tool
    let startPoint = null;
    let dragThreshold = 5; // pixels
    let hasStartedDrag = false;
    let isDragging = false;
    let tempCircle = null;
    
    // Multi-point line state
    let points = [];
    let tempLine = null;
    let isDrawingLine = false;
    let firstPointMarker = null; // Reference to first point marker for visual identification
    
    // Initialize temporary layer if needed
    if (!map._tempDrawLayer) {
      map._tempDrawLayer = L.layerGroup().addTo(map);
    }
    
    // Update the temporary polyline preview
    const updateTempLine = () => {
      // Remove existing temp line
      if (tempLine) {
        map._tempDrawLayer.removeLayer(tempLine);
      }
      
      // Create new temp line if we have at least 2 points
      if (points.length >= 2) {
        tempLine = L.polyline(points, {
          color: '#008080', // Teal color
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map._tempDrawLayer);
      }
    };
    
    // Check if two points are close enough to be considered the same
    const arePointsClose = (p1, p2, maxDistance = 15) => {
      const p1Converted = map.latLngToContainerPoint(p1);
      const p2Converted = map.latLngToContainerPoint(p2);
      return p1Converted.distanceTo(p2Converted) <= maxDistance;
    };
    
    // Finalize the current drawing
    const finishDrawing = () => {
      // Don't do anything if no drawing in progress
      if (points.length === 0 && !tempCircle) return;
      
      // CASE 1: Multiple point line
      if (isDrawingLine && points.length > 0) {
        // Different handling based on point count
        if (points.length === 1) {
          // Single point - create a marker
          const marker = L.marker(points[0], {
            icon: L.divIcon({
              className: 'custom-vertex-marker',
              iconSize: [12, 12], // Bigger points
              html: '<div style="background-color: #008080; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
            }),
            bubblingMouseEvents: false
          });
          
          // Add to drawn items
          map.drawnItems.addLayer(marker);
          
          // Store point information
          marker.pointInfo = {
            lat: points[0].lat.toFixed(6),
            lng: points[0].lng.toFixed(6)
          };
          
          // Use marker type
          const layerType = 'marker';
          map._shapeIdCounters = map._shapeIdCounters || {};
          if (typeof map._shapeIdCounters[layerType] !== 'number') {
            console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
            map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
          }
          const nextId = map._shapeIdCounters[layerType];
          map._shapeIdCounters[layerType] = nextId + 1;
          
          // Create layerId
          const layerId = `${layerType}-${nextId}`;
          marker.layerId = layerId;
          marker.layerType = layerType;
          
          // Update state
          setNextShapeIds(prev => ({
            ...prev,
            [layerType]: map._shapeIdCounters[layerType]
          }));
          
          // Add to drawn layers
          setDrawnLayers(prev => ({
            ...prev,
            [layerId]: {
              layer: marker,
              type: layerType,
              visible: true,
              name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
              color: '#008080'
            }
          }));
          
          // Add to the order array
          setDrawnLayersOrder(prev => {
            return [...(Array.isArray(prev) ? prev : []), layerId];
          });
          
          // Replace the existing code for the point marker case with this:
try {
    // Get point coordinates for API query
    const pointCoords = { lat: points[0].lat, lng: points[0].lng };
    
    // Add loading popup while fetching location
    const loadingPopupContent = `
      <div style="min-width: 200px; padding: 8px; text-align: center;">
        <p>Identifying exact location...</p>
      </div>
    `;
    marker.bindPopup(loadingPopupContent).openPopup();
    
    // Enhanced fetch for precise location - using a modified version of fetchLocationsInPolygon
    // that specifically looks for buildings/features containing this exact point
    fetchExactPointLocation(pointCoords).then(locations => {
      // Store locations with the marker for later reference
      marker.locationInfo = locations;
      
      // Format location name for display
      const locationName = locations.length > 0 
        ? locations[0].name
        : 'No building or feature identified at this point';
      
      // Create popup content with the results - emphasizing "You are at" for points
      const popupContent = `
        <div style="min-width: 200px; padding: 8px;">
          <div style="margin-bottom: 8px;">
            <strong>You are at:</strong> ${locationName}
          </div>
          <div style="margin-bottom: 8px;">
            <strong>Coordinates:</strong> Lat: ${marker.pointInfo.lat}, Lng: ${marker.pointInfo.lng}
          </div>
          <div style="text-align: center;">
            <button id="ask-question-btn" 
              style="background-color: #008080; color: white; border: none; padding: 8px 12px; 
              border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
              Ask a question about this location
            </button>
          </div>
          <div id="question-input-container" style="display: none; margin-top: 10px;">
            <textarea id="question-textarea" 
              style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
              min-height: 60px; margin-bottom: 8px;" 
              placeholder="Type your question about this location..."></textarea>
            <div style="display: flex; justify-content: space-between;">
              <button id="cancel-question-btn" 
                style="background-color: #f1f1f1; color: #333; border: none; padding: 6px 12px; 
                border-radius: 4px; cursor: pointer;">
                Cancel
              </button>
              <button id="send-question-btn" 
                style="background-color: #008080; color: white; border: none; padding: 6px 12px; 
                border-radius: 4px; cursor: pointer;">
                Send
              </button>
            </div>
          </div>
        </div>
      `;
      
      // Update popup with the location information
      marker.setPopupContent(popupContent);
      
      // Set up event listeners for the popup
      setTimeout(() => {
        const askButton = document.getElementById('ask-question-btn');
        const questionContainer = document.getElementById('question-input-container');
        const textarea = document.getElementById('question-textarea');
        const sendButton = document.getElementById('send-question-btn');
        const cancelButton = document.getElementById('cancel-question-btn');
        
        if (askButton) {
          askButton.addEventListener('click', function() {
            askButton.style.display = 'none';
            if (questionContainer) questionContainer.style.display = 'block';
            if (textarea) textarea.focus();
          });
        }
        
        if (cancelButton) {
          cancelButton.addEventListener('click', function() {
            if (askButton) askButton.style.display = 'block';
            if (questionContainer) questionContainer.style.display = 'none';
          });
        }
        
        if (sendButton && textarea) {
          sendButton.addEventListener('click', function() {
            const question = textarea.value.trim();
            if (question) {
              // Build a context-rich question with location information
              const locationContext = marker.locationInfo && marker.locationInfo.length > 0
                ? `at ${marker.locationInfo[0].name}`
                : 'at this specific point';
              
              const enhancedQuestion = `${locationContext}: ${question}`;
              
              // Send the question to chat
              if (typeof sendQuestionToChat === 'function') {
                sendQuestionToChat(enhancedQuestion);
                map.closePopup();
              }
            }
          });
          
          // Also add enter key handler for the textarea
          textarea.addEventListener('keydown', function(e) {
            // Ctrl+Enter to send
            if (e.key === 'Enter' && e.ctrlKey) {
              e.preventDefault();
              sendButton.click();
            }
          });
        }
      }, 100);
    });
  } catch (err) {
    console.error("Error processing point location:", err);
    // Fallback to basic coordinate popup
    const popupContent = `<strong>Point Location:</strong><br>Lat: ${marker.pointInfo.lat}<br>Lng: ${marker.pointInfo.lng}`;
    marker.bindPopup(popupContent).openPopup();
  }
        } 
        else if (points.length >= 2) {
          // Multiple points - determine if we should create a polyline or polygon
          const shouldCreatePolygon = points.length >= 3 && 
                                     arePointsClose(points[0], points[points.length - 1]);
          
          let layer;
          if (shouldCreatePolygon) {
            // Create a polygon if we've closed the shape
            if (arePointsClose(points[0], points[points.length - 1])) {
              // Use first point exactly to ensure perfect closing
              points[points.length - 1] = points[0];
            }
            
            layer = L.polygon(points, {
              color: '#008080', // Teal color
              weight: 3,
              opacity: 0.8,
              fillColor: '#008080',
              fillOpacity: 0.2
            });
            
            // Add to drawn items
            map.drawnItems.addLayer(layer);
            if (shouldCreatePolygon && points.length === 4) {
              layer.layerType = 'triangle';
            }
            
            const layerType = layer.layerType || (shouldCreatePolygon ? 
              (points.length === 4 ? 'triangle' : 'polygon') : 
              'polyline');
  
            map._shapeIdCounters = map._shapeIdCounters || {};
            if (typeof map._shapeIdCounters[layerType] !== 'number') {
              console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
              map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
            }
            const nextId = map._shapeIdCounters[layerType];
            map._shapeIdCounters[layerType] = nextId + 1;
            const layerId = `${layerType}-${nextId}`;
            console.log(`Created ${layerType} ${nextId}, next will be ${map._shapeIdCounters[layerType]}`);
  
            // Store the ID on the layer
            layer.layerId = layerId;
  
            // Update state to match the local counter
            setNextShapeIds(prev => ({
              ...prev,
              [layerType]: map._shapeIdCounters[layerType]
            }));
  
            // Update drawn layers state
            setDrawnLayers(prev => ({
              ...prev,
              [layerId]: {
                layer: layer,
                type: layerType,
                visible: true,
                name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
                color: '#008080'
              }
            }));
  
            // Add to the order array
            setDrawnLayersOrder(prev => {
              // Ensure prev is an array
              return [...(Array.isArray(prev) ? prev : []), layerId];
            });
            
            // Calculate and display area
            try {
              const latlngs = layer.getLatLngs()[0];
              let area = 0;
              
              // Calculate area (using Leaflet's utility if available)
              if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
                area = L.GeometryUtil.geodesicArea(latlngs);
              } else {
                // Fallback calculation
                area = calculateRoughArea(latlngs);
              }
              
              // Format area for display
              const readableArea = area > 1000000 ? 
                                `${(area/1000000).toFixed(2)} km²` : 
                                `${Math.round(area)} m²`;
              
              // Store the area information with the layer
              layer.areaInfo = readableArea;
              
              // Get all polygon points for API query
              const polygonPoints = latlngs.map(point => ({ lat: point.lat, lng: point.lng }));
              
              // Add loading popup while fetching locations
              const loadingPopupContent = `
                <div style="min-width: 200px; padding: 8px; text-align: center;">
                  <p>Identifying locations in selected area...</p>
                </div>
              `;
              layer.bindPopup(loadingPopupContent).openPopup();
              
              // Call the location/geocoding API with the polygon points
              fetchLocationsInPolygon(polygonPoints).then(locations => {
                // Store locations with the layer for later reference
                layer.locationInfo = locations;
                
                // Format location names for display
                const locationNames = locations.length > 0 
                  ? locations.map(loc => loc.name).join(', ')
                  : 'No named locations found';
                
                // Create popup content with the results
                const popupContent = `
                  <div style="min-width: 200px; padding: 8px;">
                    <div style="margin-bottom: 8px;">
                      <strong>Area:</strong> ${readableArea}
                    </div>
                    <div style="margin-bottom: 8px;">
                      <strong>Contains:</strong> ${locationNames}
                    </div>
                    <div style="text-align: center;">
                      <button id="ask-question-btn" 
                        style="background-color: #008080; color: white; border: none; padding: 8px 12px; 
                        border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
                        Ask a question about this area
                      </button>
                    </div>
                    <div id="question-input-container" style="display: none; margin-top: 10px;">
                      <textarea id="question-textarea" 
                        style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                        min-height: 60px; margin-bottom: 8px;" 
                        placeholder="Type your question about this area..."></textarea>
                      <div style="display: flex; justify-content: space-between;">
                        <button id="cancel-question-btn" 
                          style="background-color: #f1f1f1; color: #333; border: none; padding: 6px 12px; 
                          border-radius: 4px; cursor: pointer;">
                          Cancel
                        </button>
                        <button id="send-question-btn" 
                          style="background-color: #008080; color: white; border: none; padding: 6px 12px; 
                          border-radius: 4px; cursor: pointer;">
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                `;
                
                // Update popup with the location information
                layer.setPopupContent(popupContent);
                
                // Set up event listeners for the popup
                setTimeout(() => {
                  const askButton = document.getElementById('ask-question-btn');
                  const questionContainer = document.getElementById('question-input-container');
                  const textarea = document.getElementById('question-textarea');
                  const sendButton = document.getElementById('send-question-btn');
                  const cancelButton = document.getElementById('cancel-question-btn');
                  
                  if (askButton) {
                    askButton.addEventListener('click', function() {
                      askButton.style.display = 'none';
                      if (questionContainer) questionContainer.style.display = 'block';
                      if (textarea) textarea.focus();
                    });
                  }
                  
                  if (cancelButton) {
                    cancelButton.addEventListener('click', function() {
                      if (askButton) askButton.style.display = 'block';
                      if (questionContainer) questionContainer.style.display = 'none';
                    });
                  }
                  
                  if (sendButton && textarea) {
                    sendButton.addEventListener('click', function() {
                      const question = textarea.value.trim();
                      if (question) {
                        // Build a context-rich question with location information
                        const locationContext = layer.locationInfo && layer.locationInfo.length > 0
                          ? `containing ${layer.locationInfo.map(loc => loc.name).join(', ')}`
                          : 'with no named locations';
                        
                        const enhancedQuestion = `${locationContext}: ${question}`;
                        
                        // Send the question to chat
                        if (typeof sendQuestionToChat === 'function') {
                          sendQuestionToChat(enhancedQuestion);
                          map.closePopup();
                          // Disable editing when question is sent
                          if (layer.editing && typeof layer.editing.disable === 'function') {
                            layer.editing.disable();
                          }
                        }
                      }
                    });
                    
                    // Also add enter key handler for the textarea
                    textarea.addEventListener('keydown', function(e) {
                      // Ctrl+Enter to send
                      if (e.key === 'Enter' && e.ctrlKey) {
                        e.preventDefault();
                        sendButton.click();
                      }
                    });
                  }
                }, 100);
              });
            } catch (err) {
              console.error("Error processing polygon:", err);
            }
          } else {
            // Create a polyline (open shape)
            layer = L.polyline(points, {
              color: '#008080', // Teal color
              weight: 3,
              opacity: 0.8
            });
            
            // Add to drawn items
            map.drawnItems.addLayer(layer);
            
            // Set layer type
            const layerType = 'polyline';
            
            // Increment counter
            map._shapeIdCounters = map._shapeIdCounters || {};
            if (typeof map._shapeIdCounters[layerType] !== 'number') {
              console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
              map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
            }
            const nextId = map._shapeIdCounters[layerType];
            map._shapeIdCounters[layerType] = nextId + 1;
            
            // Create layer ID
            const layerId = `${layerType}-${nextId}`;
            
            // Store ID on layer
            layer.layerId = layerId;
            layer.layerType = layerType;
            
            // Update state
            setNextShapeIds(prev => ({
              ...prev,
              [layerType]: map._shapeIdCounters[layerType]
            }));
            
            // Add to drawn layers
            setDrawnLayers(prev => ({
              ...prev,
              [layerId]: {
                layer: layer,
                type: layerType,
                visible: true,
                name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
                color: '#008080'
              }
            }));
            
            // Add to the order array
            setDrawnLayersOrder(prev => {
              // Ensure prev is an array
              return [...(Array.isArray(prev) ? prev : []), layerId];
            });
            
            try {
                const latlngs = layer.getLatLngs();
                let totalDistance = 0;
                
                for (let i = 0; i < latlngs.length - 1; i++) {
                  totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
                }
                
                const formattedDistance = totalDistance > 1000 ?
                                        `${(totalDistance/1000).toFixed(2)} km` :
                                        `${totalDistance.toFixed(2)} meters`;
                
                // Store length info
                layer.lengthInfo = formattedDistance;
                
                // Get points along the line for API query
                const linePoints = latlngs.map(point => ({ lat: point.lat, lng: point.lng }));
                
                // Add loading popup while fetching locations
                const loadingPopupContent = `
                  <div style="min-width: 200px; padding: 8px; text-align: center;">
                    <p>Identifying locations along path...</p>
                  </div>
                `;
                layer.bindPopup(loadingPopupContent).openPopup();
                
                // Call the location/geocoding API with the line points
                fetchLocationsInPolygon(linePoints).then(locations => {
                  // Store locations with the layer for later reference
                  layer.locationInfo = locations;
                  
                  // Format location names for display
                  const locationNames = locations.length > 0 
                    ? locations.map(loc => loc.name).join(', ')
                    : 'No named locations found';
                  
                  // Create popup content with the results
                  const popupContent = `
                    <div style="min-width: 200px; padding: 8px;">
                      <div style="margin-bottom: 8px;">
                        <strong>Length:</strong> ${layer.lengthInfo}
                      </div>
                      <div style="margin-bottom: 8px;">
                        <strong>Passes through:</strong> ${locationNames}
                      </div>
                      <div style="text-align: center;">
                        <button id="ask-question-btn" 
                          style="background-color: #008080; color: white; border: none; padding: 8px 12px; 
                          border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
                          Ask a question about this path
                        </button>
                      </div>
                      <div id="question-input-container" style="display: none; margin-top: 10px;">
                        <textarea id="question-textarea" 
                          style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                          min-height: 60px; margin-bottom: 8px;" 
                          placeholder="Type your question about this path..."></textarea>
                        <div style="display: flex; justify-content: space-between;">
                          <button id="cancel-question-btn" 
                            style="background-color: #f1f1f1; color: #333; border: none; padding: 6px 12px; 
                            border-radius: 4px; cursor: pointer;">
                            Cancel
                          </button>
                          <button id="send-question-btn" 
                            style="background-color: #008080; color: white; border: none; padding: 6px 12px; 
                            border-radius: 4px; cursor: pointer;">
                            Send
                          </button>
                        </div>
                      </div>
                    </div>
                  `;
                  
                  // Update popup with the location information
                  layer.setPopupContent(popupContent);
                  
                  // Set up event listeners for the popup
                  setTimeout(() => {
                    const askButton = document.getElementById('ask-question-btn');
                    const questionContainer = document.getElementById('question-input-container');
                    const textarea = document.getElementById('question-textarea');
                    const sendButton = document.getElementById('send-question-btn');
                    const cancelButton = document.getElementById('cancel-question-btn');
                    
                    if (askButton) {
                      askButton.addEventListener('click', function() {
                        askButton.style.display = 'none';
                        if (questionContainer) questionContainer.style.display = 'block';
                        if (textarea) textarea.focus();
                      });
                    }
                    
                    if (cancelButton) {
                      cancelButton.addEventListener('click', function() {
                        if (askButton) askButton.style.display = 'block';
                        if (questionContainer) questionContainer.style.display = 'none';
                      });
                    }
                    
                    if (sendButton && textarea) {
                      sendButton.addEventListener('click', function() {
                        const question = textarea.value.trim();
                        if (question) {
                          // Build a context-rich question with location information
                          const locationContext = layer.locationInfo && layer.locationInfo.length > 0
                            ? `along path through ${layer.locationInfo.map(loc => loc.name).join(', ')}`
                            : 'along this path';
                          
                          const enhancedQuestion = `${locationContext}: ${question}`;
                          
                          // Send the question to chat
                          if (typeof sendQuestionToChat === 'function') {
                            sendQuestionToChat(enhancedQuestion);
                            map.closePopup();
                            // Disable editing when question is sent
                            if (layer.editing && typeof layer.editing.disable === 'function') {
                              layer.editing.disable();
                            }
                          }
                        }
                      });
                      
                      // Also add enter key handler for the textarea
                      textarea.addEventListener('keydown', function(e) {
                        // Ctrl+Enter to send
                        if (e.key === 'Enter' && e.ctrlKey) {
                          e.preventDefault();
                          sendButton.click();
                        }
                      });
                    }
                  }, 100);
                });
                
                // Add special click handler for polyline - show popup AND edit vertices
                layer.on('click', function(e) {
                  // Show popup with length information
                  layer.openPopup();
                  
                  // Also enable editing for this layer
                  if (layer.editing && typeof layer.editing.enable === 'function') {
                    layer.editing.enable();
                  }
                  
                  // Don't propagate click to map to prevent other handlers
                  L.DomEvent.stopPropagation(e);
                });
              } catch (err) {
                console.error("Error calculating line length:", err);
                // Fallback to basic length popup
                const popupContent = `<strong>Length:</strong> ${layer.lengthInfo || 'Unknown'}`;
                layer.bindPopup(popupContent).openPopup();
              }
          }
        }
      }
      // CASE 2: Circle from drag operation
      else if (tempCircle) {
        // Create permanent circle
        const center = tempCircle.getLatLng();
        const radius = tempCircle.getRadius();
  
        const circle = L.circle(center, {
          radius: radius,
          color: '#008080',
          weight: 2,
          opacity: 0.8,
          fillColor: '#008080',
          fillOpacity: 0.2
        });
  
        // Add to drawn items
        map.drawnItems.addLayer(circle);
  
        // Store a unique ID on the circle
        const layerType = 'circle';
        map._shapeIdCounters = map._shapeIdCounters || {};
        if (typeof map._shapeIdCounters[layerType] !== 'number') {
          console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
          map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
        }
        const nextId = map._shapeIdCounters[layerType];
        map._shapeIdCounters[layerType] = nextId + 1;
  
        // Create layerId
        const layerId = `${layerType}-${nextId}`;
        circle.layerId = layerId;
        circle.layerType = layerType;
  
        console.log(`Created ${layerType} ${nextId}, next will be ${map._shapeIdCounters[layerType]}`);
  
        // Add to drawn layers state
        setDrawnLayers(prev => ({
          ...prev,
          [layerId]: {
            layer: circle,
            type: layerType,
            visible: true,
            name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
            color: '#008080'
          }
        }));
  
        // Add to order array
        setDrawnLayersOrder(prev => {
          // Ensure prev is an array
          return [...(Array.isArray(prev) ? prev : []), layerId];
        });
  
        // Update state to match the local counter
        setNextShapeIds(prev => ({
          ...prev,
          [layerType]: map._shapeIdCounters[layerType]
        }));
        
        try {
            const area = Math.PI * radius * radius;
            
            // Format for display
            const readableRadius = radius > 1000 ? 
                                  `${(radius/1000).toFixed(2)} km` : 
                                  `${Math.round(radius)} m`;
            const readableArea = area > 1000000 ? 
                                `${(area/1000000).toFixed(2)} km²` : 
                                `${Math.round(area)} m²`;
            
            // Store the circle information with the layer
            circle.circleInfo = {
              radius: readableRadius,
              area: readableArea
            };
            
            // Get circle center and points around circumference for location query
            const center = circle.getLatLng();
            const circlePoints = [
              { lat: center.lat, lng: center.lng },
              { lat: center.lat + (radius/111320), lng: center.lng }, // North point
              { lat: center.lat, lng: center.lng + (radius/(111320*Math.cos(center.lat*Math.PI/180))) }, // East point
              { lat: center.lat - (radius/111320), lng: center.lng }, // South point
              { lat: center.lat, lng: center.lng - (radius/(111320*Math.cos(center.lat*Math.PI/180))) } // West point
            ];
            
            // Add loading popup while fetching locations
            const loadingPopupContent = `
              <div style="min-width: 200px; padding: 8px; text-align: center;">
                <p>Identifying locations in circle...</p>
              </div>
            `;
            circle.bindPopup(loadingPopupContent).openPopup();
            
            // Call the location/geocoding API with the circle points
            fetchLocationsInPolygon(circlePoints).then(locations => {
              // Store locations with the circle for later reference
              circle.locationInfo = locations;
              
              // Format location names for display
              const locationNames = locations.length > 0 
                ? locations.map(loc => loc.name).join(', ')
                : 'No named locations found';
              
              // Create popup content with the results
              const popupContent = `
                <div style="min-width: 200px; padding: 8px;">
                  <div style="margin-bottom: 8px;">
                    <strong>Radius:</strong> ${circle.circleInfo.radius}
                  </div>
                  <div style="margin-bottom: 8px;">
                    <strong>Area:</strong> ${circle.circleInfo.area}
                  </div>
                  <div style="margin-bottom: 8px;">
                    <strong>Contains:</strong> ${locationNames}
                  </div>
                  <div style="text-align: center;">
                    <button id="ask-question-btn" 
                      style="background-color: #008080; color: white; border: none; padding: 8px 12px; 
                      border-radius: 4px; cursor: pointer; font-weight: bold; width: 100%;">
                      Ask a question about this area
                    </button>
                  </div>
                  <div id="question-input-container" style="display: none; margin-top: 10px;">
                    <textarea id="question-textarea" 
                      style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px; 
                      min-height: 60px; margin-bottom: 8px;" 
                      placeholder="Type your question about this area..."></textarea>
                    <div style="display: flex; justify-content: space-between;">
                      <button id="cancel-question-btn" 
                        style="background-color: #f1f1f1; color: #333; border: none; padding: 6px 12px; 
                        border-radius: 4px; cursor: pointer;">
                        Cancel
                      </button>
                      <button id="send-question-btn" 
                        style="background-color: #008080; color: white; border: none; padding: 6px 12px; 
                        border-radius: 4px; cursor: pointer;">
                        Send
                      </button>
                    </div>
                  </div>
                </div>
              `;
              
              // Update popup with the location information
              circle.setPopupContent(popupContent);
              
              // Set up event listeners for the popup
              setTimeout(() => {
                const askButton = document.getElementById('ask-question-btn');
                const questionContainer = document.getElementById('question-input-container');
                const textarea = document.getElementById('question-textarea');
                const sendButton = document.getElementById('send-question-btn');
                const cancelButton = document.getElementById('cancel-question-btn');
                
                if (askButton) {
                  askButton.addEventListener('click', function() {
                    askButton.style.display = 'none';
                    if (questionContainer) questionContainer.style.display = 'block';
                    if (textarea) textarea.focus();
                  });
                }
                
                if (cancelButton) {
                  cancelButton.addEventListener('click', function() {
                    if (askButton) askButton.style.display = 'block';
                    if (questionContainer) questionContainer.style.display = 'none';
                  });
                }
                
                if (sendButton && textarea) {
                  sendButton.addEventListener('click', function() {
                    const question = textarea.value.trim();
                    if (question) {
                      // Build a context-rich question with location information
                      const locationContext = circle.locationInfo && circle.locationInfo.length > 0
                        ? `in circular area containing ${circle.locationInfo.map(loc => loc.name).join(', ')}`
                        : 'in this circular area';
                      
                      const enhancedQuestion = `${locationContext}: ${question}`;
                      
                      // Send the question to chat
                      if (typeof sendQuestionToChat === 'function') {
                        sendQuestionToChat(enhancedQuestion);
                        map.closePopup();
                        // Disable editing when question is sent
                        if (circle.editing && typeof circle.editing.disable === 'function') {
                          circle.editing.disable();
                        }
                      }
                    }
                  });
                  
                  // Also add enter key handler for the textarea
                  textarea.addEventListener('keydown', function(e) {
                    // Ctrl+Enter to send
                    if (e.key === 'Enter' && e.ctrlKey) {
                      e.preventDefault();
                      sendButton.click();
                    }
                  });
                }
              }, 100);
            });
            
            // Add special click handler for circle - show popup AND edit vertices
            circle.on('click', function(e) {
              // Show popup with circle measurements
              circle.openPopup();
              
              // Also enable editing for this circle
              if (circle.editing && typeof circle.editing.enable === 'function') {
                circle.editing.enable();
              }
              
              // Don't propagate click to map to prevent other handlers
              L.DomEvent.stopPropagation(e);
            });
          } catch (err) {
            console.error("Error calculating circle metrics:", err);
            // Fallback to basic metrics popup
            const popupContent = `<strong>Radius:</strong> ${circle.circleInfo?.radius || 'Unknown'}<br><strong>Area:</strong> ${circle.circleInfo?.area || 'Unknown'}`;
            circle.bindPopup(popupContent).openPopup();
          }
      }
      
      // Clear temporary objects
      map._tempDrawLayer.clearLayers();
      
      // Reset state
      points = [];
      tempLine = null;
      isDrawingLine = false;
      tempCircle = null;
      startPoint = null;
      hasStartedDrag = false;
      isDragging = false;
      firstPointMarker = null;
    };
    
    // Event handlers for mouse interactions
    const onMouseDown = (e) => {
      // If already dragging, ignore
      if (isDragging) return;
      
      // Store starting point for potential circle
      startPoint = e.latlng;
      hasStartedDrag = false;
    };
    
    const onMouseMove = (e) => {
      // Handle circle dragging
      if (startPoint) {
        // Check if mouse has moved beyond threshold
        const startPoint2D = map.latLngToContainerPoint(startPoint);
        const currentPoint2D = map.latLngToContainerPoint(e.latlng);
        const distance2D = startPoint2D.distanceTo(currentPoint2D);
        
        if (distance2D > dragThreshold) {
          // We're now in drag/circle mode
          isDragging = true;
          hasStartedDrag = true;
          
          // Calculate radius
          const radius = startPoint.distanceTo(e.latlng);
          
          // Remove any existing temp circle
          if (tempCircle) {
            map._tempDrawLayer.removeLayer(tempCircle);
          }
          
          // Create new temp circle
          tempCircle = L.circle(startPoint, {
            radius: radius,
            color: '#008080',
            weight: 2,
            opacity: 0.8,
            fillColor: '#008080',
            fillOpacity: 0.2
          }).addTo(map._tempDrawLayer);
        }
      }
      
      // Highlight first marker if cursor is close to it
      if (isDrawingLine && points.length >= 3 && firstPointMarker) {
        // Check if cursor is close to first point
        if (arePointsClose(e.latlng, points[0])) {
          // Highlight first point marker
          const iconElement = firstPointMarker.getElement();
          if (iconElement) {
            const divElement = iconElement.querySelector('div');
            if (divElement) {
              divElement.style.backgroundColor = '#ffcc00'; // Highlight color
              divElement.style.borderColor = '#ff8800';
              divElement.style.boxShadow = '0 0 4px #ff8800';
            }
          }
        } else {
          // Reset first point marker style
          const iconElement = firstPointMarker.getElement();
          if (iconElement) {
            const divElement = iconElement.querySelector('div');
            if (divElement) {
              divElement.style.backgroundColor = '#008080'; // Original color
              divElement.style.borderColor = 'white';
              divElement.style.boxShadow = '';
            }
          }
        }
      }
    };
    
    const onMouseUp = (e) => {
      // If we were dragging to create a circle
      if (hasStartedDrag && tempCircle) {
        finishDrawing();
        return;
      }
      
      // Not dragging - handle point/line creation
      if (!isDragging && startPoint) {
        // Start line drawing if not already
        if (!isDrawingLine) {
          isDrawingLine = true;
          points = [];
        }
        
        // Check if this is a click near the first point (to close polygon)
        if (points.length >= 2 && arePointsClose(e.latlng, points[0])) {
          // Use the exact first point to ensure perfect closing
          points.push(points[0]);
          finishDrawing();
          return;
        }
        
        // Add the point
        points.push(e.latlng);
        
        // Create special styling for first point
        if (points.length === 1) {
          firstPointMarker = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'vertex-marker first-point',
              iconSize: [16, 16], // Slightly bigger for the first point
              html: '<div style="background-color: #008080; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>'
            })
          }).addTo(map._tempDrawLayer);
          
          // Add tooltip to first point
          firstPointMarker.bindTooltip("Click to close shape", {
            permanent: false,
            direction: 'right',
            offset: [10, 0]
          });
        } else {
          // Add regular visual marker for the point
          L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'vertex-marker',
              iconSize: [12, 12],
              html: '<div style="background-color: #008080; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
            })
          }).addTo(map._tempDrawLayer);
        }
        
        // Update preview line
        updateTempLine();
      }
      
      // Reset drag tracking
      startPoint = null;
      isDragging = false;
    };
    
    // Add handler for keyboard shortcuts
    const handleKeydown = (e) => {
      // Handle Escape key - cancel drawing
      if (e.key === 'Escape') {
        // Clear any ongoing drawing
        map._tempDrawLayer.clearLayers();
        points = [];
        tempLine = null;
        isDrawingLine = false;
        startPoint = null;
        tempCircle = null;
        hasStartedDrag = false;
        isDragging = false;
        firstPointMarker = null;
        
        // Disable the tool
        if (polygonControl && polygonControl.disable) {
          const temp = polygonControl;
          map._drawControl = null;
          temp.disable();
        }
      }
      
      // Handle Enter key - finalize drawing
      if (e.key === 'Enter') {
        finishDrawing();
      }
    };
    
    // Add event listeners
    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    document.addEventListener('keydown', handleKeydown);
    
    // Create control object for cleanup
    const polygonControl = {
      disable: () => {
        // Remove event listeners
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        document.removeEventListener('keydown', handleKeydown);
        
        // Clear temp layer
        if (map._tempDrawLayer) {
          map._tempDrawLayer.clearLayers();
        }
        
        // Reset state
        points = [];
        tempLine = null;
        isDrawingLine = false;
        startPoint = null;
        tempCircle = null;
        hasStartedDrag = false;
        isDragging = false;
        firstPointMarker = null;
        
        // Reset cursor
        map.getContainer().style.cursor = '';
        
        // Restore original map dragging state
        if (originalDraggingState) {
          map.dragging.enable();
        }
      }
    };
    
    // Store reference
    map._drawControl = polygonControl;
    setActiveDrawTool('polygon');
    
    return polygonControl;
  });

// MODIFIED CODE FOR: createFreehandTool - focus on the areas that handle shape finalization
export const createFreehandTool = enhanceToolWithKeyboardSupport((map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder) => {    if (!map) return;
    
    if (map._drawControl) {
      map._drawControl.disable();
    }
    if (!map._shapeIdCounters) {
        map._shapeIdCounters = {};
      }
      
      ['polyline', 'circle', 'triangle', 'polygon'].forEach(type => {
        if (!map._shapeIdCounters[type]) {
          map._shapeIdCounters[type] = nextShapeIds[type] || 1;
        }
      });
    // Original code preserved...
    // Store original map dragging state and disable it while the tool is active
    const originalDraggingState = map.dragging.enabled();
    map.dragging.disable();
    
    // Set cursor style
    map.getContainer().style.cursor = 'crosshair';
    
    // Track state for multi-function tool
    let startPoint = null;
    let dragThreshold = 5; // pixels
    let hasStartedDrag = false;
    let isDragging = false;
    let tempCircle = null;
    
    // Multi-point line state
    let points = [];
    let tempLine = null;
    let isDrawingLine = false;
    let firstPointMarker = null; // Reference to first point marker for visual identification
    
    // Initialize temporary layer if needed
    if (!map._tempDrawLayer) {
      map._tempDrawLayer = L.layerGroup().addTo(map);
    }
    
    // Update the temporary polyline preview
    const updateTempLine = () => {
      // Remove existing temp line
      if (tempLine) {
        map._tempDrawLayer.removeLayer(tempLine);
      }
      
      // Create new temp line if we have at least 2 points
      if (points.length >= 2) {
        tempLine = L.polyline(points, {
          color: '#008080', // Teal color
          weight: 3,
          opacity: 0.8,
          dashArray: '5, 5'
        }).addTo(map._tempDrawLayer);
      }
    };
    
    // Check if two points are close enough to be considered the same
    const arePointsClose = (p1, p2, maxDistance = 15) => {
      const p1Converted = map.latLngToContainerPoint(p1);
      const p2Converted = map.latLngToContainerPoint(p2);
      return p1Converted.distanceTo(p2Converted) <= maxDistance;
    };
    
    // Finalize the current drawing - THIS IS THE MAIN PART TO MODIFY
    const finishDrawing = () => {
      // Don't do anything if no drawing in progress
      if (points.length === 0 && !tempCircle) return;
      
      // CASE 1: Multiple point line
      if (isDrawingLine && points.length > 0) {
        // Different handling based on point count
        if (points.length === 1) {
          // Single point - create a marker
const marker = L.marker(points[0], {
    icon: L.divIcon({
      className: 'custom-vertex-marker',
      iconSize: [12, 12], // Bigger points
      html: '<div style="background-color: #008080; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
    }),
    bubblingMouseEvents: false
  });
  
  // Add to drawn items
  map.drawnItems.addLayer(marker);
  
  // Store point information
  marker.pointInfo = {
    lat: points[0].lat.toFixed(6),
    lng: points[0].lng.toFixed(6)
  };
  
  // Use marker type
  const layerType = 'marker';
  map._shapeIdCounters = map._shapeIdCounters || {};
  if (typeof map._shapeIdCounters[layerType] !== 'number') {
    console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
    map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
  }
  const nextId = map._shapeIdCounters[layerType];
  map._shapeIdCounters[layerType] = nextId + 1;
  
  // Create layerId
  const layerId = `${layerType}-${nextId}`;
  marker.layerId = layerId;
  marker.layerType = layerType;
  
  // Update state
  setNextShapeIds(prev => ({
    ...prev,
    [layerType]: map._shapeIdCounters[layerType]
  }));
  
  // Add to drawn layers
  setDrawnLayers(prev => ({
    ...prev,
    [layerId]: {
      layer: marker,
      type: layerType,
      visible: true,
      name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
      color: '#008080'
    }
  }));
  
  // Add to the order array
  setDrawnLayersOrder(prev => {
    return [...(Array.isArray(prev) ? prev : []), layerId];
  });
         
          // Add click handler for info and automatically show popup
          const popupContent = `<strong>Point Location:</strong><br>Lat: ${marker.pointInfo.lat}<br>Lng: ${marker.pointInfo.lng}`;
          marker.bindPopup(popupContent).openPopup();
          
        } 
        else if (points.length >= 2) {
          // Multiple points - determine if we should create a polyline or polygon
          const shouldCreatePolygon = points.length >= 3 && 
                                     arePointsClose(points[0], points[points.length - 1]);
          
          let layer;
          if (shouldCreatePolygon) {
            // Create a polygon if we've closed the shape
            if (arePointsClose(points[0], points[points.length - 1])) {
              // Use first point exactly to ensure perfect closing
              points[points.length - 1] = points[0];
            }
            
            layer = L.polygon(points, {
              color: '#008080', // Teal color
              weight: 3,
              opacity: 0.8,
              fillColor: '#008080',
              fillOpacity: 0.2
            });
            
            // Add to drawn items
            map.drawnItems.addLayer(layer);
            if (shouldCreatePolygon && points.length === 4) {
                layer.layerType = 'triangle';
              }
              
              const layerType = layer.layerType || (shouldCreatePolygon ? 
                (points.length === 4 ? 'triangle' : 'polygon') : 
                'polyline');

                map._shapeIdCounters = map._shapeIdCounters || {};
                if (typeof map._shapeIdCounters[layerType] !== 'number') {
                  console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
                  map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
                }
                const nextId = map._shapeIdCounters[layerType];
                map._shapeIdCounters[layerType] = nextId + 1;
                const layerId = `${layerType}-${nextId}`;
                console.log(`Created ${layerType} ${nextId}, next will be ${map._shapeIdCounters[layerType]}`);

// Store the ID on the layer
layer.layerId = layerId;

// Update state to match the local counter
setNextShapeIds(prev => ({
...prev,
[layerType]: map._shapeIdCounters[layerType]
}));

// Update drawn layers state
setDrawnLayers(prev => ({
...prev,
[layerId]: {
  layer: layer,
  type: layerType,
  visible: true,
  name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
  color: '#008080'
}
}));

// Add to the order array
setDrawnLayersOrder(prev => {
  // Ensure prev is an array
  return [...(Array.isArray(prev) ? prev : []), layerId];
});
            // Calculate and display area
            try {
              const latlngs = layer.getLatLngs()[0];
              let area = 0;
              
              // Calculate area (using Leaflet's utility if available)
              if (L.GeometryUtil && L.GeometryUtil.geodesicArea) {
                area = L.GeometryUtil.geodesicArea(latlngs);
              } else {
                // Fallback calculation (should be defined elsewhere in your code)
                area = calculateRoughArea(latlngs);
              }
              
              // Format area for display
              const readableArea = area > 1000000 ? 
                                 `${(area/1000000).toFixed(2)} km²` : 
                                 `${Math.round(area)} m²`;
              
              // Store the area information with the layer
              layer.areaInfo = readableArea;
              
              // Automatically show popup with area
              const popupContent = `<strong>Area:</strong> ${layer.areaInfo}`;
              layer.bindPopup(popupContent).openPopup();
              
              // Add special click handler for polygon - show popup AND edit vertices
              layer.on('click', function(e) {
                // Show popup with area information
                layer.openPopup();
                
                // Also enable editing for this layer, but don't disable map dragging
                if (layer.editing && typeof layer.editing.enable === 'function') {
                  layer.editing.enable();
                }
                
                // Don't propagate click to map to prevent other handlers
                L.DomEvent.stopPropagation(e);
              });
            } catch (err) {
              console.error("Error calculating area:", err);
            }
            
          } else {
            // Create a polyline (open shape)
            // Create a polyline (open shape)
layer = L.polyline(points, {
    color: '#008080', // Teal color
    weight: 3,
    opacity: 0.8
  });
  
  // Add to drawn items
  map.drawnItems.addLayer(layer);
  
  // Set layer type
  const layerType = 'polyline';
  
  // Increment counter
  map._shapeIdCounters = map._shapeIdCounters || {};
  if (typeof map._shapeIdCounters[layerType] !== 'number') {
    console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
    map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
  }
  const nextId = map._shapeIdCounters[layerType];
  map._shapeIdCounters[layerType] = nextId + 1;
  
  // Create layer ID
  const layerId = `${layerType}-${nextId}`;
  
  // Store ID on layer
  layer.layerId = layerId;
  layer.layerType = layerType;
  
  // Update state
  setNextShapeIds(prev => ({
    ...prev,
    [layerType]: map._shapeIdCounters[layerType]
  }));
  
  // Add to drawn layers
  setDrawnLayers(prev => ({
    ...prev,
    [layerId]: {
      layer: layer,
      type: layerType,
      visible: true,
      name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
      color: '#008080'
    }
  }));
  
  // Add to the order array
  setDrawnLayersOrder(prev => {
    // Ensure prev is an array
    return [...(Array.isArray(prev) ? prev : []), layerId];
  });
            try {
              const latlngs = layer.getLatLngs();
              let totalDistance = 0;
              
              for (let i = 0; i < latlngs.length - 1; i++) {
                totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
              }
              
              const formattedDistance = totalDistance > 1000 ?
                                      `${(totalDistance/1000).toFixed(2)} km` :
                                      `${totalDistance.toFixed(2)} meters`;
              
              // Store length info
              layer.lengthInfo = formattedDistance;
              
              // Automatically show popup with length
              const popupContent = `<strong>Length:</strong> ${layer.lengthInfo}`;
              layer.bindPopup(popupContent).openPopup();
              
              // Add special click handler for polyline - show popup AND edit vertices
              layer.on('click', function(e) {
                // Show popup with length information
                layer.openPopup();
                
                // Also enable editing for this layer
                if (layer.editing && typeof layer.editing.enable === 'function') {
                  layer.editing.enable();
                }
                
                // Don't propagate click to map to prevent other handlers
                L.DomEvent.stopPropagation(e);
              });
            } catch (err) {
              console.error("Error calculating line length:", err);
            }
            
          }
        }
      }
      // CASE 2: Circle from drag operation
      else if (tempCircle) {
        // Create permanent circle
        // Create permanent circle
const center = tempCircle.getLatLng();
const radius = tempCircle.getRadius();

const circle = L.circle(center, {
  radius: radius,
  color: '#008080',
  weight: 2,
  opacity: 0.8,
  fillColor: '#008080',
  fillOpacity: 0.2
});

// Add to drawn items
map.drawnItems.addLayer(circle);

// Store a unique ID on the circle
const layerType = 'circle';
map._shapeIdCounters = map._shapeIdCounters || {};
if (typeof map._shapeIdCounters[layerType] !== 'number') {
  console.log(`Initializing counter for ${layerType} to ${nextShapeIds[layerType] || 1}`);
  map._shapeIdCounters[layerType] = nextShapeIds[layerType] || 1;
}
const nextId = map._shapeIdCounters[layerType];
map._shapeIdCounters[layerType] = nextId + 1;

// Create layerId
const layerId = `${layerType}-${nextId}`;
circle.layerId = layerId;
circle.layerType = layerType;

console.log(`Created ${layerType} ${nextId}, next will be ${map._shapeIdCounters[layerType]}`);

// Add to drawn layers state
setDrawnLayers(prev => ({
  ...prev,
  [layerId]: {
    layer: circle,
    type: layerType,
    visible: true,
    name: `${layerType.charAt(0).toUpperCase() + layerType.slice(1)} ${nextId}`,
    color: '#008080'
  }
}));

// Add to order array
setDrawnLayersOrder(prev => {
  // Ensure prev is an array
  return [...(Array.isArray(prev) ? prev : []), layerId];
});

// Update state to match the local counter
setNextShapeIds(prev => ({
  ...prev,
  [layerType]: map._shapeIdCounters[layerType]
}));
        try {
          const area = Math.PI * radius * radius;
          
          // Format for display
          const readableRadius = radius > 1000 ? 
                                `${(radius/1000).toFixed(2)} km` : 
                                `${Math.round(radius)} m`;
          const readableArea = area > 1000000 ? 
                              `${(area/1000000).toFixed(2)} km²` : 
                              `${Math.round(area)} m²`;
          
          // Store the circle information with the layer
          circle.circleInfo = {
            radius: readableRadius,
            area: readableArea
          };
          
          // Automatically show popup with radius and area
          const popupContent = `<strong>Radius:</strong> ${circle.circleInfo.radius}<br><strong>Area:</strong> ${circle.circleInfo.area}`;
          circle.bindPopup(popupContent).openPopup();
          
          // Add special click handler for circle - show popup AND edit vertices
          circle.on('click', function(e) {
            // Show popup with circle measurements
            circle.openPopup();
            
            // Also enable editing for this circle
            if (circle.editing && typeof circle.editing.enable === 'function') {
              circle.editing.enable();
            }
            
            // Don't propagate click to map to prevent other handlers
            L.DomEvent.stopPropagation(e);
          });
        } catch (err) {
          console.error("Error calculating circle metrics:", err);
        }
        
      }
      
      // Clear temporary objects
      map._tempDrawLayer.clearLayers();
      
      // Reset state
      points = [];
      tempLine = null;
      isDrawingLine = false;
      tempCircle = null;
      startPoint = null;
      hasStartedDrag = false;
      isDragging = false;
      firstPointMarker = null;
    };
    
    // Rest of the createFreehandTool function remains unchanged...
    // Event handlers for mouse interactions
    const onMouseDown = (e) => {
      // If already dragging, ignore
      if (isDragging) return;
      
      // Store starting point for potential circle
      startPoint = e.latlng;
      hasStartedDrag = false;
    };
    
    const onMouseMove = (e) => {
      // Handle circle dragging
      if (startPoint) {
        // Check if mouse has moved beyond threshold
        const startPoint2D = map.latLngToContainerPoint(startPoint);
        const currentPoint2D = map.latLngToContainerPoint(e.latlng);
        const distance2D = startPoint2D.distanceTo(currentPoint2D);
        
        if (distance2D > dragThreshold) {
          // We're now in drag/circle mode
          isDragging = true;
          hasStartedDrag = true;
          
          // Calculate radius
          const radius = startPoint.distanceTo(e.latlng);
          
          // Remove any existing temp circle
          if (tempCircle) {
            map._tempDrawLayer.removeLayer(tempCircle);
          }
          
          // Create new temp circle
          tempCircle = L.circle(startPoint, {
            radius: radius,
            color: '#008080',
            weight: 2,
            opacity: 0.8,
            fillColor: '#008080',
            fillOpacity: 0.2
          }).addTo(map._tempDrawLayer);
        }
      }
      
      // Highlight first marker if cursor is close to it
      if (isDrawingLine && points.length >= 3 && firstPointMarker) {
        // Check if cursor is close to first point
        if (arePointsClose(e.latlng, points[0])) {
          // Highlight first point marker
          const iconElement = firstPointMarker.getElement();
          if (iconElement) {
            const divElement = iconElement.querySelector('div');
            if (divElement) {
              divElement.style.backgroundColor = '#ffcc00'; // Highlight color
              divElement.style.borderColor = '#ff8800';
              divElement.style.boxShadow = '0 0 4px #ff8800';
            }
          }
        } else {
          // Reset first point marker style
          const iconElement = firstPointMarker.getElement();
          if (iconElement) {
            const divElement = iconElement.querySelector('div');
            if (divElement) {
              divElement.style.backgroundColor = '#008080'; // Original color
              divElement.style.borderColor = 'white';
              divElement.style.boxShadow = '';
            }
          }
        }
      }
    };
    
    const onMouseUp = (e) => {
      // If we were dragging to create a circle
      if (hasStartedDrag && tempCircle) {
        finishDrawing();
        return;
      }
      
      // Not dragging - handle point/line creation
      if (!isDragging && startPoint) {
        // Start line drawing if not already
        if (!isDrawingLine) {
          isDrawingLine = true;
          points = [];
        }
        
        // Check if this is a click near the first point (to close polygon)
        if (points.length >= 2 && arePointsClose(e.latlng, points[0])) {
          // Use the exact first point to ensure perfect closing
          points.push(points[0]);
          finishDrawing();
          return;
        }
        
        // Add the point
        points.push(e.latlng);
        
        // Create special styling for first point
        if (points.length === 1) {
          firstPointMarker = L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'vertex-marker first-point',
              iconSize: [16, 16], // Slightly bigger for the first point
              html: '<div style="background-color: #008080; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white;"></div>'
            })
          }).addTo(map._tempDrawLayer);
          
          // Add tooltip to first point
          firstPointMarker.bindTooltip("Click to close shape", {
            permanent: false,
            direction: 'right',
            offset: [10, 0]
          });
        } else {
          // Add regular visual marker for the point
          L.marker(e.latlng, {
            icon: L.divIcon({
              className: 'vertex-marker',
              iconSize: [12, 12],
              html: '<div style="background-color: #008080; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>'
            })
          }).addTo(map._tempDrawLayer);
        }
        
        // Update preview line
        updateTempLine();
      }
      
      // Reset drag tracking
      startPoint = null;
      isDragging = false;
    };
    
    // Add handler for keyboard shortcuts
    const handleKeydown = (e) => {
// Handle Escape key - cancel drawing
if (e.key === 'Escape') {
    // Clear any ongoing drawing
    map._tempDrawLayer.clearLayers();
    points = [];
    tempLine = null;
    isDrawingLine = false;
    startPoint = null;
    tempCircle = null;
    hasStartedDrag = false;
    isDragging = false;
    firstPointMarker = null;
    
    // Disable the tool
    if (freehandControl && freehandControl.disable) {
      const temp = freehandControl;
      map._drawControl = null;
      temp.disable();
      console.log("Freehand tool disabled. Current layers:", map.drawnItems ? map.drawnItems.getLayers().length : 'No drawn items');
      // Do NOT call setDrawnLayersOrder(null) here
    }
  }
      
      // Handle Enter key - finalize drawing
      if (e.key === 'Enter') {
        finishDrawing();
      }
    };
    
    // Add event listeners
    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    document.addEventListener('keydown', handleKeydown);
    
    // Create control object for cleanup
    const freehandControl = {
        disable: () => {
            console.log("Starting disable function. Current drawnLayersOrder:", map._drawnLayersOrder);
            
            // Remove event listeners
            map.off('mousedown', onMouseDown);
            map.off('mousemove', onMouseMove);
            map.off('mouseup', onMouseUp);
            document.removeEventListener('keydown', handleKeydown);
            
            // Clear temp layer
            if (map._tempDrawLayer) {
              map._tempDrawLayer.clearLayers();
            }
            
            // Reset state
            points = [];
            tempLine = null;
            isDrawingLine = false;
            startPoint = null;
            tempCircle = null;
            hasStartedDrag = false;
            isDragging = false;
            firstPointMarker = null;
            
            // Reset cursor
            map.getContainer().style.cursor = '';
            
            // Restore original map dragging state
            if (originalDraggingState) {
              map.dragging.enable();
            }
            
            console.log("Disable function completed. Current drawnLayersOrder:", map._drawnLayersOrder);
          }
    };
    
    // Store reference
    map._drawControl = freehandControl;
    setActiveDrawTool('freehand');
    
    return freehandControl;
  });

export const createEditTool = enhanceToolWithKeyboardSupport((map, editControlRef, setIsEditing) => {
  if (!map || !map.drawnItems) return;
  
  if (map._drawControl) {
    map._drawControl.disable();
  }
 
  // Create standard edit control
  const editControl = new L.EditToolbar.Edit(map, {
    featureGroup: map.drawnItems,
    selectedPathOptions: {
      maintainColor: true,
      opacity: 0.8,
      fillOpacity: 0.3,
      dashArray: null,
      weight: 3
    }
  });

  editControl.enable();
  map._drawControl = editControl;
  editControlRef.current = editControl;
  setIsEditing(true);

  // Add handlers for edit events
  map.once('draw:editstop', () => {
    map._drawControl = null;
    setIsEditing(false);
  });
  
  return editControl;
});

export const createSelectTool = enhanceToolWithKeyboardSupport((map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder) => {    if (!map) return;
    
    if (map._drawControl) {
      map._drawControl.disable();
    }
  
    // Initialize selection area
    let startPoint = null;
    let selectionRect = null;
    let selectedLayers = [];
    
    // Create custom handler
    const selectHandler = () => {
      // Reset previous selections if any
      selectedLayers.forEach(layer => {
        if (layer._icon) {
          layer._icon.style.backgroundColor = '';
          layer._icon.style.border = '';
          layer._icon.style.boxShadow = '';
        } else if (layer.setStyle && layer._originalStyle) {
          layer.setStyle(layer._originalStyle);
          delete layer._originalStyle;
        }
      });
      selectedLayers = [];
      
      // Enable selection mode
      map._selecting = true;
      map.dragging.disable();
      
      // Set cursor style
      map.getContainer().style.cursor = 'crosshair';
  
      // Add keyboard handler for deletion
      const deleteHandler = (e) => {
        // Check for Delete or Backspace keys
        if (e.key === 'Delete' || e.key === 'Backspace') {
          e.preventDefault();
          
          // Only delete layers that are part of drawnItems
          const deletableLayers = selectedLayers.filter(layer => 
            map.drawnItems && map.drawnItems.hasLayer(layer)
          );
          
          // Count how many items are deletable vs selected
          const totalSelected = selectedLayers.length;
          const deletableCount = deletableLayers.length;
          
          // Delete only drawn items
          if (deletableLayers.length > 0) {
            deletableLayers.forEach(layer => {
              if (map.hasLayer(layer)) {
                map.removeLayer(layer);
              }
              if (map.drawnItems && map.drawnItems.hasLayer(layer)) {
                map.drawnItems.removeLayer(layer);
              }
            });
            
            // Show feedback
            const message = L.DomUtil.create('div', 'leaflet-draw-delete-message');
            let messageText = '';
            
            if (deletableCount === totalSelected) {
              messageText = `Deleted ${deletableCount} item${deletableCount > 1 ? 's' : ''}`;
            } else {
              messageText = `Deleted ${deletableCount} item${deletableCount > 1 ? 's' : ''} (${totalSelected - deletableCount} protected)`;
            }
            
            message.innerHTML = `<span>${messageText}</span>`;
            message.style.position = 'absolute';
            message.style.top = '10px';
            message.style.left = '50%';
            message.style.transform = 'translateX(-50%)';
            message.style.backgroundColor = 'rgba(0,0,0,0.7)';
            message.style.color = 'white';
            message.style.padding = '8px 12px';
            message.style.borderRadius = '4px';
            message.style.zIndex = '1000';
            map.getContainer().appendChild(message);
            
            // Remove message after 2 seconds
            setTimeout(() => {
              if (message.parentNode) {
                message.parentNode.removeChild(message);
              }
            }, 2000);
            
            // Clear deleted items from selection
            selectedLayers = selectedLayers.filter(layer => 
              !deletableLayers.includes(layer)
            );
          } else if (totalSelected > 0) {
            // If nothing can be deleted but items are selected
            const message = L.DomUtil.create('div', 'leaflet-draw-delete-message');
            message.innerHTML = '<span>Can only delete drawn items</span>';
            message.style.position = 'absolute';
            message.style.top = '10px';
            message.style.left = '50%';
            message.style.transform = 'translateX(-50%)';
            message.style.backgroundColor = 'rgba(0,0,0,0.7)';
            message.style.color = 'white';
            message.style.padding = '8px 12px';
            message.style.borderRadius = '4px';
            message.style.zIndex = '1000';
            map.getContainer().appendChild(message);
            
            // Remove message after 2 seconds
            setTimeout(() => {
              if (message.parentNode) {
                message.parentNode.removeChild(message);
              }
            }, 2000);
          }
        }
      };
      
      // Add delete key handler
      document.addEventListener('keydown', deleteHandler);
      
      // Event handlers
      const onMouseDown = (e) => {
        startPoint = e.layerPoint;
        
        // Create rectangle
        selectionRect = L.rectangle(
          [map.layerPointToLatLng(startPoint), map.layerPointToLatLng(startPoint)],
          { 
            color: '#008080', 
            weight: 1, 
            opacity: 0.8,
            fillColor: '#008080',
            fillOpacity: 0.2,
            dashArray: '4'
          }
        ).addTo(map);
      };
      
      const onMouseMove = (e) => {
        if (!startPoint || !selectionRect) return;
        
        // Update rectangle dimensions
        const bounds = L.latLngBounds(
          map.layerPointToLatLng(startPoint),
          map.layerPointToLatLng(e.layerPoint)
        );
        
        selectionRect.setBounds(bounds);
      };
      
      const onMouseUp = (e) => {
        if (!startPoint || !selectionRect) return;
        
        // Get selection bounds
        const bounds = selectionRect.getBounds();
        
        // Find all markers/elements within the bounds
        map.eachLayer(layer => {
          // For point layers like markers
          if (layer.getLatLng && bounds.contains(layer.getLatLng())) {
            selectedLayers.push(layer);
            if (layer._icon) {
                layer._icon.style.backgroundColor = 'white'; 
                layer._icon.style.border = '3px solid #008080';
                layer._icon.style.borderRadius = '50%';
                layer._icon.style.boxShadow = '0 0 6px #008080';
              }
              
          }
          // For polygon/polyline layers
          else if (layer.getLatLngs && layer.getBounds) {
            // Check if any part of the layer is in the selection bounds
            const layerBounds = layer.getBounds();
            if (bounds.intersects(layerBounds)) {
              selectedLayers.push(layer);
              
              // Highlight the selected layer
              if (layer.setStyle) {
                // Store original style for later restoration
                layer._originalStyle = {
                  color: layer.options.color,
                  weight: layer.options.weight,
                  opacity: layer.options.opacity,
                  fillOpacity: layer.options.fillOpacity,
                  fillColor: layer.options.fillColor || '#3388ff'
                };
                
                // Apply highlight style - bright yellow with higher opacity
                layer.setStyle({
                  color: '#FFFF00',
                  weight: 4,
                  opacity: 1,
                  fillColor: '#FFFF00',
                  fillOpacity: 0.5,
                  dashArray: null
                });
              }
            }
          }
        });
        
        // Remove selection rectangle
        map.removeLayer(selectionRect);
        selectionRect = null;
        startPoint = null;
        
        // NEW: Show table and highlight corresponding rows
        if (selectedLayers.length > 0) {
          // Collect all feature IDs from selected layers
          const selectedFeatureIds = selectedLayers
            .filter(layer => layer.featureId || (layer._popup && layer._popup._content && layer._popup._content.includes('Feature ID:')))
            .map(layer => {
              // If we already have a featureId property, use it
              if (layer.featureId) return layer.featureId;
              
              // Otherwise try to extract it from popup content
              if (layer._popup && layer._popup._content) {
                const match = layer._popup._content.match(/Feature ID:\s*([^<\s]+)/);
                return match ? match[1] : null;
              }
              
              return null;
            })
            .filter(id => id !== null);
            
          if (window.selectRowsByFeatureIds && selectedFeatureIds.length > 0) {
            window.selectRowsByFeatureIds(selectedFeatureIds);
          }
          
          // Create popup with info about selection
          const centerPoint = bounds.getCenter();
          const selectInfo = selectedFeatureIds.length > 0 
            ? `Selected ${selectedFeatureIds.length} item${selectedFeatureIds.length > 1 ? 's' : ''} (highlighted in table)`
            : `Selected ${selectedLayers.length} item${selectedLayers.length > 1 ? 's' : ''}`;
            
          L.popup()
            .setLatLng(centerPoint)
            .setContent(`<strong>${selectInfo}</strong><br>Press Delete or Backspace to remove`)
            .openOn(map);
        }
      };
      
      // Bind events
      map.on('mousedown', onMouseDown);
      map.on('mousemove', onMouseMove);
      map.on('mouseup', onMouseUp);
      
      // Cleanup function
      return () => {
        map._selecting = false;
        map.dragging.enable();
        map.getContainer().style.cursor = '';
        map.off('mousedown', onMouseDown);
        map.off('mousemove', onMouseMove);
        map.off('mouseup', onMouseUp);
        document.removeEventListener('keydown', deleteHandler);
        
        if (selectionRect) {
          map.removeLayer(selectionRect);
          selectionRect = null;
        }
        
        // Reset styles of selected layers
        selectedLayers.forEach(layer => {
          if (layer._icon) {
            layer._icon.style.backgroundColor = '';
            layer._icon.style.border = '';
            layer._icon.style.boxShadow = '';
          }
          
          // Restore original style if it was changed
          if (layer.setStyle && layer._originalStyle) {
            layer.setStyle(layer._originalStyle);
            delete layer._originalStyle;
          }
        });
        
        selectedLayers = [];
      };
    };
    
    // Start the select tool
    const cleanup = selectHandler();
    map._drawControl = { 
      disable: () => {
        if (cleanup) cleanup();
      }
    };
    
    setActiveDrawTool('select');
    
    return map._drawControl;
  });

  

// Don't forget to keep the utility function
const calculateRoughArea = (latlngs) => {
  let area = 0;
  for (let i = 0, len = latlngs.length, j = len - 1; i < len; j = i++) {
    const p1 = latlngs[i];
    const p2 = latlngs[j];
    area += (p2.lng + p1.lng) * (p2.lat - p1.lat);
  }
  // This is a rough approximation, multiplier would depend on latitude
  return Math.abs(area * 111319.9 * 111319.9 / 2);
};

export const createTextTool = (map, setActiveDrawTool, nextShapeIds, setNextShapeIds, setDrawnLayers, setDrawnLayersOrder) => {
    if (!map) {
      console.error("No map provided to createTextTool");
      return null;
    }
  
    // Disable any existing drawing control
    if (map._drawControl) {
      map._drawControl.disable();
    }
  
    // Set cursor to text input style
    map.getContainer().style.cursor = 'text';
    
    // Store original map dragging state and disable it
    const originalDraggingState = map.dragging.enabled();
    map.dragging.disable();
    
    // Create a special pane for text elements if it doesn't exist
    if (!map.getPane('textPane')) {
      map.createPane('textPane');
      map.getPane('textPane').style.zIndex = 650;
      map.getPane('textPane').style.pointerEvents = 'auto';
    }
    
    // Initialize or ensure the active text markers tracking object exists
    if (!map._activeTextMarkers) {
      map._activeTextMarkers = new Set();
    }
    
    // Create a state to store the currently selected text marker for editing
    if (!map._selectedTextMarker) {
      map._selectedTextMarker = null;
    }
    
    // Create or reference the callback for showing the text toolbar
    if (!map._showTextToolbar) {
      map._showTextToolbar = null;
    }
    
    // Remove any existing click handlers
    if (map._textClickHandler) {
      map.off('click', map._textClickHandler);
    }
  
    // Add escape key handler to exit text tool
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // Disable the text tool
        disableTextTool();
      }
    };
    
    // Add escape key listener
    document.addEventListener('keydown', handleEscapeKey);
    
    // Create the text click handler
    const handleTextClick = function(e) {
      // Only proceed if we're still in text tool mode
      if (map._drawControl !== textControl) {
        return;
      }
      
      // Stop event propagation to prevent other handlers from interfering
      L.DomEvent.stop(e);
      
      // Get coordinates from the click event
      const latlng = e.latlng;
      
      // Create a custom text marker
      createTextMarker(latlng);
      
      return false; // Prevent default behavior
    };
    
    // Function to create a custom text marker
    const createTextMarker = (latlng) => {
        
      // Generate a unique ID for the text
      const textId = `text-${Date.now()}`;
      
      // Create a custom icon element with box and handles
      const textElement = document.createElement('div');
      textElement.id = textId;
      textElement.className = 'leaflet-text-element';
      textElement.style.cssText = `
        position: relative;
        min-width: 80px;
        min-height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        transform-origin: center center;
      `;
      
      // Create the bounding box
      const boundingBox = document.createElement('div');
      boundingBox.className = 'leaflet-text-bounding-box';
      boundingBox.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border: 2px solid #008080;
        pointer-events: none;
      `;
      
      // Create text content container
      const textContent = document.createElement('div');
      textContent.className = 'leaflet-text-content';
      textContent.style.cssText = `
        color: black;
        font-size: 18px;
        text-align: center;
        cursor: text;
        width: 100%;
        padding: 4px;
        z-index: 1;
      `;
      
      // Add content and box to element
      textElement.appendChild(textContent);
      textElement.appendChild(boundingBox);
      
      // Create corner handles 
      const handlePositions = ['tl', 'tr', 'bl', 'br'];
      const resizeHandles = {};
      
      handlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `leaflet-text-handle ${pos}`;
        handle.style.cssText = `
          position: absolute;
          width: 8px;
          height: 8px;
          background-color: white;
          border: 2px solid #008080;
          border-radius: 50%;
          z-index: 10;
        `;
        
        // Position handles
        switch(pos) {
          case 'tl':
            handle.style.top = '-5px';
            handle.style.left = '-5px';
            handle.style.cursor = 'nwse-resize';
            break;
          case 'tr':
            handle.style.top = '-5px';
            handle.style.right = '-5px';
            handle.style.cursor = 'nesw-resize';
            break;
          case 'bl':
            handle.style.bottom = '-5px';
            handle.style.left = '-5px';
            handle.style.cursor = 'nesw-resize';
            break;
          case 'br':
            handle.style.bottom = '-5px';
            handle.style.right = '-5px';
            handle.style.cursor = 'nwse-resize';
            break;
        }
        
        textElement.appendChild(handle);
        resizeHandles[pos] = handle;
      });
      
      // Create middle handles (only left and right)
      const middleHandlePositions = ['ml', 'mr'];
      const middleHandles = {};
      
      middleHandlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = `leaflet-text-handle ${pos}`;
        handle.style.cssText = `
          position: absolute;
          width: 6px;
          height: 12px;
          background-color: white;
          border: 2px solid #008080;
          z-index: 10;
        `;
        
        // Position handles
        switch(pos) {
          case 'ml': // middle left
            handle.style.left = '-4px';
            handle.style.top = '50%';
            handle.style.transform = 'translateY(-50%)';
            handle.style.cursor = 'ew-resize';
            break;
          case 'mr': // middle right
            handle.style.right = '-4px';
            handle.style.top = '50%';
            handle.style.transform = 'translateY(-50%)';
            handle.style.cursor = 'ew-resize';
            break;
        }
        
        textElement.appendChild(handle);
        middleHandles[pos] = handle;
      });
      
      // Create rotation icon (without circle around it)
      const rotateIcon = document.createElement('div');
      rotateIcon.className = 'leaflet-text-rotate-icon';
      rotateIcon.style.cssText = `
        position: absolute;
        bottom: -30px;
        left: 50%;
        transform: translateX(-50%);
        cursor: pointer;
        z-index: 10;
      `;
      
      rotateIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008080" stroke-width="2">
        <path d="M21 2v6h-6M3 12a9 9 0 0 1 15-6.7L21 8"></path>
        <path d="M3 22v-6h6M21 12a9 9 0 0 1-15 6.7L3 16"></path>
      </svg>
    `;
      
      textElement.appendChild(rotateIcon);
      
      // Create the invisible marker (container)
      const icon = L.divIcon({
        html: textElement,
        className: '',
        iconSize: [100, 40], 
        iconAnchor: [50, 20]
      });
      
      // Create marker with the icon
      const marker = L.marker(latlng, {
        icon: icon,
        draggable: true,
        interactive: true,
        bubblingMouseEvents: false
      }).addTo(map);
      
      // Add to drawn items if available
      if (map.drawnItems) {
        map.drawnItems.addLayer(marker);
      }
  
      // Store a unique ID on the text marker
      const layerType = 'text';
      if (!map._textIdCounter) {
        map._textIdCounter = nextShapeIds[layerType] || 1;
      }
      const nextId = map._textIdCounter++;
      const layerId = `${layerType}-${nextId}`;
      
      setNextShapeIds(prev => ({
        ...prev,
        [layerType]: map._textIdCounter
      }));
      marker.layerId = layerId;
      marker.layerType = layerType; // Explicitly mark as text type
      
      // Update next IDs
      setNextShapeIds(prev => ({
        ...prev,
        [layerType]: nextId + 1
      }));
      
      // Update drawn layers state with the new text layer
      setDrawnLayers(prev => {
        const updated = { ...prev };
        updated[layerId] = {
          layer: marker,
          type: layerType,
          visible: true,
          name: `Text ${nextId}`, // Use the numerical ID in the name
          color: '#008080'
        };
        return updated;
      });
      
      // Add to the drawn layers order
      setDrawnLayersOrder(prev => {
        // Ensure prev is an array
        const prevArray = Array.isArray(prev) ? prev : [];
        return [...prevArray, layerId];
      });
      
      // Store references and state
      marker._textElement = textElement;
      marker._textContent = textContent;
      marker._boundingBox = boundingBox;
      marker._resizeHandles = resizeHandles;
      marker._middleHandles = middleHandles;
      marker._rotateIcon = rotateIcon;
      marker._state = {
        angle: 0,
        scale: 1,
        fontSize: 18,
        fontFamily: 'Arial, sans-serif',
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        textAlign: 'center',
        color: '#000000',
        width: 100,
        height: 40,
        editing: false,
        dragging: false,
        resizing: false,
        rotating: false,
        selected: true // Start as selected
      };
      
      // Setup event handlers
      setupMarkerEvents(marker);
      
      // Start editing immediately
      startTextEditing(marker);
      
      return marker;
    };
    
    // Function to show/hide selection UI
    const toggleTextSelection = (marker, selected) => {
      if (!marker) return;
      
      marker._state.selected = selected;
      
      // Show/hide bounding box
      if (marker._boundingBox) {
        marker._boundingBox.style.display = selected ? 'block' : 'none';
      }
      
      // Show/hide resize handles
      Object.values(marker._resizeHandles || {}).forEach(handle => {
        handle.style.display = selected ? 'block' : 'none';
      });
      
      // Show/hide middle handles
      Object.values(marker._middleHandles || {}).forEach(handle => {
        handle.style.display = selected ? 'block' : 'none';
      });
      
      // Show/hide rotation icon
      if (marker._rotateIcon) {
        marker._rotateIcon.style.display = selected ? 'block' : 'none';
      }
      
      // Update the selected marker reference
      map._selectedTextMarker = selected ? marker : null;
      
      // Trigger text toolbar display if a marker is selected
      if (selected && typeof map._showTextToolbar === 'function') {
        // Calculate position from marker for the toolbar
        const containerPoint = map.latLngToContainerPoint(marker.getLatLng());
        
        // Show the toolbar
        map._showTextToolbar({
          marker: marker,
          format: marker._state,
          position: {
            top: containerPoint.y - 100, // Position above the text
            left: containerPoint.x
          }
        });
      } else if (!selected && typeof map._hideTextToolbar === 'function') {
        map._hideTextToolbar();
      }
    };
    
    // Function to apply text formatting
    const applyTextFormat = (marker, format) => {
      if (!marker || !marker._textContent) return;
      
      // Update marker state with new format properties
      marker._state = { ...marker._state, ...format };
      
      // Apply formatting to the text content
      const textContent = marker._textContent;
      
      // Apply font properties
      if (format.fontFamily) {
        textContent.style.fontFamily = format.fontFamily;
      }
      
      if (format.fontSize) {
        textContent.style.fontSize = `${format.fontSize}px`;
      }
      
      if (format.fontWeight) {
        textContent.style.fontWeight = format.fontWeight;
      }
      
      if (format.fontStyle) {
        textContent.style.fontStyle = format.fontStyle;
      }
      
      if (format.textDecoration) {
        textContent.style.textDecoration = format.textDecoration;
      }
      
      if (format.textAlign) {
        textContent.style.textAlign = format.textAlign;
      }
      
      if (format.color) {
        textContent.style.color = format.color;
      }
      
      // Update marker icon to refresh the display
      updateMarkerIcon(marker);
    };
    
    // Function to set up all marker events
    const setupMarkerEvents = (marker) => {
      const textElement = marker._textElement;
      const textContent = marker._textContent;
      const state = marker._state;
      const resizeHandles = marker._resizeHandles;
      const middleHandles = marker._middleHandles;
      const rotateIcon = marker._rotateIcon;
      
      // Track active markers
      if (!map._activeTextMarkers) {
        map._activeTextMarkers = new Set();
      }
      map._activeTextMarkers.add(marker);
      
      // Handle clicking on the map (deselect all text markers)
      if (!map._textMapClickHandler) {
        map._textMapClickHandler = (e) => {
          // Skip if click originated from a text marker
          if (e._textMarkerEvent) return;
          
          // Deselect all text markers
          map._activeTextMarkers.forEach(m => {
            toggleTextSelection(m, false);
          });
        };
        
        map.on('click', map._textMapClickHandler);
      }
      
      // Click on text content for selection/editing
      textContent.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Mark this as a text marker event to prevent deselection
        e._textMarkerEvent = true;
        
        // If not already selected, just select it
        if (!state.selected) {
          // Deselect all other text markers
          map._activeTextMarkers.forEach(m => {
            if (m !== marker) {
              toggleTextSelection(m, false);
            }
          });
          
          // Select this marker
          toggleTextSelection(marker, true);
        }
        // If already selected, start editing
        else if (!state.editing) {
          startTextEditing(marker);
        }
      });
      
      // Double-click for editing
      textContent.addEventListener('dblclick', (e) => {
        e.stopPropagation();
        e._textMarkerEvent = true;
        startTextEditing(marker);
      });
      
      // Set up rotation icon
      rotateIcon.addEventListener('mousedown', (e) => {
        e.stopPropagation();
        e._textMarkerEvent = true;
        state.rotating = true;
        
        // Get element rect for center calculation
        const rect = textElement.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        // Store initial rotation data
        state.rotateCenter = { x: centerX, y: centerY };
        state.startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX) * (180 / Math.PI);
        state.startRotation = state.angle;
        
        // Disable map dragging during rotation
        map.dragging.disable();
        
        document.addEventListener('mousemove', handleRotateMove);
        document.addEventListener('mouseup', handleRotateUp);
      });
      
      // Rotation move handler
      function handleRotateMove(e) {
        if (!state.rotating) return;
        
        // Calculate current angle relative to center
        const center = state.rotateCenter;
        const currentAngle = Math.atan2(e.clientY - center.y, e.clientX - center.x) * (180 / Math.PI);
        
        // Calculate angle difference
        const angleDiff = currentAngle - state.startAngle;
        const newAngle = state.startRotation + angleDiff;
        
        // Apply rotation
        textElement.style.transform = `rotate(${newAngle}deg)`;
        state.angle = newAngle;
      }
      
      // Rotation up handler
      function handleRotateUp() {
        state.rotating = false;
        document.removeEventListener('mousemove', handleRotateMove);
        document.removeEventListener('mouseup', handleRotateUp);
        
        // Re-enable map dragging if it was originally enabled
        if (originalDraggingState) {
          map.dragging.enable();
        }
        
        // Update marker icon to save rotation
        updateMarkerIcon(marker);
      }
      
      // Set up resize handlers for corner handles
      Object.entries(resizeHandles).forEach(([position, handle]) => {
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e._textMarkerEvent = true;
          state.resizing = true;
          state.resizeCorner = position;
          
          // Store initial data
          const rect = textElement.getBoundingClientRect();
          state.startWidth = rect.width;
          state.startHeight = rect.height;
          state.startPoint = { x: e.clientX, y: e.clientY };
          state.startFontSize = state.fontSize;
          
          // Set transform origin based on which corner is being dragged
          switch(position) {
            case 'br':
              textElement.style.transformOrigin = 'top left';
              break;
            case 'bl':
              textElement.style.transformOrigin = 'top right';
              break;
            case 'tr':
              textElement.style.transformOrigin = 'bottom left';
              break;
            case 'tl':
              textElement.style.transformOrigin = 'bottom right';
              break;
          }
          
          // Disable map dragging during resize
          map.dragging.disable();
          
          document.addEventListener('mousemove', handleResizeCornerMove);
          document.addEventListener('mouseup', handleResizeUp);
        });
      });
      
      // Set up resize handlers for middle handles
      Object.entries(middleHandles).forEach(([position, handle]) => {
        handle.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          e._textMarkerEvent = true;
          state.resizing = true;
          state.resizeEdge = position;
          
          // Store initial dimensions
          const rect = textElement.getBoundingClientRect();
          state.startWidth = rect.width;
          state.startHeight = rect.height;
          state.startPoint = { x: e.clientX, y: e.clientY };
          state.startFontSize = state.fontSize;
          
          // Set transform origin depending on which edge is being resized
          if (position === 'ml') {
            textElement.style.transformOrigin = 'right center';
          } else if (position === 'mr') {
            textElement.style.transformOrigin = 'left center';
          }
          
          // Disable map dragging during resize
          map.dragging.disable();
          
          document.addEventListener('mousemove', handleResizeEdgeMove);
          document.addEventListener('mouseup', handleResizeUp);
        });
      });
      
      // Handler for corner resizing
      function handleResizeCornerMove(e) {
        if (!state.resizing || !state.resizeCorner) return;
        
        const pos = state.resizeCorner;
        let deltaX, deltaY;
  
        // Calculate delta based on position of handle
        switch(pos) {
          case 'br': // Bottom right - straightforward
            deltaX = e.clientX - state.startPoint.x;
            deltaY = e.clientY - state.startPoint.y;
            break;
          case 'bl': // Bottom left 
            deltaX = state.startPoint.x - e.clientX; // Negative when moving left
            deltaY = e.clientY - state.startPoint.y;
            break;
          case 'tr': // Top right
            deltaX = e.clientX - state.startPoint.x;
            deltaY = state.startPoint.y - e.clientY; // Negative when moving up
            break;
          case 'tl': // Top left
            deltaX = state.startPoint.x - e.clientX; // Negative when moving left
            deltaY = state.startPoint.y - e.clientY; // Negative when moving up
            break;
        }
        
        // Calculate actual size changes
        let newWidth, newHeight;
        switch(pos) {
          case 'br':
            newWidth = Math.max(30, state.startWidth + deltaX);
            newHeight = Math.max(20, state.startHeight + deltaY);
            break;
          case 'bl':
            newWidth = Math.max(30, state.startWidth + deltaX);
            newHeight = Math.max(20, state.startHeight + deltaY);
            break;
          case 'tr':
            newWidth = Math.max(30, state.startWidth + deltaX);
            newHeight = Math.max(20, state.startHeight + deltaY);
            break;
          case 'tl':
            newWidth = Math.max(30, state.startWidth + deltaX);
            newHeight = Math.max(20, state.startHeight + deltaY);
            break;
        }
        
        // Update dimensions
        textElement.style.width = `${newWidth}px`;
        textElement.style.height = `${newHeight}px`;
        
        // Update font size based on width change 
        const scaleRatio = newWidth / state.startWidth;
        const newFontSize = Math.max(10, Math.min(48, state.startFontSize * scaleRatio));
        textContent.style.fontSize = `${newFontSize}px`;
        state.fontSize = newFontSize;
        
        // Remember new dimensions
        state.width = newWidth;
        state.height = newHeight;
      }
      
      // Handler for middle edge resizing
      function handleResizeEdgeMove(e) {
        if (!state.resizing || !state.resizeEdge) return;
        
        const pos = state.resizeEdge;
        let deltaX = 0;
        
        // Calculate delta based on which edge is being resized
        if (pos === 'ml') {
          deltaX = state.startPoint.x - e.clientX; // Negative when moving left
        } else if (pos === 'mr') {
          deltaX = e.clientX - state.startPoint.x; // Positive when moving right
        }
        
        // Calculate new width
        let newWidth = Math.max(30, state.startWidth + deltaX);
        if (pos === 'ml') newWidth = Math.max(30, state.startWidth + deltaX);
        
        // Update dimensions
        textElement.style.width = `${newWidth}px`;
        
        // Update font size proportionally based on width
        const scaleRatio = newWidth / state.startWidth;
        const newFontSize = Math.max(10, Math.min(48, state.startFontSize * scaleRatio));
        textContent.style.fontSize = `${newFontSize}px`;
        state.fontSize = newFontSize;
        
        // Remember new dimensions
        state.width = newWidth;
      }
      
      // Shared resize end handler
      function handleResizeUp() {
        state.resizing = false;
        state.resizeCorner = null;
        state.resizeEdge = null;
        
        // Reset transform origin
        textElement.style.transformOrigin = 'center center';
        
        document.removeEventListener('mousemove', handleResizeCornerMove);
        document.removeEventListener('mousemove', handleResizeEdgeMove);
        document.removeEventListener('mouseup', handleResizeUp);
        
        // Re-enable map dragging if it was originally enabled
        if (originalDraggingState) {
          map.dragging.enable();
        }
        
        // Update marker icon to save resized dimensions
        updateMarkerIcon(marker);
      }
      
      // Handle marker drag start
      marker.on('dragstart', (e) => {
        state.dragging = true;
        
        // Mark as text marker event
        if (e.originalEvent) {
          e.originalEvent._textMarkerEvent = true;
        }
      });
      
      // Handle marker drag end
      marker.on('dragend', () => {
        state.dragging = false;
        
        // If marker is selected and toolbar is active, update toolbar position
        if (state.selected && map._selectedTextMarker === marker && typeof map._showTextToolbar === 'function') {
          const containerPoint = map.latLngToContainerPoint(marker.getLatLng());
          
          map._showTextToolbar({
            marker: marker,
            format: marker._state,
            position: {
              top: containerPoint.y - 100,
              left: containerPoint.x
            }
          });
        }
      });
      
      // Update icon on zoom to maintain size
      map.on('zoom viewreset', () => {
        updateMarkerIcon(marker);
      });
    };
    
    // Function to update marker icon
    const updateMarkerIcon = (marker) => {
      // Get current element
      const el = marker._textElement;
      const state = marker._state;
      
      // Get actual dimensions for icon
      const width = el.offsetWidth || state.width || 100;
      const height = el.offsetHeight || state.height || 40;
      
      // Update icon to ensure size and rotation are maintained
      const icon = L.divIcon({
        html: el,
        className: '',
        iconSize: [width, height],
        iconAnchor: [width / 2, height / 2]
      });
      
      marker.setIcon(icon);
    };
    
    // Function to start text editing
    const startTextEditing = (marker) => {
      const textContent = marker._textContent;
      const currentText = textContent.textContent || '';
      const state = marker._state;
      
      // Set editing state
      state.editing = true;
      
      // Show the toolbar while editing
      if (typeof map._showTextToolbar === 'function') {
        // Calculate position from marker for the toolbar
        const containerPoint = map.latLngToContainerPoint(marker.getLatLng());
        
        // Show the toolbar above the text being edited
        map._showTextToolbar({
          marker: marker,
          format: state,
          position: {
            top: containerPoint.y - 100, // Position above the text
            left: containerPoint.x
          }
        });
      }
      
      // Clear existing content
      textContent.innerHTML = '';
      
      // Create input element
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentText;
      input.placeholder = 'Enter text';
      input.style.cssText = `
        width: 100%;
        height: 100%;
        border: none;
        background: transparent;
        text-align: ${state.textAlign || 'center'};
        font-size: ${state.fontSize || 18}px;
        font-family: ${state.fontFamily || 'Arial, sans-serif'};
        font-weight: ${state.fontWeight || 'normal'};
        font-style: ${state.fontStyle || 'normal'};
        text-decoration: ${state.textDecoration || 'none'};
        color: ${state.color || 'black'};
        outline: none;
        padding: 4px;
      `;
      
      textContent.appendChild(input);
      input.focus();
      input.select();
      
      // Finish editing on enter/escape/blur
      input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter' || e.key === 'Escape') {
          finishTextEditing(marker, input.value);
        }
      });
      
      input.addEventListener('blur', () => {
        finishTextEditing(marker, input.value);
      });
      
      // Prevent map events
      input.addEventListener('mousedown', (e) => e.stopPropagation());
      input.addEventListener('click', (e) => {
        e.stopPropagation();
        e._textMarkerEvent = true;
      });
    };
    
    // Function to finish text editing
    const finishTextEditing = (marker, value) => {
      const text = value.trim();
      const state = marker._state;
      
      // Remove marker if no text
      if (!text) {
        if (map._activeTextMarkers) {
          map._activeTextMarkers.delete(marker);
        }
        
        // Use try/catch to handle potential errors with marker removal
        try {
          if (map && map.hasLayer(marker)) {
            map.removeLayer(marker);
          }
          if (map && map.drawnItems && map.drawnItems.hasLayer(marker)) {
            map.drawnItems.removeLayer(marker);
          }
          
          // Also remove from the drawn layers state
          if (marker.layerId) {
            setDrawnLayers(prev => {
              const updated = { ...prev };
              delete updated[marker.layerId];
              return updated;
            });
            
            // Remove from the order array too
            setDrawnLayersOrder(prev => {
              return prev.filter(id => id !== marker.layerId);
            });
          }
        } catch (error) {
          console.warn("Error removing marker:", error);
        }
        
        // Hide toolbar if no text was added
        if (typeof map._hideTextToolbar === 'function') {
          map._hideTextToolbar();
        }
        
        return;
      }
      
      // Set the text content
      marker._textContent.innerHTML = '';
      marker._textContent.textContent = text;
      marker.textContent = text;
      
      // Apply current formatting
      applyTextFormat(marker, state);
      
      // Exit editing state
      state.editing = false;
      
      // Update marker icon with final text
      updateMarkerIcon(marker);
      
      // Keep the marker selected
      if (map._selectedTextMarker !== marker) {
        // Deselect any previously selected marker
        if (map._selectedTextMarker) {
          toggleTextSelection(map._selectedTextMarker, false);
        }
        
        // Select this marker
        toggleTextSelection(marker, true);
      }
      
      // Keep toolbar open after editing
      if (typeof map._showTextToolbar === 'function') {
        // Calculate position from marker for the toolbar
        const containerPoint = map.latLngToContainerPoint(marker.getLatLng());
        
        // Show the toolbar
        map._showTextToolbar({
          marker: marker,
          format: state,
          position: {
            top: containerPoint.y - 100, // Position above the text
            left: containerPoint.x
          }
        });
      }
      
      // Update the layers state with the new text content
      if (marker.layerId) {
        setDrawnLayers(prev => {
          const updated = { ...prev };
          if (updated[marker.layerId]) {
            updated[marker.layerId] = {
              ...updated[marker.layerId],
              layer: marker,
              name: updated[marker.layerId].name // Keep the existing name
            };
          }
          return updated;
        });
      }
    };
    
    // Store handler and add it to map
    map._textClickHandler = handleTextClick;
    map.on('click', handleTextClick, { priority: 999 });
    
    // Cleanup function
    const disableTextTool = () => {
      if (map._textClickHandler) {
        map.off('click', map._textClickHandler);
        delete map._textClickHandler;
      }
      
      // Remove escape key handler
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore map dragging if it was originally enabled
      if (originalDraggingState) {
        map.dragging.enable();
      }
      
      // Reset cursor
      map.getContainer().style.cursor = '';
      
      // Clear draw control reference only if it's our text control
      if (map._drawControl === textControl) {
        map._drawControl = null;
        setActiveDrawTool(null);
      }
    };
    
    // Create control object
    const textControl = {
      disable: disableTextTool
    };
    
    // Store reference to control
    map._drawControl = textControl;
    
    // Set active draw tool state
    setActiveDrawTool('text');
    
    return textControl;
};