import React, { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

// Import leaflet.heat plugin - this extends L with heatLayer method
import 'leaflet.heat';

// Function to calculate distance between two points (Haversine formula)
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

// Function to calculate density-based intensity (optimized)
const calculateIntensity = (reports, clusterRadius = 0.5) => {
  if (!reports || reports.length === 0) return [];

  // For small datasets, use all points
  // For larger datasets, we'll still use all points but optimize the calculation
  const heatData = [];
  
  // Create a grid-based approach for better performance with large datasets
  // Group reports into grid cells to reduce distance calculations
  const gridSize = 0.01; // Approximately 1km grid cells
  const grid = new Map();
  
  // First pass: assign reports to grid cells
  reports.forEach((report) => {
    if (!report.latitude || !report.longitude) return;
    const gridKey = `${Math.floor(report.latitude / gridSize)},${Math.floor(report.longitude / gridSize)}`;
    if (!grid.has(gridKey)) {
      grid.set(gridKey, []);
    }
    grid.get(gridKey).push(report);
  });

  // Second pass: calculate intensity for each report
  // Only check nearby grid cells for density calculation
  reports.forEach((report) => {
    if (!report.latitude || !report.longitude) return;
    
    const lat = report.latitude;
    const lng = report.longitude;
    let nearbyCount = 0;
    
    // Check reports in the same grid cell and adjacent cells
    const latGrid = Math.floor(lat / gridSize);
    const lngGrid = Math.floor(lng / gridSize);
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const gridKey = `${latGrid + i},${lngGrid + j}`;
        const cellReports = grid.get(gridKey);
        if (cellReports) {
          cellReports.forEach((otherReport) => {
            const distance = calculateDistance(
              lat,
              lng,
              otherReport.latitude,
              otherReport.longitude
            );
            if (distance <= clusterRadius) {
              nearbyCount++;
            }
          });
        }
      }
    }

    // Intensity calculation: use a combination that works well with heatmap visualization
    // Square root gives good distribution, and we add a base value
    const baseIntensity = Math.max(1, Math.sqrt(nearbyCount));
    heatData.push([lat, lng, baseIntensity]);
  });

  return heatData;
};

const HeatmapLayer = ({ data = [] }) => {
  const map = useMap();
  const heatLayerRef = useRef(null);

  useEffect(() => {
    // Check if heatLayer is available
    if (typeof L === 'undefined' || !L.heatLayer) {
      console.error('L.heatLayer is not available. Make sure leaflet.heat is installed.');
      return;
    }

    // Cleanup previous layer
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
      heatLayerRef.current = null;
    }

    if (!data || data.length === 0) {
      return;
    }

    // Filter valid reports
    const validReports = data.filter(
      report => report.latitude && report.longitude &&
      typeof report.latitude === 'number' &&
      typeof report.longitude === 'number' &&
      !isNaN(report.latitude) &&
      !isNaN(report.longitude)
    );

    if (validReports.length === 0) {
      return;
    }

    // Calculate intensity based on density
    // Use 500m cluster radius - good balance between local and regional patterns
    const heatData = calculateIntensity(validReports, 0.5);

    if (heatData.length === 0) {
      return;
    }

    // Find max and min intensity for normalization
    const intensities = heatData.map(point => point[2]);
    const maxIntensity = Math.max(...intensities);
    const minIntensity = Math.min(...intensities);
    
    // Normalize to 0-1 range with better distribution
    // Use min-max normalization with slight gamma correction for better visualization
    const normalizedHeatData = heatData.map(point => {
      let normalized;
      if (maxIntensity > minIntensity) {
        // Normalize to 0-1 range
        normalized = (point[2] - minIntensity) / (maxIntensity - minIntensity);
        // Apply slight enhancement to highlight hotspots (gamma correction)
        normalized = Math.pow(normalized, 0.85);
      } else {
        // All points have same intensity - set to medium
        normalized = 0.5;
      }
      // Ensure values are in valid range and visible
      return [point[0], point[1], Math.max(0.05, Math.min(1.0, normalized))];
    });

    // Create heatmap layer with improved configuration
    // Adjust radius and blur based on data density for optimal visualization
    const dataCount = normalizedHeatData.length;
    const radius = dataCount > 100 ? 80 : dataCount > 50 ? 60 : 50;
    const blur = dataCount > 100 ? 35 : dataCount > 50 ? 28 : 25;
    
    const heatLayer = L.heatLayer(normalizedHeatData, {
      radius: radius,    // Dynamic radius based on data density
      blur: blur,        // Dynamic blur for smoother gradients
      maxZoom: 18,
      max: 1.0,
      minOpacity: 0.4,   // Minimum opacity for better visibility
      gradient: {
        0.0: 'blue',     // Very low density - blue
        0.15: 'cyan',    // Low density - cyan  
        0.3: 'lime',     // Low-medium - lime green
        0.5: 'yellow',   // Medium - yellow
        0.7: 'orange',   // Medium-high - orange
        0.85: 'red',     // High - red
        1.0: 'darkred'   // Very high - dark red
      }
    });

    heatLayer.addTo(map);
    heatLayerRef.current = heatLayer;

    // Cleanup function
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
        heatLayerRef.current = null;
      }
    };
  }, [data, map]);

  return null;
};

export default HeatmapLayer;
