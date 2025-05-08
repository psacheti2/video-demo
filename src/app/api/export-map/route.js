import { NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import JSZip from 'jszip';

export async function POST(request) {
  try {
    const data = await request.json();
    const { format, mapData, selectedLayers } = data;
    
    if (format === '.shp') {
      // For Shapefile format
      // Since we need to use shp-write dynamically (it might not be compatible with all environments),
      // we'll do a dynamic import
      const shpwrite = await import('shp-write');
      
      // Convert mapData to GeoJSON based on selected layers
      const geoJson = convertToGeoJSON(mapData, selectedLayers);
      
      // Create a zip file with the shapefile components
      const zip = new JSZip();
      
      // Process each layer type separately for better organization
      // Coffee Shops (points)
      const coffeeShopFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'coffeeShop');
      
      if (coffeeShopFeatures.length > 0) {
        const coffeeShopsGeoJson = {
          type: 'FeatureCollection',
          features: coffeeShopFeatures
        };
        
        // Generate shapefile content
        const shpContent = shpwrite.default.zip(coffeeShopsGeoJson, {
          folder: 'coffee_shops',
          types: {
            point: 'points'
          }
        });
        
        // Add to zip as a separate file
        zip.file('coffee_shops.zip', shpContent);
      }
      
      // Foot Traffic (points)
      const footTrafficFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'footTraffic');
      
      if (footTrafficFeatures.length > 0) {
        const footTrafficGeoJson = {
          type: 'FeatureCollection',
          features: footTrafficFeatures
        };
        
        // Generate shapefile content
        const shpContent = shpwrite.default.zip(footTrafficGeoJson, {
          folder: 'foot_traffic',
          types: {
            point: 'points'
          }
        });
        
        // Add to zip as a separate file
        zip.file('foot_traffic.zip', shpContent);
      }
      
      // Analysis Area (polygon)
      const boundaryFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'radius');
      
      if (boundaryFeatures.length > 0) {
        const boundariesGeoJson = {
          type: 'FeatureCollection',
          features: boundaryFeatures
        };
        
        // Generate shapefile content
        const shpContent = shpwrite.default.zip(boundariesGeoJson, {
          folder: 'boundaries',
          types: {
            polygon: 'polygons'
          }
        });
        
        // Add to zip as a separate file
        zip.file('boundaries.zip', shpContent);
      }
      
      // Add a README
      zip.file('README.txt', 
        'This package contains shapefile exports from the NYC Coffee Shop Map.\n\n' +
        (coffeeShopFeatures.length > 0 ? 'coffee_shops.zip - Point data for coffee shop locations\n' : '') +
        (footTrafficFeatures.length > 0 ? 'foot_traffic.zip - Point data for pedestrian activity\n' : '') +
        (boundaryFeatures.length > 0 ? 'boundaries.zip - Polygon data for analysis areas\n' : '') +
        '\nImport these files into your GIS software like ArcGIS or QGIS.'
      );
      
      // Generate final zip file
      const zipContent = await zip.generateAsync({ type: 'arraybuffer' });
      
      return new NextResponse(zipContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="coffee_map_export.zip"`
        }
      });
    } 
    else if (format === '.gdb') {
      // For GDB format (File Geodatabase)
      // We'll create a simplified representation as a collection of JSON files
      const geoJson = convertToGeoJSON(mapData, selectedLayers);
      
      const zip = new JSZip();
      
      // Add a folder structure similar to a File Geodatabase
      const gdbFolder = zip.folder("coffee_map.gdb");
      
      // Add feature classes as GeoJSON files for each selected layer
      const coffeeShopFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'coffeeShop');
      
      if (coffeeShopFeatures.length > 0) {
        gdbFolder.file('coffee_shops.geojson', JSON.stringify({
          type: 'FeatureCollection',
          features: coffeeShopFeatures
        }, null, 2));
      }
      
      const footTrafficFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'footTraffic');
      
      if (footTrafficFeatures.length > 0) {
        gdbFolder.file('foot_traffic.geojson', JSON.stringify({
          type: 'FeatureCollection',
          features: footTrafficFeatures
        }, null, 2));
      }
      
      const boundaryFeatures = geoJson.features.filter(f => 
        f.properties.layerType === 'radius');
      
      if (boundaryFeatures.length > 0) {
        gdbFolder.file('boundaries.geojson', JSON.stringify({
          type: 'FeatureCollection',
          features: boundaryFeatures
        }, null, 2));
      }
      
      // Add metadata files typical in a GDB
      gdbFolder.file('gdb_metadata.json', JSON.stringify({
        name: "Coffee Shop Map Export",
        description: "GIS data exported from the NYC Coffee Shop Map application",
        spatialReference: {
          wkid: 4326,
          latestWkid: 4326,
          name: "WGS 1984"
        },
        featureClasses: [
          coffeeShopFeatures.length > 0 ? {
            name: "coffee_shops",
            type: "Point",
            fields: ["name", "type", "potential", "featureId"]
          } : null,
          footTrafficFeatures.length > 0 ? {
            name: "foot_traffic",
            type: "Point",
            fields: ["intensity", "count", "time", "featureId"]
          } : null,
          boundaryFeatures.length > 0 ? {
            name: "boundaries",
            type: "Polygon",
            fields: ["name", "type", "radius"]
          } : null
        ].filter(Boolean), // Remove null entries
        created: new Date().toISOString()
      }, null, 2));
      
      // Add a README file explaining this is a simplified GDB
      zip.file('README.txt', 
        'This is a simplified representation of a File Geodatabase (GDB) format.\n\n' +
        'The coffee_map.gdb folder contains:\n' +
        (coffeeShopFeatures.length > 0 ? '- coffee_shops.geojson: Point features representing coffee shops\n' : '') +
        (footTrafficFeatures.length > 0 ? '- foot_traffic.geojson: Point features representing pedestrian activity\n' : '') +
        (boundaryFeatures.length > 0 ? '- boundaries.geojson: Polygon features representing analysis boundaries\n' : '') +
        '- gdb_metadata.json: Metadata about the geodatabase structure\n\n' +
        'To use this data in GIS software like ArcGIS or QGIS:\n' +
        '1. Extract the zip file\n' +
        '2. Import the individual GeoJSON files\n\n' +
        'Note: This is not a true Esri File Geodatabase, which would require\n' +
        'specialized software libraries to create and read.'
      );
      
      // Generate the zip file
      const zipContent = await zip.generateAsync({ type: 'arraybuffer' });
      
      return new NextResponse(zipContent, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="coffee_map_gdb.zip"`
        }
      });
    }
    else if (format === '.csv') {
      // Modified CSV export to handle multiple layers in separate files

      // Check how many layers are selected
      const selectedLayerCount = Object.values(selectedLayers).filter(Boolean).length;
      
      // If only one layer is selected, return a single CSV file
      if (selectedLayerCount === 1) {
        const csvContent = generateCSV(mapData, selectedLayers);
        
        return new NextResponse(csvContent, {
          status: 200,
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="coffee_map_export.csv"`
          }
        });
      } 
      // If multiple layers are selected, create a zip with multiple CSV files
      else {
        const zip = new JSZip();
        
        // Add a CSV file for each selected layer
        if (selectedLayers.coffeeShops && mapData.coffeeShops?.length > 0) {
          const coffeeShopsCsv = generateLayerCSV(mapData, 'coffeeShops');
          zip.file('coffee_shops.csv', coffeeShopsCsv);
        }
        
        if (selectedLayers.footTraffic && mapData.footTraffic?.length > 0) {
          const footTrafficCsv = generateLayerCSV(mapData, 'footTraffic');
          zip.file('foot_traffic.csv', footTrafficCsv);
        }
        
        if (selectedLayers.radius && mapData.radius) {
          const radiusCsv = generateLayerCSV(mapData, 'radius');
          zip.file('analysis_area.csv', radiusCsv);
        }
        
        // Add a README
        zip.file('README.txt', 
          'This package contains CSV exports from the NYC Coffee Shop Map.\n\n' +
          'Each file contains data for a different layer:\n' +
          (selectedLayers.coffeeShops ? '- coffee_shops.csv: Coffee shop locations data\n' : '') +
          (selectedLayers.footTraffic ? '- foot_traffic.csv: Pedestrian foot traffic data\n' : '') +
          (selectedLayers.radius ? '- analysis_area.csv: Analysis boundary data\n' : '')
        );
        
        // Generate the zip file
        const zipContent = await zip.generateAsync({ type: 'arraybuffer' });
        
        return new NextResponse(zipContent, {
          status: 200,
          headers: {
            'Content-Type': 'application/zip',
            'Content-Disposition': `attachment; filename="coffee_map_csv_export.zip"`
          }
        });
      }
    }
    
    // If we reach here, the format wasn't handled
    return NextResponse.json({ 
      error: 'Unsupported format', 
      message: `Format ${format} is not currently supported for server-side export.` 
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error in export-map API:', error);
    return NextResponse.json({ 
      error: 'Server error',
      message: 'Failed to process map export',
      details: error.message
    }, { status: 500 });
  }
}

// Helper function to convert map data to GeoJSON format based on selected layers
function convertToGeoJSON(mapData, selectedLayers = {}) {
  const features = [];
  
  // Process coffee shops (points)
  if (selectedLayers.coffeeShops && mapData.coffeeShops && mapData.coffeeShops.length > 0) {
    mapData.coffeeShops.forEach(shop => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [shop.lng, shop.lat] // GeoJSON uses [longitude, latitude] order
        },
        properties: {
          name: shop.name || 'Coffee Shop',
          type: shop.type || 'Coffee Shop',
          potential: shop.potential || 'existing',
          featureId: shop.featureId || '',
          layerType: 'coffeeShop' // Add layer type for filtering
        }
      });
    });
  }
  
  // Process foot traffic points
if (selectedLayers.footTraffic && mapData.footTraffic && mapData.footTraffic.length > 0) {
    mapData.footTraffic.forEach(point => {
      // Create base feature
      const feature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [point.lng, point.lat]
        },
        properties: {
          intensity: point.intensity || 0.5,
          count: point.count || 0,
          time: point.time || '',
          featureId: point.featureId || '',
          layerType: 'footTraffic' // Add layer type for filtering
        }
      };
      
      // If this point has original GeoJSON properties, include them
      if (point.originalProperties) {
        // Merge the original properties, keeping layerType
        feature.properties = {
          ...point.originalProperties,
          intensity: point.intensity || 0.5,
          layerType: 'footTraffic'
        };
      }
      
      features.push(feature);
    });
  }
  
  // Process radius circle (convert to polygon)
  if (selectedLayers.radius && mapData.radius) {
    const center = [mapData.radius.center.lng, mapData.radius.center.lat];
    const radiusInKm = mapData.radius.radius / 1000; // Convert meters to kilometers
    
    // Use turf.js to create a circle as a polygon
    const circlePolygon = turf.circle(center, radiusInKm, {
      steps: 64, // Number of vertices in the polygon
      units: 'kilometers'
    });
    
    // Add properties
    circlePolygon.properties = {
      name: 'Study Area',
      type: 'Boundary',
      radius: mapData.radius.radius,
      radiusUnit: 'meters',
      center: `${mapData.radius.center.lat},${mapData.radius.center.lng}`,
      layerType: 'radius' // Add layer type for filtering
    };
    
    features.push(circlePolygon);
  }
  
  return {
    type: 'FeatureCollection',
    features: features
  };
}

// Helper function to generate CSV content based on selected layers
function generateCSV(mapData, selectedLayers = {}) {
  // Create CSV header
  let csvContent = "layer_type,feature_id,name,latitude,longitude,additional_info\n";
  
  // Add coffee shop points
  if (selectedLayers.coffeeShops && mapData.coffeeShops && mapData.coffeeShops.length > 0) {
    mapData.coffeeShops.forEach(shop => {
      // Format each coffee shop as a CSV row, escaping quotes in text fields
      csvContent += `"Coffee Shop","${shop.featureId || ''}","${(shop.name || 'Coffee Shop').replace(/"/g, '""')}",${shop.lat},${shop.lng},"${shop.potential || 'existing'}"\n`;
    });
  }
  
  // Add foot traffic points
  if (selectedLayers.footTraffic && mapData.footTraffic && mapData.footTraffic.length > 0) {
    mapData.footTraffic.forEach(point => {
      const intensity = point.intensity || 0.5;
      const intensityCategory = intensity > 0.7 ? "High" : (intensity > 0.4 ? "Medium" : "Low");
      csvContent += `"Foot Traffic","${point.featureId || ''}","Point ${point.featureId || ''}",${point.lat},${point.lng},"Intensity: ${intensityCategory} (${(intensity * 10).toFixed(1)}/10)${point.count ? `, Count: ${point.count}` : ''}${point.time ? `, Time: ${point.time}` : ''}"\n`;
    });
  }
  
  // Add radius center point
  if (selectedLayers.radius && mapData.radius) {
    const center = mapData.radius.center;
    const radiusInMiles = (mapData.radius.radius / 1609.34).toFixed(2);
    csvContent += `"Analysis Area","radius-1","Times Square",${center.lat},${center.lng},"Radius: ${radiusInMiles} miles (${Math.round(mapData.radius.radius)} meters)"\n`;
  }
  
  return csvContent;
}

