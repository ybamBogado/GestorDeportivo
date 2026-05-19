import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Header.css';

export default function Header() {
    const { user, logout } = useAuth();
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
        <header className="header-main mb-4">
            <div className="container-fluid d-flex flex-column flex-md-row justify-content-between align-items-center p-3 p-md-4">
                
                <div className="text-center text-md-start mb-3 mb-md-0">
                    <Link to="/" className="text-decoration-none d-flex align-items-center justify-content-center justify-content-md-start">
                        <img
                            src="/logo.png" 
                            alt="Gol Ahora Logo"
                            className='logo me-2'
                        />
                        <h1 className="brand-title mb-0">Gol Ahora</h1>
                    </Link>
                </div>

                <div className="d-flex align-items-center gap-3">
                    {/* Botón de Admin solo si el usuario tiene el rol */}
                    {user && user.rol === 'Administrador' && (
                        <Link to="/admin" className="btn btn-warning fw-bold px-4">
                            PANEL ADMIN
                        </Link>
                    )}

                    <div className="text-center text-md-end">
                        <button onClick={handleAuthClick} className="btn btn-auth px-4">
                            {user ? `Cerrar Sesión` : "Iniciar Sesión"}
                        </button>
                    </div>
                </div>

            </div>
        </header>
    );
}