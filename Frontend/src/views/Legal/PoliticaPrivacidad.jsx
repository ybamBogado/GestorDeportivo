import { Link } from 'react-router-dom';

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

export default function PoliticaPrivacidad() {
    return (
        <div style={{ background: '#080c0a', minHeight: '100vh', padding: '40px 20px', fontFamily: 'Inter, sans-serif' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <Link to="/" style={{ color: '#31d94f', fontSize: '0.85rem', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 32 }}>
                    ← Volver al inicio
                </Link>

                <div style={{ background: '#111d13', border: '1px solid rgba(49,217,79,0.15)', borderRadius: 16, padding: '40px 36px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
                        <div style={{ width: 48, height: 48, background: 'rgba(49,217,79,0.1)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                            🔒
                        </div>
                        <div>
                            <h1 style={{ margin: 0, color: '#fff', fontSize: '1.6rem', fontWeight: 800 }}>Política de Privacidad</h1>
                            <p style={{ margin: 0, color: '#8ca092', fontSize: '0.8rem' }}>Última actualización: junio 2025 — Gol Ahora</p>
                        </div>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>1. Información que Recopilamos</h2>
                        <p style={pStyle}>Gol Ahora recopila los siguientes datos personales de sus usuarios: nombre completo, DNI, dirección, teléfono, correo electrónico y, en caso de profesores y entrenadores, certificaciones deportivas.</p>
                        <p style={pStyle}>También se registran datos de actividad como reservas, pagos, asistencias e inscripciones a ligas, torneos y clases.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>2. Uso de la Información</h2>
                        <p style={pStyle}>Los datos recopilados se utilizan exclusivamente para:</p>
                        <ul style={{ color: '#c5d8ca', fontSize: '0.9rem', lineHeight: 1.8, paddingLeft: 20 }}>
                            <li>Gestionar reservas, pagos y recibos.</li>
                            <li>Administrar inscripciones a ligas, torneos y clases.</li>
                            <li>Enviar notificaciones relacionadas con sus actividades en el club.</li>
                            <li>Generar reportes administrativos internos.</li>
                            <li>Garantizar la seguridad e integridad del sistema.</li>
                        </ul>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>3. Seguridad de los Datos</h2>
                        <p style={pStyle}>El sistema garantiza la seguridad de los datos de los usuarios mediante cifrado de contraseñas, autenticación segura y control de acceso basado en roles (Administrador, Empleado, Profesor, Entrenador, Usuario).</p>
                        <p style={pStyle}>Todos los pagos y transacciones son registrados de forma segura. Los datos sensibles como contraseñas nunca se almacenan en texto plano.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>4. Compartición de Datos</h2>
                        <p style={pStyle}>No compartimos sus datos personales con terceros, salvo en los casos estrictamente necesarios para la operación del sistema (por ejemplo, integración con sistemas de pago electrónico).</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>5. Retención de Datos</h2>
                        <p style={pStyle}>Los datos personales se conservan mientras el usuario mantenga una relación activa con el club. Una vez solicitada la baja, los datos serán eliminados o anonimizados conforme a la legislación vigente.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>6. Derechos del Usuario</h2>
                        <p style={pStyle}>Conforme a la Ley de Protección de Datos Personales, usted tiene derecho a: acceder a sus datos, rectificarlos, solicitar su eliminación y oponerse a su tratamiento. Para ejercer estos derechos, contáctenos a través de nuestro formulario.</p>
                    </div>

                    <div style={{ marginBottom: '2rem' }}>
                        <h2 style={h2Style}>7. Cookies</h2>
                        <p style={pStyle}>La plataforma puede utilizar cookies de sesión para mantener la autenticación del usuario. Estas cookies no almacenan información personal sensible y se eliminan al cerrar sesión.</p>
                    </div>

                    <div style={{ marginTop: 32, padding: '16px', background: 'rgba(49,217,79,0.05)', borderRadius: 10, border: '1px solid rgba(49,217,79,0.1)', textAlign: 'center' }}>
                        <p style={{ color: '#8ca092', fontSize: '0.82rem', margin: 0 }}>
                            Para más información contactanos en{' '}
                            <Link to="/contacto-rrhh" style={{ color: '#31d94f' }}>nuestro formulario de contacto</Link>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
