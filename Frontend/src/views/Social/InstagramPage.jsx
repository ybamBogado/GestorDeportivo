import { Link } from 'react-router-dom';

const posts = [
    { id: 1, emoji: '⚽', text: '¡Noche de fútbol en Gol Ahora! ✨ Canchas techadas disponibles los 7 días. Reservá ya. #GolAhora #Futbol5 #NocheDeFutbol', likes: 312, time: '2h' },
    { id: 2, emoji: '🏆', text: 'INSCRIPCIONES ABIERTAS 🔥 Liga de Verano 2025. Plazas limitadas para equipos. Link en bio 👆 #LigaVerano #Torneo', likes: 541, time: '1d' },
    { id: 3, emoji: '🎽', text: 'Nuevos uniformes para el staff de Gol Ahora 💚 Orgullosos de nuestro equipo. #Team #GolAhora', likes: 198, time: '3d' },
    { id: 4, emoji: '🌟', text: 'Clases de fútbol para todas las edades! 👦👧 Profesores certificados. Consultá horarios en nuestra plataforma.', likes: 267, time: '5d' },
    { id: 5, emoji: '🎉', text: '¡Felicitamos a los campeones del Torneo Primavera 2024! Increíble partido final 🏅', likes: 891, time: '1sem' },
    { id: 6, emoji: '📅', text: 'Recordá: Podés hacer tus reservas online desde cualquier dispositivo 📱💻 Rápido y fácil.', likes: 143, time: '2sem' },
];

export default function InstagramPage() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header tipo Instagram */}
            <div style={{ background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', padding: '3px 0' }}>
                <div style={{ background: '#080c0a', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <span style={{ color: '#fff', fontSize: '1.3rem', fontWeight: 800, fontFamily: 'serif', letterSpacing: -0.5 }}>golahora_oficial</span>
                </div>
            </div>

            <div style={{ maxWidth: 600, margin: '0 auto', padding: '20px 20px' }}>
                {/* Profile */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginBottom: 24 }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433, #bc1888)', padding: 3, flexShrink: 0 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111d13', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⚽</div>
                    </div>
                    <div>
                        <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.1rem', margin: '0 0 4px' }}>golahora_oficial</h2>
                        <div style={{ display: 'flex', gap: 20, marginBottom: 8 }}>
                            {[{ v: '312', l: 'publicaciones' }, { v: '5.2K', l: 'seguidores' }, { v: '48', l: 'seguidos' }].map(s => (
                                <div key={s.l} style={{ textAlign: 'center' }}>
                                    <div style={{ color: '#fff', fontWeight: 800, fontSize: '0.95rem' }}>{s.v}</div>
                                    <div style={{ color: '#8ca092', fontSize: '0.72rem' }}>{s.l}</div>
                                </div>
                            ))}
                        </div>
                        <p style={{ color: '#c5d8ca', fontSize: '0.82rem', margin: 0 }}>🏟️ Complejo deportivo · Reservas online ⚽ Buenos Aires, Argentina</p>
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(240,148,51,0.08)', border: '1px solid rgba(240,148,51,0.25)', borderRadius: 10, padding: '10px 16px', marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1.1rem' }}>ℹ️</span>
                    <p style={{ color: '#f0ac6a', fontSize: '0.82rem', margin: 0 }}>Vista simulada de Instagram. Las interacciones no son reales.</p>
                </div>

                {/* Grid de posts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, marginBottom: 24 }}>
                    {posts.map(post => (
                        <div key={post.id} style={{ aspectRatio: '1', background: 'linear-gradient(135deg, rgba(49,217,79,0.15), rgba(24,119,242,0.1))', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4, cursor: 'pointer', borderRadius: 4 }}>
                            <span style={{ fontSize: '2.2rem' }}>{post.emoji}</span>
                            <span style={{ color: '#8ca092', fontSize: '0.68rem' }}>❤️ {post.likes}</span>
                        </div>
                    ))}
                </div>

                {/* Feed */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingBottom: 40 }}>
                    {posts.map(post => (
                        <div key={post.id} style={{ background: '#111d13', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, overflow: 'hidden' }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '12px 14px' }}>
                                <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #f09433, #bc1888)', padding: 2 }}>
                                    <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: '#111d13', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem' }}>⚽</div>
                                </div>
                                <span style={{ color: '#fff', fontWeight: 700, fontSize: '0.85rem' }}>golahora_oficial</span>
                                <span style={{ color: '#8ca092', fontSize: '0.75rem', marginLeft: 'auto' }}>{post.time}</span>
                            </div>
                            <div style={{ background: 'rgba(49,217,79,0.06)', height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '5rem' }}>
                                {post.emoji}
                            </div>
                            <div style={{ padding: '12px 14px' }}>
                                <div style={{ display: 'flex', gap: 14, marginBottom: 10 }}>
                                    <span style={{ color: '#c5d8ca', fontSize: '1.1rem', cursor: 'pointer' }}>♡</span>
                                    <span style={{ color: '#c5d8ca', fontSize: '1.1rem', cursor: 'pointer' }}>💬</span>
                                    <span style={{ color: '#c5d8ca', fontSize: '1.1rem', cursor: 'pointer', marginLeft: 'auto' }}>🔖</span>
                                </div>
                                <p style={{ color: '#c5d8ca', fontSize: '0.82rem', margin: '0 0 4px' }}><strong style={{ color: '#fff' }}>❤️ {post.likes} Me gusta</strong></p>
                                <p style={{ color: '#c5d8ca', fontSize: '0.82rem', margin: 0 }}><strong style={{ color: '#fff' }}>golahora_oficial</strong> {post.text}</p>
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
