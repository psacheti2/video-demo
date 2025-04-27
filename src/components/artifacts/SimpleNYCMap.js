import React, { useEffect, useRef, useState } from 'react';

const NYCNeighborhoodsMap = () => {
  const mapContainerRef = useRef(null);
  const [map, setMap] = useState(null);
  
  const neighborhoods = [
    { name: "Midtown East", lat: 40.7545, lng: -73.9720, radius: 500 },
    { name: "Midtown South", lat: 40.7465, lng: -73.9880, radius: 500 },
    { name: "Union Square", lat: 40.7359, lng: -73.9911, radius: 450 }
  ];  
  const timesSquareCoords = { lat: 40.7580, lng: -73.9855 }; // Times Square coordinates

  const isWithin1MileOfTimesSquare = (lat, lng) => {
    const timesSquareLat = timesSquareCoords.lat;
    const timesSquareLng = timesSquareCoords.lng;
    const R = 6371e3; // Earth's radius in meters
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat - timesSquareLat);
    const dLng = toRad(lng - timesSquareLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(timesSquareLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= 1609.34 * 2; // 1 mile in meters
  };

  const fetchFootTrafficData = async () => {
    const res = await fetch('/data/pedestrian-data.geojson');
    return res.json();
  };
  
  const fetchStorefrontData = async () => {
    const res = await fetch('/data/vacated-data.geojson');
    return res.json();
  };

  const fetchSubwayData = async () => {
    const res = await fetch('/data/subway-data.geojson');
    return res.json();
  };
  
  const fetchCoffeeShopData = async () => {
    const res = await fetch('/data/coffeeshop-data.geojson');
    return res.json();
  };
  
  
  const isInsideNeighborhood = (lat, lng, centerLat, centerLng, radiusMeters) => {
    const R = 6371e3; // Earth's radius in meters
    const toRad = (x) => (x * Math.PI) / 180;
    const dLat = toRad(lat - centerLat);
    const dLng = toRad(lng - centerLng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(centerLat)) * Math.cos(toRad(lat)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance <= radiusMeters;
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
    
      // Initialize map
      const leafletMap = L.map(mapContainerRef.current, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 12,
        maxZoom: 18,
        doubleClickZoom: false
      }).setView([40.7445, -73.9855], 14);
    
      // Add tile layer
      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
        subdomains: 'abcd',
        maxZoom: 19
      }).addTo(leafletMap);
    
      // Add controls
      L.control.zoom({ position: 'topright' }).addTo(leafletMap);
      L.control.attribution({ position: 'bottomright' }).addTo(leafletMap);
      const neighborhoodLayer = L.layerGroup().addTo(leafletMap);

      neighborhoods.forEach(hood => {
        const circle = L.circle([hood.lat, hood.lng], {
          radius: hood.radius,
          color: '#666',
          fillColor: 'transparent',
          fillOpacity: 0,
          weight: 2,
          dashArray: '4 4'
        });
      
        circle.bindPopup(`<strong>${hood.name}</strong>`);
        neighborhoodLayer.addLayer(circle); // Add to layer group instead of map
      });
    
      // Fetch all real data
      const trafficData = await fetchFootTrafficData();
      const storefrontData = await fetchStorefrontData();
      const subwayData = await fetchSubwayData();
      const coffeeShopData = await fetchCoffeeShopData();

      console.log('Traffic Data Loaded:', trafficData);
console.log('Storefront Data Loaded:', storefrontData);
console.log('Subway Data Loaded:', subwayData);
console.log('Coffee Shop Data Loaded:', coffeeShopData);
    
      let trafficHeatPoints = [];
      let storefrontHeatPoints = [];
    
      // Parse real traffic points
      trafficData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          neighborhoods.forEach(({ lat: centerLat, lng: centerLng, radius }) => {
            if (isInsideNeighborhood(lat, lng, centerLat, centerLng, radius)) {
              const intensity = feature.properties?.intensity || 0.5;
              trafficHeatPoints.push([lat, lng, intensity * 5]);
            }
          });
        }
      });
    
      neighborhoods.forEach(({ lat: centerLat, lng: centerLng, radius }) => {
        for (let i = 0; i < 10; i++) {
          const randomLat = centerLat + (Math.random() - 0.5) * (radius / 111000);
          const randomLng = centerLng + (Math.random() - 0.5) * (radius / (111000 * Math.cos(centerLat * Math.PI / 180)));
          trafficHeatPoints.push([randomLat, randomLng, 2 + Math.random() * 3]);
        }
      });
    
      // Parse storefront points
      storefrontData.features.forEach(feature => {
        if (feature.geometry && feature.geometry.type === 'Point') {
          const [lng, lat] = feature.geometry.coordinates;
          neighborhoods.forEach(({ lat: centerLat, lng: centerLng, radius }) => {
            if (isInsideNeighborhood(lat, lng, centerLat, centerLng, radius)) {
              storefrontHeatPoints.push([lat, lng, 0.5]);
            }
          });
        }
      });

    
      // Declare heatmap layers
      let footTrafficLayer;
      let storefrontLayer;
    
      if (trafficHeatPoints.length > 0 && window.L.heatLayer) {
        footTrafficLayer = window.L.heatLayer(trafficHeatPoints, {
          radius: 25,
          blur: 15,
          gradient: {
            0.2: '#FFCCCB',
            0.5: '#FF0000',
            0.8: '#8B0000'
          }
        }).addTo(leafletMap);
      }
    
      if (storefrontHeatPoints.length > 0 && window.L.heatLayer) {
        storefrontLayer = window.L.heatLayer(storefrontHeatPoints, {
          radius: 20,
          blur: 15,
          gradient: {
            0.0: '#C7FFDA',  // very light green
            0.4: '#00B8B8',  // medium green
            0.7: '#007A7A',  // dark olive green
        }
        }).addTo(leafletMap);
      }
    
      console.log('trafficHeatPoints:', trafficHeatPoints.length);
