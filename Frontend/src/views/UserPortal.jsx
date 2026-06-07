import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast.jsx';
import { reservas as reservasApi, cobros as cobrosApi, recibos as recibosApi, users as usersApi } from '../services/api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import './UserPortal.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';
const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

export default function UserPortal() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate               = useNavigate();
    const { notify }             = useToast();

    const [activeTab, setActiveTab] = useState('reservas');
    const [selectedReservaEfectivo, setSelectedReservaEfectivo] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [showHistory, setShowHistory] = useState(false);

    // Postulation states
    const [postularRol, setPostularRol] = useState('Profesor');
    const [pdfBase64, setPdfBase64] = useState(null);
    const [sendingPostulation, setSendingPostulation] = useState(false);

    const showConfirm = (message, onConfirm, title = 'Confirmación') => {
        setConfirmConfig({
            isOpen: true,
            title,
            message,
            onConfirm: () => {
                onConfirm();
                setConfirmConfig(c => ({ ...c, isOpen: false }));
            }
        });
    };
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
        showConfirm('¿Deseas quitar tu foto de perfil?', async () => {
            try {
                await usersApi.update(user.id, {
                    id: user.id,
                    email: user.email,
                    rol: user.rol || 'Usuario',
                    nombre: user.nombre,
                    apellido: user.apellido,
                    dni: Number(user.dni || 0),
                    legajo: Number(user.legajo || 0),
                    fotoPerfil: 'REMOVE',
                    direccion: user.direccion || '',
                    telefono: user.telefono || '',
                    certificadoPdf: user.certificadoPdf
                });
                const updatedUser = { ...user, fotoPerfil: null };
                login(updatedUser);
                notify('Foto de perfil eliminada', 'success');
            } catch (err) {
                notify('Error al eliminar foto de perfil: ' + err.message, 'error');
            }
        });
    };

    const handlePdfFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type !== 'application/pdf') {
                notify('Por favor, selecciona un archivo PDF válido', 'error');
                e.target.value = '';
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                setPdfBase64(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handlePostularSubmit = async (e) => {
        e.preventDefault();
        if (!pdfBase64) {
            notify('Por favor, sube tu certificado PDF', 'error');
            return;
        }

        setSendingPostulation(true);
        try {
            await usersApi.update(user.id, {
                id: user.id,
                email: user.email,
                rol: user.rol || 'Usuario',
                nombre: user.nombre,
                apellido: user.apellido,
                dni: Number(user.dni || 0),
                legajo: Number(user.legajo || 0),
                fotoPerfil: user.fotoPerfil,
                direccion: user.direccion || '',
                telefono: user.telefono || '',
                certificadoPdf: pdfBase64
            });

            notify('Postulación enviada con éxito. Un empleado la revisará pronto.', 'success');
            
            // Re-fetch user details to get the exact saved PDF url and update context
            const freshUser = await usersApi.getAll();
            const me = freshUser.find(u => u.id === user.id);
            if (me) {
                login(me);
            }
        } catch (err) {
            notify('Error al enviar la postulación: ' + err.message, 'error');
        } finally {
            setSendingPostulation(false);
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
            
            // Persist base64 data to backend database & static folder
            usersApi.update(user.id, {
                ...updatedUser,
                dni: Number(user.dni)
            }).then(() => {
                login(updatedUser);
                setShowCropModal(false);
                notify('Foto de perfil actualizada', 'success');
            }).catch(err => {
                notify('Error al guardar foto de perfil: ' + err.message, 'error');
            });
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
        const ACTIVE_ESTADOS = ['Pendiente', 'PendienteVerificacion', 'Confirmada'];
        const activeReservaIds = new Set(
            reservas.filter(r => ACTIVE_ESTADOS.includes(r.estado)).map(r => r.id)
        );
        const activeBookings = reservas.filter(r => r.estado === 'Confirmada').length;
        const totalSpent = cobros
            .filter(c => c.estado === 'Pagado')
            .reduce((s, c) => s + Number(c.montoFinal), 0);

        return { activeBookings, totalSpent };
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

    const openComprobanteEnPestana = (path) => {
        if (!path) return;
        
        // El servidor guarda la imagen y devuelve una ruta como /uploads/receipts/...
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';
        const baseUrl = API_BASE.replace('/api/v1', '');
        
        // Si por alguna razón es una URL completa o un base64 heredado, lo abrimos directo
        if (path.startsWith('http') || path.startsWith('data:')) {
            window.open(path, '_blank');
            return;
        }

        // Construimos la URL completa al backend
        const fullUrl = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
        window.open(fullUrl, '_blank');
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
                        <button className="theme-toggle" onClick={() => { setLoading(true); fetchUserData(); }} title="Actualizar datos">
                            <i className="bi bi-arrow-clockwise"></i>
                        </button>
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
                                {activeTab === 'reservas' && (() => {
                                    const INACTIVE = ['Cancelada', 'Expirada'];
                                    const pendingAction = reservas.filter(r =>
                                        r.estado === 'Pendiente' &&
                                        !r.pago &&
                                        r.fechaExpiracion &&
                                        new Date(r.fechaExpiracion + (r.fechaExpiracion.endsWith('Z') ? '' : 'Z')) > new Date()
                                    );
                                    const pendingVerificacion = reservas.filter(r => r.estado === 'PendienteVerificacion');
                                    const sorted = [...reservas].sort((a, b) => new Date(b.fecha) - new Date(a.fecha) || b.id - a.id);
                                    const visible = showHistory ? sorted : sorted.filter(r => !INACTIVE.includes(r.estado));
                                    const hiddenCount = sorted.filter(r => INACTIVE.includes(r.estado)).length;

                                    const estadoMeta = (r) => {
                                        if (r.pago) return { label: 'Pagado ✓', cls: 'success', icon: '✅' };
                                        if (r.estado === 'Confirmada') return { label: 'Confirmada', cls: 'success', icon: '✅' };
                                        if (r.estado === 'PendienteVerificacion') return { label: 'Verificando pago…', cls: 'pending', icon: '⏳' };
                                        if (r.estado === 'Pendiente') return { label: 'Pendiente de pago', cls: 'pending', icon: '🕐' };
                                        if (r.estado === 'Cancelada') return { label: 'Cancelada', cls: 'danger', icon: '✕' };
                                        if (r.estado === 'Expirada') return { label: 'Expirada', cls: 'danger', icon: '⏰' };
                                        return { label: r.estado, cls: 'pending', icon: '•' };
                                    };

                                    return (
                                    <div className="portal-reservas-section">
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                                            <h3 style={{ margin: 0 }}>Mis Reservas</h3>
                                            <Link to="/" className="btn-reserve-new">+ Nueva Cancha</Link>
                                        </div>

                                        {/* Banner: pago pendiente urgente */}
                                        {pendingAction.length > 0 && (
                                            <div className="reservas-pending-banner">
                                                <div className="reservas-pending-banner__icon">
                                                    <i className="bi bi-clock-history"></i>
                                                </div>
                                                <div className="reservas-pending-banner__body">
                                                    <strong>Tenés {pendingAction.length} reserva{pendingAction.length > 1 ? 's' : ''} esperando pago</strong>
                                                    <p>Completá el pago antes de que expire el tiempo reservado. Usá el botón de la barra superior.</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Banner: en verificación por transferencia */}
                                        {pendingVerificacion.length > 0 && (
                                            <div className="reservas-pending-banner reservas-pending-banner--info">
                                                <div className="reservas-pending-banner__icon reservas-pending-banner__icon--info">
                                                    <i className="bi bi-hourglass-split"></i>
                                                </div>
                                                <div className="reservas-pending-banner__body">
                                                    <strong>{pendingVerificacion.length} comprobante{pendingVerificacion.length > 1 ? 's' : ''} en verificación</strong>
                                                    <p>Tu transferencia está siendo revisada por el equipo. Te confirmaremos a la brevedad.</p>
                                                </div>
                                            </div>
                                        )}

                                        {reservas.length === 0 ? (
                                            <div className="empty-state">
                                                <i className="bi bi-calendar-x" style={{ fontSize: '3rem', display: 'block', marginBottom: 12, color: '#8ca092' }}></i>
                                                <p>¡Todavía no tenés reservas! Elegí tu cancha favorita y empezá a jugar.</p>
                                                <Link to="/" className="btn-reserve-new" style={{ marginTop: 12, display: 'inline-block' }}>Reservar ahora</Link>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="reservas-cards-grid">
                                                    {visible.map(r => {
                                                        const cobroAsociado = cobros.find(c => c.reservaId === r.id);
                                                        const meta = estadoMeta(r);
                                                        const isInactive = INACTIVE.includes(r.estado);
                                                        return (
                                                            <div key={r.id} className={`reserva-card ${isInactive ? 'reserva-card--inactive' : ''} ${r.estado === 'Pendiente' && !r.pago ? 'reserva-card--pending' : ''}`}>
                                                                {/* ─ Card Header: cancha name + status pill ─ */}
                                                                <div className="reserva-card__header">
                                                                    <div className="reserva-card__cancha-icon">
                                                                        <i className="bi bi-dribbble"></i>
                                                                    </div>
                                                                    <div className="reserva-card__cancha-info">
                                                                        <strong>{r.cancha}</strong>
                                                                    </div>
                                                                    <span className={`pill ${meta.cls}`}>{meta.label}</span>
                                                                </div>
                                                                {/* ─ Card Body: all relevant details including date ─ */}
                                                                <div className="reserva-card__body">
                                                                    <div className="reserva-card__detail">
                                                                        <span><i className="bi bi-calendar3"></i> Fecha</span>
                                                                        <strong style={{ textTransform: 'capitalize' }}>
                                                                            {new Date(r.fecha).toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                                                                        </strong>
                                                                    </div>
                                                                    <div className="reserva-card__detail">
                                                                        <span><i className="bi bi-clock"></i> Horario</span>
                                                                        <strong>{r.horaInicio} – {r.horaFin}</strong>
                                                                    </div>
                                                                    <div className="reserva-card__detail">
                                                                        <span><i className="bi bi-credit-card"></i> Método</span>
                                                                        <strong style={{ textTransform: 'capitalize' }}>{r.metodoPago || '—'}</strong>
                                                                    </div>
                                                                    <div className="reserva-card__detail">
                                                                        <span><i className="bi bi-cash-coin"></i> Total</span>
                                                                        <strong style={{ color: '#31d94f' }}>{moneyFmt.format(r.precio)}</strong>
                                                                    </div>
                                                                    {r.fechaCreacion && (
                                                                        <div className="reserva-card__detail">
                                                                            <span><i className="bi bi-pencil-square"></i> Creada el</span>
                                                                            <strong>{new Date(r.fechaCreacion).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</strong>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {/* ─ Card Footer: action buttons ─ */}
                                                                {!isInactive && (
                                                                    <div className="reserva-card__footer">
                                                                        {!r.pago && cobroAsociado && r.metodoPago === 'efectivo' && r.estado === 'Pendiente' && (
                                                                            <button className="btn-action btn-action--yellow" onClick={() => setSelectedReservaEfectivo(r)}>
                                                                                <i className="bi bi-upc-scan me-1"></i> Ver Código Rapipago
                                                                            </button>
                                                                        )}
                                                                        {r.estado === 'PendienteVerificacion' && (
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
                                                                                <span className="reserva-card__verif-badge">
                                                                                    <i className="bi bi-hourglass-split me-1"></i> Comprobante en verificación
                                                                                </span>
                                                                                {r.comprobantePdf && (
                                                                                    <button 
                                                                                        className="btn-action btn-action--yellow" 
                                                                                        style={{ padding: '6px 12px', fontSize: '0.85rem' }}
                                                                                        onClick={() => openComprobanteEnPestana(r.comprobantePdf)}
                                                                                    >
                                                                                        <i className="bi bi-file-earmark-pdf me-1"></i> Ver Comprobante
                                                                                    </button>
                                                                                )}
                                                                            </div>
                                                                        )}
                                                                        {r.pago && (
                                                                            <span className="reserva-card__ok-badge">
                                                                                <i className="bi bi-check-circle-fill me-1"></i> Pago confirmado
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {hiddenCount > 0 && (
                                                    <button
                                                        className="btn-toggle-history"
                                                        onClick={() => setShowHistory(p => !p)}
                                                    >
                                                        {showHistory
                                                            ? `▲ Ocultar historial (${hiddenCount} canceladas/expiradas)`
                                                            : `▼ Ver historial completo (${hiddenCount} canceladas/expiradas)`}
                                                    </button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    );
                                })()}

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

                                        {user?.rol === 'Usuario' && (
                                            <div className="profile-premium-card" style={{ marginTop: '24px' }}>
                                                <h3 className="text-success fw-bold" style={{ fontSize: '1.2rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '16px' }}>
                                                    Postulación Profesional
                                                </h3>
                                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '24px' }}>
                                                    ¿Quieres ser profesor o entrenador en Gol Ahora? Sube tu certificación correspondiente en formato PDF para iniciar el proceso de verificación.
                                                </p>
                                                
                                                {user?.certificadoPdf ? (
                                                    <div className="alert alert-success d-flex align-items-center gap-2" role="alert" style={{ background: 'rgba(49, 217, 79, 0.1)', border: '1px solid rgba(49, 217, 79, 0.2)', color: '#31d94f', borderRadius: '12px' }}>
                                                        <i className="bi bi-clock-history"></i>
                                                        <div>
                                                            Ya tienes una postulación pendiente de revisión. 
                                                            <a href={user.certificadoPdf} target="_blank" rel="noopener noreferrer" style={{ color: '#31d94f', textDecoration: 'underline', marginLeft: '6px', fontWeight: 'bold' }}>
                                                                Ver certificado enviado
                                                            </a>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={handlePostularSubmit} style={{ display: 'grid', gap: '16px', maxWidth: '500px' }}>
                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Puesto al que te postulas</label>
                                                            <select 
                                                                value={postularRol} 
                                                                onChange={e => setPostularRol(e.target.value)}
                                                                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-base)', borderRadius: '10px', color: 'var(--text-primary)' }}
                                                                required
                                                            >
                                                                <option value="Profesor">Profesor</option>
                                                                <option value="Entrenador">Entrenador</option>
                                                            </select>
                                                        </div>

                                                        <div>
                                                            <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 'bold', marginBottom: '6px', textTransform: 'uppercase' }}>Certificación Deportiva (PDF)</label>
                                                            <input 
                                                                type="file" 
                                                                accept="application/pdf"
                                                                onChange={handlePdfFileChange}
                                                                style={{ width: '100%', padding: '10px', background: 'var(--bg-input)', border: '1px solid var(--border-base)', borderRadius: '10px', color: 'var(--text-primary)' }}
                                                                required
                                                            />
                                                        </div>

                                                        <button 
                                                            type="submit" 
                                                            className="btn btn-success" 
                                                            style={{ backgroundColor: '#28a745', border: 'none', padding: '12px', borderRadius: '50px', fontWeight: 'bold', cursor: 'pointer', marginTop: '8px' }}
                                                            disabled={sendingPostulation}
                                                        >
                                                            {sendingPostulation ? 'Enviando postulación...' : 'Enviar Postulación'}
                                                        </button>
                                                    </form>
                                                )}
                                            </div>
                                        )}
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
                <ConfirmModal
                    isOpen={confirmConfig.isOpen}
                    title={confirmConfig.title}
                    message={confirmConfig.message}
                    onConfirm={confirmConfig.onConfirm}
                    onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
                />

                {/* MODAL DE COMPROBANTE EFECTIVO */}
                {selectedReservaEfectivo && (
                    <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
                        <div className="modal-content" style={{ background: 'var(--bg-card)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '400px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <h3 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>💵 Comprobante de Pago</h3>
                            <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                                Muestra este código en mostrador o en cualquier sucursal Rapipago / PagoFácil.
                            </p>
                            
                            <div style={{ background: 'var(--bg-app)', padding: '20px', borderRadius: '8px', border: '1px dashed var(--accent)', marginBottom: '20px' }}>
                                <div style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '5px' }}>Código de Pago</div>
                                <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: 'var(--accent)', letterSpacing: '2px' }}>
                                    {selectedReservaEfectivo.codigoPagoExterno || 'Generando...'}
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontSize: '1rem', color: 'var(--text-primary)' }}>
                                <span>Total a pagar:</span>
                                <strong style={{ color: 'var(--accent)' }}>{moneyFmt.format(selectedReservaEfectivo.precio)}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '25px', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                                <span>Vence:</span>
                                <span>{new Date(selectedReservaEfectivo.fechaExpiracion).toLocaleString('es-AR')}</span>
                            </div>

                            <button onClick={() => setSelectedReservaEfectivo(null)} style={{ background: 'transparent', border: '1px solid var(--text-secondary)', color: 'var(--text-primary)', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', width: '100%', fontWeight: 'bold' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}
