import { Link } from 'react-router-dom';

const tweets = [
    { id: 1, text: 'Abrieron inscripciones para la Liga de Verano 2025. Cupos limitados. Inscribite en nuestra plataforma. #GolAhora #Futbol', likes: 89, retweets: 34, time: '2h' },
    { id: 2, text: 'Felicitamos a Los Pumas por ganar el Torneo Primavera 2024. Gran final la de anoche. @golahora', likes: 213, retweets: 67, time: '1d' },
    { id: 3, text: 'Nuevo horario de atencion: lunes a viernes 8:00 - 22:00. Sabados y domingos 8:00 - 20:00. Reservas online las 24 horas.', likes: 56, retweets: 28, time: '2d' },
    { id: 4, text: 'Recorda que podes cancelar tu reserva hasta 6 horas antes sin cargo. Aprovecha los descuentos para socios de liga.', likes: 43, retweets: 15, time: '4d' },
    { id: 5, text: 'Nuevos profes certificados sumados al staff de Gol Ahora. Consulta el calendario de clases en la app.', likes: 128, retweets: 41, time: '1sem' }
];

export default function TwitterPage() {
    return (
        <div style={{ background: '#000', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ background: '#000', borderBottom: '1px solid #202327', padding: '14px 20px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10 }}>
                <i className="bi bi-twitter-x" style={{ color: '#fff', fontSize: '1.15rem' }}></i>
                <span style={{ color: '#fff', fontSize: '1rem', fontWeight: 700 }}>GolAhora</span>
            </div>

            <div style={{ maxWidth: 600, margin: '0 auto', borderLeft: '1px solid #202327', borderRight: '1px solid #202327' }}>
                <div style={{ background: 'linear-gradient(135deg, #0f172a, #1d9bf0)', height: 170 }}></div>

                <div style={{ background: '#000', padding: '0 20px 20px', borderBottom: '1px solid #202327' }}>
                    <div style={{ width: 82, height: 82, borderRadius: '50%', background: '#111', border: '4px solid #000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', marginTop: -42, marginBottom: 12 }}>
                        <i className="bi bi-dribbble" style={{ color: '#1d9bf0' }}></i>
                    </div>
                    <h2 style={{ color: '#e7e9ea', fontWeight: 900, fontSize: '1.1rem', margin: '0 0 2px' }}>Gol Ahora</h2>
                    <p style={{ color: '#71767b', fontSize: '0.85rem', margin: '0 0 10px' }}>@golahora_oficial</p>
                    <p style={{ color: '#e7e9ea', fontSize: '0.9rem', margin: '0 0 12px', lineHeight: 1.55 }}>
                        Complejo de canchas de futbol en Buenos Aires. Reservas online 24/7, ligas, torneos y clases para todos los niveles.
                    </p>
                    <div style={{ display: 'flex', gap: 14, color: '#71767b', fontSize: '0.82rem', flexWrap: 'wrap', marginBottom: 14 }}>
                        <span><i className="bi bi-geo-alt me-1"></i>Buenos Aires, AR</span>
                        <span><i className="bi bi-link-45deg me-1"></i>golahora.com.ar</span>
                    </div>
                    <div style={{ display: 'flex', gap: 20 }}>
                        {[{ v: '312', l: 'Siguiendo' }, { v: '5.2K', l: 'Seguidores' }].map((s) => (
                            <span key={s.l} style={{ color: '#71767b', fontSize: '0.85rem' }}>
                                <strong style={{ color: '#e7e9ea' }}>{s.v}</strong> {s.l}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ background: '#08141f', border: '1px solid #12324b', margin: '12px 20px', borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <i className="bi bi-info-circle-fill" style={{ color: '#1d9bf0' }}></i>
                    <p style={{ color: '#8ecdfd', fontSize: '0.8rem', margin: 0 }}>Vista simulada de X. Las interacciones no son reales.</p>
                </div>

                <div style={{ paddingBottom: 40 }}>
                    {tweets.map((tweet) => (
                        <div key={tweet.id} style={{ background: '#000', borderBottom: '1px solid #202327', padding: '16px 20px' }}>
                            <div style={{ display: 'flex', gap: 12 }}>
                                <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                    <i className="bi bi-dribbble" style={{ color: '#1d9bf0', fontSize: '1.05rem' }}></i>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 6 }}>
                                        <span style={{ color: '#e7e9ea', fontWeight: 800, fontSize: '0.9rem' }}>Gol Ahora</span>
                                        <span style={{ color: '#71767b', fontSize: '0.82rem' }}>@golahora_oficial</span>
                                        <span style={{ color: '#71767b', fontSize: '0.78rem', marginLeft: 'auto' }}>{tweet.time}</span>
                                    </div>
                                    <p style={{ color: '#e7e9ea', fontSize: '0.92rem', lineHeight: 1.6, margin: '0 0 12px' }}>{tweet.text}</p>
                                    <div style={{ display: 'flex', gap: 24 }}>
                                        <span style={{ color: '#71767b', fontSize: '0.82rem' }}><i className="bi bi-chat me-1"></i>Responder</span>
                                        <span style={{ color: '#71767b', fontSize: '0.82rem' }}><i className="bi bi-repeat me-1"></i>{tweet.retweets}</span>
                                        <span style={{ color: '#71767b', fontSize: '0.82rem' }}><i className="bi bi-heart me-1"></i>{tweet.likes}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Link to="/" style={{ color: '#1d9bf0', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 }}>
                        <i className="bi bi-arrow-left me-1"></i>
                        Volver a Gol Ahora
                    </Link>
                </div>
            </div>
        </div>
    );
}
