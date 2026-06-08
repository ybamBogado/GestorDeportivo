import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate = useNavigate();

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
