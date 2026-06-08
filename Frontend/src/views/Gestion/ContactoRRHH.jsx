import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function ContactoRRHH() {
    const [form, setForm] = useState({ nombre: '', email: '', telefono: '', asunto: 'Consulta laboral', mensaje: '' });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitted(true);
    };

    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 700, margin: '0 auto' }}>
                <Link to="/" style={{ color: '#31d94f', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
                    ← Volver al inicio
                </Link>

                <div style={{ background: '#111d13', border: '1px solid rgba(49,217,79,0.15)', borderRadius: 16, padding: '40px 36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(49,217,79,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            👥
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>Contacto RRHH</h1>
                            <p style={{ margin: 0, color: '#8ca092', fontSize: '0.8rem' }}>Recursos Humanos — Gol Ahora</p>
                        </div>
                    </div>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>📨</div>
                            <h2 style={{ color: '#31d94f', fontWeight: 800 }}>Mensaje Enviado</h2>
                            <p style={{ color: '#c5d8ca', fontSize: '0.95rem' }}>Tu consulta fue recibida por el área de Recursos Humanos.</p>
                            <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>Responderemos a tu correo electrónico dentro de los próximos 2 días hábiles.</p>
                            <button
                                onClick={() => { setSubmitted(false); setForm({ nombre: '', email: '', telefono: '', asunto: 'Consulta laboral', mensaje: '' }); }}
                                style={{ marginTop: 16, padding: '10px 24px', background: 'rgba(49,217,79,0.1)', border: '1px solid rgba(49,217,79,0.3)', borderRadius: 8, color: '#31d94f', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Enviar otro mensaje
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Info de contacto */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 28 }}>
                                {[
                                    { icon: '📍', label: 'Dirección', value: 'Av. del Club 1234, Buenos Aires' },
                                    { icon: '📞', label: 'Teléfono', value: '+54 11 4567-8900' },
                                    { icon: '🕐', label: 'Horario', value: 'Lun–Vie 9:00 a 18:00' },
                                ].map(item => (
                                    <div key={item.label} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '12px 14px', textAlign: 'center' }}>
                                        <div style={{ fontSize: '1.3rem', marginBottom: 6 }}>{item.icon}</div>
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
                                            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                            required
                                            placeholder="Tu nombre y apellido"
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Email *</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                            required
                                            placeholder="tu@email.com"
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Teléfono</label>
                                        <input
                                            type="tel"
                                            value={form.telefono}
                                            onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
                                            placeholder="+54 11 1234-5678"
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Asunto *</label>
                                        <select
                                            value={form.asunto}
                                            onChange={e => setForm(f => ({ ...f, asunto: e.target.value }))}
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        >
                                            <option>Consulta laboral</option>
                                            <option>Postulación espontánea</option>
                                            <option>Certificación deportiva</option>
                                            <option>Convenio institucional</option>
                                            <option>Otro</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Mensaje *</label>
                                    <textarea
                                        value={form.mensaje}
                                        onChange={e => setForm(f => ({ ...f, mensaje: e.target.value }))}
                                        required
                                        rows={5}
                                        placeholder="Escribí tu consulta..."
                                        style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem', resize: 'vertical' }}
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
