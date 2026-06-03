import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { GoogleLogin } from '@react-oauth/google';
import { auth } from '../services/api.js';
import './Login.css';

export default function Login() {
    const [email, setEmail]       = useState('');
    const [password, setPassword] = useState('');
    const [error, setError]       = useState(null);
    const [loading, setLoading]   = useState(false);

    const navigate = useNavigate();
    const { login } = useAuth();

    const redirectAfterLogin = (userData) => {
        login(userData);
        navigate(userData.rol === 'Administrador' ? '/admin' : '/');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const userData = await auth.login(email, password);
            redirectAfterLogin(userData);
        } catch (err) {
            setError(err.message || 'Credenciales inválidas');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setError(null);
        setLoading(true);

        try {
            const userData = await auth.google(credentialResponse.credential);
            redirectAfterLogin(userData);
        } catch (err) {
            setError(err.message || 'Error al autenticar con Google');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page fade-in-up">
            <div className="login-card">
                <div className="login-header">
                    <Link to="/">
                        <img src="/logo.png" alt="Gol Ahora" className="login-logo" />
                    </Link>
                    <h2>¡Bienvenido!</h2>
                    <p>Gestiona tus canchas con Gol Ahora</p>
                </div>

                {error && (
                    <div className="login-error" role="alert">
                        <span>⚠</span> {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="login-form" noValidate>
                    <div className="form-group">
                        <label htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="nombre@ejemplo.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            autoComplete="email"
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            autoComplete="current-password"
                        />
                    </div>

                    <button type="submit" className="login-btn" disabled={loading}>
                        {loading ? (
                            <span className="btn-loading">
                                <span className="spinner-dot" /><span className="spinner-dot" /><span className="spinner-dot" />
                            </span>
                        ) : 'Iniciar Sesión'}
                    </button>
                </form>

                <div className="login-divider"><span>O CONTINUAR CON</span></div>

                <div className="login-google">
                    <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={() => setError('Error al autenticar con Google')}
                        useOneTap
                    />
                </div>

                <div className="login-footer">
                    <Link to="/register">
                        ¿No tienes cuenta? <strong>Regístrate</strong>
                    </Link>
                    <Link to="/">← Volver al inicio</Link>
                </div>
            </div>
        </div>
    );
}
