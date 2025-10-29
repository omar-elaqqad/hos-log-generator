// src/components/MapDisplay.js

import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "../styles/main.css";

// Custom Icons for Different Stop Types
const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
});

const iconMap = {
    current: { icon: createIcon('green'), label: 'Start', color: '#28a745' },
    pickup: { icon: createIcon('blue'), label: 'Pickup', color: '#007bff' },
    rest: { icon: createIcon('violet'), label: 'End of Day Rest', color: '#8a2be2' },
    fuel: { icon: createIcon('orange'), label: 'Fuel Stop', color: '#fd7e14' },
    dropoff: { icon: createIcon('red'), label: 'Dropoff', color: '#dc3545' },
    default: { icon: createIcon('grey'), label: 'Stop', color: '#6c757d' }
};

// Map Legend Component
const MapLegend = () => (
    <div className="map-legend">
        {Object.values(iconMap).map(item => (
            <div key={item.label} className="legend-item">
                <div className="legend-color-box" style={{ backgroundColor: item.color }}></div>
                <span>{item.label}</span>
            </div>
        ))}
    </div>
);

// Helper component to auto-zoom the map
const AutoFitBounds = ({ bounds }) => {
    const map = useMap();
    useEffect(() => {
        if (bounds && bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }
    }, [map, bounds]);
    return null;
};

const MapDisplay = ({ routePoints, stops }) => {
    if (!routePoints || routePoints.length < 1 || !stops || stops.length === 0) {
        return <p>Map data is incomplete.</p>;
    }

    const allCoords = stops.map(s => s.coords).filter(c => c);
    if (allCoords.length === 0) return <p>No valid coordinates for map stops.</p>;
    
    const bounds = L.latLngBounds(allCoords);

    return (
        <div>
            <MapContainer
                bounds={bounds}
                style={{ height: "500px", width: "100%", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                scrollWheelZoom={true}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution="&copy; OpenStreetMap contributors"
                />
                <AutoFitBounds bounds={bounds} />
                <Polyline positions={routePoints} color="#0055c2" weight={5} />
                {stops.map((stop, index) => (
                    stop.coords && 
                    <Marker 
                        key={index} 
                        position={stop.coords} 
                        icon={iconMap[stop.type]?.icon || iconMap.default.icon}
                    >
                        <Popup>{stop.label}</Popup>
                    </Marker>
                ))}
            </MapContainer>
            <MapLegend />
        </div>
    );
};

export default MapDisplay;