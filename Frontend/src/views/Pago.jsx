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
    { id: 'tarjeta',       label: 'Tarjeta de Crédito/Débito', icon: '💳' },
    { id: 'transferencia', label: 'Transferencia Bancaria',     icon: '🏦' },
    { id: 'efectivo',      label: 'Efectivo en Mostrador',      icon: '💵' },
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
    if (!ms || ms <= 0) return "00:00";
    const totalSecs = Math.floor(ms / 1000);
    const hours = Math.floor(totalSecs / 3600);
    const mins = String(Math.floor((totalSecs % 3600) / 60)).padStart(2, '0');
    const secs = String(totalSecs % 60).padStart(2, '0');
    if (hours > 0) {
        return `${String(hours).padStart(2, '0')}:${mins}:${secs}`;
    }
    return `${mins}:${secs}`;
}

export default function Pago() {
    const { cobroId } = useParams();
    const navigate    = useNavigate();
    const { user, loading: authLoading } = useAuth();

    const [cobro, setCobro]         = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [paying, setPaying]       = useState(false);
    const [recibo, setRecibo]       = useState(null);
    const [timeLeft, setTimeLeft]   = useState(null);
    const [expired, setExpired]     = useState(false);

    // Finalized states
    const [comprobanteFile, setComprobanteFile] = useState(null);
    const [finalizedEfectivo, setFinalizedEfectivo] = useState(null);
    const [finalizedTransferencia, setFinalizedTransferencia] = useState(false);

    // Card form state
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
    const [cardErrors, setCardErrors] = useState({});

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

    const handleCardChange = (field) => (e) => {
        let value = e.target.value;
        if (field === 'number') value = formatCardNumber(value);
        if (field === 'expiry') value = formatExpiry(value);
        if (field === 'cvv')    value = value.replace(/\D/g, '').slice(0, 4);
        setCard(prev => ({ ...prev, [field]: value }));
        if (cardErrors[field]) setCardErrors(prev => ({ ...prev, [field]: undefined }));
    };

    const handlePagar = async () => {
        if (!cobro) return;

        // Validate card if tarjeta method selected
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
                monto:      cobro.montoFinal,
                metodoPago: metodoPago === 'tarjeta' ? `Tarjeta ${detectCardBrand(card.number)}` : metodoPago,
                aprobado:   true,
            });

            const todos = await recibosApi.getAll();
            const reciboDelCobro = todos
                .filter(r => r.cobroId === updated.id)
                .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))[0];

            setRecibo(reciboDelCobro ?? {
                numero:        `REC-${Date.now()}`,
                fechaEmision:  new Date().toISOString(),
                datos:         `Recibo por ${updated.concepto}. Monto: $${updated.montoFinal}`,
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

    // ── Pantalla de éxito ────────────────────────────────────────────────────
    if (recibo) {
        const fecha = new Date(recibo.fechaEmision).toLocaleString('es-AR', {
            dateStyle: 'medium', timeStyle: 'short',
        });
        return (
            <>
                <Header />
                <div className="pago-page fade-in-up">
                    <div className="recibo-card">
                        <div className="recibo-check">✓</div>
                        <h2 className="recibo-title">¡Pago Exitoso!</h2>
                        <p className="recibo-subtitle">Tu reserva está confirmada</p>

                        <div className="recibo-body">
                            <div className="recibo-row"><span>N° Recibo</span>  <strong>{recibo.numero}</strong></div>
                            <div className="recibo-row"><span>Fecha</span>      <strong>{fecha}</strong></div>
                            <div className="recibo-row"><span>Concepto</span>   <strong>{cobro?.concepto}</strong></div>
                            <div className="recibo-row recibo-row--total">
                                <span>Total Pagado</span>
                                <strong className="recibo-monto">${Number(cobro?.montoFinal).toLocaleString('es-AR')}</strong>
                            </div>
                            <div className="recibo-row">
                                <span>Estado</span>
                                <span className="badge-pagado">Pagado ✓</span>
                            </div>
                        </div>

                        <button className="btn-volver" onClick={() => navigate('/')}>
                            Volver al inicio
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // ── Pantalla de éxito Transferencia ──────────────────────────────────────
    if (finalizedTransferencia) {
        return (
            <>
                <Header />
                <div className="pago-page fade-in-up">
                    <div className="recibo-card" style={{textAlign: 'center'}}>
                        <div className="recibo-check" style={{background: 'var(--accent)'}}>⏳</div>
                        <h2 className="recibo-title">Comprobante Enviado</h2>
                        <p className="recibo-subtitle">Tu reserva está pendiente de verificación</p>
                        <p style={{color: 'var(--text-secondary)', marginBottom: '30px'}}>Nuestros administradores revisarán el pago en breve. Tenés 24 horas para que el pago se acredite.</p>
                        <button className="btn-volver" onClick={() => navigate('/my-portal')}>
                            Ir a Mis Reservas
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // ── Pantalla de éxito Efectivo ───────────────────────────────────────────
    if (finalizedEfectivo) {
        return (
            <>
                <Header />
                <div className="pago-page fade-in-up">
                    <div className="recibo-card" style={{textAlign: 'center'}}>
                        <div className="recibo-check" style={{background: '#f2b84b'}}>💵</div>
                        <h2 className="recibo-title">Código Generado</h2>
                        <p className="recibo-subtitle">Acercate a Rapipago o PagoFácil</p>
                        
                        <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', border: '1px dashed var(--accent)', margin: '20px 0' }}>
                            <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Tu código de pago</div>
                            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '3px' }}>
                                {finalizedEfectivo.codigoPagoExterno}
                            </div>
                        </div>

                        <p style={{color: 'var(--text-secondary)', marginBottom: '30px'}}>Tenés 3 horas para abonar antes de que la reserva expire automáticamente.</p>
                        <button className="btn-volver" onClick={() => navigate('/my-portal')}>
                            Ir a Mis Reservas
                        </button>
                    </div>
                </div>
                <Footer />
            </>
        );
    }

    // ── Formulario de pago ───────────────────────────────────────────────────
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
                        
                        {timeLeft !== null && !expired && (
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

                    {!expired && (
                        <>
                            {/* Resumen */}
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

                            {/* Método de pago */}
                            <div className="pago-metodos">
                                <p className="pago-label">Seleccioná el método de pago</p>
                                <div className="metodo-grid">
                                    {METODOS.map(m => (
                                        <button
                                            key={m.id}
                                            className={`metodo-btn ${metodoPago === m.id ? 'metodo-btn--active' : ''}`}
                                            onClick={() => handleMetodoChange(m.id)}
                                        >
                                            <span className="metodo-icon">{m.icon}</span>
                                            <span>{m.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                    {/* Formulario de tarjeta con validación Luhn */}
                    {metodoPago === 'tarjeta' && (
                        <div className="card-form">
                            <div className="card-preview">
                                <div className="card-preview-brand">
                                    {card.number ? cardBrand : 'Tarjeta'}
                                    {cardValid && <span className="card-valid-icon"> ✓</span>}
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
                            <h4>🏦 Datos bancarios y QR</h4>
                            <p>CBU: <strong>1234567890123456789012</strong></p>
                            <p>Alias: <strong>GOLAHORA.PAGOS</strong></p>
                            
                            <div style={{textAlign: 'center', margin: '20px 0'}}>
                                <img src="/qr.jpg" alt="QR MercadoPago" style={{maxWidth: '200px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)'}} onError={(e) => e.target.outerHTML='<div style="padding:40px;background:var(--bg-app);color:var(--text-primary);display:inline-block;border-radius:10px;border:1px dashed var(--border);"><i class="bi bi-qr-code" style="font-size:4rem"></i></div>'} />
                                <p style={{fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '10px'}}>Escaneá con Mercado Pago u otra billetera virtual</p>
                            </div>
                            
                            <div className="file-upload-box" style={{background: 'var(--bg-app)', padding: '15px', borderRadius: '8px', marginTop: '15px', border: '1px dashed var(--border)'}}>
                                <label style={{display: 'block', marginBottom: '10px', fontWeight: 'bold', color: 'var(--text-primary)'}}>
                                    <i className="bi bi-cloud-arrow-up"></i> Subir Comprobante (Obligatorio)
                                </label>
                                <input type="file" accept=".pdf,image/*" onChange={(e) => setComprobanteFile(e.target.files[0])} style={{color: 'var(--text-secondary)'}} />
                            </div>
                            
                            <p className="pago-info-note" style={{marginTop: '15px'}}>Una vez enviado el comprobante, tu reserva quedará pendiente hasta que verifiquemos el pago (Plazo: 24 hs).</p>

                            <button className="btn-pagar" style={{ marginTop: '20px' }} onClick={handleFinalizarTransferencia} disabled={paying || !comprobanteFile}>
                                {paying ? 'Enviando...' : 'Enviar comprobante y finalizar'}
                            </button>
                        </div>
                    )}

                            {metodoPago === 'efectivo' && (
                                <div className="pago-info-box">
                                    <h4>💵 Pago en Efectivo</h4>
                                    <p>Acercate a cualquier sucursal de Rapipago o PagoFácil y dicta el código que generaremos a continuación.</p>
                                    <p className="pago-info-note">Al confirmar, se generará tu código de pago y tendrás <strong>3 horas</strong> para abonar antes de que se cancele automáticamente tu reserva.</p>
                                    
                                    <button className="btn-pagar" style={{ marginTop: '20px', background: '#f2b84b', color: '#000' }} onClick={handleFinalizarEfectivo} disabled={paying}>
                                        {paying ? 'Generando...' : 'Entendido, generar código'}
                                    </button>
                                </div>
                            )}

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
