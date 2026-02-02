import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import 'ol/ol.css';
import './Map.css';

const MapComponent = ({ isBlurred }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return;

        // Leipzig coordinates: [longitude, latitude]
        const leipzigCoords = [12.3731, 51.3397];
        
        // Create map
        mapInstanceRef.current = new Map({
            target: mapRef.current,     // WHERE to render
            layers: [                   // WHAT to show
                new TileLayer({
                    source: new OSM(),  // Get map tiles from OpenStreetMap
                }),
            ],
            view: new View({            // Camera settings
                center: fromLonLat(leipzigCoords),
                zoom: 13, // 1-4: World/continent / 5-9: Country/state / 10-13: City / 14-16: Neighborhood / 17-20: Street level 
            }),
        });

        // Cleanup on unmount
        return () =>  {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(null);
            }
        };
    }, []);

    return (
        <div
            ref={mapRef}
            className={`map-container ${isBlurred ? 'blurred' : ''}`}
        />
    );
};

export default MapComponent;