import React, { useState } from 'react';
import { X, Download, Check } from 'lucide-react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { useNotificationStore } from '@/store/NotificationsStore';

// Define default colors in case they're not provided
const DEFAULT_COLORS = {
  existingShop: '#D2691E',
  highTraffic: '#8B0000',
  mediumTraffic: '#CD5C5C',
  lowTraffic: '#FFB6C1',
  primary: '#2C3E50',
  coral: '#008080',
  white: '#FFFFFF'
};

const MapDownloader = ({ 
  isOpen, 
  onClose, 
  mapContainerRef,
  coffeeShopsRef,
  footTrafficPointsRef,
  radiusCircleRef,
  radius,
  activeLayers,
  layerColors = {}, // Provide default empty object
  addNotification,
  map
}) => {
  const [downloadSelections, setDownloadSelections] = useState({
    map: { filename: 'nyc_coffee_map', format: '.jpg' }
  });
  const [notificationMessage, setNotificationMessage] = useState('');
  const [showEmailNotification, setShowEmailNotification] = useState(false);
  const [selectedLayers, setSelectedLayers] = useState({
    coffeeShops: true,
    footTraffic: true,
    radius: true
  });
  const [showLayerSelector, setShowLayerSelector] = useState(false);

  // If notification store wasn't passed as prop, use the hook
  const notificationStore = useNotificationStore();
  const addNotificationFn = addNotification || notificationStore.addNotification;

  // Safely get colors, falling back to defaults if needed
  const getColor = (colorKey) => {
    return layerColors?.[colorKey] || DEFAULT_COLORS[colorKey] || '#cccccc';
  };

  // Only show layer selection for GIS formats
  const isGisFormat = downloadSelections.map?.format === '.shp' || 
                      downloadSelections.map?.format === '.gdb' || 
                      downloadSelections.map?.format === '.csv';

  const handleFormatChange = (e) => {
    const newFormat = e.target.value;
    setDownloadSelections(prev => ({
      ...prev,
      map: {
        filename: prev['map']?.filename || 'nyc_coffee_map',
        format: newFormat
      }
    }));
    
    // Show layer selector automatically if GIS format is selected
    if (newFormat === '.shp' || newFormat === '.gdb' || newFormat === '.csv') {
      setShowLayerSelector(true);
    } else {
      setShowLayerSelector(false);
    }
  };

  const toggleLayer = (layerName) => {
    setSelectedLayers(prev => ({
      ...prev,
      [layerName]: !prev[layerName]
    }));
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

          // Collect map data based on selected layers
          const mapData = {};
          
          // Only include selected layers
          if (selectedLayers.coffeeShops && coffeeShopsRef?.current?.length > 0) {
            mapData.coffeeShops = coffeeShopsRef.current.map(({ marker, potential, featureId }) => {
              const position = marker.getLatLng();
              const popupContent = marker.getPopup()?.getContent() || '';

              // Extract name from popup if available
              let name = "Coffee Shop";
              const nameMatch = popupContent.match(/Name: ([^<]+)/);
              if (nameMatch && nameMatch[1]) {
                name = nameMatch[1].trim();
              }

              return {
                lat: position.lat,
                lng: position.lng,
                name: name,
                potential: potential,
                type: 'Coffee Shop',
                featureId: featureId || marker.featureId
              };
            });
          }
          
          // Include foot traffic data if selected
if (selectedLayers.footTraffic && footTrafficPointsRef?.current?.length > 0) {
  mapData.footTraffic = footTrafficPointsRef.current.map(point => {
    // Check if this is a GeoJSON feature (from pedestrian-data.geojson)
    if (point.type === 'Feature' && point.geometry && point.geometry.type === 'Point') {
      // Extract average PM value for intensity calculation
      const pmValues = Object.keys(point.properties || {})
        .filter(key => key.includes('_pm') || key.includes('p_m'))
        .map(key => parseFloat(point.properties[key]) || 0)
        .filter(val => !isNaN(val));
      
      // Calculate average intensity (normalized to 0-1 range)
      const avgValue = pmValues.length > 0 
        ? pmValues.reduce((sum, val) => sum + val, 0) / pmValues.length 
        : 0;
      const intensity = Math.min(avgValue / 6000, 1); // Normalize, assuming 6000 is high
      
      return {
        lat: point.geometry.coordinates[1], // GeoJSON uses [lng, lat] order
        lng: point.geometry.coordinates[0],
        intensity: intensity,
        count: Math.round(avgValue).toString(),
        time: '',
        featureId: point.properties.objectid || '',
        // Preserve original properties for export
        originalProperties: point.properties
      };
    } 
    // Handle the existing format too (if any non-GeoJSON points exist)
    else if (point.latlng) {
      return {
        lat: point.latlng.lat,
        lng: point.latlng.lng,
        intensity: point.properties?.intensity || 0.5,
        count: point.properties?.count || '',
        time: point.properties?.time || '',
        featureId: point.featureId || ''
      };
    }
    // Fallback for any other structure
    else if (point.lat && point.lng) {
      return point;
    }
    // Default case - log error and provide default
    else {
      console.error('Unknown point structure:', point);
      return {
        lat: 0,
        lng: 0,
        intensity: 0.5,
        count: '',
        time: '',
        featureId: ''
      };
    }
  });
}

          // Include radius data if selected
          if (selectedLayers.radius && radiusCircleRef?.current) {
            const circle = radiusCircleRef.current;
            mapData.radius = {
              center: circle.getLatLng(),
              radius: circle.getRadius()
            };
          }

          // Add layer styling information - use the safe color getter
          mapData.styles = {
            layerColors: {
              existingShop: getColor('existingShop'),
              highTraffic: getColor('highTraffic'),
              mediumTraffic: getColor('mediumTraffic'),
              lowTraffic: getColor('lowTraffic')
            }
          };

          // Log what we're sending for debugging purposes
          console.log('Sending mapData for export:', mapData);
          console.log('Selected layers:', selectedLayers);

          // Send to server for processing
          fetch('/api/export-map', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              format,
              mapData,
              selectedLayers
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
              if (format === '.csv' && Object.values(selectedLayers).filter(Boolean).length === 1) {
                // Single CSV file
                return response.text().then(text => ({
                  data: text,
                  type: 'text/csv',
                  filename: serverFilename || `${filename}.csv`
                }));
              } else {
                // Zip file (for multiple CSVs or other formats)
                return response.arrayBuffer().then(buffer => ({
                  data: buffer,
                  type: 'application/zip',
                  filename: serverFilename || `${filename}${format === '.csv' ? '_csv' : ''}.zip`
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
      }
    });

    // Push notification
    if (downloadedFiles.length > 0) {
      const fileList = downloadedFiles.join(', ');
      setNotificationMessage(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
      setShowEmailNotification(true);
      addNotificationFn(`Downloaded ${downloadedFiles.length} file${downloadedFiles.length > 1 ? 's' : ''}: ${fileList}`);
    }
    
    // Close the dialog
    onClose();
  };

  // Simple download just the image via html2canvas
  const captureAndDownload = () => {
    if (!mapContainerRef.current) {
      console.error('Map element not found');
      return;
    }

    html2canvas(mapContainerRef.current, {
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[1000] bg-black/30">
      <div className="bg-white w-[380px] rounded-2xl shadow-2xl p-6 border border-gray-200 relative animate-fade-in">
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          <X size={16} />
        </button>

        <h2 className="text-lg font-semibold text-gray-800 mb-4">Download Map</h2>

        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            className="border px-3 py-2 rounded-lg w-[220px] text-sm focus:outline-none focus:ring-2 focus:ring-[#008080]"
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
            onChange={handleFormatChange}
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

        <div className="mb-3">
          <p className="text-xs text-gray-500 mt-1">
            {(() => {
              const format = downloadSelections['map']?.format;
              if (format === '.shp') 
                return 'Shapefile (.shp) exports map features as vector data for GIS software like ArcGIS or QGIS.';
              if (format === '.gdb') 
                return 'Geodatabase (.gdb) exports map data in a structured format for Esri products.';
              if (format === '.csv') 
                return 'CSV file with all locations and their attributes for spreadsheet applications.';
              if (format === '.pdf') 
                return 'PDF document with high-quality map image suitable for printing.';
              return 'Image file for sharing or embedding in documents.';
            })()}
          </p>
        </div>

        {/* Layer selection for GIS formats */}
        {isGisFormat && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Select Layers to Export</h3>
              <button 
                onClick={() => setShowLayerSelector(!showLayerSelector)}
                className="text-xs text-[#008080] hover:text-teal-700"
              >
                {showLayerSelector ? 'Hide' : 'Show'} Options
              </button>
            </div>
            
            {showLayerSelector && (
              <div className="bg-gray-50 rounded-lg p-2 border border-gray-200 space-y-1">
                <div 
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleLayer('coffeeShops')}
                >
                  <div className="flex items-center">
                    {/* Using the safe color getter */}
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColor('existingShop') }} />
                    <span className="text-sm">Coffee Shops</span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${selectedLayers.coffeeShops ? 'bg-[#008080] text-white' : 'border border-gray-300'}`}>
                    {selectedLayers.coffeeShops && <Check size={12} />}
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleLayer('footTraffic')}
                >
                  <div className="flex items-center">
                    {/* Using the safe color getter */}
                    <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: getColor('highTraffic') }} />
                    <span className="text-sm">Foot Traffic</span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${selectedLayers.footTraffic ? 'bg-[#008080] text-white' : 'border border-gray-300'}`}>
                    {selectedLayers.footTraffic && <Check size={12} />}
                  </div>
                </div>
                
                <div 
                  className="flex items-center justify-between p-2 rounded hover:bg-gray-100 cursor-pointer"
                  onClick={() => toggleLayer('radius')}
                >
                  <div className="flex items-center">
                    <div className="w-3 h-3 rounded-full mr-2 border border-[#4169E1]" style={{ backgroundColor: 'transparent' }} />
                    <span className="text-sm">Analysis Radius</span>
                  </div>
                  <div className={`w-4 h-4 rounded flex items-center justify-center ${selectedLayers.radius ? 'bg-[#008080] text-white' : 'border border-gray-300'}`}>
                    {selectedLayers.radius && <Check size={12} />}
                  </div>
                </div>
                
                {/* Show a warning if no layers are selected */}
                {!Object.values(selectedLayers).some(v => v) && (
                  <p className="text-xs text-red-500 mt-1 px-2">Please select at least one layer to export</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Quick Download Button */}
        <div className="mb-4">
          <button
            onClick={captureAndDownload}
            className="w-full flex items-center justify-center py-2 rounded-md text-sm font-semibold bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300"
          >
            <Download size={16} className="mr-2" />
            Quick Image Download (JPG)
          </button>
        </div>

        {/* Custom Download Button */}
        <button
          onClick={handleDownloadAll}
          disabled={isGisFormat && !Object.values(selectedLayers).some(v => v)}
          className={`w-full py-2 rounded-md text-sm font-semibold 
            ${isGisFormat && !Object.values(selectedLayers).some(v => v) 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-[#008080] text-white hover:bg-teal-700'}`}
        >
          Download with Selected Options
        </button>

        {showEmailNotification && (
          <div className="fixed top-6 right-6 z-[9999] animate-slide-in transition-opacity duration-300">
            <div className="bg-white border border-[#008080] text-[#008080] px-5 py-3 rounded-lg shadow-lg text-sm font-medium">
              {notificationMessage}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapDownloader;