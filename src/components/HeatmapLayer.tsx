import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

// Extend the Leaflet types to include heatLayer
declare module 'leaflet' {
    function heatLayer(
        latlngs: Array<[number, number, number?]>,
        options?: {
            minOpacity?: number;
            maxZoom?: number;
            max?: number;
            radius?: number;
            blur?: number;
            gradient?: Record<number, string>;
        }
    ): L.Layer;
}

interface HeatmapPoint {
    latitude: number;
    longitude: number;
    weight: number;
}

interface HeatmapLayerProps {
    points: HeatmapPoint[];
    fitBounds?: boolean;
}

const HeatmapLayer = ({ points, fitBounds = true }: HeatmapLayerProps) => {
    const map = useMap();

    useEffect(() => {
        if (!points || points.length === 0) return;

        const heatData: [number, number, number][] = points.map((p) => [
            p.latitude,
            p.longitude,
            p.weight,
        ]);

        const heat = L.heatLayer(heatData, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            minOpacity: 0.4,
            gradient: {
                0.2: '#2196F3',
                0.4: '#4CAF50',
                0.6: '#FFEB3B',
                0.8: '#FF9800',
                1.0: '#F44336',
            },
        });

        heat.addTo(map);

        // Fit bounds to show all points
        if (fitBounds && heatData.length > 0) {
            const bounds = L.latLngBounds(heatData.map(([lat, lng]) => [lat, lng]));
            map.fitBounds(bounds, { padding: [30, 30], maxZoom: 16 });
        }

        return () => {
            map.removeLayer(heat);
        };
    }, [points, map, fitBounds]);

    return null;
};

export default HeatmapLayer;
