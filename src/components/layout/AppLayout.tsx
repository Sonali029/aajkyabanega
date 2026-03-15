import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Home, UtensilsCrossed, Users, Settings } from 'lucide-react';
import AppHeader from './AppHeader';

const AppLayout: React.FC = () => {
    return (
        <div className="app-layout">
            <AppHeader />
            <main className="page-content">
                <Outlet />
            </main>
            <nav className="bottom-nav">
                <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Home />
                    <span>Home</span>
                </NavLink>
                <NavLink to="/dishes" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <UtensilsCrossed />
                    <span>Dishes</span>
                </NavLink>
                <NavLink to="/family" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Users />
                    <span>Family</span>
                </NavLink>
                <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Settings />
                    <span>Settings</span>
                </NavLink>
            </nav>
        </div>
    );
};

export default AppLayout;
