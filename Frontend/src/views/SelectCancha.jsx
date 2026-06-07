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

// Hora de apertura y cierre del club
const HORA_APERTURA = 8;  // 08:00
const HORA_CIERRE   = 23; // hasta las 23:00

/**
 * Genera bloques fijos dinámicos según la duración máxima de la cancha.
 * Ejemplo: duracion=90 min → slots: 08:00, 09:30, 11:00, ...
 * Esto evita huecos muertos en la agenda del club (Opción A del plan).
 */
function generateTimeSlots(duracionMinutos) {
    const slots = [];
    let current = HORA_APERTURA * 60; // en minutos
    const end   = HORA_CIERRE  * 60;
    while (current + duracionMinutos <= end) {
        const startH = String(Math.floor(current / 60)).padStart(2, '0');
        const startM = String(current % 60).padStart(2, '0');
        
        const next = current + duracionMinutos;
        const endH = String(Math.floor(next / 60)).padStart(2, '0');
        const endM = String(next % 60).padStart(2, '0');
        
        slots.push({
            start: `${startH}:${startM}`,
            end: `${endH}:${endM}`
        });
        current += duracionMinutos;
    }
    return slots;
}

function addMinutesToTime(timeStr, minutes) {
    const [h, m] = timeStr.split(':').map(Number);
    const total = h * 60 + m + minutes;
    return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function todayISO() {
    return new Date().toISOString().split('T')[0];
}

function maxDateISO() {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
}

function getCanchaImage(tipo) {
    return CANCHA_IMAGES[tipo] || CANCHA_IMAGES.default;
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

    // Disponibilidad dinámica
    const [disponibilidad, setDisponibilidad] = useState(null);
    const [loadingDisp, setLoadingDisp] = useState(false);

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

    const [activeCheckoutCobroId, setActiveCheckoutCobroId] = useState(null);

    useEffect(() => {
        if (!user) {
            setActiveCheckoutCobroId(null);
            return;
        }

        const checkActiveCheckout = async () => {
            try {
                const allReservas = await reservasApi.getAll();
                const nowMs = new Date().getTime();
                
                const pending = allReservas.find(r => {
                    if (r.personaId !== user.id || r.estado !== 'Pendiente') return false;
                    const expDate = r.fechaExpiracion;
                    if (!expDate) return false;
                    const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
                    return exp > nowMs && (exp - nowMs) <= 15 * 60 * 1000;
                });

                if (pending) {
                    const response = await fetch(`http://localhost:5071/api/v1/cobros`);
                    if (response.ok) {
                        const allCobros = await response.json();
                        const cobro = allCobros.find(c => c.reservaId === pending.id);
                        if (cobro) {
                            setActiveCheckoutCobroId(cobro.id);
                            return;
                        }
                    }
                }
                setActiveCheckoutCobroId(null);
            } catch (e) {
                console.error("Error checking active checkout", e);
            }
        };

        checkActiveCheckout();
        const handleUpdate = () => checkActiveCheckout();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                checkActiveCheckout();
            }
        };
        window.addEventListener('reservaUpdate', handleUpdate);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => {
            window.removeEventListener('reservaUpdate', handleUpdate);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [user]);

    // Cada vez que cambia la cancha o la fecha, consulta disponibilidad
    useEffect(() => {
        if (!selectedCancha) { setDisponibilidad(null); return; }
        setLoadingDisp(true);
        setSelectedTime(null);
        fetch(`http://localhost:5071/api/v1/reservas/disponibilidad?canchaId=${selectedCancha.id}&fecha=${selectedDate}`)
            .then(r => r.json())
            .then(data => setDisponibilidad(data))
            .catch(() => setDisponibilidad(null))
            .finally(() => setLoadingDisp(false));
    }, [selectedCancha, selectedDate]);

    /**
     * Determina si un slot está ocupado comparando con las reservas activas y bloqueos.
     */
    function isSlotOcupado(slotTime) {
        if (!disponibilidad) return false;
        const durMin = disponibilidad.duracionMaximaMinutos || 60;
        const [sh, sm] = slotTime.split(':').map(Number);
        const slotIni = sh * 60 + sm;
        const slotFin = slotIni + durMin;

        const ocupadoPorReserva = (disponibilidad.reservasOcupadas || []).some(r => {
            const [rh, rm] = (r.horaInicio?.substring(0, 5) || '00:00').split(':').map(Number);
            const [fh, fm] = (r.horaFin?.substring(0, 5)   || '00:00').split(':').map(Number);
            const rIni = rh * 60 + rm;
            const rFin = fh * 60 + fm;
            return slotIni < rFin && slotFin > rIni;
        });

        const ocupadoPorBloqueo = (disponibilidad.bloqueos || []).some(b => {
            const bIni = new Date(b.fechaHoraInicio);
            const bFin = new Date(b.fechaHoraFin);
            const bIniMin = bIni.getHours() * 60 + bIni.getMinutes();
            const bFinMin = bFin.getHours() * 60 + bFin.getMinutes();
            return slotIni < bFinMin && slotFin > bIniMin;
        });

        let isPast = false;
        if (selectedDate === todayISO()) {
            const now = new Date();
            const currentMin = now.getHours() * 60 + now.getMinutes();
            if (slotIni <= currentMin) {
                isPast = true;
            }
        }

        return ocupadoPorReserva || ocupadoPorBloqueo || isPast;
    }

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

        const durMin = disponibilidad?.duracionMaximaMinutos || 60;
        const horaFin = addMinutesToTime(selectedTime, durMin);

        setBookingError(null);
        setSubmitting(true);
        try {
            const data = await reservasApi.create({
                canchaId:   parseInt(selectedCancha.id, 10),
                personaId:  user.id,
                fecha:      selectedDate,
                horaInicio: selectedTime,
                horaFin:    horaFin,
                precio:     disponibilidad?.precioHora || 4500,
                pago:       false,
                metodoPago: 'tarjeta', // default; Pago.jsx puede cambiarlo
            });
            window.dispatchEvent(new Event('reservaUpdate'));
            navigate(`/pago/${data.cobroId}`);
        } catch (err) {
            setBookingError(err?.message || 'La reserva no pudo procesarse. Intentá de nuevo.');
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

                                        {activeCheckoutCobroId ? (
                                            <div className="booking-detail-error" style={{ background: 'rgba(242, 184, 75, 0.1)', border: '1px solid #f2b84b', color: '#f2b84b', padding: '20px', borderRadius: '12px', marginTop: '20px', textAlign: 'center' }}>
                                                <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '2rem', display: 'block', marginBottom: '10px' }}></i>
                                                <h4 style={{ fontWeight: 'bold', margin: '0 0 10px 0' }}>¡Pago Pendiente Activo!</h4>
                                                <p style={{ fontSize: '0.95rem', margin: '0 0 20px 0', color: 'var(--text-secondary)' }}>Tienes una reserva en proceso de pago. Debes completar la reserva anterior o cancelarla antes de poder seleccionar un nuevo horario.</p>
                                                <button 
                                                    type="button" 
                                                    className="booking-detail-reserve-btn" 
                                                    style={{ width: '100%', background: '#f2b84b', color: '#000', fontWeight: 'bold' }} 
                                                    onClick={() => navigate(`/pago/${activeCheckoutCobroId}`)}
                                                >
                                                    ⏳ Completar Reserva Activa
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="booking-detail-section">
                                                    <label className="booking-detail-label">1. SELECCIONÁ EL DÍA</label>
                                                    <div className="booking-detail-date-wrapper">
                                                        <i className="bi bi-calendar-event"></i>
                                                        <input
                                                            type="date"
                                                            className="booking-detail-date-input"
                                                            value={selectedDate}
                                                            min={todayISO()}
                                                            max={maxDateISO()}
                                                            onChange={e => setSelectedDate(e.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="booking-detail-section">
                                                    <label className="booking-detail-label">2. SELECCIONÁ EL HORARIO</label>
                                                    {loadingDisp ? (
                                                        <p style={{color:'#aaa', fontSize:'0.85rem'}}>Cargando horarios disponibles...</p>
                                                    ) : (
                                                    <div className="booking-time-slots">
                                                        {(disponibilidad
                                                            ? generateTimeSlots(disponibilidad.duracionMaximaMinutos)
                                                            : generateTimeSlots(60)
                                                        ).map(slot => {
                                                            const time = slot.start;
                                                            const ocupado = isSlotOcupado(time);
                                                            return (
                                                                <button
                                                                    key={time}
                                                                    type="button"
                                                                    title={ocupado ? 'Este horario ya está reservado' : `Reservar de ${slot.start} a ${slot.end}`}
                                                                    className={[
                                                                        'booking-time-slot',
                                                                        selectedTime === time ? 'booking-time-slot--active' : '',
                                                                        ocupado ? 'booking-time-slot--ocupado' : '',
                                                                    ].join(' ')}
                                                                    onClick={() => !ocupado && setSelectedTime(time)}
                                                                    disabled={ocupado}
                                                                >
                                                                    {slot.start} - {slot.end}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                    )}
                                                </div>

                                                <div className="booking-detail-summary">
                                                    <div className="booking-detail-price-row">
                                                        <span>Total a pagar</span>
                                                        <strong className="booking-detail-price">
                                                            ${(disponibilidad?.precioHora || 4500).toLocaleString('es-AR')}
                                                        </strong>
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
                                            </>
                                        )}
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
