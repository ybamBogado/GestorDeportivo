import { Link } from 'react-router-dom';

const posts = [
    {
        id: 1,
        text: 'Estamos buscando profesores de futbol certificados para la temporada 2025. Sumate al equipo de Gol Ahora y desarrolla tu carrera en un ambiente profesional. Envia tu CV a rrhh@golahora.com.ar.',
        likes: 87,
        comments: 12,
        time: 'Hace 3 dias'
    },
    {
        id: 2,
        text: 'Cerramos el ano con mas de 10.000 reservas procesadas y 150 equipos inscriptos en ligas y torneos. Gracias a toda nuestra comunidad deportiva. 2025 viene con novedades.',
        likes: 214,
        comments: 31,
        time: 'Hace 1 semana'
    },
    {
        id: 3,
        text: 'Implementamos un sistema de gestion digital para nuestro complejo deportivo. Ahora los usuarios pueden reservar canchas, inscribirse a torneos y gestionar pagos desde cualquier dispositivo.',
        likes: 341,
        comments: 48,
        time: 'Hace 2 semanas'
    }
];

export default function LinkedInPage() {
    return (
        <div style={{ background: '#f3f2ef', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: '#fff', borderBottom: '1px solid #d0d4d9', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: '#0a66c2', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>in</div>
                <span style={{ color: '#1d2226', fontSize: '1rem', fontWeight: 700 }}>LinkedIn</span>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>
                <div style={{ background: '#fff', border: '1px solid #d0d4d9', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ background: 'linear-gradient(135deg, #0a66c2, #004182)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <i className="bi bi-building" style={{ color: '#fff', fontSize: '3rem' }}></i>
                    </div>
                    <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h1 style={{ color: '#1d2226', fontWeight: 800, fontSize: '1.3rem', margin: '0 0 4px' }}>Gol Ahora - Complejo Deportivo</h1>
                                <p style={{ color: '#5e6a75', fontSize: '0.85rem', margin: '0 0 8px' }}>Instalaciones deportivas · Buenos Aires, Argentina</p>
                                <p style={{ color: '#5e6a75', fontSize: '0.82rem', margin: 0 }}>1.240 seguidores · 28 empleados</p>
                            </div>
                            <div style={{ padding: '8px 20px', background: '#0a66c2', borderRadius: 20, color: '#fff', fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                <i className="bi bi-plus-lg me-1"></i>
                                Seguir
                            </div>
                        </div>
                        <p style={{ color: '#1d2226', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 16px' }}>
                            Gol Ahora es un complejo deportivo dedicado al alquiler de canchas de futbol y la organizacion de ligas, torneos y clases para todas las edades y niveles.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['Futbol', 'Deporte', 'Reservas Online', 'Ligas y Torneos', 'Buenos Aires'].map((tag) => (
                                <span key={tag} style={{ background: '#eef3f8', border: '1px solid #d0d4d9', borderRadius: 20, padding: '3px 12px', color: '#0a66c2', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                <div style={{ background: '#eef3f8', border: '1px solid #d0d4d9', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <i className="bi bi-info-circle-fill" style={{ color: '#0a66c2' }}></i>
                    <p style={{ color: '#0a66c2', fontSize: '0.82rem', margin: 0 }}>Vista simulada de LinkedIn. Las interacciones no son reales.</p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
                    {posts.map((post) => (
                        <div key={post.id} style={{ background: '#fff', border: '1px solid #d0d4d9', borderRadius: 12, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 8, background: '#0a66c2', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <i className="bi bi-building" style={{ color: '#fff', fontSize: '1.1rem' }}></i>
                                </div>
                                <div>
                                    <p style={{ color: '#1d2226', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Gol Ahora</p>
                                    <p style={{ color: '#5e6a75', fontSize: '0.75rem', margin: 0 }}>Instalaciones deportivas · {post.time}</p>
                                </div>
                            </div>
                            <p style={{ color: '#1d2226', fontSize: '0.9rem', lineHeight: 1.65, margin: '0 0 14px' }}>{post.text}</p>
                            <div style={{ borderTop: '1px solid #e6e9ec', paddingTop: 12, display: 'flex', gap: 20 }}>
                                <span style={{ color: '#5e6a75', fontSize: '0.82rem' }}><i className="bi bi-hand-thumbs-up me-1"></i>{post.likes} Me gusta</span>
                                <span style={{ color: '#5e6a75', fontSize: '0.82rem' }}><i className="bi bi-chat-left-text me-1"></i>{post.comments} Comentarios</span>
                                <span style={{ color: '#5e6a75', fontSize: '0.82rem' }}><i className="bi bi-share me-1"></i>Compartir</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Link to="/" style={{ color: '#0a66c2', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver a Gol Ahora
                    </Link>
                </div>
            </div>
        </div>
    );
}
