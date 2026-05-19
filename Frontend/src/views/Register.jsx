import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        password: '',
        rol: 'Cliente' // Agregamos el rol por defecto
    });
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('http://localhost:5071/api/v1/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            if (!response.ok) {
                const msg = await response.text();
                throw new Error(msg || "Error al registrarse");
            }

            alert("¡Registro exitoso! Ahora puedes iniciar sesión.");
            navigate('/login');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="register-page fade-in-up">
            <div className="register-card">
                <div className="text-center mb-4">
                    <img src="/logo.png" alt="Logo" className="register-logo mb-2" />
                    <h2 className="fw-bold text-white">ÚNETE A GOL AHORA</h2>
                    <p className="text-secondary small">Crea tu cuenta para reservar canchas</p>
                </div>

                {error && <div className="error-alert">{error}</div>}

                <form onSubmit={handleSubmit} className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label">Nombre</label>
                        <input 
                            type="text" className="form-input" required 
                            value={formData.nombre}
                            onChange={(e) => setFormData({...formData, nombre: e.target.value})}
                        />
                    </div>
                    <div className="col-md-6">
                        <label className="form-label">Apellido</label>
                        <input 
                            type="text" className="form-input" required 
                            value={formData.apellido}
                            onChange={(e) => setFormData({...formData, apellido: e.target.value})}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">DNI</label>
                        <input 
                            type="number" className="form-input" required 
                            value={formData.dni}
                            onChange={(e) => setFormData({...formData, dni: e.target.value})}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Email</label>
                        <input 
                            type="email" className="form-input" required 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                        />
                    </div>
                    <div className="col-12">
                        <label className="form-label">Contraseña</label>
                        <input 
                            type="password" className="form-input" required 
                            value={formData.password}
                            onChange={(e) => setFormData({...formData, password: e.target.value})}
                        />
                    </div>

                    <div className="col-12 mt-4">
                        <button type="submit" className="register-btn" disabled={loading}>
                            {loading ? 'REGISTRANDO...' : 'CREAR MI CUENTA'}
                        </button>
                    </div>
                </form>

                <div className="text-center mt-4 border-top pt-3">
                    <Link to="/login" className="back-link small">
                        ¿Ya tienes cuenta? <span style={{color: '#28a745'}}>Inicia Sesión</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
