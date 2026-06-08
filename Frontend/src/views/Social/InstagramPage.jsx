import { Link } from 'react-router-dom';

const posts = [
    { id: 1, title: 'Noche de futbol', text: 'Noche de futbol en Gol Ahora. Canchas techadas disponibles los 7 dias. Reserva ya.', likes: 312, time: '2h' },
    { id: 2, title: 'Liga de verano', text: 'Inscripciones abiertas para la Liga de Verano 2025. Plazas limitadas para equipos. Link en bio.', likes: 541, time: '1d' },
    { id: 3, title: 'Equipo interno', text: 'Nuevos uniformes para el staff de Gol Ahora. Orgullosos de nuestro equipo.', likes: 198, time: '3d' },
    { id: 4, title: 'Clases', text: 'Clases de futbol para todas las edades. Profesores certificados. Consulta horarios.', likes: 267, time: '5d' },
    { id: 5, title: 'Campeones', text: 'Felicitamos a los campeones del Torneo Primavera 2024. Increible partido final.', likes: 891, time: '1sem' },
    { id: 6, title: 'Reservas online', text: 'Podes hacer tus reservas online desde cualquier dispositivo. Rapido y facil.', likes: 143, time: '2sem' }
];

export default function InstagramPage() {
    return (
        <div style={{ background: '#111', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: 'linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)', padding: '3px 0' }}>
                <div style={{ background: '#111', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                    <i className="bi bi-instagram" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
                    <span style={{ color: '#fff', fontSize: '1.05rem', fontWeight: 800 }}>golahora_oficial</span>
                </div>
            </div>

            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px' }}>
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f58529, #dd2a7b, #8134af)', padding: 3, flexShrink: 0 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <i className="bi bi-dribbble" style={{ color: '#fff', fontSize: '1.8rem' }}></i>
                        </div>
                    </div>
                    <div>
                        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 4px' }}>golahora_oficial</h2>
                        <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
                            {[{ v: '312', l: 'publicaciones' }, { v: '5.2K', l: 'seguidores' }, { v: '48', l: 'seguidos' }].map((s) => (
                                <div key={s.l} style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{s.v}</div>
                                    <div style={{ color: '#a8a8a8', fontSize: '0.72rem' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                        <p style={{ color: '#f5f5f5', fontSize: '0.82rem', margin: 0 }}>Complejo deportivo · Reservas online · Buenos Aires, Argentina</p>
                    </div>
                </div>

                <div style={{ background: 'rgba(245,133,41,0.1)', border: '1px solid rgba(245,133,41,0.28)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <i className="bi bi-info-circle-fill" style={{ color: '#f58529' }}></i>
                    <p style={{ color: '#ffbf86', fontSize: '0.82rem', margin: 0 }}>Vista simulada de Instagram. Las interacciones no son reales.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 24 }}>
                    {posts.map((post) => (
                        <div key={post.id} style={{ aspectRatio: '1', background: 'linear-gradient(135deg, rgba(245,133,41,0.18), rgba(129,52,175,0.3))', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 4 }}>
                            <i className="bi bi-camera-fill" style={{ color: '#fff', fontSize: '1.5rem' }}></i>
                            <span style={{ color: '#fff', fontSize: '0.72rem', textAlign: 'center', padding: '0 8px' }}>{post.title}</span>
                            <span style={{ color: '#d8d8d8', fontSize: '0.68rem' }}><i className="bi bi-heart-fill me-1"></i>{post.likes}</span>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
                    {posts.map((post) => (
                        <div key={post.id} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f58529, #dd2a7b)', padding: 2 }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <i className="bi bi-dribbble" style={{ color: '#fff', fontSize: '0.9rem' }}></i>
                                    </div>
                                </div>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>golahora_oficial</span>
                                <span style={{ color: '#a8a8a8', fontSize: '0.75rem', marginLeft: 'auto' }}>{post.time}</span>
                            </div>
                            <div style={{ background: 'linear-gradient(135deg, rgba(245,133,41,0.14), rgba(129,52,175,0.28))', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className="bi bi-camera-reels-fill" style={{ color: '#fff', fontSize: '4rem' }}></i>
                            </div>
                            <div style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                                    <span style={{ color: '#f5f5f5', fontSize: '1.05rem' }}><i className="bi bi-heart"></i></span>
                                    <span style={{ color: '#f5f5f5', fontSize: '1.05rem' }}><i className="bi bi-chat"></i></span>
                                    <span style={{ color: '#f5f5f5', fontSize: '1.05rem' }}><i className="bi bi-send"></i></span>
                                    <span style={{ color: '#f5f5f5', fontSize: '1.05rem', marginLeft: 'auto' }}><i className="bi bi-bookmark"></i></span>
                                </div>
                                <p style={{ color: '#f5f5f5', fontSize: '0.82rem', margin: '0 0 4px' }}><strong>{post.likes} Me gusta</strong></p>
                                <p style={{ color: '#f5f5f5', fontSize: '0.82rem', margin: 0 }}><strong>golahora_oficial</strong> {post.text}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <Link to="/" style={{ color: '#f58529', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                    <i className="bi bi-arrow-left me-1"></i>
                    Volver a Gol Ahora
                </Link>
            </div>
        </div>
    );
}
