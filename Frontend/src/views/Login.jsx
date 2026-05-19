import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Login.css';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5071/api/v1/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(errorData || 'Credenciales inválidas');
            }

            const userData = await response.json();
            login(userData);
            navigate('/');
        } catch (err) {
            console.error("Login error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page fade-in-up">
            <div className="login-card">
                <div className="text-center mb-4">
                    <Link to="/">
                        <img src="/logo.png" alt="Gol Ahora" className="login-card-logo mb-3" />
                    </Link>
                    <h2 className="fw-bold m-0" style={{ letterSpacing: '1px' }}>¡Bienvenido!</h2>
                    <p className="small text-muted mt-2">Gestiona tus canchas con Gol Ahora</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label">Email</label>
                        <input 
                            type="email" 
                            className="form-input" 
                            placeholder="nombre@ejemplo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input 
                            type="password" 
                            className="form-input" 
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? 'Validando...' : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="divider"><span>O CONTINUAR CON</span></div>

                <button className="btn google-btn w-100 d-flex align-items-center justify-content-center gap-2">
                    <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" alt="Google" width="20" />
                    Google
                </button>

                <div className="text-center mt-4 border-top pt-3">
                    <Link to="/register" className="back-to-home-link small d-block mb-2">
                        ¿No tienes cuenta? <span style={{ color: '#28a745' }}>Regístrate</span>
                    </Link>
                    <Link to="/" className="back-to-home-link small">
                        ← Volver al inicio
                    </Link>
                </div>
            </div>
        </div>
    );
}
