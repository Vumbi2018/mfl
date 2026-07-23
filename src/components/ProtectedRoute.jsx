import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
    const [token, setToken] = useState(localStorage.getItem('token'));
    const location = useLocation();

    // Check token on mount and maybe validate it
    // For now, simple existence check
    if (!token) {
        // Redirect to login page, saving the location they tried to access
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
};

export default ProtectedRoute;