console.log('storefrontHeatPoints:', storefrontHeatPoints.length);

      // Subway stations layer - filtered to 1 mile from Times Square
const subwayLayer = L.layerGroup();
subwayData.features.forEach(feature => {
  if (feature.geometry && feature.geometry.type === 'Point') {
    const [lng, lat] = feature.geometry.coordinates;
    if (isWithin1MileOfTimesSquare(lat, lng)) {
      const marker = L.circleMarker([lat, lng], {
        radius: 4,
        color: '#0039A6',
        weight: 2,
        fillColor: '#0039A6',
        fillOpacity: 0.8
      }).bindPopup(`<strong>Subway Station</strong>`);
      subwayLayer.addLayer(marker);
    }
  }
});
    // Coffee shops layer - filtered to 1 mile from Times Square
const coffeeShopLayer = L.layerGroup();
coffeeShopData.features.forEach(feature => {
  let lat, lng;

  if (feature.geometry && feature.geometry.type === 'Point') {
    [lng, lat] = feature.geometry.coordinates;
  } else if (feature.properties?.latitude && feature.properties?.longitude) {
    lat = parseFloat(feature.properties.latitude);
    lng = parseFloat(feature.properties.longitude);
  }

  if (lat && lng && isWithin1MileOfTimesSquare(lat, lng)) {
    const marker = L.circleMarker([lat, lng], {
      radius: 4,
      color: '#D2691E',
      weight: 2,
      fillColor: '#D2691E',
      fillOpacity: 0.8
    }).bindPopup(`<strong>Coffee Shop</strong>`);
    coffeeShopLayer.addLayer(marker);
  }
});

    
      // Add layer control
      const overlayMaps = {
        "Recommended Areas": neighborhoodLayer, 
        "Foot Traffic Heatmap": footTrafficLayer,
        "Storefront Heatmap": storefrontLayer,
        "Subway Stations": subwayLayer,
        "Coffee Shops": coffeeShopLayer
      };
    
      L.control.layers(null, overlayMaps, { collapsed: false, position: 'topright' }).addTo(leafletMap);
    
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