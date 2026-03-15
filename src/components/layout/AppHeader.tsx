import React from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { logoutUser } from '../../services/auth.service';

const AppHeader: React.FC = () => {
    const { family } = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logoutUser();
        navigate('/login');
    };

    return (
        <header className="app-header">
            <div>
                <div className="header-title">🍽️ Aaj Kya Banega?</div>
                {family && <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{family.name}</div>}
            </div>
            <div className="header-actions">
                <button className="icon-btn" title="Notifications">
                    <Bell size={16} />
                </button>
                <button className="icon-btn" onClick={handleLogout} title="Logout">
                    <LogOut size={16} />
                </button>
            </div>
        </header>
    );
};

export default AppHeader;
