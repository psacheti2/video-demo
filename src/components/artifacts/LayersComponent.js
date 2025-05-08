import React, { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import _ from 'lodash';

// This component doesn't render any visible UI elements
// Instead, it manages map layers and adds them to a provided map instance
const LayersComponent = ({ 
  map, 
  layerTypes = [],  // Array of layer types to add: ['flood', 'infrastructure', 'stormwater', '311', 'demographics']
  activeLayers = {}, // Object with layer visibility status
  layerColors = {}, // Colors for different layer elements
  onLayersLoaded = () => {}, // Callback when layers are loaded
  onLayerRefs = () => {} // Callback to pass layer references
}) => {
  // References to keep track of features for interaction
  const floodPolygonsRef = useRef([]);
  const streetLinesRef = useRef([]);
  const sewerLinesRef = useRef([]);
  const projectFeaturesRef = useRef([]);
  const demographicPolygonsRef = useRef([]);
  const [layersLoaded, setLayersLoaded] = useState(false);
  
  // Default colors if not provided
  const COLORS = {
    // Flood zones
    floodLight: layerColors.floodLight || '#ADD8E6',
    floodMedium: layerColors.floodMedium || '#4682B4',
    floodDark: layerColors.floodDark || '#000080',

    // Infrastructure conditions
    streetGood: layerColors.streetGood || '#2ECC71',
    streetMedium: layerColors.streetMedium || '#F1C40F',
    streetPoor: layerColors.streetPoor || '#E74C3C',

    sewerGood: layerColors.sewerGood || '#3498DB',
    sewerMedium: layerColors.sewerMedium || '#85C1E9',
    sewerPoor: layerColors.sewerPoor || '#E67E22',

    // Projects
    projectActive: layerColors.projectActive || '#9C27B0',
    projectPlanned: layerColors.projectPlanned || '#673AB7',

    // Demographics
    demoHigh: layerColors.demoHigh || '#FF5722',
    demoMedium: layerColors.demoMedium || '#FF9800',
    demoLow: layerColors.demoLow || '#FFC107',

    // 311 Data
    data311High: layerColors.data311High || '#607D8B',
    data311Medium: layerColors.data311Medium || '#90A4AE',
    data311Low: layerColors.data311Low || '#CFD8DC',
  };

  // Helper function to convert GeoJSON to table data
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

  // Fetch and create flood zone layers
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
            coordinates = feature.geometry.coordinates[0].map(coord => [coord[1], coord[0]]);
          } else {
            coordinates = feature.geometry.coordinates[0][0].map(coord => [coord[1], coord[0]]);
          }

          // Determine color based on risk level
          let color = COLORS.floodMedium;
          let fillColor = COLORS.floodLight;

          if (feature.properties) {
            if (feature.properties.risk_level === 'high') {
              color = COLORS.floodDark;
              fillColor = COLORS.floodMedium;
            } else if (feature.properties.risk_level === 'low') {
              color = COLORS.floodLight;
              fillColor = COLORS.floodLight;
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
      return { floodLayer: L.layerGroup(), floodData: { features: [] } };
    }
  };

  // Fetch and create infrastructure layers
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
            let color = COLORS.streetMedium;
            const condition = feature.properties?.condition || 'C';

            if (condition === 'A' || condition === 'B') {
              color = COLORS.streetGood;
            } else if (condition === 'C' || condition === 'D') {
              color = COLORS.streetMedium;
            } else {
              color = COLORS.streetPoor;
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
            let color = COLORS.sewerMedium;
            const condition = feature.properties?.condition || 'C';

            if (condition === 'A' || condition === 'B') {
              color = COLORS.sewerGood;
            } else if (condition === 'C' || condition === 'D') {
              color = COLORS.sewerMedium;
            } else {
              color = COLORS.sewerPoor;
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
      return { infraLayer: L.layerGroup(), streetData: { features: [] }, sewerData: { features: [] } };
    }
  };

  // Fetch and create stormwater projects layer
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
                  html: `<div style="background-color: ${COLORS.projectActive}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
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
              projectFeaturesRef.current.push({ element: marker });
              projectsLayer.addLayer(marker);

            } else if (feature.geometry.type === 'LineString') {
              // For linestring features
              projectCoords = feature.geometry.coordinates.map(coord => [coord[1], coord[0]]);

              const line = L.polyline(projectCoords, {
                color: COLORS.projectActive,
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
                  color: COLORS.projectActive,
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
      return { projectsLayer: L.layerGroup(), projectsData: { features: [] } };
    }
  };

  // Fetch and create 311 data layer
  const fetch311Data = async () => {
    try {
      const res = await fetch('/data/311-data.geojson');
      const data311 = await res.json();
      const data311Layer = L.layerGroup();

      // Process the actual 311 data
      const heatData = [];
      const neighborhoodCountMap = new Map();

      // Filter for features with valid geometry
      const validFeatures = data311.features.filter(feature =>
        feature.geometry && feature.geometry.type === 'Point' &&
        feature.geometry.coordinates &&
        feature.geometry.coordinates.length === 2
      );

      // Count features by neighborhood
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
        const color = priority === "High" ? COLORS.data311High :
          priority === "Medium" ? COLORS.data311Medium : COLORS.data311Low;

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

      // Add neighborhood centers for heatmap data
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

      // Add heatmap data from neighborhoods
      neighborhoodCountMap.forEach((count, neighborhood) => {
        if (neighborhoodCenters[neighborhood] && count > 0) {
          const coords = neighborhoodCenters[neighborhood];
          const intensity = Math.min(count / 5, 1.0);
          heatData.push([coords[0], coords[1], intensity]);
        }
      });

      // Add heatmap for 311 calls if available
      if (window.L.heatLayer && heatData.length > 0) {
        const heatmap = window.L.heatLayer(heatData, {
          radius: 30,
          blur: 15,
          maxZoom: 17,
          gradient: {
            0.2: COLORS.data311Low,
            0.5: COLORS.data311Medium,
            0.8: COLORS.data311High
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

  // Fetch and create demographics layer
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

            const color = normalized > 0.8 ? COLORS.demoHigh :
              normalized > 0.5 ? COLORS.demoMedium : COLORS.demoLow;

            const polygon = L.polygon(coords, {
              color: '#2C3E50',
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
      return { demographicsLayer: L.layerGroup(), demographicsData: { features: [] } };
    }
  };

  // Create "infrastructure outside projects" layer
  const createInfrastructureOutsideLayer = async (infrastructureLayer, projectsLayer) => {
    try {
      if (!infrastructureLayer || !projectsLayer) {
        console.error("Required layers not available for spatial analysis");
        return L.layerGroup();
      }

      // This is a simplified approach
      const outsideLayer = L.layerGroup();
      const infraItems = [];
      
      // Collect infrastructure items
      infrastructureLayer.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
          infraItems.push({
            layer: layer,
            bounds: layer.getBounds(),
            center: layer.getBounds().getCenter(),
            type: layer.options.dashArray ? 'Sewer Line' : 'Street',
            condition: layer._popup ? 
              (layer._popup._content.includes('Condition: F') ? 'F' :
               layer._popup._content.includes('Condition: E') ? 'E' :
               layer._popup._content.includes('Condition: D') ? 'D' : 'C')
              : 'Unknown'
          });
        }
      });

      // Collect project areas
      const projectAreas = [];
      projectsLayer.eachLayer(layer => {
        if (layer instanceof L.Polyline || layer instanceof L.Polygon) {
          projectAreas.push({
            layer: layer,
            bounds: layer.getBounds(),
            buffer: 0.001 // Small buffer (about 100m) around project areas
          });
        }
      });

      // Find infrastructure outside project areas
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

      // Add markers for critical infrastructure
      criticalInfra.forEach(item => {
        // Create popup with information
        let popupContent = `<strong>Warning: ${item.type}</strong><br>Condition: ${item.condition}<br>Priority: High<br>Status: Outside Current Project Areas`;

        // Create a marker at the center point
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
      return L.layerGroup();
    }
  };

  // Main effect to load and add layers to the map
  useEffect(() => {
    if (!map) return;

    // Initialize array to collect promise results
    const loadPromises = [];
    const results = {};

    // Load selected layer types
    if (layerTypes.includes('flood')) {
      loadPromises.push(fetchFloodZones().then(result => {
        results.floodZones = result;
        return result;
      }));
    }

    if (layerTypes.includes('infrastructure')) {
      loadPromises.push(fetchInfrastructureData().then(result => {
        results.infrastructure = result;
        return result;
      }));
    }

    if (layerTypes.includes('stormwater')) {
      loadPromises.push(fetchStormwaterProjects().then(result => {
        results.stormwater = result;
        return result;
      }));
    }

    if (layerTypes.includes('311')) {
      loadPromises.push(fetch311Data().then(result => {
        results.data311 = result;
        return result;
      }));
    }

    if (layerTypes.includes('demographics')) {
      loadPromises.push(fetchDemographics().then(result => {
        results.demographics = result;
        return result;
      }));
    }

    // Wait for all layer promises to resolve
    Promise.all(loadPromises).then(async () => {
      // Create the infrastructure outside layer if both required layers exist
      if (results.infrastructure && results.stormwater) {
        const outsideLayer = await createInfrastructureOutsideLayer(
          results.infrastructure.infraLayer,
          results.stormwater.projectsLayer
        );
        results.infrastructureOutside = { infrastructureOutsideLayer: outsideLayer };
      }

      // Add all layers to map if they're active
      if (results.floodZones && activeLayers.floodZones !== false) {
        map.addLayer(results.floodZones.floodLayer);
        map.floodZoneLayer = results.floodZones.floodLayer;
      }

      if (results.infrastructure && activeLayers.infrastructure !== false) {
        map.addLayer(results.infrastructure.infraLayer);
        map.infrastructureLayer = results.infrastructure.infraLayer;
      }

      if (results.stormwater && activeLayers.stormwaterProjects !== false) {
        map.addLayer(results.stormwater.projectsLayer);
        map.stormwaterProjectsLayer = results.stormwater.projectsLayer;
      }

      if (results.infrastructureOutside && activeLayers.infrastructureOutsideProjects !== false) {
        map.addLayer(results.infrastructureOutside.infrastructureOutsideLayer);
        map.infrastructureOutsideLayer = results.infrastructureOutside.infrastructureOutsideLayer;
      }

      if (results.data311 && activeLayers.data311 !== false) {
        map.addLayer(results.data311.data311Layer);
        map.data311Layer = results.data311.data311Layer;
      }

      if (results.demographics && activeLayers.demographics !== false) {
        map.addLayer(results.demographics.demographicsLayer);
        map.demographicsLayer = results.demographics.demographicsLayer;
      }

      // Call onLayersLoaded callback with all results
      onLayersLoaded(results);
      
      // Pass layer references to parent
      onLayerRefs({
        floodPolygonsRef: floodPolygonsRef.current,
        streetLinesRef: streetLinesRef.current,
        sewerLinesRef: sewerLinesRef.current,
        projectFeaturesRef: projectFeaturesRef.current,
        demographicPolygonsRef: demographicPolygonsRef.current
      });

      setLayersLoaded(true);
    });

    // Cleanup: remove layers when component unmounts
    return () => {
      if (map.floodZoneLayer) map.removeLayer(map.floodZoneLayer);
      if (map.infrastructureLayer) map.removeLayer(map.infrastructureLayer);
      if (map.stormwaterProjectsLayer) map.removeLayer(map.stormwaterProjectsLayer);
      if (map.infrastructureOutsideLayer) map.removeLayer(map.infrastructureOutsideLayer);
      if (map.data311Layer) map.removeLayer(map.data311Layer);
      if (map.demographicsLayer) map.removeLayer(map.demographicsLayer);
    };
  }, [map]);

  // Effect to toggle layer visibility when activeLayers prop changes
  useEffect(() => {
    if (!map || !layersLoaded) return;

    // Toggle flood zones layer
    if (map.floodZoneLayer) {
      if (activeLayers.floodZones) {
        if (!map.hasLayer(map.floodZoneLayer)) map.addLayer(map.floodZoneLayer);
      } else {
        if (map.hasLayer(map.floodZoneLayer)) map.removeLayer(map.floodZoneLayer);
      }
    }

    // Toggle infrastructure layer
    if (map.infrastructureLayer) {
      if (activeLayers.infrastructure) {
        if (!map.hasLayer(map.infrastructureLayer)) map.addLayer(map.infrastructureLayer);
      } else {
        if (map.hasLayer(map.infrastructureLayer)) map.removeLayer(map.infrastructureLayer);
      }
    }

    // Toggle stormwater projects layer
    if (map.stormwaterProjectsLayer) {
      if (activeLayers.stormwaterProjects) {
        if (!map.hasLayer(map.stormwaterProjectsLayer)) map.addLayer(map.stormwaterProjectsLayer);
      } else {
        if (map.hasLayer(map.stormwaterProjectsLayer)) map.removeLayer(map.stormwaterProjectsLayer);
      }
    }

    // Toggle infrastructure outside projects layer
    if (map.infrastructureOutsideLayer) {
      if (activeLayers.infrastructureOutsideProjects) {
        if (!map.hasLayer(map.infrastructureOutsideLayer)) map.addLayer(map.infrastructureOutsideLayer);
      } else {
        if (map.hasLayer(map.infrastructureOutsideLayer)) map.removeLayer(map.infrastructureOutsideLayer);
      }
    }

    // Toggle 311 data layer
    if (map.data311Layer) {
      if (activeLayers.data311) {
        if (!map.hasLayer(map.data311Layer)) map.addLayer(map.data311Layer);
      } else {
        if (map.hasLayer(map.data311Layer)) map.removeLayer(map.data311Layer);
      }
    }

    // Toggle demographics layer
    if (map.demographicsLayer) {
      if (activeLayers.demographics) {
        if (!map.hasLayer(map.demographicsLayer)) map.addLayer(map.demographicsLayer);
      } else {
        if (map.hasLayer(map.demographicsLayer)) map.removeLayer(map.demographicsLayer);
      }
    }
  }, [map, activeLayers, layersLoaded]);

  // Effect to update layer colors
  useEffect(() => {
    if (!map || !layersLoaded) return;

    // Flood Zones
    floodPolygonsRef.current.forEach(({ polygon, properties }) => {
      let color = COLORS.floodMedium;
      let fillColor = COLORS.floodLight;

      if (properties?.risk_level === 'high') {
        color = COLORS.floodDark;
        fillColor = COLORS.floodMedium;
      } else if (properties?.risk_level === 'low') {
        color = COLORS.floodLight;
        fillColor = COLORS.floodLight;
      }

      polygon.setStyle({ color, fillColor });
    });

    // Streets
    streetLinesRef.current.forEach(({ line, condition }) => {
      let color = COLORS.streetMedium;
      if (condition === 'A' || condition === 'B') color = COLORS.streetGood;
      else if (condition === 'C' || condition === 'D') color = COLORS.streetMedium;
      else color = COLORS.streetPoor;

      line.setStyle({ color });
    });

    // Sewer Lines 
    sewerLinesRef.current.forEach(({ line, condition }) => {
      let color = COLORS.sewerMedium;
      if (condition === 'A' || condition === 'B') color = COLORS.sewerGood;
      else if (condition === 'C' || condition === 'D') color = COLORS.sewerMedium;
      else color = COLORS.sewerPoor;

      if (line && typeof line.setStyle === 'function') {
        line.setStyle({ color });
      }
    });

    // Projects
    projectFeaturesRef.current.forEach(({ element }) => {
      if (element && element.setStyle) {
        element.setStyle({ color: COLORS.projectActive });
      } else if (element && element.setIcon) {
        element.setIcon(L.divIcon({
          html: `<div style="background-color: ${COLORS.projectActive}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white;"></div>`,
          className: '',
          iconSize: [16, 16]
        }));
      }
    });

    // Demographics
    demographicPolygonsRef.current.forEach(({ polygon, socioEconomicValue }) => {
      const normalized = socioEconomicValue / 100;
      const fillColor = normalized > 0.8
        ? COLORS.demoHigh
        : normalized > 0.5
          ? COLORS.demoMedium
          : COLORS.demoLow;

      polygon.setStyle({ fillColor });
    });

  }, [map, layerColors, layersLoaded]);

  // This component doesn't render any visible UI
  return null;
};

export default LayersComponent;