import React, { useEffect, useState } from 'react';
import { Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

const LandmarksLayer = () => {
    const map = useMap();
    const [landmarks, setLandmarks] = useState([]);
    const [rivers, setRivers] = useState([]);

    const fetchLandmarks = async () => {
        const bounds = map.getBounds();
        const bbox = `${bounds.getSouth()},${bounds.getWest()},${bounds.getNorth()},${bounds.getEast()}`;
        
        // Overpass query for important landmarks and geography
        const query = `
            [out:json][timeout:25];
            (
              node["amenity"~"school|market|place_of_worship|hospital"](${bbox});
              node["natural"~"water|peak"](${bbox});
              way["waterway"~"river"](${bbox});
            );
            out body;
            >;
            out skel qt;
        `;
        
        try {
            const response = await fetch('https://overpass-api.de/api/interpreter', {
                method: 'POST',
                body: query
            });
            const data = await response.json();
            
            const newLandmarks = data.elements.filter(e => e.type === 'node').map(e => ({
                id: e.id,
                lat: e.lat,
                lng: e.lon,
                name: e.tags.name || e.tags.amenity || e.tags.natural || 'Landmark',
                type: e.tags.amenity || e.tags.natural
            }));

            // Basic river extraction (simplified)
            const newRivers = data.elements.filter(e => e.type === 'way' && e.tags.waterway === 'river');
            
            setLandmarks(newLandmarks);
            // setRivers(newRivers); // Complexity: need to resolve nodes to coordinates
        } catch (err) {
            console.error('Error fetching landmarks:', err);
        }
    };

    useEffect(() => {
        if (!map) return;
        fetchLandmarks();
        map.on('moveend', fetchLandmarks);
        return () => map.off('moveend', fetchLandmarks);
    }, [map]);

    const getIcon = (type) => {
        let color = '#64748b'; // default slate
        if (type === 'school') color = '#3b82f6';
        if (type === 'market') color = '#f59e0b';
        if (type === 'place_of_worship') color = '#a855f7';
        if (type === 'water' || type === 'river') color = '#0ea5e9';

        return L.divIcon({
            html: `<div style="background: ${color}; width: 8px; height: 8px; border-radius: 50%; border: 1px solid white;"></div>`,
            className: 'landmark-icon',
            iconSize: [8, 8]
        });
    };

    return (
        <>
            {landmarks.map(l => (
                <Marker key={l.id} position={[l.lat, l.lng]} icon={getIcon(l.type)}>
                    <Popup>
                        <div className="p-1">
                            <span className="text-xs font-bold uppercase text-slate-500">{l.type}</span>
                            <h4 className="text-sm font-bold">{l.name}</h4>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </>
    );
};

export default LandmarksLayer;
