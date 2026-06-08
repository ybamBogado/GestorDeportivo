import { useState } from 'react';
import { Link } from 'react-router-dom';

const INITIAL_FORM = {
    nombre: '',
    email: '',
    telefono: '',
    asunto: 'Consulta laboral',
    mensaje: ''
};

const sanitizePhone = (value) => {
    const cleaned = value.replace(/[^\d+\-\s()]/g, '');
    const hasLeadingPlus = cleaned.startsWith('+');
    const withoutPlus = cleaned.replace(/\+/g, '');
    return `${hasLeadingPlus ? '+' : ''}${withoutPlus}`.slice(0, 22);
};

export default function ContactoRRHH() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [submitted, setSubmitted] = useState(false);
    const [phoneError, setPhoneError] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        const digits = form.telefono.replace(/\D/g, '');
        if (form.telefono && digits.length < 8) {
            setPhoneError('Ingresa un telefono valido de al menos 8 digitos.');
            return;
        }
        setPhoneError('');
        setSubmitted(true);
    };

    const cardStyle = {
        background: 'rgba(255,255,255,0.03)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 10,
        padding: '12px 14px',
        textAlign: 'center'
    };

    const inputStyle = {
        padding: '10px 12px',
        background: '#0a100c',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8,
        color: '#fff',
        fontSize: '0.9rem'
    };

    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <Link to="/" style={{ color: '#31d94f', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
                    <i className="bi bi-arrow-left"></i>
                    Volver al inicio
                </Link>

                <div style={{ background: '#111d13', border: '1px solid rgba(49,217,79,0.15)', borderRadius: 16, padding: '40px 36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(49,217,79,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', color: '#31d94f' }}>
                            <i className="bi bi-people-fill"></i>
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>Contacto RRHH</h1>
                            <p style={{ margin: 0, color: '#8ca092', fontSize: '0.8rem' }}>Recursos Humanos - Gol Ahora</p>
                        </div>
                    </div>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16, color: '#31d94f' }}>
                                <i className="bi bi-envelope-check-fill"></i>
                            </div>
                            <h2 style={{ color: '#31d94f', fontWeight: 800 }}>Mensaje Enviado</h2>
                            <p style={{ color: '#c5d8ca', fontSize: '0.95rem' }}>Tu consulta fue recibida por el area de Recursos Humanos.</p>
                            <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>Responderemos a tu correo electronico dentro de los proximos 2 dias habiles.</p>
                            <button
                                onClick={() => {
                                    setSubmitted(false);
                                    setForm(INITIAL_FORM);
                                    setPhoneError('');
                                }}
                                style={{ marginTop: 16, padding: '10px 24px', background: 'rgba(49,217,79,0.1)', border: '1px solid rgba(49,217,79,0.3)', borderRadius: 8, color: '#31d94f', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Enviar otro mensaje
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                                {[
                                    { icon: 'bi bi-geo-alt-fill', label: 'Direccion', value: 'Av. del Club 1234, Buenos Aires' },
                                    { icon: 'bi bi-telephone-fill', label: 'Telefono', value: '+54 11 4567-8900' },
                                    { icon: 'bi bi-clock-fill', label: 'Horario', value: 'Lun-Vie 9:00 a 18:00' }
                                ].map((item) => (
                                    <div key={item.label} style={cardStyle}>
                                        <div style={{ fontSize: '1.3rem', marginBottom: 6, color: '#31d94f' }}>
                                            <i className={item.icon}></i>
                                        </div>
                                        <div style={{ color: '#8ca092', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{item.label}</div>
                                        <div style={{ color: '#c5d8ca', fontSize: '0.82rem', fontWeight: 600 }}>{item.value}</div>
                                    </div>
                                ))}
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Nombre completo *</label>
                                        <input
                                            type="text"
                                            value={form.nombre}
                                            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                                            required
                                            placeholder="Tu nombre y apellido"
                                            style={inputStyle}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                                            required
                                            placeholder="tu@email.com"
                                            style={inputStyle}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Telefono</label>
                                        <input
                                            type="tel"
                                            inputMode="numeric"
                                            value={form.telefono}
                                            onChange={(e) => {
                                                setForm((f) => ({ ...f, telefono: sanitizePhone(e.target.value) }));
                                                if (phoneError) setPhoneError('');
                                            }}
                                            pattern="^\+?[0-9\s()-]{8,22}$"
                                            placeholder="+54 11 1234-5678"
                                            style={inputStyle}
                                        />
                                        {phoneError && <span style={{ color: '#ff8f87', fontSize: '0.78rem' }}>{phoneError}</span>}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Asunto *</label>
                                        <select
                                            value={form.asunto}
                                            onChange={(e) => setForm((f) => ({ ...f, asunto: e.target.value }))}
                                            style={inputStyle}
                                        >
                                            <option>Consulta laboral</option>
                                            <option>Postulacion espontanea</option>
                                            <option>Certificacion deportiva</option>
                                            <option>Convenio institucional</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Mensaje *</label>
                                    <textarea
                                        value={form.mensaje}
                                        onChange={(e) => setForm((f) => ({ ...f, mensaje: e.target.value }))}
                                        required
                                        rows={5}
                                        placeholder="Escribi tu consulta..."
                                        style={{ ...inputStyle, resize: 'vertical' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, paddingTop: 8 }}>
                                    <Link to="/" style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#8ca092', textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem', display: 'flex', alignItems: 'center' }}>
                                        Cancelar
                                    </Link>
                                    <button
                                        type="submit"
                                        style={{ padding: '10px 24px', background: '#31d94f', border: 'none', borderRadius: 8, color: '#061007', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}
                                    >
                                        Enviar mensaje
                                    </button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
