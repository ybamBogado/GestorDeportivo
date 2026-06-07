import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import { cobros as cobrosApi, recibos as recibosApi } from '../services/api.js';
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

export default function Pago() {
    const { cobroId } = useParams();
    const navigate    = useNavigate();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (!authLoading && user?.rol === 'Administrador') {
            navigate('/admin');
        }
    }, [user, authLoading, navigate]);

    const [cobro, setCobro]         = useState(null);
    const [loading, setLoading]     = useState(true);
    const [error, setError]         = useState(null);
    const [metodoPago, setMetodoPago] = useState('tarjeta');
    const [paying, setPaying]       = useState(false);
    const [recibo, setRecibo]       = useState(null);

    // Card form state
    const [card, setCard] = useState({ number: '', expiry: '', cvv: '', holder: '' });
    const [cardErrors, setCardErrors] = useState({});

    useEffect(() => {
        cobrosApi.getById(cobroId)
            .then(setCobro)
            .catch(e => setError(e.message ?? 'Error de conexión'))
            .finally(() => setLoading(false));
    }, [cobroId]);

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
            setError(e.message);
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
                    </div>

                    {error && <div className="pago-error" role="alert">{error}</div>}

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
                                    onClick={() => setMetodoPago(m.id)}
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
                            <h4>🏦 Datos bancarios</h4>
                            <p>CBU: <strong>1234567890123456789012</strong></p>
                            <p>Alias: <strong>GOLAHORA.PAGOS</strong></p>
                            <p className="pago-info-note">Una vez realizada la transferencia, tu reserva se confirmará en 24 hs.</p>
                        </div>
                    )}

                    {metodoPago === 'efectivo' && (
                        <div className="pago-info-box">
                            <h4>💵 Pago en mostrador</h4>
                            <p>Presentate en el complejo con el número de reserva y abonás en el momento.</p>
                            <p className="pago-info-note">Tenés 2 horas para presentarte antes que se cancele la reserva.</p>
                        </div>
                    )}

                    <button className="btn-pagar" onClick={handlePagar} disabled={paying}>
                        {paying
                            ? <span>Procesando...</span>
                            : `Pagar $${Number(cobro?.montoFinal).toLocaleString('es-AR')}`}
                    </button>

                    <button className="btn-cancelar" onClick={() => navigate('/')}>
                        Cancelar
                    </button>
                </div>
            </div>
            <Footer />
        </>
    );
}
