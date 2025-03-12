import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

function Sidebar({ isOpen, toggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  // Navigation items
  const navItems = [
    { path: '/', label: 'Dashboard', icon: 'home' },
    { path: '/bookings', label: 'Bookings', icon: 'calendar' },
    { path: '/reports', label: 'Reports', icon: 'chart-bar' },
    { path: '/visualizations', label: 'Visualizations', icon: 'chart-pie' },
    { path: '/settings', label: 'Settings', icon: 'cog' },
  ];

  // ... rest of the component ...
}

export default Sidebar; 