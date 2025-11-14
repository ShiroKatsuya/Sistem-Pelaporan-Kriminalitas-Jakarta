import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

const ZoneLayer = ({ zones = [], onZoneClick }) => {
  const map = useMap();

  useEffect(() => {
    if (!zones || zones.length === 0) return;

    const layers = [];

    zones.forEach((zone) => {
      try {
        // Convert GeoJSON to Leaflet layer
        const geoJsonLayer = L.geoJSON(zone.geometry, {
          style: (feature) => {
            return {
              color: zone.warna || '#FF0000',
              fillColor: zone.warna || '#FF0000',
              fillOpacity: 0.3,
              weight: 2,
              opacity: 0.8,
            };
          },
          onEachFeature: (feature, layer) => {
            // Add popup
            const popupContent = `
              <div>
                <h3 class="font-bold">${zone.nama}</h3>
                <p><strong>Level Risiko:</strong> ${zone.level_risiko}</p>
              </div>
            `;
            layer.bindPopup(popupContent);

            // Add click handler
            if (onZoneClick) {
              layer.on('click', () => {
                onZoneClick(zone);
              });
            }
          },
        });

        geoJsonLayer.addTo(map);
        layers.push(geoJsonLayer);
      } catch (error) {
        console.error('Error rendering zone:', error);
      }
    });

    // Cleanup
    return () => {
      layers.forEach((layer) => {
        map.removeLayer(layer);
      });
    };
  }, [zones, map, onZoneClick]);

  return null;
};

export default ZoneLayer;

