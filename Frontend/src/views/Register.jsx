import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../services/api.js';
import { isValidEmail, validatePassword } from '../utils/validation.js';
import { useToast } from '../components/Toast.jsx';
import './Register.css';

export default function Register() {
    const [formData, setFormData] = useState({
        nombre:   '',
        apellido: '',
        dni:      '',
        email:    '',
        password: '',
        rol:      'Usuario'
    });
    const [errors, setErrors]   = useState({});
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();
    const { notify } = useToast();

    const validate = () => {
        const errs = {};
        if (!formData.nombre.trim())   errs.nombre   = 'El nombre es requerido';
        if (!formData.apellido.trim()) errs.apellido = 'El apellido es requerido';
        if (!formData.dni || isNaN(formData.dni) || Number(formData.dni) < 1000000)
            errs.dni = 'DNI inválido (mínimo 7 dígitos)';
        if (!isValidEmail(formData.email)) errs.email = 'Email inválido';
        const pwErrors = validatePassword(formData.password);
        if (pwErrors.length) errs.password = `La contraseña debe tener ${pwErrors.join(', ')}`;
        return errs;
    };

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errs = validate();
        if (Object.keys(errs).length) { setErrors(errs); return; }

        setLoading(true);
        try {
            await auth.register({ ...formData, dni: parseInt(formData.dni, 10) });
            notify('¡Cuenta creada! Ya podés iniciar sesión.', 'success');
            navigate('/login');
        } catch (err) {
            setErrors({ form: err.message || 'Error al registrarse' });
        } finally {
            setLoading(false);
        }
    };

    const Field = ({ id, label, type = 'text', placeholder, value, onChange, error, autoComplete }) => (
        <div className="field-group">
            <label htmlFor={id}>{label}</label>
            <input
                id={id}
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                className={error ? 'input-error' : ''}
                autoComplete={autoComplete}
                required
            />
            {error && <span className="field-error">{error}</span>}
        </div>
    );

    return (
        <div className="register-page fade-in-up">
            <div className="register-card">
                <div className="register-header">
                    <img src="/logo.png" alt="Gol Ahora" className="register-logo" />
                    <h2>ÚNETE A GOL AHORA</h2>
                    <p>Crea tu cuenta para reservar canchas</p>
                </div>

                {errors.form && (
                    <div className="register-error" role="alert">
                        <span>⚠</span> {errors.form}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="register-form" noValidate>
                    <div className="register-grid">
                        <Field id="nombre"   label="Nombre"   placeholder="Juan"      value={formData.nombre}   onChange={handleChange('nombre')}   error={errors.nombre}   autoComplete="given-name" />
                        <Field id="apellido" label="Apellido" placeholder="Pérez"     value={formData.apellido} onChange={handleChange('apellido')} error={errors.apellido} autoComplete="family-name" />
                    </div>
                    <Field id="dni"      label="DNI"         type="number" placeholder="30123456" value={formData.dni}      onChange={handleChange('dni')}      error={errors.dni}      autoComplete="off" />
                    <Field id="email"    label="Email"       type="email"  placeholder="nombre@ejemplo.com" value={formData.email}    onChange={handleChange('email')}    error={errors.email}    autoComplete="email" />
                    <Field id="password" label="Contraseña"  type="password" placeholder="Mínimo 6 caracteres" value={formData.password} onChange={handleChange('password')} error={errors.password} autoComplete="new-password" />

                    <button type="submit" className="register-btn" disabled={loading}>
                        {loading ? 'Creando cuenta...' : 'CREAR MI CUENTA'}
                    </button>
                </form>

                <div className="register-footer">
                    <Link to="/login">¿Ya tienes cuenta? <strong>Inicia Sesión</strong></Link>
                </div>
            </div>
        </div>
    );
}