// New function to generate CSV for a specific layer
function generateLayerCSV(mapData, layerType) {
  let csvContent = "";
  
  // Coffee shops layer
  if (layerType === 'coffeeShops' && mapData.coffeeShops && mapData.coffeeShops.length > 0) {
    // Create header with coffee shop specific fields
    csvContent = "feature_id,name,latitude,longitude,potential,type\n";
    
    // Add each coffee shop
    mapData.coffeeShops.forEach(shop => {
      csvContent += `"${shop.featureId || ''}","${(shop.name || 'Coffee Shop').replace(/"/g, '""')}",${shop.lat},${shop.lng},"${shop.potential || 'existing'}","${shop.type || 'Coffee Shop'}"\n`;
    });
  }
  
 // Foot traffic layer
else if (layerType === 'footTraffic' && mapData.footTraffic && mapData.footTraffic.length > 0) {
    // Determine what fields to include in the CSV
    let fields = ["feature_id", "latitude", "longitude", "intensity", "intensity_category"];
    
    // Check if we have original GeoJSON properties to include
    const samplePoint = mapData.footTraffic.find(p => p.originalProperties);
    if (samplePoint && samplePoint.originalProperties) {
      // Add key temporal fields from the original properties
      const additionalFields = Object.keys(samplePoint.originalProperties)
        .filter(key => 
          // Include location info and selected time periods
          key === 'street_nam' || 
          key === 'from_stree' || 
          key === 'to_street' || 
          key === 'borough' ||
          // Include up to 10 time periods (AM, MD, PM) for best data representation
          key.includes('_am') || 
          key.includes('_md') || 
          key.includes('_pm'))
        .slice(0, 20); // Limit to 20 additional fields to keep CSV manageable
      
      fields = fields.concat(additionalFields);
    } else {
      // Use standard fields if no original properties
      fields = fields.concat(["count", "time"]);
    }
    
    // Create header
    csvContent = fields.join(",") + "\n";
    
    // Add each foot traffic point
    mapData.footTraffic.forEach(point => {
      const intensity = point.intensity || 0.5;
      const intensityCategory = intensity > 0.7 ? "High" : (intensity > 0.4 ? "Medium" : "Low");
      
      // Start with standard fields
      let row = [
        `"${point.featureId || ''}"`, 
        point.lat, 
        point.lng, 
        intensity, 
        `"${intensityCategory}"`
      ];
      
      // Add values for additional fields from original properties
      if (point.originalProperties) {
        for (let i = 5; i < fields.length; i++) {
          const field = fields[i];
          const value = point.originalProperties[field] || '';
          row.push(`"${value}"`);
        }
      } else {
        // Add standard fields if no original properties
        if (fields.includes("count")) row.push(`"${point.count || ''}"`);
        if (fields.includes("time")) row.push(`"${point.time || ''}"`);
      }
      
      csvContent += row.join(",") + "\n";
    });
  }
  
  // Radius/analysis area layer
  else if (layerType === 'radius' && mapData.radius) {
    // Create header for analysis area
    csvContent = "name,center_latitude,center_longitude,radius_meters,radius_miles\n";
    
    // Add the analysis area
    const center = mapData.radius.center;
    const radiusInMiles = (mapData.radius.radius / 1609.34).toFixed(2);
    csvContent += `"Times Square Analysis Area",${center.lat},${center.lng},${Math.round(mapData.radius.radius)},${radiusInMiles}\n`;
  }
  
  return csvContent;
}