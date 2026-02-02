import { useEffect, useRef } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import Feature from 'ol/Feature';
import Point  from 'ol/geom/Point';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import {Style, Icon, Text, Fill, Stroke } from 'ol/style';
import 'ol/ol.css';
import './Map.css';

const MapComponent = ({ isBlurred, robots = []}) => {
    console.log('🔍 Props received:', { isBlurred, robots });  // ✅ Add this
    console.log('🔍 Robots is array?', Array.isArray(robots));  // ✅ Add this
    console.log('🔍 Robots length:', robots?.length);  // ✅ Add this
    console.log('🔄 Map component rendered, robots count:', robots.length);
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const vectorSourceRef = useRef(null);

    // Initialize map
    useEffect(() => {
        if (!mapRef.current) return;
        console.log('Initializing map...');

        // Leipzig coordinates: [longitude, latitude]
        const leipzigCoords = [12.3731, 51.3397];

        // Create vector source for robot markers
        vectorSourceRef.current = new VectorSource();
        
        // Create vector layer for robots
        const vectorLayer = new VectorLayer({
            source: vectorSourceRef.current,
            style: (feature) => {
                const robot = feature.get('robot');
                const isMoving = robot?.status === 'moving';
                
                console.log('Styling robot:', robot?.name, 'status:', robot?.status);

                return new Style({
                    image: new Icon({
                        src: '/images/robot.png',
                        scale: 0.15, // 0.1 = 10%, 0.2 = 20%
                        anchor: [0.5, 0.5],
                        opacity: isMoving ? 1: 0.7, // Slightly transparent when idle
                        crossOrigin: 'anonymous',
                    }),
                    text: new Text({
                        text: robot?.name || '',
                        offsetY: -35,
                        fill: new Fill({
                            color: isMoving ? '#4CAF50' : '#FA891A', 
                        }),
                        stroke: new Stroke({
                            color: '#fff',
                            width: 3,
                        }),
                        font: 'bold 14px sans-serif',
                    }),
                });
            },
        });

        // Create map
        mapInstanceRef.current = new Map({
            target: mapRef.current,     // WHERE to render
            layers: [                   // WHAT to show
                new TileLayer({
                    source: new OSM(),  // Get map tiles from OpenStreetMap
                    wrapX: true,
                }),
                vectorLayer,
            ],
            view: new View({            // Camera settings
                center: fromLonLat(leipzigCoords),
                zoom: 13, // 1-4: World/continent / 5-9: Country/state / 10-13: City / 14-16: Neighborhood / 17-20: Street level 
                minZoom: 2,
                maxZoom: 19,
                constrainResolution: true,
            }),
        });

        console.log('Map initialized');
        // Cleanup on unmount
        return () =>  {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.setTarget(null);
            }
        };
    }, []);

    // Update robot markers when robot change
    useEffect(() => {
        if (!vectorSourceRef.current || !mapInstanceRef.current) {
            console.log('Vector source or map not ready');
            return;
        }

        console.log('Updating robot markers, count:', robots.length);
        console.log('Robots data:', robots);

        // Clear existing markers
        vectorSourceRef.current.clear();

        if (robots.length === 0) {
        console.log('No robots to display');
        return;
        }

        // Create features for each robot
        const features = robots.map((robot) => {
            console.log(`Creating marker for ${robot.name} at [${robot.lon}, ${robot.lat}]`);
            const feature = new Feature({
                geometry: new Point(fromLonLat([robot.lon, robot.lat])),
                robot: robot,
            });
            feature.setId(robot.id);
            return feature;
        });

        // Add all features to the map
        vectorSourceRef.current.addFeatures(features);
        console.log('Added', features.length, 'features to map');
        
        // Center map on first robot (or calculate center of all robots)
        const firstRobot = robots[0];
        const view = mapInstanceRef.current.getView();
        view.animate({
            center: fromLonLat([firstRobot.lon, firstRobot.lat]),
            zoom: 13,
            duration: 1000,
        })

        console.log('Robot markers updated');
    }, [robots])

    return (
        <div className="map-wrapper">
            <div
                ref={mapRef}
                className={`map-container ${isBlurred ? 'blurred' : ''}`}
            />

            {/* Map Legend*/}
            <div className="map-legend">
                <h4>Roboter Status</h4>
                <div className="legend-item">
                    <img src="/images/robot.png" alt="Robot" className="legend-robot" />
                    <div className="legend-status">
                        <div className="status-indicator moving"></div>
                        <span>Moving</span>
                    </div>
                </div>
                <div className="legend-item">
                    <img src="/images/robot.png" alt="Robot" className="legend-robot idle-robot" />
                    <div className="legend-status">
                        <div className="status-indicator idle"></div>
                        <span>Idle</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MapComponent;