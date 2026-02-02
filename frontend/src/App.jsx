import { useState } from "react";
import MapComponent from "./components/Map";
import './App.css';

function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        setErrorMessage(''); // Clear previous errors

        // Fornow, just authenticate without checking credentials
        setIsAuthenticated(true);
    }

    return (
        <div className = "app">
            { /* Header always visible */}
            <header className = "header">
                <img src="/images/robot_head.png" alt="Robot" className="header-logo" />
                <h1>Mini Fleet Monitor</h1>
            </header>
            
            {/* Map - always rendered, blurred when not authenticated */}
            <MapComponent isBlurred={!isAuthenticated}/>

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

                            <button type="submit">Login</button>
                        </form>

                        <div className="demo-hint">
                            <small>Demo: admin@test.com/ test123</small>
                        </div>
                    </div>
                </div>
            )}

            {/* Robot Lis Slidebar - shown only when authenticated */}
            {isAuthenticated && (
                <div className="robot-sidebar">
                    <h2>Robots</h2>
                    <p>Robot list will go here...</p>
                </div>
            )}
        </div>
    );
}

export default App;