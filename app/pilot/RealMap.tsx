'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon not showing in React-Leaflet
const DefaultIcon = L.icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
});

if (typeof window !== 'undefined') {
    L.Marker.prototype.options.icon = DefaultIcon;
}

// Custom Clean Premium Marker
const createCleanIcon = (color: string) => {
    if (typeof window === 'undefined') return null;
    return L.divIcon({
        className: 'custom-clean-icon',
        html: `
            <div style="position: relative; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; transform: translate(-50%, -85%);">
                <!-- Subtle Outer Pulse -->
                <div style="position: absolute; width: 100%; height: 100%; border: 1.5px solid ${color}; border-radius: 50%; opacity: 0.6; animation: ping-soft 2.5s ease-out infinite;"></div>
                
                <!-- Minimalist Pin -->
                <div style="position: relative; z-index: 10; filter: drop-shadow(0 4px 10px rgba(0,0,0,0.4));">
                    <svg width="30" height="38" viewBox="0 0 30 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M15 0C6.7 0 0 6.7 0 15C0 23.3 15 38 15 38C15 38 30 23.3 30 15C30 6.7 23.3 0 15 0Z" fill="white"/>
                        <path d="M15 2C7.8 2 2 7.8 2 15C2 22.2 13.5 34.5 15 34.5C16.5 34.5 28 22.2 28 15C28 7.8 22.2 2 15 2Z" fill="${color}" fill-opacity="0.9"/>
                        <circle cx="15" cy="15" r="4.5" fill="white"/>
                    </svg>
                </div>
            </div>
        `,
        iconSize: [0, 0],
        iconAnchor: [0, 0]
    });
};


export default function RealMap({ selectedNode, setSelectedNode, nodes }: any) {
    // Map auto-refresh and recentering
    function MapController({ nodes }: { nodes: any[] }) {
        const map = useMap();

        useEffect(() => {
            if (nodes.length > 0) {
                // Invalidate size helps fix rendering issues in dynamic layouts
                map.invalidateSize();

                // If a node is selected, fly to it
                if (selectedNode && selectedNode.lat && selectedNode.lng) {
                    map.flyTo([selectedNode.lat, selectedNode.lng], 12, { duration: 1.5 });
                }
            }
        }, [nodes, selectedNode, map]);

        return null;
    }

    return (
        <div className="w-full h-full relative" style={{ minHeight: '100%' }}>
            <MapContainer
                center={[26.1144, 91.7266]}
                zoom={4}
                className="w-full h-full bg-black satellite-surface"
                zoomControl={false}
                scrollWheelZoom={true}
            >
                {/* Real High-Resolution Satellite Surface - ESRI WORLD IMAGERY */}
                <TileLayer
                    attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                    detectRetina={true}
                    maxZoom={19}
                />

                <TileLayer
                    url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
                    pane="markerPane" // Ensures labels appear above the satellite tiles but integrated with the map content
                    opacity={1}
                />

                {/* Non-clustered visual elements (Circles) */}
                {nodes.map((node: any) => {
                    if (!node.lat || !node.lng) return null;
                    return (
                        <Circle
                            key={`circle-${node.id}`}
                            center={[node.lat, node.lng]}
                            radius={60000}
                            pathOptions={{
                                fillColor: node.color,
                                fillOpacity: 0.1,
                                color: node.color,
                                weight: 1,
                                dashArray: '2, 6',
                                opacity: 0.4
                            }}
                        />
                    );
                })}

                {/* Operative Pins */}
                {nodes.map((node: any) => {
                    if (!node.lat || !node.lng) return null;

                    const icon = createCleanIcon(node.color);
                    if (!icon) return null;

                    return (
                        <Marker
                            key={`marker-${node.id}`}
                            position={[node.lat, node.lng]}
                            icon={icon}
                            eventHandlers={{
                                click: () => setSelectedNode(node)
                            }}
                        />
                    );
                })}

                <MapController nodes={nodes} />

                <style jsx global>{`
                    .leaflet-container {
                        background: #000000 !important;
                        outline: none;
                    }
                    @keyframes ping-soft {
                        0% { transform: scale(1); opacity: 0.6; }
                        100% { transform: scale(3.5); opacity: 0; }
                    }
                    .satellite-surface .leaflet-tile-container {
                        filter: brightness(0.85) contrast(1.1) saturate(1.2) !important;
                    }
                    .leaflet-control-attribution {
                        display: none !important;
                    }
                `}</style>
            </MapContainer>

            {/* Black surface to hide watermark area and provide clean bottom edge */}
            <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent z-[1000] pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-4 bg-black z-[1001] pointer-events-none" />
        </div>
    );
}
