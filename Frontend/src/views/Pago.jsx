import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { cobros as cobrosApi, recibos as recibosApi, reservas as reservasApi } from '../services/api.js';
import { validateCard, detectCardBrand, luhnCheck } from '../utils/validation.js';
import './Pago.css';

const METODOS = [
    { id: 'tarjeta', label: 'Tarjeta de Crédito/Débito', icon: 'bi bi-credit-card-2-front' },
    { id: 'transferencia', label: 'Transferencia Bancaria', icon: 'bi bi-bank' },
    { id: 'efectivo', label: 'Efectivo en Mostrador', icon: 'bi bi-cash-coin' },
];

function formatCardNumber(value) {
    return value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
}

function formatExpiry(value) {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 3) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
    return digits;
}

function formatTime(ms) {
    if (!ms || ms <= 0) return '00:00';
    const totalSecs = Math.floor(ms / 1000);
    const minutes = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    const hours = Math.floor(totalSecs / 3600);
    return hours > 0 ? `${String(hours).padStart(2, '0')}:${minutes}:${secs}` : `${minutes}:${secs}`;
}

export default function Pago() {
    const { cobroId } = useParams();
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user?.rol === 'Administrador') {
            navigate('/admin');
        }
    }, [user, authLoading, navigate]);

    const [cobro, setCobro] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [paying, setPaying] = useState(false);
    const [recibo, setRecibo] = useState(null);
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
    const [cardErrors, setCardErrors] = useState({});
    const [timeLeft, setTimeLeft] = useState(null);
    const [expired, setExpired] = useState(false);

    const concepto = cobro?.concepto || '';
    const esReserva = concepto.toLowerCase().includes('reserva');
    const successTitle = esReserva ? '¡Pago Exitoso!' : '¡Inscripción Confirmada!';
    const successSubtitle = esReserva ? 'Tu reserva está confirmada' : 'Tu inscripción quedó registrada correctamente';

    useEffect(() => {
        const fetchCobro = () => {
            cobrosApi.getById(cobroId)
                .then(data => {
                    if (data?.reserva?.estado !== 'Pendiente' && data?.estado !== 'Aprobado') {
                        navigate('/');
                        return;
                    }
                    setCobro(data);
                    if (data?.reserva?.metodoPago) {
                        setMetodoPago(data.reserva.metodoPago);
                    }
                })
                .catch(e => {
                    if (e.message?.includes('Pendiente') || e.message?.includes('encontrada')) {
                        navigate('/');
                    } else {
                        setError(e.message ?? 'Error de conexión');
                    }
                })
                .finally(() => setLoading(false));
        };

        fetchCobro();
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                fetchCobro();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [cobroId, navigate]);

    useEffect(() => {
        if (!cobro?.reserva?.fechaExpiracion || expired || recibo) return;

        // Si es admin/empleado, no hay expiración estricta visual
        if (user?.rol === 'Administrador' || user?.rol === 'Empleado') {
            setTimeLeft(null);
            return;
        }

        const interval = setInterval(() => {
            const expDate = cobro.reserva?.fechaExpiracion;
            if (!expDate) return;

            const now = new Date().getTime();
            const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
            const diff = exp - now;

            if (diff <= 0) {
                clearInterval(interval);
                setTimeLeft(0);
                setExpired(true);
            } else {
                setTimeLeft(diff);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [cobro, expired, recibo, user]);

    const handleMetodoChange = (newMetodo) => {
        if (newMetodo === metodoPago) return;
        setMetodoPago(newMetodo);
        // NO llamamos al backend aquí. Solo cuando confirmen la acción final.
    };

    const handleFinalizarEfectivo = async () => {
        setPaying(true);
        setError(null);
        try {
            const rId = cobro.reservaId || cobro.reserva.id;
            const res = await reservasApi.updateMetodoPago(rId, 'efectivo');
            window.dispatchEvent(new Event('reservaUpdate'));
            setFinalizedEfectivo(res);
        } catch (e) {
            if (e.message?.includes('Pendiente')) navigate('/');
            else setError(e.message);
        } finally {
            setPaying(false);
        }
    };

    const handleFinalizarTransferencia = async () => {
        if (!comprobanteFile) {
            setError("Por favor selecciona un archivo de comprobante.");
            return;
        }

        setPaying(true);
        setError(null);
        try {
            const rId = cobro.reservaId || cobro.reserva.id;

            const reader = new FileReader();
            reader.readAsDataURL(comprobanteFile);
            reader.onloadend = async () => {
                const base64Data = reader.result;
                try {
                    await reservasApi.updateMetodoPago(rId, 'transferencia', base64Data);
                    window.dispatchEvent(new Event('reservaUpdate'));
                    setFinalizedTransferencia(true);
                } catch (e) {
                    if (e.message?.includes('Pendiente')) navigate('/');
                    else setError(e.message);
                    setPaying(false);
                }
            };
            reader.onerror = () => {
                setError("Error al leer el comprobante.");
                setPaying(false);
            };
        } catch (e) {
            if (e.message?.includes('Pendiente')) navigate('/');
            else setError(e.message);
            setPaying(false);
        }
    };

    const handleCancelarReserva = async () => {
        if (!cobro) {
            navigate('/');
            return;
        }

        setPaying(true);
        setError(null);
        try {
            const rId = cobro.reservaId || cobro.reserva.id;
            await reservasApi.cancelar(rId);
            window.dispatchEvent(new Event('reservaUpdate'));
            navigate('/');
        } catch (e) {
            setError("No se pudo cancelar la reserva: " + e.message);
            setPaying(false);
        }
    };

    useEffect(() => {
        if (!cobro?.reserva?.fechaExpiracion || recibo) {
            setTimeLeft(null);
            setExpired(false);
            return;
        }

        const tick = () => {
            const expDate = cobro.reserva.fechaExpiracion;
            const exp = new Date(expDate + (expDate.endsWith('Z') ? '' : 'Z')).getTime();
            const diff = exp - Date.now();
            if (diff <= 0) {
                setTimeLeft(0);
                setExpired(true);
            } else {
                setTimeLeft(diff);
                setExpired(false);
            }
        };

        tick();
        const interval = setInterval(tick, 1000);
        return () => clearInterval(interval);
    }, [cobro, recibo]);

    const handleCardChange = (field) => (e) => {
        let value = e.target.value;
        if (field === 'number') value = formatCardNumber(value);
        if (field === 'expiry') value = formatExpiry(value);
        if (field === 'cvv') value = value.replace(/\D/g, '').slice(0, 4);
        setCard(prev => ({ ...prev, [field]: value }));
        if (cardErrors[field]) setCardErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handlePagar = async () => {
        if (!cobro) return;

        if (metodoPago === 'tarjeta') {
            const errors = validateCard(card);
            if (Object.keys(errors).length) {
                setCardErrors(errors);
                return;
            }
        }

        setPaying(true);
        setError(null);

        try {
            const updated = await cobrosApi.pagar(cobroId, {
                monto: cobro.montoFinal,
                metodoPago: metodoPago === 'tarjeta' ? `Tarjeta ${detectCardBrand(card.number)}` : metodoPago,
                aprobado: true,
            });

            const todos = await recibosApi.getAll();
            const reciboDelCobro = todos
                .filter(r => r.cobroId === updated.id)
                .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))[0];

            setRecibo(reciboDelCobro ?? {
                numero: `REC-${Date.now()}`,
                fechaEmision: new Date().toISOString(),
                datos: `Recibo por ${updated.concepto}. Monto: $${updated.montoFinal}`,
            });
            setCobro(updated);
        } catch (e) {
            if (e.message?.includes('Pendiente')) navigate('/');
            else setError(e.message);
        } finally {
            setPaying(false);
        }
    };

    if (loading) return <><Header /><Loader /><Footer /></>;

    if (recibo) {
        const fecha = new Date(recibo.fechaEmision).toLocaleString('es-AR', {
            dateStyle: 'medium', timeStyle: 'short',
        });
        return (
            <>
                <Header />
                <div className="pago-page fade-in-up">
                    <div className="recibo-card">
                        <div className="recibo-check"><i className="bi bi-check-lg"></i></div>
                        <h2 className="recibo-title">{successTitle}</h2>
                        <p className="recibo-subtitle">{successSubtitle}</p>

                        <div className="recibo-body">
                            <div className="recibo-row"><span>N° Recibo</span><strong>{recibo.numero}</strong></div>
                            <div className="recibo-row"><span>Fecha</span><strong>{fecha}</strong></div>
                            <div className="recibo-row"><span>Concepto</span><strong>{cobro?.concepto}</strong></div>
                            <div className="recibo-row recibo-row--total">
                                <span>Total Pagado</span>
                                <strong className="recibo-monto">${Number(cobro?.montoFinal).toLocaleString('es-AR')}</strong>
                            </div>
                            <div className="recibo-row">
                                <span>Estado</span>
                                <span className="badge-pagado">Pagado <i className="bi bi-check-lg"></i></span>
                            </div>
                        </div>

                        <button className="btn-volver" onClick={() => navigate(esReserva ? '/' : '/my-portal')}>
                            {esReserva ? 'Volver al inicio' : 'Volver al portal'}
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    const cardBrand = detectCardBrand(card.number);
    const cardValid = card.number.length >= 13 && luhnCheck(card.number.replace(/\s/g, ''));

    return (
        <>
            <Header />
            <div className="pago-page fade-in-up">
                <div className="pago-card">
                    <div className="pago-header">
                        <span className="pago-step">PASO 2 DE 2</span>
                        <h2>Completar Pago</h2>
                        <p>Revisá los detalles y elegí cómo pagar</p>
                        {esReserva && timeLeft !== null && !expired && (
                            <div className="pago-timer mt-3" style={{ background: 'rgba(49, 217, 79, 0.1)', border: '1px solid var(--accent)', color: 'var(--accent)', padding: '10px 15px', borderRadius: '8px', display: 'inline-block', fontWeight: 'bold' }}>
                                <i className="bi bi-clock-history"></i> Tiempo restante para pagar: <strong>{formatTime(timeLeft)}</strong>
                            </div>
                        )}
                    </div>

                    {expired && (
                        <div className="alert alert-danger mt-3" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '20px', borderRadius: '12px' }}>
                            <h4 className="alert-heading" style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>¡Tiempo expirado!</h4>
                            <p style={{ margin: '0 0 15px 0' }}>El tiempo para completar el pago ha finalizado y la cancha ha sido liberada. Por favor, volvé a iniciar tu reserva.</p>
                            <button className="btn-cancelar" style={{ width: '100%', margin: 0 }} onClick={() => navigate('/')}>Volver al inicio</button>
                        </div>
                    )}

                    {error && <div className="pago-error" role="alert">{error}</div>}

                    {esReserva && expired && (
                        <div className="alert alert-danger mt-3" role="alert" style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', padding: '20px', borderRadius: '12px' }}>
                            <h4 className="alert-heading" style={{ margin: '0 0 10px 0', fontSize: '1.2rem' }}>¡Tiempo expirado!</h4>
                            <p style={{ margin: '0 0 15px 0' }}>El tiempo para completar el pago ha finalizado. Por favor, volvé a iniciar la reserva.</p>
                            <button className="btn-cancelar" style={{ width: '100%', margin: 0 }} onClick={() => navigate('/')}>Volver al inicio</button>
                        </div>
                    )}

                    <div className="pago-resumen">
                        <div className="pago-resumen-row">
                            <span>Concepto</span>
                            <strong>{cobro?.concepto}</strong>
                        </div>
                        {cobro?.descuento > 0 && (
                            <>
                                <div className="pago-resumen-row">
                                    <span>Subtotal</span>
                                    <strong>${Number(cobro?.monto).toLocaleString('es-AR')}</strong>
                                </div>
                                <div className="pago-resumen-row pago-descuento">
                                    <span>Descuento</span>
                                    <strong>-${Number(cobro?.descuento).toLocaleString('es-AR')}</strong>
                                </div>
                            </>
                        )}
                        <div className="pago-resumen-row pago-total">
                            <span>Total</span>
                            <strong>${Number(cobro?.montoFinal).toLocaleString('es-AR')}</strong>
                        </div>
                    </div>

                    <div className="pago-metodos">
                        <p className="pago-label">Seleccioná el método de pago</p>
                        <div className="metodo-grid">
                            {METODOS.map(m => (
                                <button
                                    key={m.id}
                                    className={`metodo-btn ${metodoPago === m.id ? 'metodo-btn--active' : ''}`}
                                    onClick={() => setMetodoPago(m.id)}
                                >
                                    <span className="metodo-icon"><i className={m.icon}></i></span>
                                    <span>{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {metodoPago === 'tarjeta' && (
                        <div className="card-form">
                            <div className="card-preview">
                                <div className="card-preview-brand">
                                    {card.number ? cardBrand : 'Tarjeta'}
                                    {cardValid && <span className="card-valid-icon"> <i className="bi bi-check-lg"></i></span>}
                                </div>
                                <div className="card-preview-number">
                                    {card.number || '•••• •••• •••• ••••'}
                                </div>
                                <div className="card-preview-footer">
                                    <div>
                                        <span>TITULAR</span>
                                        <strong>{card.holder || 'NOMBRE APELLIDO'}</strong>
                                    </div>
                                    <div>
                                        <span>VENCE</span>
                                        <strong>{card.expiry || 'MM/AA'}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="card-fields">
                                <div className={`card-field ${cardErrors.number ? 'card-field--error' : ''}`}>
                                    <label>Número de tarjeta</label>
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        placeholder="1234 5678 9012 3456"
                                        value={card.number}
                                        onChange={handleCardChange('number')}
                                        maxLength={19}
                                    />
                                    {cardErrors.number && <span>{cardErrors.number}</span>}
                                </div>

                                <div className="card-row-2">
                                    <div className={`card-field ${cardErrors.expiry ? 'card-field--error' : ''}`}>
                                        <label>Vencimiento</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder="MM/AA"
                                            value={card.expiry}
                                            onChange={handleCardChange('expiry')}
                                            maxLength={5}
                                        />
                                        {cardErrors.expiry && <span>{cardErrors.expiry}</span>}
                                    </div>
                                    <div className={`card-field ${cardErrors.cvv ? 'card-field--error' : ''}`}>
                                        <label>CVV</label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            placeholder={cardBrand === 'Amex' ? '4 dígitos' : '3 dígitos'}
                                            value={card.cvv}
                                            onChange={handleCardChange('cvv')}
                                            maxLength={4}
                                        />
                                        {cardErrors.cvv && <span>{cardErrors.cvv}</span>}
                                    </div>
                                </div>

                                <div className={`card-field ${cardErrors.holder ? 'card-field--error' : ''}`}>
                                    <label>Nombre del titular</label>
                                    <input
                                        type="text"
                                        placeholder="Como figura en la tarjeta"
                                        value={card.holder}
                                        onChange={handleCardChange('holder')}
                                        autoComplete="cc-name"
                                    />
                                    {cardErrors.holder && <span>{cardErrors.holder}</span>}
                                </div>
                            </div>
                        </div>
                    )}

                    {metodoPago === 'transferencia' && (
                        <div className="pago-info-box">
                            <h4><i className="bi bi-bank"></i> Datos bancarios</h4>
                            <p>CBU: <strong>1234567890123456789012</strong></p>
                            <p>Alias: <strong>GOLAHORA.PAGOS</strong></p>
                            <p className="pago-info-note">Una vez realizada la transferencia, tu operación se confirmará en 24 hs.</p>
                        </div>
                    )}

                    {metodoPago === 'efectivo' && (
                        <div className="pago-info-box">
                            <h4><i className="bi bi-cash-coin"></i> Pago en mostrador</h4>
                            <p>Presentate en el complejo con el número de operación y abonás en el momento.</p>
                            <p className="pago-info-note">Tenés 2 horas para presentarte antes que se cancele la operación.</p>
                        </div>
                    )}

                    <button className="btn-pagar" onClick={handlePagar} disabled={paying || expired}>
                        {paying ? <span>Procesando...</span> : `Pagar $${Number(cobro?.montoFinal).toLocaleString('es-AR')}`}
                    </button>

                            {metodoPago === 'tarjeta' && (
                                <button className="btn-pagar" onClick={handlePagar} disabled={paying}>
                                    {paying
                                        ? <span>Procesando...</span>
                                        : `Pagar $${Number(cobro?.montoFinal).toLocaleString('es-AR')}`}
                                </button>
                            )}

                            <button className="btn-cancelar" onClick={handleCancelarReserva} disabled={paying}>
                                Cancelar y volver
                            </button>
                        </>
                    )}
                </div>
            </div>
            <Footer />
        </>
    );
}
