import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import Loader from '../components/Loader.jsx';
import { canchas as canchasApi, reservas as reservasApi } from '../services/api.js';
import './SelectCancha.css';

const CANCHA_IMAGES = {
    'Fútbol 5':  'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    'Fútbol 7':  'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?w=800&q=80',
    'Fútbol 11': 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?w=800&q=80',
    default:     'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
};

const TIME_SLOTS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const PRECIO_BASE = 4500;

function getCanchaImage(tipo) {
    return CANCHA_IMAGES[tipo] || CANCHA_IMAGES.default;
}

function getEndTime(start) {
    const hour = parseInt(start.split(':')[0], 10);
    return hour >= 23 ? '23:59' : `${String(hour + 1).padStart(2, '0')}:00`;
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

export default function SelectCancha() {
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const [canchas, setCanchas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Booking states
    const [selectedCancha, setSelectedCancha] = useState(null);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [selectedTime, setSelectedTime] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [bookingError, setBookingError] = useState(null);

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

    const handleSelectCancha = (cancha) => {
        if (selectedCancha?.id === cancha.id) {
            setSelectedCancha(null);
            setSelectedTime(null);
            setBookingError(null);
        } else {
            setSelectedCancha(cancha);
            setSelectedTime(null);
            setBookingError(null);
        }
    };

    const handleConfirmReserva = async () => {
        if (!user) {
            setBookingError('Debés iniciar sesión para reservar.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        if (!selectedTime) {
            setBookingError('Por favor, seleccioná un horario.');
            return;
        }

        setBookingError(null);
        setSubmitting(true);
        try {
            const data = await reservasApi.create({
                canchaId:   parseInt(selectedCancha.id, 10),
                personaId:  user.id,
                fecha:      selectedDate,
                horaInicio: selectedTime,
                horaFin:    getEndTime(selectedTime),
                precio:     PRECIO_BASE,
                pago:       false,
            });
            navigate(`/pago/${data.cobroId}`);
        } catch {
            setBookingError('La reserva no pudo procesarse. Intentá de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

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
            <main className="select-cancha-page fade-in-up">
                <div className="select-cancha-container">
                    <div className="select-cancha-header">
                        <span className="select-badge-highlight">⚽ Nuestras Instalaciones</span>
                        <h1>Seleccioná una Cancha</h1>
                        <p>Elegí la superficie y tipo de cancha que prefieras de la lista para desplegar el configurador de reserva</p>
                    </div>

                    <div className="select-cancha-grid">
                        {canchas.length === 0 ? (
                            <div className="select-cancha-empty">
                                <p>No hay canchas disponibles en este momento.</p>
                            </div>
                        ) : (
                            canchas.map(cancha => (
                                <div
                                    key={cancha.id}
                                    className={`select-cancha-card-item ${selectedCancha?.id === cancha.id ? 'active-cancha' : ''}`}
                                    onClick={() => handleSelectCancha(cancha)}
                                >
                                    <div className="select-cancha-card-img">
                                        <img src={getCanchaImage(cancha.tipoCancha)} alt={cancha.superficie} />
                                        <span className={`cancha-badge ${cancha.estado === 'Disponible' ? 'cancha-badge--available' : 'cancha-badge--busy'}`}>
                                            {cancha.estado}
                                        </span>
                                    </div>
                                    <div className="select-cancha-card-body">
                                        <p className="select-cancha-card-type">{cancha.tipoCancha || 'Fútbol'}</p>
                                        <h3 className="select-cancha-card-title">{cancha.superficie}</h3>
                                        <div className="select-cancha-card-meta">
                                            <span>👥 Capacidad: <strong>{cancha.capacidad} jugadores</strong></span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Interactive Turn Configurator - displayed in centered modal with blurred background */}
                    {selectedCancha && (
                        <div id="booking-form-unfolded-section" className="booking-form-unfolded-wrapper" onClick={() => setSelectedCancha(null)}>
                            <div className="booking-detail-card-container fade-in-up" onClick={e => e.stopPropagation()}>
                                <button className="booking-modal-close-btn" onClick={() => setSelectedCancha(null)} aria-label="Cerrar">
                                    <i className="bi bi-x-lg"></i>
                                </button>
                                <div className="booking-detail-card">
                                    <div className="booking-detail-left">
                                        <img
                                            src={getCanchaImage(selectedCancha.tipoCancha)}
                                            alt={selectedCancha.superficie}
                                            className="booking-detail-img"
                                        />
                                        <div className="booking-detail-info">
                                            <h2>{selectedCancha.superficie}</h2>
                                            <span className="booking-detail-badge">Seleccionada</span>
                                            <p className="booking-detail-description">
                                                Iluminación LED de alta potencia, vestuarios premium y
                                                estacionamiento vigilado. Ideal para partidos de {selectedCancha.capacidad} jugadores.
                                            </p>
                                            <div className="booking-detail-stat">
                                                <span>Capacidad</span>
                                                <strong>{selectedCancha.capacidad} jugadores</strong>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="booking-detail-right">
                                        <h3>CONFIGURÁ TU TURNO</h3>

                                        {bookingError && <div className="booking-detail-error" role="alert">{bookingError}</div>}

                                        <div className="booking-detail-section">
                                            <label className="booking-detail-label">1. SELECCIONÁ EL DÍA</label>
                                            <input
                                                type="date"
                                                className="booking-detail-date-input"
                                                value={selectedDate}
                                                min={todayISO()}
                                                onChange={e => setSelectedDate(e.target.value)}
                                            />
                                        </div>

                                        <div className="booking-detail-section">
                                            <label className="booking-detail-label">2. SELECCIONÁ EL HORARIO</label>
                                            <div className="booking-time-slots">
                                                {TIME_SLOTS.map(time => (
                                                    <button
                                                        key={time}
                                                        type="button"
                                                        className={`booking-time-slot ${selectedTime === time ? 'booking-time-slot--active' : ''}`}
                                                        onClick={() => setSelectedTime(time)}
                                                    >
                                                        {time}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="booking-detail-summary">
                                            <div className="booking-detail-price-row">
                                                <span>Total a pagar</span>
                                                <strong className="booking-detail-price">${PRECIO_BASE.toLocaleString('es-AR')}</strong>
                                            </div>
                                            <button
                                                className="booking-detail-reserve-btn"
                                                onClick={handleConfirmReserva}
                                                disabled={submitting}
                                            >
                                                {submitting
                                                    ? 'Procesando...'
                                                    : selectedTime
                                                        ? `RESERVAR PARA LAS ${selectedTime}`
                                                        : 'ELEGÍ UN HORARIO'}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
            <Footer />
        </>
    );
}
