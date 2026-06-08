import { Link } from 'react-router-dom';

const posts = [
    {
        id: 1,
        text: '🏟️ Estamos buscando profesores de fútbol certificados para la temporada 2025. Sumate al equipo de Gol Ahora y desarrollá tu carrera en un ambiente profesional. Enviá tu CV a rrhh@golahora.com.ar #Empleo #FutbolProfesional',
        likes: 87,
        comments: 12,
        time: 'Hace 3 días',
    },
    {
        id: 2,
        text: '📊 Cerramos el año con más de 10.000 reservas procesadas y 150 equipos inscriptos en ligas y torneos. Gracias a toda nuestra comunidad deportiva. ¡2025 viene con novedades! #Deportes #Gestión #GolAhora',
        likes: 214,
        comments: 31,
        time: 'Hace 1 semana',
    },
    {
        id: 3,
        text: '💡 Implementamos un sistema de gestión digital para nuestro complejo deportivo. Ahora los usuarios pueden reservar canchas, inscribirse a torneos y gestionar pagos desde cualquier dispositivo. La tecnología al servicio del deporte. #Innovación #TechDeportes',
        likes: 341,
        comments: 48,
        time: 'Hace 2 semanas',
    },
];

export default function LinkedInPage() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#111d13', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, background: '#0077b5', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 900, fontSize: '0.9rem' }}>in</div>
                <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>LinkedIn</span>
            </div>

            <div style={{ maxWidth: 700, margin: '0 auto', padding: '20px' }}>
                {/* Company card */}
                <div style={{ background: '#111d13', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, overflow: 'hidden', marginBottom: 20 }}>
                    <div style={{ background: 'linear-gradient(135deg, #31d94f22, #0077b522)', height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3.5rem' }}>
                        ⚽
                    </div>
                    <div style={{ padding: '20px 24px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                            <div>
                                <h1 style={{ color: '#fff', fontWeight: 800, fontSize: '1.3rem', margin: '0 0 4px' }}>Gol Ahora — Complejo Deportivo</h1>
                                <p style={{ color: '#8ca092', fontSize: '0.85rem', margin: '0 0 8px' }}>Instalaciones deportivas · Buenos Aires, Argentina</p>
                                <p style={{ color: '#8ca092', fontSize: '0.82rem', margin: 0 }}>1.240 seguidores · 28 empleados</p>
                            </div>
                            <div style={{ padding: '8px 20px', background: '#0077b5', borderRadius: 20, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                + Seguir
                            </div>
                        </div>
                        <p style={{ color: '#c5d8ca', fontSize: '0.88rem', lineHeight: 1.6, margin: '0 0 16px' }}>
                            Gol Ahora es un complejo deportivo dedicado al alquiler de canchas de fútbol y la organización de ligas, torneos y clases para todas las edades y niveles. Ofrecemos un sistema de gestión digital que facilita reservas, pagos e inscripciones online.
                        </p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {['Fútbol', 'Deporte', 'Reservas Online', 'Ligas y Torneos', 'Buenos Aires'].map(tag => (
                                <span key={tag} style={{ background: 'rgba(0,119,181,0.12)', border: '1px solid rgba(0,119,181,0.25)', borderRadius: 20, padding: '3px 12px', color: '#93b8f7', fontSize: '0.78rem', fontWeight: 600 }}>
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(0,119,181,0.08)', border: '1px solid rgba(0,119,181,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                    <p style={{ color: '#93b8f7', fontSize: '0.82rem', margin: 0 }}>Vista simulada de LinkedIn. Las interacciones no son reales.</p>
                </div>

                {/* Posts */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 40 }}>
                    {posts.map(post => (
                        <div key={post.id} style={{ background: '#111d13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '18px 20px' }}>
                            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14 }}>
                                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'linear-gradient(135deg, #31d94f22, #0077b522)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0 }}>⚽</div>
                                <div>
                                    <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9rem', margin: 0 }}>Gol Ahora</p>
                                    <p style={{ color: '#8ca092', fontSize: '0.75rem', margin: 0 }}>Instalaciones deportivas · {post.time}</p>
                                </div>
                            </div>
                            <p style={{ color: '#c5d8ca', fontSize: '0.88rem', lineHeight: 1.65, margin: '0 0 14px' }}>{post.text}</p>
                            <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12, display: 'flex', gap: 20 }}>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>👍 {post.likes} Me gusta</span>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>💬 {post.comments} Comentarios</span>
                                <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>↗️ Compartir</span>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                    <Link to="/" style={{ color: '#31d94f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← Volver a Gol Ahora</Link>
                </div>
            </div>
        </div>
    );
}
