import { Link } from 'react-router-dom';

const tweets = [
    { id: 1, text: '⚽ ¡Abrieron inscripciones para la Liga de Verano 2025! Cupos limitados. Inscribite en nuestra plataforma #GolAhora #Futbol', likes: 89, retweets: 34, time: '2h' },
    { id: 2, text: '🏆 Felicitamos a "Los Pumas" por ganar el Torneo Primavera 2024! Gran final la de anoche. @golahora', likes: 213, retweets: 67, time: '1d' },
    { id: 3, text: '📢 Nuevo horario de atención: Lunes a Viernes 8:00 - 22:00 / Sábados y Domingos 8:00 - 20:00. Reservas online las 24hs.', likes: 56, retweets: 28, time: '2d' },
    { id: 4, text: 'Recordá que podés cancelar tu reserva hasta 6 horas antes sin cargo. ¡Aprovechá los descuentos para socios de liga! 💚', likes: 43, retweets: 15, time: '4d' },
    { id: 5, text: '🌟 Nuevos profes certificados sumados al staff de Gol Ahora. ¡Bienvenidos! Consultá el calendario de clases en la app.', likes: 128, retweets: 41, time: '1sem' },
];

export default function TwitterPage() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            {/* Header */}
            <div style={{ background: '#111d13', borderBottom: '1px solid rgba(255,255,255,0.08)', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <span style={{ color: '#fff', fontSize: '1.2rem', fontWeight: 900 }}>𝕏</span>
                <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>GolAhora</span>
            </div>

            <div style={{ maxWidth: 600, margin: '0 auto' }}>
                {/* Banner */}
                <div style={{ background: 'linear-gradient(135deg, rgba(49,217,79,0.2), rgba(0,0,0,0))', height: 150, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
                    ⚽
                </div>

                {/* Profile */}
                <div style={{ background: '#111d13', padding: '0 20px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)', position: 'relative' }}>
                    <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'linear-gradient(135deg, #31d94f, #0a100c)', border: '4px solid #111d13', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginTop: -40, marginBottom: 12 }}>
                        ⚽
                    </div>
                    <h2 style={{ color: '#fff', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 2px' }}>Gol Ahora</h2>
                    <p style={{ color: '#8ca092', fontSize: '0.85rem', margin: '0 0 10px' }}>@golahora_oficial</p>
                    <p style={{ color: '#c5d8ca', fontSize: '0.88rem', margin: '0 0 12px', lineHeight: 1.5 }}>
                        🏟️ Complejo de canchas de fútbol en Buenos Aires. Reservas online 24/7. Ligas, torneos y clases para todos los niveles. ⚽💚
                    </p>
                    <div style={{ display: 'flex', gap: 8, color: '#8ca092', fontSize: '0.8rem', flexWrap: 'wrap', marginBottom: 14 }}>
                        <span>📍 Buenos Aires, AR</span>
                        <span>🔗 golahora.com.ar</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {[{ v: '312', l: 'Siguiendo' }, { v: '5.2K', l: 'Seguidores' }].map(s => (
                            <span key={s.l} style={{ color: '#c5d8ca', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#fff' }}>{s.v}</strong> {s.l}
                            </span>
                        ))}
                    </div>
                </div>

                {/* Disclaimer */}
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', margin: '12px 20px', borderRadius: 10, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontSize: '1rem' }}>ℹ️</span>
                    <p style={{ color: '#8ca092', fontSize: '0.8rem', margin: 0 }}>Vista simulada de X / Twitter. Las interacciones no son reales.</p>
                </div>

                {/* Tweets */}
                <div style={{ paddingBottom: 40 }}>
                    {tweets.map(tweet => (
                        <div key={tweet.id} style={{ background: '#111d13', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: 'linear-gradient(135deg, #31d94f, #0a100c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>⚽</div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.9rem' }}>Gol Ahora</span>
                                        <span style={{ color: '#8ca092', fontSize: '0.82rem' }}>@golahora_oficial</span>
                                        <span style={{ color: '#8ca092', fontSize: '0.78rem', marginLeft: 'auto' }}>{tweet.time}</span>
                                    </div>
                                    <p style={{ color: '#c5d8ca', fontSize: '0.9rem', lineHeight: 1.6, margin: '0 0 12px' }}>{tweet.text}</p>
                                    <div style={{ display: 'flex', gap: 24 }}>
                                        <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>💬 Responder</span>
                                        <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>🔁 {tweet.retweets}</span>
                                        <span style={{ color: '#8ca092', fontSize: '0.82rem', cursor: 'pointer' }}>♡ {tweet.likes}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Link to="/" style={{ color: '#31d94f', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>← Volver a Gol Ahora</Link>
                </div>
            </div>
        </div>
    );
}
