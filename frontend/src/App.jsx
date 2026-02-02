import { useState } from "react";
import MapComponent from "./components/Map";
import { authAPI } from "./services/api";
import { robotAPI } from "./services/api";
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [robots, setRobots] = useState([]);
    const [expandedRobotId, setExpandedRobotId] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors
        setLoading(true);

        // Get form data
        const email = e.target.email.value;
        const password = e.target.password.value;

        console.log('Attempting login with:', email);
        try {
            // Call the backend API
            const data = await authAPI.login(email, password);
            console.log('Login successful!');
            console.log('Response data:', data);
            console.log('Access token (first 50 chars):', data.access_token.substring(0, 50) + '...');
            console.log('User info:', data.user);

            // Store the token in localStorage
            localStorage.setItem('token', data.access_token);

            // Store user info if needed
            localStorage.setItem('user', JSON.stringify(data.user));
            console.log('Token stored in localStorage');

            // Update authentication state
            setIsAuthenticated(true);

            // Fetch robots after successful login
            await fetchRobots();
        } catch (error) {
            console.error('Login failed:', error);

            // Handle errors
            if (error.response) {
                // Backend returned an error
                console.error('Server error:', error.response.data);
                setErrorMessage(error.response.data.error || 'Login failed');
            } else if (error.request) {
                // Network error
                console.error('Network error - Backend not reachable');
                setErrorMessage('Connection to server failed')
            } else {
                // Others error
                console.error('Unknown error:', error.message);
                setErrorMessage('An error has occurred')
            }
        } finally {
            setLoading(false);
        }
    }

    const fetchRobots = async () => {
        try {
            console.log('Fetching robot...');
            const data = await robotAPI.getRobots();
            console.log('Robot fetched: ', data);
            setRobots(data);
            console.log('Robots state updated, count:', data.length);
        } catch (error) {
            console.error(' Failed to fetch robots:', error)
        }
    };

    return (
        <div className = "app">
            { /* Header always visible */}
            <header className = "header">
                <img src="/images/robot_head.png" alt="Robot" className="header-logo" />
                <h1>Mini Fleet Monitor</h1>
            </header>
            
            {/* Map - always rendered, blurred when not authenticated */}
            {console.log('About to render Map, isAuthenticated:', isAuthenticated, 'robots:', robots)}
            <MapComponent 
                key={`map-${robots.length}`} 
                isBlurred={!isAuthenticated}
                robots={robots}
            />

            {/** Login Overlay - shown when not authenticated */}
            {!isAuthenticated && (
                <div className ="login-overlay">
                    <div className="login-card">
                        <div className="login-heaeder">
                            <img src="/images/robot_head.png" alt="Robot" className="header-logo" />
                            <h2>Sign in</h2>
                        </div>

                        <form onSubmit={handleLogin}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    id="email"
                                    type="email"
                                    placeholder="admin@test.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Passwort</label>
                                <input
                                id="password"
                                type="password"
                                placeholder="password"
                                required
                                />
                            </div>

                            {/* Error Message Display */}
                            {errorMessage && (
                                <div className="error-message">
                                    {errorMessage}    
                                </div>
                            )}

                            <button type="submit" disabled={loading}>
                                {loading ? 'Logging in...' : 'Login'}
                            </button>
                        </form>

                        <div className="demo-hint">
                            <small>Demo: admin@test.com/ test123</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Robot List Slidebar - shown only when authenticated */}
            {isAuthenticated && (
                <div className="robot-sidebar">
                    <h2>Robots ({robots.length})</h2>

                    {robots.length === 0 ? (
                        <p className="no-robots">No Robots available</p>
                    ):(
                        <div className="robot-list">
                            {robots.map((robot) => (
                                <div 
                                    key={robot.id}
                                    className={`robot-item ${expandedRobotId === robot.id ? 'expanded' : ''}`}
                                    onClick={() => setExpandedRobotId(
                                        expandedRobotId === robot.id ? null : robot.id
                                    )}
                                >
                                    {/* Always visible: Name and Status */}
                                    <div className="robot-header">
                                        <h3>{robot.name}</h3>
                                        <span className={`status-badge status-${robot.status}`}>
                                            {robot.status}
                                        </span>
                                    </div>
                                    
                                    {/* Expandable details */}
                                    {expandedRobotId === robot.id && (
                                    <div className="robot-details">
                                        <div className="detail-row">
                                            <span className="label">Lat:</span>
                                            <span className="value">{robot.lat.toFixed(6)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Lon:</span>
                                            <span className="value">{robot.lon.toFixed(6)}</span>
                                        </div>
                                        <div className="detail-row">
                                            <span className="label">Update:</span>
                                            <span className="value">
                                            {new Date(robot.updated_at).toLocaleTimeString('de-DE')}
                                            </span>
                                        </div>
                                    </div>
                                    )}

                                    {/* Expand indicator */}
                                    <div className="expand-hint">
                                        {expandedRobotId === robot.id ? '▲ Less' : '▼ More'}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default App;