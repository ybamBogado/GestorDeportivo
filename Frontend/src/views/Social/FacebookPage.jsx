import { Link } from 'react-router-dom';

const posts = [
    { id: 1, text: 'Nuevas canchas de Futbol 7 disponibles. Reserva tu turno ahora en Gol Ahora. #GolAhora #Futbol', likes: 142, comments: 23, time: 'Hace 2 horas' },
    { id: 2, text: 'Abrieron las inscripciones para la Liga de Verano 2025. Cupos limitados. No te quedes afuera.', likes: 287, comments: 41, time: 'Hace 1 dia' },
    { id: 3, text: 'Felicitamos al equipo Los Pumas por ganar el Torneo Primavera 2024. Gran torneo de todos.', likes: 503, comments: 89, time: 'Hace 3 dias' },
    { id: 4, text: 'Recorda que los sabados hay clases de tecnica individual con profe certificado. Consulta horarios.', likes: 98, comments: 15, time: 'Hace 5 dias' }
];

export default function FacebookPage() {
    return (
        <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: 'linear-gradient(135deg, #1877f2 0%, #0b57d0 100%)', padding: '20px 0 0' }}>
                <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
                    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.02))', height: 220, borderRadius: '12px 12px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-dribbble" style={{ color: '#fff', fontSize: '4.2rem' }}></i>
                    </div>
                </div>
            </div>

            <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 20px' }}>
                <div style={{ background: '#fff', borderRadius: '0 0 12px 12px', padding: '0 24px 20px', border: '1px solid #dfe3e8', borderTop: 'none', marginBottom: 24 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingTop: 8 }}>
                        <div style={{ width: 100, height: 100, borderRadius: '50%', background: 'linear-gradient(135deg, #1877f2, #42a5f5)', border: '4px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: -40, flexShrink: 0 }}>
                            <i className="bi bi-dribbble" style={{ color: '#fff', fontSize: '2.3rem' }}></i>
                        </div>
                        <div style={{ flex: 1, paddingBottom: 4 }}>
                            <h1 style={{ color: '#1c1e21', fontSize: '1.5rem', fontWeight: 800, margin: '0 0 2px' }}>Gol Ahora - Club Deportivo</h1>
                            <p style={{ color: '#65676b', fontSize: '0.85rem', margin: 0 }}>
                                <i className="bi bi-geo-alt-fill me-1"></i>
                                Buenos Aires, Argentina · Complejo deportivo
                            </p>
                        </div>
                        <div style={{ display: 'flex', gap: 8, paddingBottom: 4 }}>
                            <div style={{ padding: '8px 18px', background: '#1877f2', borderRadius: 8, color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                                <i className="bi bi-hand-thumbs-up-fill me-1"></i>
                                Me gusta
                            </div>
                            <div style={{ padding: '8px 18px', background: '#e4e6eb', borderRadius: 8, color: '#050505', fontSize: '0.85rem', fontWeight: 600 }}>
                                Seguir
                            </div>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 28, marginTop: 16, paddingTop: 12, borderTop: '1px solid #e4e6eb' }}>
                        {[
                            { label: 'Me gusta', value: '4.8K' },
                            { label: 'Seguidores', value: '5.2K' },
                            { label: 'Publicaciones', value: '312' }
                        ].map((s) => (
                            <div key={s.label}>
                                <span style={{ color: '#050505', fontWeight: 800, fontSize: '1rem' }}>{s.value}</span>
                                <span style={{ color: '#65676b', fontSize: '0.82rem', marginLeft: 5 }}>{s.label}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#e7f3ff', border: '1px solid #cfe2ff', borderRadius: 10, padding: '10px 16px', marginBottom: 24, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <i className="bi bi-info-circle-fill" style={{ color: '#1877f2' }}></i>
                    <p style={{ color: '#2851a3', fontSize: '0.82rem', margin: 0 }}>Esta es una vista simulada de la pagina de Facebook de Gol Ahora. Las interacciones no son reales.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
                    {posts.map((post) => (
                        <div key={post.id} style={{ background: '#fff', border: '1px solid #dfe3e8', borderRadius: 12, padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                                <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#1877f2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <i className="bi bi-dribbble" style={{ color: '#fff', fontSize: '1rem' }}></i>
                                </div>
                                <div>
                                    <p style={{ color: '#1c1e21', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Gol Ahora</p>
                                    <p style={{ color: '#65676b', fontSize: '0.75rem', margin: 0 }}>{post.time}</p>
                                </div>
                            </div>
                            <p style={{ color: '#1c1e21', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 14px' }}>{post.text}</p>
                            <div style={{ display: 'flex', gap: 20, paddingTop: 12, borderTop: '1px solid #e4e6eb' }}>
                                <span style={{ color: '#65676b', fontSize: '0.82rem' }}><i className="bi bi-hand-thumbs-up me-1"></i>{post.likes} Me gusta</span>
                                <span style={{ color: '#65676b', fontSize: '0.82rem' }}><i className="bi bi-chat-left-text me-1"></i>{post.comments} Comentarios</span>
                                <span style={{ color: '#65676b', fontSize: '0.82rem' }}><i className="bi bi-share me-1"></i>Compartir</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid #dfe3e8' }}>
                <Link to="/" style={{ color: '#1877f2', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="bi bi-arrow-left me-1"></i>
                    Volver a Gol Ahora
                </Link>
            </div>
        </div>
    );
}
