import { Link } from 'react-router-dom';

const posts = [
    { id: 1, text: '⚽ ¡Nuevas canchas de Fútbol 7 disponibles! Reservá tu turno ahora en Gol Ahora. #GolAhora #Futbol', likes: 142, comments: 23, time: 'Hace 2 horas' },
    { id: 2, text: '🏆 ¡Abrieron las inscripciones para la Liga de Verano 2025! Cupos limitados. No te quedés afuera. #LigaVerano', likes: 287, comments: 41, time: 'Hace 1 día' },
    { id: 3, text: '🎉 ¡Felicitamos al equipo Los Pumas por ganar el Torneo Primavera 2024! Gran torneo de todos.', likes: 503, comments: 89, time: 'Hace 3 días' },
    { id: 4, text: '📅 Recordá que los sábados hay clases de técnica individual con profe certificado. ¡Consultá horarios!', likes: 98, comments: 15, time: 'Hace 5 días' },
];

export default function FacebookPage() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Banner */}
            <div style={{ background: 'linear-gradient(135deg, #1877f2 0%, #0d4fa8 100%)', padding: '20px 0 0', position: 'relative' }}>
                <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ background: 'rgba(0,0,0,0.3)', height: 220, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 0 }}>
                        <span style={{ fontSize: '5rem' }}>⚽</span>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
                {/* Profile area */}
                <div style={{ background: '#111d13', borderRadius: '0 0 12px 12px', padding: '0 24px 20px', border: '1px solid rgba(49,217,79,0.1)', borderTop: 'none', marginBottom: 24, position: 'relative' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 8 }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #31d94f, #1877f2)', border: '4px solid #111d13', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem', marginTop: -40, flexShrink: 0 }}>
                            ⚽
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                            <h1 style={{ color: '#fff', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px' }}>Gol Ahora — Club Deportivo</h1>
                            <p style={{ color: '#8ca092', fontSize: '0.85rem', margin: 0 }}>📍 Buenos Aires, Argentina · 🏟️ Complejo deportivo</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                            <div style={{ padding: '8px 18px', background: '#1877f2', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                                👍 Me gusta
                            </div>
                            <div style={{ padding: '8px 18px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#c5d8ca', fontSize: '0.85rem', fontWeight: 600 }}>
                                Seguir
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 28, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                        {[
                            { label: 'Me gusta', value: '4.8K' },
                            { label: 'Seguidores', value: '5.2K' },
                            { label: 'Publicaciones', value: '312' },
                        ].map(s => (
                            <div key={s.label}>
                                <span style={{ color: '#fff', fontWeight: 800, fontSize: '1rem' }}>{s.value}</span>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', marginLeft: 5 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(24,119,242,0.08)', border: '1px solid rgba(24,119,242,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                    <p style={{ color: '#93b8f7', fontSize: '0.82rem', margin: 0 }}>Esta es una vista simulada de la página de Facebook de Gol Ahora. Las interacciones no son reales.</p>
                </div>

                {/* Posts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
                    {posts.map(post => (
                        <div key={post.id} style={{ background: '#111d13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #31d94f, #1877f2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>⚽</div>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Gol Ahora</p>
                                    <p style={{ color: '#8ca092', fontSize: '0.75rem', margin: 0 }}>{post.time}</p>
                                </div>
                            </div>
                            <p style={{ color: '#c5d8ca', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 14px' }}>{post.text}</p>
                            <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>👍 {post.likes} Me gusta</span>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>💬 {post.comments} Comentarios</span>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>↗️ Compartir</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link to="/" style={{ color: '#31d94f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← Volver a Gol Ahora</Link>
            </div>
        </div>
    );
}
