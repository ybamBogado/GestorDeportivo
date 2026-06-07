import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import { canchas as canchasApi } from '../services/api.js';
import './CanchaCatalog.css';

const CANCHA_IMAGES = {
    'Fútbol 5':  'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?w=800&q=80',
    'Fútbol 7':  'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    'Fútbol 11': 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=800&q=80',
    default:     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
};

function getCanchaImage(tipo) {
    return CANCHA_IMAGES[tipo] || CANCHA_IMAGES.default;
}

export default function CanchaCatalog() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!authLoading && user?.rol === 'Administrador') {
            navigate('/admin');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        canchasApi.getAll()
            .then(data => setCanchas(data.filter(c => c.estado !== 'Mantenimiento')))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, []);

    if (loading) return <><Header /><Loader /><Footer /></>;

    if (error) {
        return (
            <>
                <Header />
                <div className="catalog-error-container">
                    <div className="catalog-error-card">
                        <div className="catalog-error-icon">⚠</div>
                        <h4>No se pudo conectar con el servidor</h4>
                        <p>Asegúrate de que el backend esté corriendo.</p>
                        <button onClick={() => window.location.reload()}>Reintentar</button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <main className="catalog-page">
                <div className="catalog-hero">
                    <h1>Reservá tu cancha</h1>
                    <p>Elegí el tipo de cancha que más se adapte a tu partido</p>
                </div>

                <div className="catalog-grid">
                    {canchas.length === 0 ? (
                        <div className="catalog-empty">
                            <p>No hay canchas disponibles en este momento.</p>
                        </div>
                    ) : (
                        canchas.map(cancha => (
                            <article key={cancha.id} className="cancha-card">
                                <div className="cancha-card-img-wrapper">
                                    <img
                                        src={getCanchaImage(cancha.tipoCancha)}
                                        alt={cancha.superficie}
                                        loading="lazy"
                                    />
                                    <span className={`cancha-badge ${cancha.estado === 'Disponible' ? 'cancha-badge--available' : 'cancha-badge--busy'}`}>
                                        {cancha.estado}
                                    </span>
                                </div>
                                <div className="cancha-card-body">
                                    <h2 className="cancha-card-title">{cancha.superficie}</h2>
                                    <p className="cancha-card-type">{cancha.tipoCancha || 'Fútbol'}</p>
                                    <div className="cancha-card-meta">
                                        <span>👥 {cancha.capacidad} jugadores</span>
                                    </div>
                                    <Link to={`/cancha/${cancha.id}`} className="cancha-card-btn">
                                        Reservar ahora
                                    </Link>
                                </div>
                            </article>
                        ))
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
