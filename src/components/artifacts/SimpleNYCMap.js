import React, { useEffect, useRef, useState } from 'react';

const NYCNeighborhoodsMap = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  
  // Coordinates for NYC neighborhoods
  const neighborhoods = [
    { name: "Hell's Kitchen", lat: 40.763, lng: -73.991, radius: 500 },
    { name: "Union Square", lat: 40.735, lng: -73.991, radius: 450 },
    { name: "Chelsea", lat: 40.746, lng: -74.001, radius: 500 }
  ];
  
  useEffect(() => {
    const initializeMap = async () => {
      // Import Leaflet dynamically
      const L = await import('leaflet');
      await import('leaflet/dist/leaflet.css');
      
      if (map || !mapContainerRef.current) return;
      
      // Initialize map with the same styling as the AdditionalLayersMapComponent
      const leafletMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 12,
        maxZoom: 18,
        doubleClickZoom: false
      }).setView([40.747, -73.995], 14); // Centered between the three neighborhoods
      
      // Add the same tile layer as in the original component
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);
      
      // Add minimal controls in the same position
      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);
      
      // Create circles for each neighborhood with matching styles
      neighborhoods.forEach(hood => {
        // Create circle with semi-transparent fill
        const circle = L.circle([hood.lat, hood.lng], {
          radius: hood.radius,
          color: getNeighborhoodColor(hood.name),
          fillColor: getNeighborhoodColor(hood.name),
          fillOpacity: 0.2,
          weight: 2
        }).addTo(leafletMap);
        
        // Add labels with the same styling as the original component
        const marker = L.marker([hood.lat, hood.lng], {
          icon: L.divIcon({
            html: `<div style="background-color: white; padding: 4px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; border: 1px solid rgba(0,0,0,0.2); box-shadow: 0 1px 3px rgba(0,0,0,0.1);">${hood.name}</div>`,
            className: '',
            iconSize: [100, 20],
            iconAnchor: [50, 10]
          })
        }).addTo(leafletMap);
      });
      
      // Set the map in state
      setMap(leafletMap);
    };
    
    initializeMap();
    
    // Cleanup on unmount
    return () => {
      if (map) map.remove();
    };
  }, []);
  
  // Function to get consistent colors for neighborhoods
  const getNeighborhoodColor = (name) => {
    switch(name) {
      case "Hell's Kitchen":
        return '#FF5733'; // Red-orange
      case "Union Square":
        return '#33A8FF'; // Blue
      case "Chelsea":
        return '#33FF57'; // Green
      default:
        return '#8033FF'; // Purple
    }
  };
  
  return (
    <div style={{ width: '100%', height: '500px', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
      <div 
        ref={mapContainerRef} 
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default NYCNeighborhoodsMap;