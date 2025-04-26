import { NextResponse } from 'next/server';
import * as turf from '@turf/turf';
import JSZip from 'jszip';

export async function POST(request) {
  try {
    const data = await request.json();
    const { format, mapData } = data;
    
    if (format === '.shp') {
      // For Shapefile format
      // Since we need to use shp-write dynamically (it might not be compatible with all environments),
      // we'll do a dynamic import
      const shpwrite = await import('shp-write');
      
      // Convert mapData to GeoJSON
      const geoJson = convertToGeoJSON(mapData);
      
      // Create a zip file with the shapefile components
      const zip = new JSZip();
      
      // Process points and polygons separately
      const pointFeatures = geoJson.features.filter(f => f.geometry.type === 'Point');
      if (pointFeatures.length > 0) {
        const pointsGeoJson = {
          type: 'FeatureCollection',
          features: pointFeatures
        };
        
        // Generate shapefile content
        const shpContent = shpwrite.default.zip(pointsGeoJson, {
          folder: 'coffee_shops',
          types: {
            point: 'points'
          }
        });
        
        // Add to zip as a separate file
        zip.file('coffee_shops.zip', shpContent);
      }
      
      // Process polygon features (circles, etc.)
      const polygonFeatures = geoJson.features.filter(f => f.geometry.type === 'Polygon');
      if (polygonFeatures.length > 0) {
        const polygonsGeoJson = {
          type: 'FeatureCollection',
          features: polygonFeatures
        };
        
        // Generate shapefile content
        const shpContent = shpwrite.default.zip(polygonsGeoJson, {
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
        'This package contains shapefile exports from the Coffee Shop Map.\n\n' +
        'coffee_shops.zip - Point data for coffee shop locations\n' +
        'boundaries.zip - Polygon data for study areas\n\n' +
        'Import these files into your GIS software like ArcGIS or QGIS.'
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
      const geoJson = convertToGeoJSON(mapData);
      
      const zip = new JSZip();
      
      // Add a folder structure similar to a File Geodatabase
      const gdbFolder = zip.folder("coffee_map.gdb");
      
      // Add feature classes as GeoJSON files
      const pointFeatures = geoJson.features.filter(f => f.geometry.type === 'Point');
      if (pointFeatures.length > 0) {
        gdbFolder.file('coffee_shops.geojson', JSON.stringify({
          type: 'FeatureCollection',
          features: pointFeatures
        }, null, 2));
      }
      
      const polygonFeatures = geoJson.features.filter(f => f.geometry.type === 'Polygon');
      if (polygonFeatures.length > 0) {
        gdbFolder.file('boundaries.geojson', JSON.stringify({
          type: 'FeatureCollection',
          features: polygonFeatures
        }, null, 2));
      }
      
      // Add metadata files typical in a GDB
      gdbFolder.file('gdb_metadata.json', JSON.stringify({
        name: "Coffee Shop Map Export",
        description: "GIS data exported from the Coffee Shop Map application",
        spatialReference: {
          wkid: 4326,
          latestWkid: 4326,
          name: "WGS 1984"
        },
        featureClasses: [
          {
            name: "coffee_shops",
            type: "Point",
            fields: ["name", "type", "potential"]
          },
          {
            name: "boundaries",
            type: "Polygon",
            fields: ["name", "type", "radius"]
          }
        ],
        created: new Date().toISOString()
      }, null, 2));
      
      // Add a README file explaining this is a simplified GDB
      zip.file('README.txt', 
        'This is a simplified representation of a File Geodatabase (GDB) format.\n\n' +
        'The coffee_map.gdb folder contains:\n' +
        '- coffee_shops.geojson: Point features representing coffee shops\n' +
        '- boundaries.geojson: Polygon features representing analysis boundaries\n' +
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
      // Generate CSV data
      const csvContent = generateCSV(mapData);
      
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="coffee_map_export.csv"`
        }
      });
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

// Helper function to convert map data to GeoJSON format
function convertToGeoJSON(mapData) {
  const features = [];
  
  // Process coffee shops (points)
  if (mapData.coffeeShops && mapData.coffeeShops.length > 0) {
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
          potential: shop.potential || 'existing'
        }
      });
    });
  }
  
  // Process radius circle (convert to polygon)
  if (mapData.radius) {
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
      center: `${mapData.radius.center.lat},${mapData.radius.center.lng}`
    };
    
    features.push(circlePolygon);
  }
  
  return {
    type: 'FeatureCollection',
    features: features
  };
}

// Helper function to generate CSV content
function generateCSV(mapData) {
  // Create CSV header
  let csvContent = "type,name,latitude,longitude,additional_info\n";
  
  // Add coffee shop points
  if (mapData.coffeeShops && mapData.coffeeShops.length > 0) {
    mapData.coffeeShops.forEach(shop => {
      // Format each coffee shop as a CSV row, escaping quotes in text fields
      csvContent += `"Point","${(shop.name || 'Coffee Shop').replace(/"/g, '""')}",${shop.lat},${shop.lng},"${shop.potential || 'existing'}"\n`;
    });
  }
  
  // Add radius center point
  if (mapData.radius) {
    const center = mapData.radius.center;
    csvContent += `"Center","Times Square",${center.lat},${center.lng},"Radius: ${(mapData.radius.radius / 1609.34).toFixed(2)} miles"\n`;
  }
  
  return csvContent;
}