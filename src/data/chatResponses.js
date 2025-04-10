export const chatResponses = {
  "Help me prioritize our budget across Vancouver based on flood risk and infrastructure needs. Also add relevant 311 call data and socio-economic demographics to this": {
    text: "Here's your interactive map with flood zones, infrastructure conditions, stormwater projects, 311 calls, and demographic indicators.\n\n Key insights: \n\n1. Eastern neighborhoods show both high flood risk and aging sewer infrastructure \n2. Three high-density residential areas have significant flood risk but no current projects \n3. Northwestern areas have clustered 311 drainage complaints that align with flood risk models. \n\nThese patterns suggest where budget allocation would have maximum impact. Would you like me to create a composite risk-need index to help prioritize specific areas?",
    timing: [1000, 2000, 3000, 2500, 2000, 1500], // Timing for each line
    artifacts: [{
      type: "map",
      title: "Vancouver Flood Risk & Infrastructure Priority Map",
      component: "MapComponent",
      data: {
        layers: ["flood_zones", "stormwater_projects", "infrastructure_conditions", "311_data", "demographics"],
        operations: ["overlay", "index_calculation"]
      }
    }, {
      type: "chart",
      title: "Budget Priority Analysis Dashboard",
      component: "BudgetDashboard",
      data: {
        source: "data/budget-data.csv",
        chartOptions: [
          { id: 'category-budget', name: 'Budget & Spending by Service Category' },
          { id: 'streets-subcategory', name: 'Streets Budget by Subcategory' },
          { id: 'yearly-spending', name: 'Yearly Spending Forecast (2025-2029)' },
          { id: 'top-projects', name: 'Top 10 Projects by Budget' },
          { id: 'project-count', name: 'Project Count by Category' }
        ]
      }
    }]
  },
  "What is a composite risk-need index?": {
    text: "A composite risk index combines multiple factors that affect infrastructure planning decisions into a single actionable score.\n\nFor urban flood management, this typically integrates physical vulnerability (flood zones, infrastructure age), social vulnerability (population density, income levels), and historical data (311 calls, past incidents).\n\nThis approach helps planners quickly identify which areas face the greatest combined threats and where limited budget can have the most impact across multiple planning objectives.\n\nWould you like me to create a composite risk-need index to help prioritize specific areas?",
    timing: [1200, 2500, 2000, 1800], // Different timing for each line
    artifacts: [] 
  },
  "Yes, please create an index.": {
    text: "Creating composite index with weighted factors: flood risk (35%), infrastructure condition (25%), 311 calls (15%), population density (15%), and social vulnerability (10%).\n\nRed areas represent highest priority zones. Click any area to see its score breakdown.\n\nShould we examine how current projects align with these priorities?",
    timing: [3000, 2500, 1500], // Longer initial pause to simulate "thinking"
    artifacts: [{
      type: "map",
      title: "Budget Priority Index Distribution",
      component: "RiskComponent",
      data: {
        type: "bar",
        labels: ["Downtown", "East Vancouver", "South Vancouver", "West Side", "North Vancouver"],
        datasets: [{
          label: "Priority Score",
          data: [78, 92, 85, 64, 71]
        }]
      }
    }]
  },
  "Can you do a Benefit-Cost Analysis for these areas and identify which ones we should focus on?": {
    text: "Projects with highest benefit-cost ratios:\n\n1. Green infrastructure in East Vancouver (BCA: 4.3)\n2. Sewer upgrades in Northwest district (BCA: 3.8)\n3. Detention basin improvements near harbor (BCA: 3.2)\n\nProjects in the upper-right quadrant of BCA vs. Risk Index, deliver highest ROI while addressing critical risk areas. I recommend prioritizing these in your budget.",
    timing: [1500, 800, 800, 800, 2500], // Quick succession for list items, longer for conclusion
    artifacts: [{
      type: "chart",
      title: "Benefit-Cost Analysis by Project Area",
      component: "IndexDashboard",
      data: {
        type: "scatter",
        datasets: [{
          label: "Projects",
          data: [
            { x: 85, y: 4.3, r: 15, label: "East Van Green Infrastructure" },
            { x: 78, y: 3.8, r: 18, label: "Northwest Sewer Upgrades" },
            { x: 72, y: 3.2, r: 12, label: "Harbor Detention Basin" }
          ]
        }]
      }
    }, {
      type: "map",
      title: "Benefit-Cost Analysis",
      component: "FourMap",
      data: {
        source: "data/budget-data.csv",
        chartOptions: [
          { id: 'category-budget', name: 'Budget & Spending by Service Category' },
          { id: 'streets-subcategory', name: 'Streets Budget by Subcategory' },
          { id: 'yearly-spending', name: 'Yearly Spending Forecast (2025-2029)' },
          { id: 'top-projects', name: 'Top 10 Projects by Budget' },
          { id: 'project-count', name: 'Project Count by Category' }
        ]
      }
    }]
  },
  "Put all of this in a report": {
    text: "Report includes priority analysis, maps, methodology, recommendations, and implementation timeline.",
    timing: [2000], // Single line, just need one timing value
    artifacts: [{
      type: "report",
      title: "Vancouver Infrastructure Budget Prioritization Report",
      component: "ReportComponentVancouver",
      data: {
        sections: ["Executive Summary", "Methodology", "Findings", "Recommendations", "Implementation Timeline"],
        priority: "high"
      }
    }]
  },
  "I've just uploaded Dallas's new affordable housing policy document. Can you map current affordable housing projects?": {
    text: "I've analyzed the Dallas Housing Policy 2033 Action Plan you uploaded. The map shows 83 total affordable housing developments across Dallas - 56 from the HUD LIHTC database and 27 from the Reinvestment Areas Combined dataset. I've color-coded them to distinguish the data sources. Looking at the distribution, I notice that 64% of existing developments fall within the policy's high-priority reinvestment zones, but there's a significant gap in coverage for transit-oriented development areas identified in the 2033 Action Plan, particularly along the planned Silver Line corridor.",
    timing: [4000], // Single long paragraph, single timing value
    artifacts: [{
      type: "map",
      title: "Dallas Affordable Housing Developments Map",
      component: "HousingMapComponent",
      data: {
        layers: ["housing_developments", "reinvestment_zones", "transit_lines"],
        points: [
          { type: "LIHTC", count: 56, color: "#3388ff" },
          { type: "Reinvestment", count: 27, color: "#ff6644" }
        ]
      }
    }]
  },
  "Open the report for the Vickery Meadow project and summarize the key metrics.": {
    text: "The Vickery Meadow plan focuses on 5 key metrics that align with the 2033 Housing Policy:\n\n1. Housing Diversity: Currently 78% multifamily units, with a goal to increase owner-occupied housing by 15% by 2030.\n2. Economic Mobility: Plan targets reduction in poverty rate from current 37% to 25% through mixed-income development.\n3. Safety Initiatives: Includes lighting improvements and design standards that meet the 2033 Policy's community safety requirements.\n4. Educational Partnerships: Five educational facilities identified for co-location with housing developments, exceeding the 2033 Policy recommendation of integrated community services.\n5. Infrastructure Investment: $12.4M allocated for connectivity improvements, which falls short of the 2033 Policy's recommendation of $18M for areas of this size.\n\nKey stakeholders include the Vickery Meadow Public Improvement District, Dallas Housing Authority, and five neighborhood associations serving the area's diverse population of over 38,000 residents.",
    timing: [2000, 1000, 1000, 1000, 1000, 1000, 2000], // Intro, 5 points, and conclusion
    artifacts: [{
      type: "report",
      title: "Vickery Meadow Housing Project Analysis",
      component: "SevenExtract",
      data: {
        metrics: [
          { name: "Housing Diversity", current: "78% multifamily", target: "63% multifamily" },
          { name: "Economic Mobility", current: "37% poverty rate", target: "25% poverty rate" },
          { name: "Safety Score", current: 68, target: 85 },
          { name: "Educational Integration", current: 5, target: 3 },
          { name: "Infrastructure Budget", current: "$12.4M", target: "$18M" }
        ],
        stakeholders: [
          "Vickery Meadow Public Improvement District",
          "Dallas Housing Authority",
          "5 Neighborhood Associations",
          "38,000 residents"
        ]
      }
    }]
  },
  "What specific changes would you recommend to better align these developments with the Dallas Housing Policy 2033 Action Plan?": {
    text: "1. Infrastructure Connectivity: 72% of HUD LIHTC properties need improved pedestrian and transit connectivity to meet the 2033 Policy's mobility goals. The highest priority should be the five developments along the Skillman corridor in Vickery Meadow.\n\n2. Mixed-Income Integration: The Reinvestment Areas dataset shows 64% of developments have less income diversity than the new policy recommends. I suggest focusing first on the Oak Cliff projects where minor adjustments to unit allocation could quickly improve compliance.\n\n3. Preservation vs. New Construction: Current projects are weighted 70% toward new construction, while the 2033 Policy recommends a 60/40 balance. Redirecting approximately $8.4M from planned new developments to preservation efforts in Southern Dallas would better align with policy goals.\n\nWould you like me to generate a detailed report comparing all projects against the 2033 Policy requirements?",
    timing: [2000, 2000, 2000, 2500], // Three points and a conclusion
    artifacts: [] 
  },
  "Put this in a report": {
    text: "I've compiled a comprehensive report on aligning current affordable housing developments with the Dallas Housing Policy 2033 Action Plan. The report includes detailed gap analysis, specific recommendations for each development area, budget reallocation strategies, and an implementation timeline.",
    timing: [2500], // Single paragraph
    artifacts: [{
      type: "report",
      title: "Dallas Housing Policy Alignment Report",
      component: "ReportComponent",
      data: {
        sections: ["Executive Summary", "Gap Analysis", "Development Recommendations", "Budget Strategies", "Implementation Timeline"],
        priority: "high"
      }
    }]
  }
};