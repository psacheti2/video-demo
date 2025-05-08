/**
 * Map Context Helper
 * Utility functions to gather rich context information from the map
 */

// Function to extract information about features in a given area
export const getMapContextForArea = (map, bounds, options = {}) => {
    if (!map || !bounds) return null;
    
    const context = {
      bounds: bounds.toBBoxString(),
      center: bounds.getCenter(),
      // Default to NYC Times Square if not specified
      locationName: options.locationName || "New York City Times Square area",
      coffeeShops: [],
      footTrafficPoints: [],
      totalCoffeeShops: 0,
      highTrafficAreas: 0,
      mediumTrafficAreas: 0,
      lowTrafficAreas: 0,
      nearbyStreets: [],
      estimatedPopulation: null,
      notes: []
    };
    
    // Count coffee shops and gather information
    if (map.coffeeShopsLayer) {
      map.coffeeShopsLayer.eachLayer(layer => {
        if (!layer.getLatLng || !bounds.contains(layer.getLatLng())) return;
        
        context.totalCoffeeShops++;
        
        // Extract more details if available
        let shopInfo = { position: layer.getLatLng() };
        
        if (layer.getPopup) {
          const popupContent = layer.getPopup().getContent();
          
          // Extract name if available
          const nameMatch = popupContent.match(/Name:\s*([^<]+)/);
          if (nameMatch && nameMatch[1]) {
            shopInfo.name = nameMatch[1].trim();
          }
          
          // Extract address if available
          const addressMatch = popupContent.match(/Address:\s*([^<]+)/);
          if (addressMatch && addressMatch[1]) {
            shopInfo.address = addressMatch[1].trim();
          }
          
          // Extract any other relevant information
          const gradeMatch = popupContent.match(/Grade:\s*([^<]+)/);
          if (gradeMatch && gradeMatch[1]) {
            shopInfo.grade = gradeMatch[1].trim();
          }
        }
        
        context.coffeeShops.push(shopInfo);
      });
    }
    
    // Analyze foot traffic data
    if (map.footTrafficLayer) {
      map.footTrafficLayer.eachLayer(layer => {
        // Handle both individual markers and heatmap
        if (layer.getLatLng && bounds.contains(layer.getLatLng())) {
          let trafficInfo = { position: layer.getLatLng() };
          
          // Try to get intensity from popup or properties
          if (layer.getPopup) {
            const popupContent = layer.getPopup().getContent();
            const intensityMatch = popupContent.match(/Intensity:\s*([^<\/]+)/);
            
            if (intensityMatch && intensityMatch[1]) {
              trafficInfo.intensity = intensityMatch[1].trim();
              
              // Categorize traffic
              const intensityValue = parseFloat(trafficInfo.intensity);
              if (intensityValue > 7) context.highTrafficAreas++;
              else if (intensityValue > 4) context.mediumTrafficAreas++;
              else context.lowTrafficAreas++;
            }
          }
          
          context.footTrafficPoints.push(trafficInfo);
        }
      });
    }
    
    // Add any additional context notes
    if (context.totalCoffeeShops > 3) {
      context.notes.push("This area has high coffee shop density");
    }
    
    if (context.highTrafficAreas > 2) {
      context.notes.push("This area has multiple high foot traffic zones");
    }
    
    return context;
  };
  
  // Function to format context as text for inclusion in chat messages
  export const formatMapContextAsText = (context) => {
    if (!context) return "";
    
    let text = `Map Context: ${context.locationName}\n`;
    text += `• Center: ${context.center.lat.toFixed(6)}, ${context.center.lng.toFixed(6)}\n`;
    
    if (context.totalCoffeeShops > 0) {
      text += `• Coffee Shops: ${context.totalCoffeeShops} in the selected area\n`;
      
      // List a few if there aren't too many
      if (context.totalCoffeeShops <= 3 && context.coffeeShops.length > 0) {
        context.coffeeShops.forEach((shop, idx) => {
          text += `  - ${shop.name || `Shop #${idx+1}`}${shop.grade ? ` (Grade: ${shop.grade})` : ''}\n`;
        });
      }
    }
    
    if (context.footTrafficPoints.length > 0) {
      text += `• Foot Traffic: ${context.footTrafficPoints.length} data points\n`;
      if (context.highTrafficAreas > 0) text += `  - High traffic areas: ${context.highTrafficAreas}\n`;
      if (context.mediumTrafficAreas > 0) text += `  - Medium traffic areas: ${context.mediumTrafficAreas}\n`;
      if (context.lowTrafficAreas > 0) text += `  - Low traffic areas: ${context.lowTrafficAreas}\n`;
    }
    
    if (context.notes.length > 0) {
      text += `• Additional Notes:\n`;
      context.notes.forEach(note => {
        text += `  - ${note}\n`;
      });
    }
    
    return text;
  };
  
  // Function to create a rich question with map context
  export const createRichMapQuestion = (question, map, bounds, options = {}) => {
    const context = getMapContextForArea(map, bounds, options);
    const contextText = formatMapContextAsText(context);
    
    // Combine question with context
    return `${question}\n\n${contextText}`;
  };