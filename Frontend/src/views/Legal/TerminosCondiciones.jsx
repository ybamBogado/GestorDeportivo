import { Link } from 'react-router-dom';

const sectionStyle = {
    marginBottom: '2rem',
};

const h2Style = {
    color: '#31d94f',
    fontSize: '1.1rem',
    fontWeight: 700,
    borderBottom: '1px solid rgba(49,217,79,0.2)',
    paddingBottom: '8px',
    marginBottom: '12px',
};

const pStyle = {
    color: '#c5d8ca',
    fontSize: '0.9rem',
    lineHeight: 1.7,
    marginBottom: '10px',
};

export default function TerminosCondiciones() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Link to="/" style={{ color: '#31d94f', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
                    ← Volver al inicio
                </Link>

                <div style={{ background: '#111d13', border: '1px solid rgba(49,217,79,0.15)', borderRadius: 16, padding: '40px 36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(49,217,79,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            📋
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>Términos y Condiciones</h1>
                            <p style={{ margin: 0, color: '#8ca092', fontSize: '0.8rem' }}>Última actualización: junio 2025 — Gol Ahora</p>
                        </div>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>1. Aceptación de los Términos</h2>
                        <p style={pStyle}>Al acceder y utilizar la plataforma Gol Ahora, el usuario acepta quedar vinculado por los presentes Términos y Condiciones. Si no está de acuerdo con alguno de estos términos, le pedimos que no utilice nuestros servicios.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>2. Descripción del Servicio</h2>
                        <p style={pStyle}>Gol Ahora es un sistema de gestión para el complejo deportivo "El Buen Deporte", que permite la reserva de canchas de fútbol, inscripción a ligas y torneos, gestión de clases y entrenamientos, y administración de pagos.</p>
                        <p style={pStyle}>El servicio está disponible en el horario de atención del club y permite acceso remoto para consultas y reservas online desde dispositivos móviles, tablets y computadoras.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>3. Reservas y Pagos</h2>
                        <p style={pStyle}>Para que una reserva de cancha sea confirmada, el pago completo debe ser registrado y validado por el sistema. No se confirmarán reservas pendientes de pago.</p>
                        <p style={pStyle}>Cada tipo de cancha tiene una duración máxima de reserva predefinida: Fútbol 5 (1 hora), Fútbol 7 (1.5 horas), Fútbol 11 (2 horas). El sistema no permitirá reservas que excedan estas duraciones.</p>
                        <p style={pStyle}>Los usuarios pueden reservar canchas con una antelación máxima de 30 días calendario antes de la fecha de la reserva.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>4. Política de Cancelaciones</h2>
                        <p style={pStyle}>Las cancelaciones deben realizarse con un mínimo de 6 horas de antelación al inicio de la reserva. Si la cancelación se efectúa dentro del plazo establecido, se procesará un reembolso total.</p>
                        <p style={pStyle}>Si la cancelación se realiza fuera de este plazo, se aplicará un cargo equivalente al porcentaje establecido por el club según la política vigente.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>5. Descuentos y Promociones</h2>
                        <p style={pStyle}>El club ofrece descuentos a determinados grupos: equipos que participan en ligas regulares, paquetes de horas, y socios de escuelas de fútbol afiliadas. La aplicación de estos descuentos es gestionada exclusivamente por el personal autorizado del club.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>6. Ligas y Torneos</h2>
                        <p style={pStyle}>Todos los torneos y ligas se rigen por las reglas oficiales de fútbol (FIFA o asociación local pertinente), complementadas por reglamentos internos del club. Solo los equipos con inscripción confirmada (pago validado) participarán en el fixture.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>7. Responsabilidad</h2>
                        <p style={pStyle}>Gol Ahora no se hace responsable por lesiones ocurridas durante el uso de las instalaciones. Los usuarios deben respetar las normas de seguridad del complejo en todo momento.</p>
                    </div>

                    <div style={sectionStyle}>
                        <h2 style={h2Style}>8. Modificaciones</h2>
                        <p style={pStyle}>Nos reservamos el derecho de modificar estos Términos y Condiciones en cualquier momento. Los cambios entrarán en vigor una vez publicados en la plataforma.</p>
                    </div>

                    <div style={{ marginTop: 32, padding: '16px', background: 'rgba(49,217,79,0.05)', borderRadius: 10, border: '1px solid rgba(49,217,79,0.1)', textAlign: 'center' }}>
                        <p style={{ color: '#8ca092', fontSize: '0.82rem', margin: 0 }}>
                            ¿Tenés dudas? Contactanos en{' '}
                            <Link to="/contacto-rrhh" style={{ color: '#31d94f' }}>nuestro formulario de contacto</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
