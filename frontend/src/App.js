// App.jsx
import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Signup from './components/Signup';
import TaskList from './components/TaskList';
import Profile from './components/Profile';
import './App.css';

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'));

    const handleLogin = (token) => {
        localStorage.setItem('token', token);
        setToken(token);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        setToken(null);
    };

    return (
        <Router>
            <div className="App">
                <nav>
                    {token ? (
                        <>
                            <button onClick={handleLogout}>Logout</button>
                            <a href="/tasks">Tasks</a>
                            <a href="/profile">Profile</a>
                        </>
                    ) : (
                        <>
                            <a href="/login">Login</a>
                            <a href="/signup">Signup</a>
                        </>
                    )}
                </nav>

                <Routes>
                    <Route path="/login" element={<Login onLogin={handleLogin} />} />
                    <Route path="/signup" element={<Signup />} />
                    {token ? (
                        <>
                            <Route path="/tasks" element={<TaskList />} />
                            <Route path="/profile" element={<Profile />} />
                        </>
                    ) : (
                        <Route path="*" element={<Navigate to="/login" />} />
                    )}
                </Routes>
            </div>
        </Router>
    );
}

export default App;
