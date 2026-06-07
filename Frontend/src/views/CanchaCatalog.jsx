import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import './CanchaCatalog.css';

const BACKGROUND_IMAGES = [
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1600&q=80',
    'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=1600&q=80',
    'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=1600&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=1600&q=80'
];

export default function CanchaCatalog() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [bgIndex, setBgIndex] = useState(0);

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
                        <span className="welcome-badge">⚽ Gol Ahora</span>
                        <h2>Viví la pasión del fútbol</h2>
                        <p>
                            Alquilá canchas de césped sintético y natural de la mejor calidad.
                            Instalaciones premium con vestuarios, iluminación LED y estacionamiento.
                        </p>
                        <button onClick={() => navigate('/select-cancha')} className="cancha-card-btn">
                            Seleccionar cancha
                        </button>
                    </div>
                </div>
            </main>
            <Footer />
        </>
    );
}
