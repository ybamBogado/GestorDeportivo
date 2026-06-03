import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Loader from '../components/Loader';
import './Pago.css';

const API = 'http://localhost:5071/api/v1';

const METODOS = [
  { id: 'billetera_virtual', label: 'Billetera Virtual', icon: '💳' },
  { id: 'transferencia', label: 'Transferencia Bancaria', icon: '🏦' },
  { id: 'efectivo', label: 'Efectivo en Mostrador', icon: '💵' },
];

export default function Pago() {
  const { cobroId } = useParams();
  const navigate = useNavigate();

  const [cobro, setCobro] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [metodoPago, setMetodoPago] = useState('billetera_virtual');
  const [paying, setPaying] = useState(false);
  const [recibo, setRecibo] = useState(null); // null = not paid yet, object = success

  useEffect(() => {
    fetch(`${API}/cobros/${cobroId}`)
      .then(r => {
        if (!r.ok) throw new Error('No se pudo cargar el cobro');
        return r.json();
      })
      .then(data => {
        setCobro(data);
        setLoading(false);
      })
      .catch(e => {
        setError(e.message ?? 'Error de conexión');
        setLoading(false);
      });
  }, [cobroId]);

  const handlePagar = async () => {
    if (!cobro) return;
    setPaying(true);
    setError(null);

    try {
      const res = await fetch(`${API}/cobros/${cobroId}/pagar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          monto: cobro.montoFinal,
          metodoPago,
          aprobado: true,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || 'El pago fue rechazado');
      }

      const updated = await res.json();
      // Fetch the receipt generated for this cobro
      const recibosRes = await fetch(`${API}/recibos`);
      const todos = await recibosRes.json();
      const reciboDelCobro = todos
        .filter(r => r.cobroId === updated.id)
        .sort((a, b) => new Date(b.fechaEmision) - new Date(a.fechaEmision))[0];

      setRecibo(reciboDelCobro ?? {
        numero: `REC-${Date.now()}`,
        fechaEmision: new Date().toISOString(),
        datos: `Recibo por ${updated.concepto}. Monto final: $${updated.montoFinal}`,
      });
      setCobro(updated);
    } catch (e) {
      setError(e.message);
    } finally {
      setPaying(false);
    }
  };

  if (loading) return <><Header /><Loader /><Footer /></>;

  // ─── SUCCESS / RECEIPT SCREEN ───────────────────────────────────────────────
  if (recibo) {
    const fecha = new Date(recibo.fechaEmision).toLocaleString('es-AR', {
      dateStyle: 'medium',
      timeStyle: 'short',
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
              <div className="recibo-row">
                <span>N° Recibo</span>
                <strong>{recibo.numero}</strong>
              </div>
              <div className="recibo-row">
                <span>Fecha</span>
                <strong>{fecha}</strong>
              </div>
              <div className="recibo-row">
                <span>Concepto</span>
                <strong>{cobro?.concepto}</strong>
              </div>
              <div className="recibo-row recibo-row--total">
                <span>Total Pagado</span>
                <strong className="recibo-monto">
                  ${Number(cobro?.montoFinal).toLocaleString('es-AR')}
                </strong>
              </div>
              <div className="recibo-row">
                <span>Método</span>
                <strong>{METODOS.find(m => m.id === cobro?.metodoPago)?.label ?? cobro?.metodoPago}</strong>
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

  // ─── PAYMENT FORM ────────────────────────────────────────────────────────────
  return (
    <>
      <Header />
      <div className="pago-page fade-in-up">
        <div className="pago-card">
          {/* Header */}
          <div className="pago-header">
            <span className="pago-step">PASO 2 DE 2</span>
            <h2>Completar Pago</h2>
            <p>Revisá los detalles y elegí cómo pagar</p>
          </div>

          {error && <div className="pago-error">{error}</div>}

          {/* Resumen del cobro */}
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
            <label className="pago-label">Seleccioná el método de pago</label>
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

          {/* Simulación billetera virtual */}
          {metodoPago === 'billetera_virtual' && (
            <div className="wallet-info">
              <div className="wallet-logo">💳 Billetera Virtual</div>
              <p className="wallet-desc">
                Pago simulado. En producción esto redirigirá a la pasarela externa.
              </p>
              <div className="wallet-saldo">
                <span>Saldo disponible</span>
                <strong>$99.999,00 ✓</strong>
              </div>
            </div>
          )}

          {/* CTA */}
          <button
            className="btn-pagar"
            onClick={handlePagar}
            disabled={paying}
          >
            {paying ? (
              <span className="spinner">Procesando<span className="dots">...</span></span>
            ) : (
              `Pagar $${Number(cobro?.montoFinal).toLocaleString('es-AR')}`
            )}
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
