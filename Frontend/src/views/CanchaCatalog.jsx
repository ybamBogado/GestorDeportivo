import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../components/Toast.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { clases as clasesApi, entrenamientos as entrenamientosApi, equipos as equiposApi } from '../services/api.js';
import './CanchaCatalog.css';

const BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1600&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1600&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80'
];

export default function CanchaCatalog() {
    const { user, loading: authLoading } = useAuth();
    const { notify } = useToast();
    const navigate = useNavigate();
    const [bgIndex, setBgIndex] = useState(0);
    const [clases, setClases] = useState([]);
    const [entrenamientos, setEntrenamientos] = useState([]);
    const [equipos, setEquipos] = useState([]);
    const [loadingExtras, setLoadingExtras] = useState(true);
    const [inscribiendo, setInscribiendo] = useState('');

    useEffect(() => {
        if (!authLoading && user?.rol === 'Administrador') {
            navigate('/admin');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        const interval = setInterval(() => {
            setBgIndex((prev) => (prev + 1) % BACKGROUND_IMAGES.length);
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        Promise.all([
            clasesApi.getAll(),
            entrenamientosApi.getAll(),
            equiposApi.getAll()
        ])
            .then(([clasesData, entrenamientosData, equiposData]) => {
                setClases(clasesData.slice(0, 3));
                setEntrenamientos(entrenamientosData.slice(0, 3));
                setEquipos(equiposData.slice(0, 4));
            })
            .catch((error) => {
                notify(`No se pudieron cargar las inscripciones deportivas: ${error.message}`, 'error');
            })
            .finally(() => setLoadingExtras(false));
    }, [notify]);

    const formatDateTime = (value) => {
        if (!value) return 'A confirmar';
        return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const handleInscripcionClase = async (claseId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setInscribiendo(`clase-${claseId}`);
        try {
            const result = await clasesApi.inscribirse(claseId, user.id);
            const cobroId = result.cobroId ?? result.CobroId;
            if (cobroId) {
                navigate(`/pago/${cobroId}`);
                return;
            }
            notify('Inscripción a clase confirmada', 'success');
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            setInscribiendo('');
        }
    };

    const handleInscripcionEntrenamiento = async (entrenamientoId) => {
        if (!user) {
            navigate('/login');
            return;
        }

        setInscribiendo(`entrenamiento-${entrenamientoId}`);
        try {
            const result = await entrenamientosApi.inscribirse(entrenamientoId, user.id);
            const cobroId = result.cobroId ?? result.CobroId;
            if (cobroId) {
                navigate(`/pago/${cobroId}`);
                return;
            }
            notify('Inscripción a entrenamiento confirmada', 'success');
        } catch (error) {
            notify(error.message, 'error');
        } finally {
            setInscribiendo('');
        }
    };

    return (
        <>
            <Header />
            <main className="landing-page-hero">
                {BACKGROUND_IMAGES.map((imgUrl, index) => (
                    <div
                        key={imgUrl}
                        className={`hero-bg-slide ${index === bgIndex ? 'active' : ''}`}
                        style={{
                            backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.8)), url(${imgUrl})`
                        }}
                    />
                ))}

                <div className="landing-hero-content">
                    <div className="welcome-labels">
                        <span className="section-main-title">Canchas Disponibles</span>
                        <h1 className="slide-hero-title">Reservá tu cancha</h1>
                    </div>

                    <div className="landing-welcome-card">
                        <span className="welcome-badge">Gol Ahora</span>
                        <h2>Viví la pasión del fútbol</h2>
                        <p>
                            Alquilá canchas de césped sintético y natural de la mejor calidad.
                            Instalaciones premium con vestuarios, iluminación LED y estacionamiento.
                        </p>
                        <button onClick={() => navigate('/select-cancha')} className="cancha-card-btn">
                            Seleccionar cancha
                        </button>
                    </div>

                    <section className="landing-cta-panel">
                        <div className="landing-cta-panel__header">
                            <span className="welcome-badge welcome-badge--secondary">Inscripciones</span>
                            <h3>Inscribirse a clases, entrenamientos y equipos</h3>
                            <p>Debajo de la reserva de cancha, dejamos accesos rápidos para sumarte a más actividades.</p>
                        </div>

                        <div className="landing-cta-grid">
                            <article className="landing-cta-card">
                                <div className="landing-cta-card__title-row">
                                    <h4>Clases disponibles</h4>
                                    <span>{clases.length}</span>
                                </div>
                                {loadingExtras ? (
                                    <p className="landing-cta-card__empty">Cargando clases...</p>
                                ) : clases.length === 0 ? (
                                    <p className="landing-cta-card__empty">No hay clases publicadas por ahora.</p>
                                ) : (
                                    clases.map((clase) => (
                                        <div key={clase.id} className="landing-activity-item">
                                            <div>
                                                <strong>{clase.tipo}</strong>
                                                <span>{formatDateTime(clase.fechaHora)}</span>
                                            </div>
                                            <button
                                                className="landing-mini-btn"
                                                onClick={() => handleInscripcionClase(clase.id)}
                                                disabled={inscribiendo === `clase-${clase.id}`}
                                            >
                                                {inscribiendo === `clase-${clase.id}` ? 'Inscribiendo...' : 'Inscribirse'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </article>

                            <article className="landing-cta-card">
                                <div className="landing-cta-card__title-row">
                                    <h4>Entrenamientos disponibles</h4>
                                    <span>{entrenamientos.length}</span>
                                </div>
                                {loadingExtras ? (
                                    <p className="landing-cta-card__empty">Cargando entrenamientos...</p>
                                ) : entrenamientos.length === 0 ? (
                                    <p className="landing-cta-card__empty">No hay entrenamientos publicados por ahora.</p>
                                ) : (
                                    entrenamientos.map((entrenamiento) => (
                                        <div key={entrenamiento.id} className="landing-activity-item">
                                            <div>
                                                <strong>{entrenamiento.tipo}</strong>
                                                <span>{formatDateTime(entrenamiento.fecha)}</span>
                                            </div>
                                            <button
                                                className="landing-mini-btn"
                                                onClick={() => handleInscripcionEntrenamiento(entrenamiento.id)}
                                                disabled={inscribiendo === `entrenamiento-${entrenamiento.id}`}
                                            >
                                                {inscribiendo === `entrenamiento-${entrenamiento.id}` ? 'Inscribiendo...' : 'Inscribirse'}
                                            </button>
                                        </div>
                                    ))
                                )}
                            </article>

                            <article className="landing-cta-card landing-cta-card--teams">
                                <div className="landing-cta-card__title-row">
                                    <h4>Inscribirse a un equipo</h4>
                                    <span>{equipos.length}</span>
                                </div>
                                {loadingExtras ? (
                                    <p className="landing-cta-card__empty">Cargando equipos...</p>
                                ) : equipos.length === 0 ? (
                                    <p className="landing-cta-card__empty">No hay equipos abiertos para sumarte.</p>
                                ) : (
                                    <>
                                        {equipos.map((equipo) => (
                                            <div key={equipo.id} className="landing-team-item">
                                                <div>
                                                    <strong>{equipo.nombre}</strong>
                                                    <span>{equipo.categoria || 'Libre'} · {equipo.jugadores} miembros</span>
                                                </div>
                                                <button
                                                    className="landing-mini-btn landing-mini-btn--ghost"
                                                    onClick={() => navigate(`/equipos/${equipo.id}`)}
                                                >
                                                    Ver equipo
                                                </button>
                                            </div>
                                        ))}
                                        <button className="cancha-card-btn cancha-card-btn--secondary" onClick={() => navigate('/competencias')}>
                                            Ver ligas y torneos
                                        </button>
                                    </>
                                )}
                            </article>
                        </div>
                    </section>
                </div>
            </main>
            <Footer />
        </>
    );
}
