import React, { useEffect, useRef } from 'react';

const ShapefilePreview = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const dataCenters = [
    {
      name: "San Fernando de Henares Industrial Park",
      coordinates: [40.44262913, -3.502245627]
    },
    {
      name: "Alcobendas - Equinix MD2", 
      coordinates: [40.53648282, -3.649031411]
    },
    {
      name: "Las Rozas de Madrid - NTT Madrid 1",
      coordinates: [40.50026363, -3.89002509]
    },
    {
      name: "Alcala de Henares - Punto Com Park",
      coordinates: [40.51939852, -3.341420201]
    },
    {
      name: "Valdebebas - New Urban Extension",
      coordinates: [40.44501153, -3.705749366]
    }
  ];

  useEffect(() => {
    // Only load if not already loaded
    const loadLeaflet = () => {
      if (window.L) {
        initializeMap();
        return;
      }

      // Load Leaflet CSS only if not present
      if (!document.querySelector('link[href*="leaflet.min.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css';
        document.head.appendChild(link);
      }

      // Load Leaflet JS only if not present
      if (!document.querySelector('script[src*="leaflet.min.js"]')) {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js';
        script.onload = initializeMap;
        document.head.appendChild(script);
      }
    };

    loadLeaflet();

    // Cleanup only the map instance, NOT the global resources
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  const initializeMap = () => {
    if (!window.L || !mapRef.current || mapInstanceRef.current) return;

    // Initialize map centered on Madrid
    const map = window.L.map(mapRef.current).setView([40.4168, -3.7038], 10);
    mapInstanceRef.current = map;

    // Add CartoDB Positron tiles
    window.L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    // Add markers for each data center
    dataCenters.forEach((dc) => {
      window.L.circleMarker(dc.coordinates, {
        radius: 8,
        fillColor: '#dc2626',
        color: '#ffffff',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.8
      })
      .addTo(map)
      .bindPopup(`<strong>${dc.name}</strong>`);
    });
  };

  return (
    <div className="w-full h-screen">
      
      <div 
        ref={mapRef} 
        className="w-full"
        style={{ height: 'calc(100vh - 80px)' }}
      />
    </div>
  );
};

export default ShapefilePreview;