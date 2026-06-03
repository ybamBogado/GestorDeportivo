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

    return (
        <header className="header-main">
            <div className="header-inner">
                <Link to="/" className="header-brand">
                    <img src="/logo.png" alt="Gol Ahora Logo" className="header-logo" />
                    <span className="header-title">Gol Ahora</span>
                </Link>

                <div className="header-actions">
                    {user && user.rol === 'Administrador' && (
                        <Link to="/admin" className="header-admin-btn">
                            Panel Admin
                        </Link>
                    )}

                    {user && (
                        <span className="header-username" title={user.email}>
                            {user.nombre}
                        </span>
                    )}

                    <button
                        className="header-theme-btn"
                        onClick={toggleTheme}
                        aria-label={`Cambiar a modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                        title={`Modo ${theme === 'dark' ? 'claro' : 'oscuro'}`}
                    >
                        {theme === 'dark' ? '☀' : '☾'}
                    </button>

                    <button className="header-auth-btn" onClick={handleAuthClick}>
                        {user ? 'Cerrar Sesión' : 'Iniciar Sesión'}
                    </button>
                </div>
            </div>
        </header>
    );
}
