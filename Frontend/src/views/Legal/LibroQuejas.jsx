import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function LibroQuejas() {
    const [form, setForm] = useState({ nombre: '', email: '', tipo: 'Queja', descripcion: '', fecha: new Date().toISOString().split('T')[0] });
    const [submitted, setSubmitted] = useState(false);
    const [numero] = useState(() => `QJ-${Date.now().toString().slice(-6)}`);

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
                            📝
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>Libro de Quejas Online</h1>
                            <p style={{ margin: 0, color: '#8ca092', fontSize: '0.8rem' }}>Tu opinión nos ayuda a mejorar — Gol Ahora</p>
                        </div>
                    </div>

                    {submitted ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                            <div style={{ fontSize: '3rem', marginBottom: 16 }}>✅</div>
                            <h2 style={{ color: '#31d94f', fontWeight: 800 }}>Queja / Reclamo Registrado</h2>
                            <p style={{ color: '#c5d8ca', fontSize: '0.95rem' }}>Tu presentación fue recibida correctamente.</p>
                            <div style={{ background: 'rgba(49,217,79,0.07)', border: '1px solid rgba(49,217,79,0.2)', borderRadius: 10, padding: '16px 24px', display: 'inline-block', margin: '16px 0' }}>
                                <p style={{ color: '#8ca092', fontSize: '0.78rem', margin: 0, textTransform: 'uppercase', fontWeight: 700 }}>N° de seguimiento</p>
                                <p style={{ color: '#31d94f', fontSize: '1.4rem', fontWeight: 900, margin: '4px 0 0' }}>{numero}</p>
                            </div>
                            <p style={{ color: '#8ca092', fontSize: '0.85rem' }}>Guardá este número. Nos pondremos en contacto en un plazo de 48 horas hábiles.</p>
                            <button
                                onClick={() => { setSubmitted(false); setForm({ nombre: '', email: '', tipo: 'Queja', descripcion: '', fecha: new Date().toISOString().split('T')[0] }); }}
                                style={{ marginTop: 16, padding: '10px 24px', background: 'rgba(49,217,79,0.1)', border: '1px solid rgba(49,217,79,0.3)', borderRadius: 8, color: '#31d94f', fontWeight: 700, cursor: 'pointer' }}
                            >
                                Registrar otro reclamo
                            </button>
                        </div>
                    ) : (
                        <>
                            <p style={{ color: '#8ca092', fontSize: '0.88rem', marginBottom: 24, lineHeight: 1.6 }}>
                                Completá el siguiente formulario para registrar una queja, reclamo o sugerencia. Tu presentación quedará registrada y recibirás una respuesta dentro de las 48 horas hábiles.
                            </p>

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
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Email de contacto *</label>
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
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Tipo de presentación *</label>
                                        <select
                                            value={form.tipo}
                                            onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        >
                                            <option value="Queja">Queja</option>
                                            <option value="Reclamo">Reclamo</option>
                                            <option value="Sugerencia">Sugerencia</option>
                                            <option value="Felicitación">Felicitación</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                        <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Fecha del incidente</label>
                                        <input
                                            type="date"
                                            value={form.fecha}
                                            onChange={e => setForm(f => ({ ...f, fecha: e.target.value }))}
                                            style={{ padding: '10px 12px', background: '#0a100c', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff', fontSize: '0.9rem' }}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <label style={{ color: '#8ca092', fontSize: '0.78rem', fontWeight: 700, textTransform: 'uppercase' }}>Descripción detallada *</label>
                                    <textarea
                                        value={form.descripcion}
                                        onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                                        required
                                        rows={5}
                                        placeholder="Describí detalladamente el motivo de tu presentación..."
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
                                        Enviar presentación
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
