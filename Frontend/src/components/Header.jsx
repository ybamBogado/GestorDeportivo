import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { reservas as reservasApi, cobros as cobrosApi } from '../services/api';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    const [pendingReserva, setPendingReserva] = useState(null);
    const [timeLeft, setTimeLeft] = useState(null);

    useEffect(() => {
        if (!user) {
            setPendingReserva(null);
            return;
        }

        const checkPending = async () => {
            try {
                const allReservas = await reservasApi.getAll();
                const nowMs = new Date().getTime();
                
                // Find a pending reservation for this user that hasn't expired yet
                const pending = allReservas.find(r => {
                    if (r.personaId !== user.id || r.estado !== 'Pendiente') return false;
                    const expDate = r.fechaExpiracion;
                    if (!expDate) return false;
                    const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
                    // Must be in the future and within 15 minutes of session
                    return exp > nowMs && (exp - nowMs) <= 15 * 60 * 1000;
                });

                if (pending) {
                    const allCobros = await cobrosApi.getAll();
                    const cobro = allCobros.find(c => c.reservaId === pending.id);
                    if (cobro) {
                        setPendingReserva({ ...pending, cobroId: cobro.id });
                        
                        // Inicializamos el timeLeft inmediatamente para que no tarde 1 segundo en aparecer
                        const expDate = pending.fechaExpiracion;
                        const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
                        setTimeLeft(exp - nowMs);
                        return;
                    }
                }
                setPendingReserva(null);
                setTimeLeft(null);
            } catch (e) {
                console.error("Error checking pending reserva", e);
            }
        };

        checkPending();
        const handleUpdate = () => checkPending();
        window.addEventListener('reservaUpdate', handleUpdate);
        return () => window.removeEventListener('reservaUpdate', handleUpdate);
    }, [user, location.pathname]);

    useEffect(() => {
        if (!pendingReserva) {
            setTimeLeft(null);
            return;
        }
        
        const interval = setInterval(() => {
            const expDate = pendingReserva.fechaExpiracion;
            const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
            const now = new Date().getTime();
            const diff = exp - now;
            
            if (diff <= 0) {
                setPendingReserva(null);
                setTimeLeft(null);
                clearInterval(interval);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);
        
        return () => clearInterval(interval);
    }, [pendingReserva]);

    function formatTime(ms) {
        if (!ms || ms <= 0) return "00:00";
        const totalSecs = Math.floor(ms / 1000);
        const mins = String(Math.floor(totalSecs / 60)).padStart(2, '0');
        const secs = String(totalSecs % 60).padStart(2, '0');
        return `${mins}:${secs}`;
    }

    const handleAuthClick = () => {
        if (user) {
            logout();
            navigate('/');
        } else {
            navigate('/login');
        }
    };

    const displayUsername = user && typeof user === 'object'
        ? (user.nombre && user.nombre !== 'None' && user.nombre !== 'None2'
            ? `${user.nombre} ${user.apellido || ''}`
            : (user.email ? user.email.split('@')[0] : ''))
        : '';

    return (
        <header className="header-main">
            <div className="header-inner">
                <Link to="/" className="header-brand">
                    <img src="/logo.png" alt="Gol Ahora Logo" className="header-logo" />
                    <span className="header-title">Gol Ahora</span>
                </Link>
                <div className="header-actions">
                    {pendingReserva && timeLeft !== null && (
                        <button 
                            onClick={() => navigate(`/pago/${pendingReserva.cobroId}`)} 
                            style={{ 
                                background: '#f2b84b', 
                                color: '#000', 
                                border: 'none', 
                                padding: '8px 16px', 
                                borderRadius: '20px', 
                                fontWeight: 'bold', 
                                marginRight: '15px',
                                boxShadow: '0 0 10px rgba(242, 184, 75, 0.5)',
                                cursor: 'pointer',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseOver={e => e.target.style.transform = 'scale(1.05)'}
                            onMouseOut={e => e.target.style.transform = 'scale(1)'}
                        >
                            ⏳ Completar Reserva ({formatTime(timeLeft)})
                        </button>
                    )}
                    {user && (
                        <Link to={
                            user.rol === 'Administrador' ? '/admin' :
                            user.rol === 'Empleado' ? '/employee' :
                            (user.rol === 'Profesor' || user.rol === 'Entrenador') ? '/trainer' :
                            '/my-portal'
                        } className="header-profile-widget" title="Ir a mi panel/portal">
                            <div className="header-avatar-container">
                                {user.fotoPerfil ? (
                                    <img src={user.fotoPerfil} alt="Avatar" className="header-profile-avatar" />
                                ) : (
                                    <i className="bi bi-person-circle header-profile-icon"></i>
                                )}
                            </div>
                            <span className="header-profile-name">
                                {displayUsername}
                            </span>
                        </Link>
                    )}

                    <button
                        className="header-theme-btn"
                        onClick={toggleTheme}
                        aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                        title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                    >
                        {theme === 'dark' ? (
                            <i className="bi bi-sun-fill" style={{ color: '#fbbf24' }}></i>
                        ) : (
                            <i className="bi bi-moon-stars-fill" style={{ color: '#3b82f6' }}></i>
                        )}
                    </button>

                    <button className="header-auth-btn" onClick={handleAuthClick}>
                        {user ? (
                            <>
                                <i className="bi bi-box-arrow-right me-2"></i>
                                Cerrar Sesión
                            </>
                        ) : (
                            <>
                                <i className="bi bi-box-arrow-in-right me-2"></i>
                                Iniciar Sesión
                            </>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
