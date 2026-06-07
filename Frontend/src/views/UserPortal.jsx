import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast.jsx';
import { reservas as reservasApi, cobros as cobrosApi, recibos as recibosApi, users as usersApi } from '../services/api.js';
import './UserPortal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';
const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function UserPortal() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate               = useNavigate();
    const { notify }             = useToast();

    const [activeTab, setActiveTab] = useState('reservas');
    const [loading, setLoading]     = useState(true);

    const [reservas, setReservas] = useState([]);
    const [clases, setClases]     = useState([]);
    const [cobros, setCobros]     = useState([]);
    const [recibos, setRecibos]   = useState([]);
    const [ligas, setLigas]       = useState([]);

    const [profileForm, setProfileForm] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: ''
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState({
        nombre: '',
        apellido: '',
        dni: '',
        email: '',
        telefono: '',
        direccion: ''
    });

    const fileInputRef = useRef(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [imageSrc, setImageSrc] = useState('');
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    const triggerFileSelect = () => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                setImageSrc(reader.result);
                setZoom(1);
                setRotation(0);
                setPosition({ x: 0, y: 0 });
                setShowCropModal(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePointerDown = (e) => {
        setIsDragging(true);
        setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handlePointerMove = (e) => {
        if (!isDragging) return;
        setPosition({
            x: e.clientX - dragStart.x,
            y: e.clientY - dragStart.y
        });
    };

    const handlePointerUp = () => {
        setIsDragging(false);
    };

    const handleRotate = () => {
        setRotation(r => (r + 90) % 360);
    };

    const handleReset = () => {
        setZoom(1);
        setRotation(0);
        setPosition({ x: 0, y: 0 });
    };

    const handleRemoveAvatar = () => {
        if (window.confirm('¿Deseas quitar tu foto de perfil?')) {
            const updatedUser = { ...user, fotoPerfil: null };
            login(updatedUser);
            notify('Foto de perfil eliminada', 'success');
        }
    };

    const handleApplyCrop = () => {
        const image = new Image();
        image.src = imageSrc;
        image.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = 150;
            canvas.height = 150;
            const ctx = canvas.getContext('2d');

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.save();
            ctx.beginPath();
            ctx.arc(75, 75, 75, 0, Math.PI * 2);
            ctx.clip();
            ctx.translate(75, 75);
            ctx.rotate((rotation * Math.PI) / 180);

            const imgAspect = image.width / image.height;
            let renderedWidth = 320;
            let renderedHeight = 320 / imgAspect;
            if (renderedHeight > 220) {
                renderedHeight = 220;
                renderedWidth = 220 * imgAspect;
            }

            const scale = 150 / 140;
            const canvasDrawWidth = renderedWidth * zoom * scale;
            const canvasDrawHeight = renderedHeight * zoom * scale;

            ctx.drawImage(
                image,
                (position.x * scale) - canvasDrawWidth / 2,
                (position.y * scale) - canvasDrawHeight / 2,
                canvasDrawWidth,
                canvasDrawHeight
            );

            ctx.restore();

            const croppedDataUrl = canvas.toDataURL('image/jpeg');
            const updatedUser = { ...user, fotoPerfil: croppedDataUrl };
            login(updatedUser);
            setShowCropModal(false);
            notify('Foto de perfil actualizada', 'success');
        };
    };

    useEffect(() => {
        if (user) {
            const initialData = {
                nombre: user.nombre || '',
                apellido: user.apellido || '',
                dni: user.dni || '',
                email: user.email || '',
                telefono: user.telefono || '',
                direccion: user.direccion || ''
            };
            setProfileForm(initialData);
            setTempValue(initialData);
        }
    }, [user]);

    const startEditing = (field) => {
        setEditingField(field);
        setTempValue({ ...profileForm });
    };

    const cancelEditing = () => {
        setEditingField(null);
    };

    const handleSaveField = async (field) => {
        setSavingProfile(true);
        try {
            const payload = {
                ...user,
                ...tempValue,
                dni: Number(tempValue.dni)
            };
            await usersApi.update(user.id, payload);
            
            const updatedUserSession = {
                ...user,
                ...tempValue,
                dni: Number(tempValue.dni)
            };
            login(updatedUserSession);

            const updatedData = {
                nombre: updatedUserSession.nombre || '',
                apellido: updatedUserSession.apellido || '',
                dni: updatedUserSession.dni || '',
                email: updatedUserSession.email || '',
                telefono: updatedUserSession.telefono || '',
                direccion: updatedUserSession.direccion || ''
            };
            setProfileForm(updatedData);
            setTempValue(updatedData);
            notify('Dato de perfil actualizado', 'success');
            setEditingField(null);
        } catch (err) {
            notify(err.message || 'Error al actualizar', 'error');
        } finally {
            setSavingProfile(false);
        }
    };

    const fetchUserData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // Fetch all reservations, classes, cobros, receipts, and leagues
            const [allReservas, allCobros, allRecibos, allLigas] = await Promise.all([
                reservasApi.getAll(),
                cobrosApi.getAll(),
                recibosApi.getAll(),
                fetch(`${API_URL}/ligas`).then(r => r.ok ? r.json() : [])
            ]);

            // Filter reservations belonging to the logged-in user
            const myReservas = allReservas.filter(r => r.personaId === user.id);
            setReservas(myReservas);

            // Filter cobros belonging to the user's reservations
            const myReservaIds = new Set(myReservas.map(r => r.id));
            const myCobros = allCobros.filter(c => c.reservaId && myReservaIds.has(c.reservaId));
            setCobros(myCobros);

            // Filter receipts for those cobros
            const myCobroIds = new Set(myCobros.map(c => c.id));
            const myRecibos = allRecibos.filter(r => myCobroIds.has(r.cobroId));
            setRecibos(myRecibos);

            // Filter leagues where the user or user's team is registered
            // For simplicity, we show the list of leagues and indicate details
            setLigas(allLigas);

            // Fetch classes and check which ones the user is enrolled in
            const clasesRes = await fetch(`${API_URL}/clases`);
            if (clasesRes.ok) {
                const allClases = await clasesRes.json();
                // To check enrollments, we need details. But we can fetch them or check if user is in assistances list
                // Since fetching each class details is async, we can resolve them:
                const enrollmentPromises = allClases.map(async (c) => {
                    const detailRes = await fetch(`${API_URL}/clases/${c.id}`);
                    if (detailRes.ok) {
                        const details = await detailRes.json();
                        const enrolled = details.asistencias?.some(a => a.usuarioId === user.id) || false;
                        return enrolled ? { ...c, enrolled: true, asistencias: details.asistencias } : null;
                    }
                    return null;
                });
                const resolved = await Promise.all(enrollmentPromises);
                setClases(resolved.filter(Boolean));
            }

        } catch (error) {
            notify('Error al cargar datos: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [user, notify]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || user.rol !== 'Usuario') {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        fetchUserData();
    }, [fetchUserData]);

    const metrics = useMemo(() => {
        const activeBookings = reservas.filter(r => r.estado === 'Confirmada').length;
        const pendingPayments = cobros.filter(c => c.estado === 'Pendiente').length;
        const totalSpent = cobros
            .filter(c => c.estado === 'Pagado')
            .reduce((s, c) => s + Number(c.montoFinal), 0);

        return { activeBookings, pendingPayments, totalSpent };
    }, [reservas, cobros]);

    const handlePrintRecibo = (r) => {
        const w = window.open('', '_blank', 'width=650,height=520');
        w.document.write(`<html><head><title>Recibo ${r.numero}</title>
        <style>body{font-family:Arial;background:#0b130e;color:#fff;padding:40px}
        .card{border:2px solid #28a745;border-radius:12px;padding:28px;max-width:480px;margin:auto;background:#111d13}
        .header{font-size:20px;font-weight:bold;border-bottom:2px solid #28a745;padding-bottom:12px;margin-bottom:20px;color:#28a745;text-align:center}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:15px}
        .label{color:#8ca092}.value{color:#fff;font-weight:bold}</style></head>
        <body><div class="card">
        <div class="header">GOL AHORA — RECIBO DE PAGO</div>
        <div class="row"><span class="label">N° Recibo</span><span class="value">${r.numero}</span></div>
        <div class="row"><span class="label">Fecha</span><span class="value">${new Date(r.fechaEmision).toLocaleString('es-AR')}</span></div>
        <div class="row"><span class="label">Cobro</span><span class="value">#${r.cobroId}</span></div>
        </div><script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

    const formatLocalDateTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    return (
        <div className="user-portal-shell">
            <header className="portal-header">
                <div className="portal-header-inner">
                    <Link to="/" className="portal-brand">
                        <img src="/logo.png" alt="Gol Ahora" />
                        <span>Gol Ahora - Portal</span>
                    </Link>
                    <div className="portal-user-meta">
                        <span>Hola, <strong>{user?.nombre} {user?.apellido}</strong></span>
                        <button className="theme-toggle" onClick={toggleTheme}>
                            {theme === 'dark' ? '☀' : '☾'}
                        </button>
                        <button className="btn-logout" onClick={() => { logout(); navigate('/'); }}>
                            Cerrar sesión
                        </button>
                    </div>
                </div>
            </header>

            <main className="portal-main-container">
                <div className="portal-hero">
                    <h1>Mi Portal de Cliente</h1>
                    <p>Gestiona tus alquileres de canchas, inscripciones a ligas y clases grupales.</p>
                </div>

                <div className="portal-metrics-grid">
                    <article className="metric-card">
                        <span>Reservas Activas</span>
                        <strong>{metrics.activeBookings}</strong>
                    </article>
                    <article className="metric-card">
                        <span>Pagos Pendientes</span>
                        <strong style={{ color: '#f2b84b' }}>{metrics.pendingPayments}</strong>
                    </article>
                    <article className="metric-card">
                        <span>Inversión Deportiva</span>
                        <strong style={{ color: '#31d94f' }}>{moneyFmt.format(metrics.totalSpent)}</strong>
                    </article>
                </div>

                <div className="portal-tabs-container">
                    <nav className="portal-tabs">
                        <button className={activeTab === 'reservas' ? 'active' : ''} onClick={() => setActiveTab('reservas')}>
                            <i className="bi bi-calendar-check me-2"></i> Mis Reservas
                        </button>
                        <button className={activeTab === 'clases' ? 'active' : ''} onClick={() => setActiveTab('clases')}>
                            <i className="bi bi-journal-text me-2"></i> Mis Clases
                        </button>
                        <button className={activeTab === 'ligas' ? 'active' : ''} onClick={() => setActiveTab('ligas')}>
                            <i className="bi bi-trophy me-2"></i> Ligas y Torneos
                        </button>
                        <button className={activeTab === 'recibos' ? 'active' : ''} onClick={() => setActiveTab('recibos')}>
                            <i className="bi bi-receipt me-2"></i> Mis Recibos
                        </button>
                        <button className={activeTab === 'perfil' ? 'active' : ''} onClick={() => setActiveTab('perfil')}>
                            <i className="bi bi-person-circle me-2"></i> Mi Perfil
                        </button>
                    </nav>

                    <section className="portal-tab-content">
                        {loading ? (
                            <div className="empty-state">Cargando mis datos...</div>
                        ) : (
                            <>
                                {/* RESERVAS TAB */}
                                {activeTab === 'reservas' && (
                                    <div className="portal-reservas-section">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                            <h3>Historial de Reservas</h3>
                                            <Link to="/" className="btn-reserve-new">+ Reservar Nueva Cancha</Link>
                                        </div>
                                        {reservas.length === 0 ? (
                                            <div className="empty-state">No posees reservas registradas. ¡Reserva tu primer turno en el inicio!</div>
                                        ) : (
                                            <div className="data-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Cancha</th>
                                                            <th>Fecha</th>
                                                            <th>Horario</th>
                                                            <th>Precio</th>
                                                            <th>Estado</th>
                                                            <th>Pago</th>
                                                            <th>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {reservas.map(r => {
                                                            const cobroAsociado = cobros.find(c => c.reservaId === r.id);
                                                            return (
                                                                <tr key={r.id}>
                                                                    <td>#{r.id}</td>
                                                                    <td style={{ fontWeight: 'bold' }}>{r.cancha}</td>
                                                                    <td>{new Date(r.fecha).toLocaleDateString('es-AR')}</td>
                                                                    <td>{r.horaInicio} – {r.horaFin}</td>
                                                                    <td>{moneyFmt.format(r.precio)}</td>
                                                                    <td>
                                                                        <span className={`pill ${r.estado === 'Confirmada' ? 'success' : r.estado === 'Pendiente' ? 'pending' : 'danger'}`}>
                                                                            {r.estado}
                                                                        </span>
                                                                    </td>
                                                                    <td>
                                                                        <span className={`pill ${r.pago ? 'success' : 'danger'}`}>
                                                                            {r.pago ? 'PAGADO' : 'IMPAGO'}
                                                                        </span>
                                                                    </td>
                                                                    <td className="table-actions">
                                                                        {!r.pago && cobroAsociado && (
                                                                            <button onClick={() => navigate(`/pago/${cobroAsociado.id}`)} style={{ background: '#31d94f', color: '#000' }}>
                                                                                💳 Pagar
                                                                            </button>
                                                                        )}
                                                                        {r.pago && cobroAsociado && (
                                                                            <span style={{ fontSize: '0.85rem', color: '#8ca092' }}>Completado</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* CLASES TAB */}
                                {activeTab === 'clases' && (
                                    <div className="portal-clases-section">
                                        <h3>Mis Clases Inscriptas</h3>
                                        {clases.length === 0 ? (
                                            <div className="empty-state">No estás inscrito en ninguna clase o entrenamiento grupal actualmente.</div>
                                        ) : (
                                            <div className="data-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>Clase</th>
                                                            <th>Fecha / Hora</th>
                                                            <th>Cancha</th>
                                                            <th>Profesor / Entrenador</th>
                                                            <th>Asistencia Registrada</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {clases.map(c => {
                                                            const myAsistencia = c.asistencias?.find(a => a.usuarioId === user.id);
                                                            return (
                                                                <tr key={c.id}>
                                                                    <td style={{ fontWeight: 'bold' }}>{c.tipo}</td>
                                                                    <td>{formatLocalDateTime(c.fechaHora)}</td>
                                                                    <td>{c.cancha}</td>
                                                                    <td>{c.profesor}</td>
                                                                    <td>
                                                                        <span className={`pill ${myAsistencia?.presente ? 'success' : 'danger'}`}>
                                                                            {myAsistencia?.presente ? 'PRESENTE' : 'AUSENTE / PENDIENTE'}
                                                                        </span>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* LIGAS TAB */}
                                {activeTab === 'ligas' && (
                                    <div className="portal-ligas-section">
                                        <h3>Ligas y Torneos del Club</h3>
                                        <p style={{ color: '#8ca092', fontSize: '0.9rem', marginBottom: 16 }}>Consulta los torneos activos en el complejo. Para inscribir a tu equipo, ponte en contacto con la administración.</p>
                                        {ligas.length === 0 ? (
                                            <div className="empty-state">No hay ligas o torneos creados actualmente.</div>
                                        ) : (
                                            <div className="data-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>ID</th>
                                                            <th>Nombre</th>
                                                            <th>Reglamento</th>
                                                            <th>Equipos Inscriptos</th>
                                                            <th>Cupo Máximo</th>
                                                            <th>Estado</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {ligas.map(l => (
                                                            <tr key={l.id}>
                                                                <td>#{l.id}</td>
                                                                <td style={{ fontWeight: 'bold' }}>{l.nombre}</td>
                                                                <td>{l.reglamento}</td>
                                                                <td>{l.equiposInscriptos}</td>
                                                                <td>{l.cupoEquipos} equipos</td>
                                                                <td>
                                                                    <span className={`pill ${l.estado === 'Abierta' ? 'success' : l.estado === 'En curso' ? 'pending' : 'danger'}`}>
                                                                        {l.estado}
                                                                    </span>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* RECIBOS TAB */}
                                {activeTab === 'recibos' && (
                                    <div className="portal-recibos-section">
                                        <h3>Mis Recibos y Comprobantes</h3>
                                        {recibos.length === 0 ? (
                                            <div className="empty-state">No posees recibos de pago disponibles. Éstos se generan al saldar tus cobros.</div>
                                        ) : (
                                            <div className="data-table">
                                                <table>
                                                    <thead>
                                                        <tr>
                                                            <th>N° Recibo</th>
                                                            <th>ID Cobro</th>
                                                            <th>Fecha de Emisión</th>
                                                            <th>Detalle de Transacción</th>
                                                            <th>Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {recibos.map(r => (
                                                            <tr key={r.id}>
                                                                <td style={{ fontWeight: 'bold', color: 'var(--accent)' }}>{r.numero}</td>
                                                                <td>#{r.cobroId}</td>
                                                                <td>{new Date(r.fechaEmision).toLocaleString()}</td>
                                                                <td>{r.datos}</td>
                                                                <td className="table-actions">
                                                                    <button onClick={() => handlePrintRecibo(r)}>🖨️ Imprimir Recibo</button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* PERFIL TAB */}
                                {activeTab === 'perfil' && (
                                    <div className="portal-perfil-section">
                                        <div className="profile-premium-card">
                                            <div className="profile-avatar-row">
                                                <div className="profile-avatar-circle">
                                                    {user?.fotoPerfil ? (
                                                        <img src={user.fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                                    ) : (
                                                        user?.nombre?.[0] || 'U'
                                                    )}
                                                </div>
                                                <div className="profile-avatar-meta">
                                                    <h4>Foto de perfil</h4>
                                                    <p>Personaliza tu avatar en el portal</p>
                                                </div>
                                                <div className="profile-avatar-actions">
                                                    {user?.fotoPerfil && (
                                                        <button 
                                                            className="btn-crop-reset" 
                                                            onClick={handleRemoveAvatar}
                                                            style={{ marginRight: '16px', color: 'var(--danger)' }}
                                                        >
                                                            Quitar la foto
                                                        </button>
                                                    )}
                                                    <button className="btn-avatar-outline" onClick={triggerFileSelect}>
                                                        Cambiar la foto
                                                    </button>
                                                    <input 
                                                        type="file" 
                                                        ref={fileInputRef} 
                                                        style={{ display: 'none' }} 
                                                        accept="image/*" 
                                                        onChange={handleFileChange} 
                                                    />
                                                </div>
                                            </div>

                                            <div className="profile-fields-list">
                                                {/* CAMPO: NOMBRE Y APELLIDO */}
                                                <div className="profile-field-row">
                                                    <div className="field-info">
                                                        <span className="field-label">Nombre y Apellido</span>
                                                        {editingField === 'nombre' ? (
                                                            <div className="field-inputs-group">
                                                                <input
                                                                    type="text"
                                                                    value={tempValue.nombre}
                                                                    placeholder="Nombre"
                                                                    onChange={e => setTempValue({ ...tempValue, nombre: e.target.value })}
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={tempValue.apellido}
                                                                    placeholder="Apellido"
                                                                    onChange={e => setTempValue({ ...tempValue, apellido: e.target.value })}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="field-value">{profileForm.nombre} {profileForm.apellido}</span>
                                                        )}
                                                    </div>
                                                    <div className="field-action">
                                                        {editingField === 'nombre' ? (
                                                            <div className="edit-actions">
                                                                <button className="btn-save-field" onClick={() => handleSaveField('nombre')} disabled={savingProfile}>Guardar</button>
                                                                <button className="btn-cancel-field" onClick={cancelEditing}>Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-edit-field" onClick={() => startEditing('nombre')}>Editar</button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CAMPO: DNI */}
                                                <div className="profile-field-row">
                                                    <div className="field-info">
                                                        <span className="field-label">DNI</span>
                                                        {editingField === 'dni' ? (
                                                            <input
                                                                type="number"
                                                                value={tempValue.dni}
                                                                onChange={e => setTempValue({ ...tempValue, dni: e.target.value })}
                                                            />
                                                        ) : (
                                                            <span className="field-value">{profileForm.dni || '—'}</span>
                                                        )}
                                                    </div>
                                                    <div className="field-action">
                                                        {editingField === 'dni' ? (
                                                            <div className="edit-actions">
                                                                <button className="btn-save-field" onClick={() => handleSaveField('dni')} disabled={savingProfile}>Guardar</button>
                                                                <button className="btn-cancel-field" onClick={cancelEditing}>Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-edit-field" onClick={() => startEditing('dni')}>Editar</button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CAMPO: EMAIL */}
                                                <div className="profile-field-row">
                                                    <div className="field-info">
                                                        <span className="field-label">Correo electrónico</span>
                                                        {editingField === 'email' ? (
                                                            <input
                                                                type="email"
                                                                value={tempValue.email}
                                                                onChange={e => setTempValue({ ...tempValue, email: e.target.value })}
                                                            />
                                                        ) : (
                                                            <span className="field-value">{profileForm.email}</span>
                                                        )}
                                                    </div>
                                                    <div className="field-action">
                                                        {editingField === 'email' ? (
                                                            <div className="edit-actions">
                                                                <button className="btn-save-field" onClick={() => handleSaveField('email')} disabled={savingProfile}>Guardar</button>
                                                                <button className="btn-cancel-field" onClick={cancelEditing}>Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-edit-field" onClick={() => startEditing('email')}>Editar</button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CAMPO: TELEFONO */}
                                                <div className="profile-field-row">
                                                    <div className="field-info">
                                                        <span className="field-label">Teléfono</span>
                                                        {editingField === 'telefono' ? (
                                                            <input
                                                                type="text"
                                                                value={tempValue.telefono}
                                                                onChange={e => setTempValue({ ...tempValue, telefono: e.target.value })}
                                                            />
                                                        ) : (
                                                            <span className="field-value">{profileForm.telefono || 'Sin especificar'}</span>
                                                        )}
                                                    </div>
                                                    <div className="field-action">
                                                        {editingField === 'telefono' ? (
                                                            <div className="edit-actions">
                                                                <button className="btn-save-field" onClick={() => handleSaveField('telefono')} disabled={savingProfile}>Guardar</button>
                                                                <button className="btn-cancel-field" onClick={cancelEditing}>Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-edit-field" onClick={() => startEditing('telefono')}>Editar</button>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* CAMPO: DIRECCION */}
                                                <div className="profile-field-row">
                                                    <div className="field-info">
                                                        <span className="field-label">Dirección</span>
                                                        {editingField === 'direccion' ? (
                                                            <input
                                                                type="text"
                                                                value={tempValue.direccion}
                                                                onChange={e => setTempValue({ ...tempValue, direccion: e.target.value })}
                                                            />
                                                        ) : (
                                                            <span className="field-value">{profileForm.direccion || 'Sin especificar'}</span>
                                                        )}
                                                    </div>
                                                    <div className="field-action">
                                                        {editingField === 'direccion' ? (
                                                            <div className="edit-actions">
                                                                <button className="btn-save-field" onClick={() => handleSaveField('direccion')} disabled={savingProfile}>Guardar</button>
                                                                <button className="btn-cancel-field" onClick={cancelEditing}>Cancelar</button>
                                                            </div>
                                                        ) : (
                                                            <button className="btn-edit-field" onClick={() => startEditing('direccion')}>Editar</button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {showCropModal && (
                                    <div className="crop-modal-overlay">
                                        <div className="crop-modal-card">
                                            <div className="crop-modal-header">
                                                <h3>Editar imagen</h3>
                                                <button className="crop-modal-close" onClick={() => setShowCropModal(false)}>
                                                    <i className="bi bi-x-lg"></i>
                                                </button>
                                            </div>
                                            
                                            <div className="crop-modal-body">
                                                <div 
                                                    className="crop-image-container"
                                                    onPointerDown={handlePointerDown}
                                                    onPointerMove={handlePointerMove}
                                                    onPointerUp={handlePointerUp}
                                                    onPointerLeave={handlePointerUp}
                                                >
                                                    <img 
                                                        src={imageSrc} 
                                                        alt="Crop target" 
                                                        style={{
                                                            transform: `translate(${position.x}px, ${position.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                                                            maxWidth: '100%',
                                                            maxHeight: '100%',
                                                            userSelect: 'none',
                                                            pointerEvents: 'none',
                                                            transition: isDragging ? 'none' : 'transform 0.1s ease'
                                                        }}
                                                    />
                                                    <div className="crop-overlay-circle"></div>
                                                </div>

                                                <div className="crop-controls-row">
                                                    <i className="bi bi-image" style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}></i>
                                                    <input 
                                                        type="range" 
                                                        min="1" 
                                                        max="3" 
                                                        step="0.05"
                                                        value={zoom}
                                                        onChange={e => setZoom(parseFloat(e.target.value))}
                                                        className="crop-zoom-slider"
                                                    />
                                                    <i className="bi bi-image" style={{ fontSize: '1.4rem', color: 'var(--text-secondary)' }}></i>
                                                    <button className="btn-rotate" onClick={handleRotate} title="Rotar 90°">
                                                        <i className="bi bi-arrow-clockwise"></i>
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="crop-modal-footer">
                                                <button className="btn-crop-reset" onClick={handleReset}>Restablecer</button>
                                                <div className="crop-modal-footer-actions">
                                                    <button className="btn-crop-cancel" onClick={() => setShowCropModal(false)}>Cancelar</button>
                                                    <button className="btn-crop-apply" onClick={handleApplyCrop}>Aplicar</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
