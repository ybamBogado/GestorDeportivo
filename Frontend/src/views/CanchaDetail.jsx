import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { canchas as canchasApi, reservas as reservasApi } from '../services/api.js';
import './CanchaDetail.css';

const TIME_SLOTS = ['18:00', '19:00', '20:00', '21:00', '22:00', '23:00'];
const PRECIO_BASE = 4500;

function getEndTime(start) {
    const hour = parseInt(start.split(':')[0], 10);
    return hour >= 23 ? '23:59' : `${String(hour + 1).padStart(2, '0')}:00`;
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

export default function CanchaDetail() {
    const { canchaId } = useParams();
    const navigate     = useNavigate();
    const { user }     = useAuth();

    const [cancha, setCancha]           = useState(null);
    const [loading, setLoading]         = useState(true);
    const [error, setError]             = useState(null);
    const [submitting, setSubmitting]   = useState(false);
    const [selectedDate, setSelectedDate] = useState(todayISO());
    const [selectedTime, setSelectedTime] = useState(null);

    useEffect(() => {
        canchasApi.getById(canchaId)
            .then(setCancha)
            .catch(err => setError(err.message))
            .finally(() => setLoading(false));
    }, [canchaId]);

    const handleConfirmReserva = async () => {
        if (!user) {
            setError('Debés iniciar sesión para reservar.');
            setTimeout(() => navigate('/login'), 2000);
            return;
        }
        if (!selectedTime) {
            setError('Por favor, seleccioná un horario.');
            return;
        }

        setError(null);
        setSubmitting(true);
        try {
            const data = await reservasApi.create({
                canchaId:   parseInt(canchaId, 10),
                personaId:  user.id,
                fecha:      selectedDate,
                horaInicio: selectedTime,
                horaFin:    getEndTime(selectedTime),
                precio:     PRECIO_BASE,
                pago:       false,
            });
            navigate(`/pago/${data.cobroId}`);
        } catch {
            setError('La reserva no pudo procesarse. Intentá de nuevo.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <><Header /><Loader /><Footer /></>;

    return (
        <>
            <Header />
            <main className="detail-page fade-in-up">
                <div className="detail-card">
                    {/* ── Panel izquierdo ──────────────────────────────────── */}
                    <div className="detail-left">
                        <img
                            src="https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80"
                            alt={cancha?.superficie}
                            className="detail-img"
                        />
                        <div className="detail-info">
                            <h2>{cancha?.superficie}</h2>
                            <span className="detail-badge">Disponible</span>
                            <p className="detail-description">
                                Iluminación LED de alta potencia, vestuarios premium y
                                estacionamiento vigilado. Ideal para partidos de {cancha?.capacidad} jugadores.
                            </p>
                            <div className="detail-stat">
                                <span>Capacidad</span>
                                <strong>{cancha?.capacidad} jugadores</strong>
                            </div>
                        </div>
                    </div>

                    {/* ── Panel derecho ─────────────────────────────────────── */}
                    <div className="detail-right">
                        <h3>CONFIGURÁ TU TURNO</h3>

                        {error && <div className="detail-error" role="alert">{error}</div>}

                        <div className="detail-section">
                            <label className="detail-label">1. SELECCIONÁ EL DÍA</label>
                            <input
                                type="date"
                                className="detail-date-input"
                                value={selectedDate}
                                min={todayISO()}
                                onChange={e => setSelectedDate(e.target.value)}
                            />
                        </div>

                        <div className="detail-section">
                            <label className="detail-label">2. SELECCIONÁ EL HORARIO</label>
                            <div className="time-slots">
                                {TIME_SLOTS.map(time => (
                                    <button
                                        key={time}
                                        type="button"
                                        className={`time-slot ${selectedTime === time ? 'time-slot--active' : ''}`}
                                        onClick={() => setSelectedTime(time)}
                                    >
                                        {time}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="detail-summary">
                            <div className="detail-price-row">
                                <span>Total a pagar</span>
                                <strong className="detail-price">${PRECIO_BASE.toLocaleString('es-AR')}</strong>
                            </div>
                            <button
                                className="detail-reserve-btn"
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
            </main>
            <Footer />
        </>
    );
}
