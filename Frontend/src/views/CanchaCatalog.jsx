import { useState, useEffect } from 'react'
import Header from '../components/Header.jsx'
import Footer from '../components/Footer.jsx'
import Loader from '../components/Loader.jsx'
import { Link } from 'react-router-dom'
import './CanchaCatalog.css'

export default function CanchaCatalog() {
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Actualizado al puerto 5071 del backend
        fetch('http://localhost:5071/api/v1/canchas')
            .then(response => {
                if (!response.ok) throw new Error("No se pudieron cargar las canchas.");
                return response.json();
            })
            .then(data => {
                // Filter out canchas that are in Mantenimiento
                const canchasDisponibles = data.filter(c => c.estado !== 'Mantenimiento');
                setCanchas(canchasDisponibles);
            })
            .catch(err => {
                console.error(err);
                setError(err.message);
            })
            .finally(() => setLoading(false));
    }, []);

    if (error) {
        return (
            <>
                <Header />
                <div className="container text-center mt-5">
                    <div className="alert alert-danger shadow-sm py-4" style={{ backgroundColor: '#1a1a1a', border: '1px solid #dc3545' }}>
                        <h4 className="fw-bold text-danger">Error al conectar con el servidor</h4>
                        <p className="text-secondary">Asegúrate de que el backend esté corriendo en el puerto 5071.</p>
                        <button className="btn btn-outline-danger mt-2" onClick={() => window.location.reload()}>
                            Reintentar
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    if (loading) {
        return (
            <>
                <Header />
                <Loader />
                <Footer />
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container mt-4 cancha-container">
                <h1 className="text-center mb-4 cancha-title fw-bold" style={{ letterSpacing: '2px' }}>CATÁLOGO DE CANCHAS</h1>
                <div className="row justify-content-center">
                    {canchas.map(cancha => (
                        <div key={cancha.id} className="col-12 col-md-6 col-lg-4 mb-4">
                            <div className="card shadow-sm cancha-card" style={{ backgroundColor: '#111d13', border: '1px solid #1b4332' }}>
                                <div className="card-body p-0">
                                    <div style={{ position: 'relative' }}>
                                        <img 
                                            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                                            alt={cancha.superficie} 
                                            className="card-img-top"
                                            style={{ height: '200px', objectFit: 'cover', opacity: '0.8' }}
                                        />
                                        <span className={`badge position-absolute top-0 end-0 m-3 ${cancha.estado === 'Disponible' ? 'bg-success' : 'bg-warning'}`}>
                                            {cancha.estado}
                                        </span>
                                    </div>
                                    <div className="p-3">
                                        <h5 className="card-title fw-bold text-white mb-1">{cancha.superficie}</h5>
                                        <p className="text-secondary small mb-3">Capacidad: {cancha.capacidad} jugadores</p>
                                        <Link to={`/cancha/${cancha.id}`}>
                                            <button className="btn btn-success w-100 fw-bold" style={{ borderRadius: '8px' }}>
                                                RESERVAR AHORA
                                            </button>
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <Footer />
        </>
    );
}
