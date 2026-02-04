import { use, useEffect, useRef } from 'react';
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

const MapComponent = ({ isBlurred, robots = [], highlightedRobotId = null, focusedRobot = null, onRobotClick = null }) => {
    console.log('🔍 Props received:', { isBlurred, robots, highlightedRobotId });
    console.log('🔍 Robots is array?', Array.isArray(robots));
    console.log('🔍 Robots length:', robots?.length);
    console.log('🔄 Map component rendered, robots count:', robots.length);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const vectorSourceRef = useRef(null);
    const vectorLayerRef = useRef(null);
    const onRobotClickRef = useRef(onRobotClick);
    
    // Keep callback ref in sync to avoid stale closure in map click handler
    onRobotClickRef.current = onRobotClick;

    // Create a style function that uses current highlightedRobotId
    const getStyleForRobot = (feature) => {
        const robot = feature.get('robot');
        const isMoving = robot?.status === 'moving';
        const isHighlighted = robot?.id === highlightedRobotId;
        const isAnimating = feature.get('animating')
        
        if (isHighlighted) {
        console.log('🎯 Highlighting robot on map:', robot?.name);
        }

        let scale = 0.07;
        if (isHighlighted) {
            scale = isAnimating ? 0.14 : 0.12;
        }

        return new Style({
            image: new Icon({
                src: '/images/robot.png',
                scale: scale,
                anchor: [0.5, 1],
                anchorXUnits: 'fraction',
                anchorYUnits: 'fraction',
                opacity: isMoving ? 1 : 0.7,
                crossOrigin: 'anonymous',
            }),
            text: new Text({
                text: robot?.name || '',
                offsetY: isHighlighted ? -70 : -60,
                fill: new Fill({
                color: isHighlighted ? '#FF1744' : (isMoving ? '#4CAF50' : '#FA891A'),
                }),
                stroke: new Stroke({
                    color: '#fff',
                    width: isHighlighted ? 4 : 3,
                }),
                font: isHighlighted ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
            }),
        });
    };

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
            style: getStyleForRobot,
            /* style: (feature) => {
                const robot = feature.get('robot');
                const isMoving = robot?.status === 'moving';
                const isHighlighted = robot?.id === highlightedRobotId;

                console.log('Styling robot:', robot?.name, 'status:', robot?.status, 'highlighted:', isHighlighted);

                return new Style({
                    image: new Icon({
                        src: '/images/robot.png',
                        scale: isHighlighted ? 0.12 : 0.08, // 0.1 = 10%, 0.2 = 20%
                        anchor: [0.5, 1], // horizontally centered (0.5), vertically at bottom (1)
                        anchorXUnits: 'fraction',  
                        anchorYUnits: 'fraction', 
                        opacity: isMoving ? 1: 0.7, // Slightly transparent when idle
                        crossOrigin: 'anonymous',
                    }),
                    text: new Text({
                        text: robot?.name || '',
                        offsetY: isHighlighted ? -80 : -70,  // ✅ Adjust text position,
                        fill: new Fill({
                            color: isMoving ? '#4CAF50' : '#FA891A', 
                        }),
                        stroke: new Stroke({
                            color: '#000',
                            width: isHighlighted ? 4 : 3, // Thicker stroke when highlighted
                        }),
                        font: isHighlighted ? 'bold 16px sans-serif' : 'bold 12px sans-serif',
                    }),
                });
            },*/
        });

        vectorLayerRef.current = vectorLayer; // Store layer reference

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

        // Click on robot feature → notify parent
        mapInstanceRef.current.on('click', (evt) => {
            const feature = mapInstanceRef.current.forEachFeatureAtPixel(evt.pixel, (f) => f);
            if (feature) {
                const robot = feature.get('robot');
                if (robot && onRobotClickRef.current) {
                    onRobotClickRef.current(robot.id);
                }
            }
        });

        // Show pointer cursor when hovering over a robot
        mapInstanceRef.current.on('pointermove', (evt) => {
            const hit = mapInstanceRef.current.hasFeatureAtPixel(evt.pixel);
            mapInstanceRef.current.getTargetElement().style.cursor = hit ? 'pointer' : '';
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
        console.log('Robot markers updated');
    }, [robots])

    // Center map only on initial robot load
    useEffect(() => {
        if (!mapInstanceRef.current || robots.length === 0) return;

        // Check if this is the first time we have robots
        const hasInitiallyPositioned = mapInstanceRef.current.get('initiallyPositioned');

        if (!hasInitiallyPositioned) {
            console.log('Initial positioning: centering on first robots');
            const firstRobot = robots[0];
            const view = mapInstanceRef.current.getView();
            view.animate({
                center: fromLonLat([firstRobot.lon, firstRobot.lat]),
                zoom: 13,
                duration: 1000,
            });

            // Mark as positioned
            mapInstanceRef.current.set('initiallyPositioned', true);
        }
    }, [robots.length > 0]);

    // Refresh styles when highlighted robot changes
    useEffect(() => {
        if (!vectorLayerRef.current) return;

        // Update the layer's style function to use the current closure
        vectorLayerRef.current.setStyle(getStyleForRobot);

        // Force re-render of all features to update styles
        const features = vectorSourceRef.current?.getFeatures() || [];
        features.forEach(feature => {
            feature.changed();
        });

        console.log('Refreshed robot styles, highlighted:', highlightedRobotId);
    }, [highlightedRobotId]);

    // Zoom to robot when clicked inside bar
    useEffect(() => {
        if (!mapInstanceRef.current || !focusedRobot) return;

        console.log('Focusing on robot:', focusedRobot.id);

        const view = mapInstanceRef.current.getView();

        // Animate to robot position with zoom
        view.animate({
            center: fromLonLat([focusedRobot.lon, focusedRobot.lat]),
            zoom: 13,
            duration: 800,  
        });

        // Trigger bounce animation of the feature
        const feature = vectorSourceRef.current.getFeatureById(focusedRobot.id);
        if (feature) {
            // Add animation class by forcing style update
            feature.set('animating', true);

            // Remove animation after 3 seconds
            setTimeout(() => {
                feature.set('animating', false);
                feature.changed();
            }, 3000);
        }
    }, [focusedRobot?.timestamp]);
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