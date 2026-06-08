import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { canchas as canchasApi, reservas as reservasApi, cobros as cobrosApi, recibos as recibosApi, users as usersApi } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import ConfirmModal from '../components/ConfirmModal.jsx';
import './EmployeePanel.css';

const todayInput = () => new Date().toISOString().split('T')[0];
const moneyFmt = new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 });

const getKycDetails = (certificadoPdf) => {
    if (!certificadoPdf) return { role: 'Profesor', pdfUrl: '' };
    if (certificadoPdf.includes(':')) {
        const parts = certificadoPdf.split(':');
        if (parts[0] === 'Entrenador' || parts[0] === 'Profesor') {
            const role = parts[0];
            const path = parts.slice(1).join(':');
            return { role, pdfUrl: path };
        }
    }
    return { role: 'Profesor', pdfUrl: certificadoPdf };
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';

const menuItems = [
    { id: 'reservas', label: 'Reservas y turnos', icon: 'bi bi-calendar-check' },
    { id: 'canchas', label: 'Gestión de canchas', icon: 'bi bi-grid-3x3-gap' },
    { id: 'pagos', label: 'Pagos y recibos', icon: 'bi bi-credit-card' },
    { id: 'kyc', label: 'Solicitudes KYC', icon: 'bi bi-shield-check' },
    { id: 'perfil', label: 'Mi Perfil', icon: 'bi bi-person-circle' }
];

const statusFilters = ['Todas', 'Pendiente', 'Confirmada', 'Cancelada'];

export default function EmployeePanel() {
    const { user, login, logout, loading: authLoading } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const navigate               = useNavigate();
    const { notify }             = useToast();

    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

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

    const [activeSection, setActiveSection] = useState('reservas');
    const [selectedDate,  setSelectedDate]  = useState(todayInput());
    const [statusFilter,  setStatusFilter]  = useState('Todas');
    const [loading,       setLoading]       = useState(true);

    const [reservas, setReservas] = useState([]);
    const [canchas,  setCanchas]  = useState([]);
    const [users,    setUsers]    = useState([]);

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
                    rol: user.rol || 'Empleado',
                    nombre: user.nombre,
                    apellido: user.apellido,
                    dni: Number(user.dni || 0),
                    legajo: Number(user.legajo || 0),
                    fotoPerfil: 'REMOVE',
                    direccion: user.direccion || '',
                    telefono: user.telefono || ''
                });
                const updatedUser = { ...user, fotoPerfil: null };
                login(updatedUser);
                notify('Foto de perfil eliminada', 'success');
            } catch (err) {
                notify('Error al eliminar foto de perfil: ' + err.message, 'error');
            }
        });
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

    const [showCanchaForm, setShowCanchaForm] = useState(false);
    const [canchaForm, setCanchaForm] = useState({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5', duracionMaximaMinutos: 60, precioHora: 4500 });

    // Bloqueos de mantenimiento
    const [bloqueos, setBloqueos] = useState([]);
    const [loadingBloqueos, setLoadingBloqueos] = useState(false);
    const [showBloqueoForm, setShowBloqueoForm] = useState(false);
    const [bloqueoForm, setBloqueoForm] = useState({ canchaId: '', fechaHoraInicio: '', fechaHoraFin: '', motivo: '' });

    const fetchBloqueos = async () => {
        setLoadingBloqueos(true);
        try {
            const res = await fetch(`${API_URL}/canchas/bloqueos`);
            if (res.ok) setBloqueos(await res.json());
        } catch { /* silencioso */ }
        finally { setLoadingBloqueos(false); }
    };

    const handleCrearBloqueo = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_URL}/canchas/${bloqueoForm.canchaId}/bloquear`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fechaHoraInicio: new Date(bloqueoForm.fechaHoraInicio).toISOString(),
                    fechaHoraFin:    new Date(bloqueoForm.fechaHoraFin).toISOString(),
                    motivo:          bloqueoForm.motivo || 'Mantenimiento'
                })
            });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.title || 'Error al crear bloqueo');
            }
            notify('Bloqueo de mantenimiento creado', 'success');
            setShowBloqueoForm(false);
            setBloqueoForm({ canchaId: '', fechaHoraInicio: '', fechaHoraFin: '', motivo: '' });
            await Promise.all([fetchAll(), fetchBloqueos()]);
        } catch (err) {
            notify(err.message, 'error');
        }
    };

    const handleDesactivarBloqueo = (bloqueoId) => {
        showConfirm('Desactivar este bloqueo? La cancha volvera a estar disponible en ese horario.', async () => {
            try {
                const res = await fetch(`${API_URL}/canchas/bloqueos/${bloqueoId}/desactivar`, { method: 'PUT' });
                if (!res.ok) throw new Error('No se pudo desactivar');
                notify('Bloqueo desactivado', 'success');
                fetchBloqueos();
            } catch (err) {
                notify(err.message, 'error');
            }
        });
    };

    const [showReservaForm, setShowReservaForm] = useState(false);
    const [reservaForm, setReservaForm] = useState({
        canchaId: '', personaId: '', fecha: todayInput(),
        horaInicio: '20:00', horaFin: '21:00', precio: 4500, pago: false
    });

    const [cobros, setCobros] = useState([]);
    const [recibosList, setRecibos] = useState([]);
    const [cobroTab, setCobroTab] = useState('cobros');
    const [showCobroForm, setShowCobroForm] = useState(false);
    const [editingCobro, setEditingCobro] = useState(null);
    const [cobroForm, setCobroForm] = useState({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });

    const fetchAll = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedDate)             params.fecha  = selectedDate;
            if (statusFilter !== 'Todas') params.estado = statusFilter;

            const [r, c, u, cob, rec] = await Promise.all([
                reservasApi.getAll(params),
                canchasApi.getAll(),
                usersApi.getAll(),
                cobrosApi.getAll(),
                recibosApi.getAll()
            ]);
            setReservas(r);
            setCanchas(c);
            setUsers(u);
            setCobros(cob);
            setRecibos(rec);
        } catch (err) {
            notify(err.message || 'Error al cargar datos', 'error');
        } finally {
            setLoading(false);
        }
    }, [selectedDate, statusFilter]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || (user.rol !== 'Empleado' && user.rol !== 'Administrador')) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        fetchAll();
        fetchBloqueos();
    }, [fetchAll]);

    const reservasByCancha = useMemo(() => {
        return reservas.reduce((groups, reserva) => {
            const key = reserva.cancha || `Cancha #${reserva.canchaId}`;
            if (!groups[key]) groups[key] = [];
            groups[key].push(reserva);
            return groups;
        }, {});
    }, [reservas]);

    const metrics = useMemo(() => {
        const confirmed = reservas.filter(r => r.estado === 'Confirmada').length;
        const pending = reservas.filter(r => r.estado === 'Pendiente').length;
        const canceled = reservas.filter(r => r.estado === 'Cancelada').length;
        const revenue = reservas
            .filter(r => r.estado !== 'Cancelada')
            .reduce((total, r) => total + Number(r.precio || 0), 0);

        return { confirmed, pending, canceled, revenue };
    }, [reservas]);

    const pendingKycUsers = useMemo(() => {
        return users.filter(u => u.rol === 'Usuario' && u.certificadoPdf && u.certificadoPdf.trim() !== '');
    }, [users]);

    const shiftDate = (days) => {
        const d = new Date(`${selectedDate}T00:00:00`);
        d.setDate(d.getDate() + days);
        const iso = d.toISOString().split('T')[0];
        setSelectedDate(iso);
        setReservaForm(f => ({ ...f, fecha: iso }));
    };

    const handleCreateCancha = async (e) => {
        e.preventDefault();
        try {
            await canchasApi.create(canchaForm);
            notify('Cancha creada con exito', 'success');
            setShowCanchaForm(false);
            setCanchaForm({ superficie: '', capacidad: 10, tipoCancha: 'Futbol5', duracionMaximaMinutos: 60, precioHora: 4500 });
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo crear la cancha', 'error');
        }
    };

    const handleCreateReserva = async (e) => {
        e.preventDefault();
        try {
            await reservasApi.create({
                ...reservaForm,
                canchaId:  Number(reservaForm.canchaId),
                personaId: Number(reservaForm.personaId),
                precio:    Number(reservaForm.precio),
            });
            notify('Reserva creada con éxito', 'success');
            setShowReservaForm(false);
            setSelectedDate(reservaForm.fecha);
            fetchAll();
        } catch (err) {
            notify(err.message || 'No se pudo crear la reserva', 'error');
        }
    };

    const updateReservaEstado = async (id, estado) => {
        try {
            await reservasApi.updateEstado(id, estado);
            notify(`Reserva ${estado.toLowerCase()} con éxito`, 'success');
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al actualizar', 'error');
        }
    };

    const handleKycAction = (targetUser, newRol, isApprove) => {
        const actionLabel = isApprove ? `aprobar como ${newRol}` : 'rechazar';
        showConfirm(`¿Estás seguro de que deseas ${actionLabel} la solicitud de ${targetUser.nombre} ${targetUser.apellido}?`, async () => {
            const nextYear = new Date();
            nextYear.setFullYear(nextYear.getFullYear() + 1);

            const payload = {
                id: targetUser.id,
                nombre: targetUser.nombre,
                apellido: targetUser.apellido,
                dni: targetUser.dni,
                email: targetUser.email,
                rol: isApprove ? newRol : 'Usuario',
                legajo: targetUser.legajo || 0,
                direccion: targetUser.direccion || '',
                telefono: targetUser.telefono || '',
                fotoPerfil: targetUser.fotoPerfil || null,
                certificacion: isApprove,
                fechaVencimientoCertificacion: isApprove ? nextYear.toISOString() : null,
                certificadoPdf: isApprove ? targetUser.certificadoPdf : null
            };

            try {
                await usersApi.update(targetUser.id, payload);
                notify(isApprove ? `Usuario aprobado como ${newRol} con éxito` : 'Solicitud rechazada con éxito', 'success');
                fetchAll();
            } catch (error) {
                notify(`Error al procesar solicitud: ${error.message}`, 'error');
            }
        });
    };

    const handleSaveCobro = async (e) => {
        e.preventDefault();
        const body = { ...cobroForm, monto: Number(cobroForm.monto), descuento: Number(cobroForm.descuento) };
        try {
            if (editingCobro) await cobrosApi.update(editingCobro, body);
            else              await cobrosApi.create(body);
            notify(editingCobro ? 'Cobro actualizado' : 'Cobro creado', 'success');
            setShowCobroForm(false);
            setEditingCobro(null);
            setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' });
            fetchAll();
        } catch (err) {
            notify(err.message || 'Error al guardar', 'error');
        }
    };

    const handlePagarCobro = (c) => {
        showConfirm(`¿Registrar pago de ${moneyFmt.format(c.montoFinal)} para el cobro #${c.id}?`, async () => {
            try {
                await cobrosApi.pagar(c.id, { monto: c.montoFinal, metodoPago: 'Efectivo', aprobado: true });
                notify('Pago registrado y recibo generado', 'success');
                fetchAll();
            } catch (err) {
                notify(err.message || 'Error al procesar', 'error');
            }
        });
    };

    const handlePrintCobro = (c) => {
        const w = window.open('', '_blank', 'width=650,height=520');
        w.document.write(`<html><head><title>Cobro #${c.id}</title>
        <style>body{font-family:Arial;background:#0b130e;color:#fff;padding:40px}
        .card{border:2px solid #28a745;border-radius:12px;padding:28px;max-width:480px;margin:auto;background:#111d13}
        .header{font-size:20px;font-weight:bold;border-bottom:2px solid #28a745;padding-bottom:12px;margin-bottom:20px;color:#28a745;text-align:center}
        .row{display:flex;justify-content:space-between;margin-bottom:12px;font-size:15px}
        .label{color:#8ca092}.value{color:#fff;font-weight:bold}</style></head>
        <body><div class="card">
        <div class="header">GOL AHORA — COMPROBANTE DE COBRO</div>
        <div class="row"><span class="label">N° Cobro</span><span class="value">#${c.id}</span></div>
        <div class="row"><span class="label">Concepto</span><span class="value">${c.concepto}</span></div>
        <div class="row"><span class="label">Total</span><span class="value">$${Number(c.montoFinal).toLocaleString('es-AR')}</span></div>
        <div class="row"><span class="label">Estado</span><span class="value">${c.estado}</span></div>
        </div><script>window.onload=()=>window.print()</script></body></html>`);
        w.document.close();
    };

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

    const totalCobrado  = cobros.filter(c => c.estado === 'Pagado').reduce((s, c) => s + Number(c.montoFinal), 0);
    const totalPendiente = cobros.filter(c => c.estado === 'Pendiente').reduce((s, c) => s + Number(c.montoFinal), 0);
    const estadoPill = (e) => ({ Pagado: 'success', Pendiente: 'pending', Rechazado: 'danger' }[e] ?? 'neutral');

    return (
        <main className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <img src="/logo.png" alt="Gol Ahora" />
                    <div>
                        <strong>Gol Ahora</strong>
                        <span>Empleado del club</span>
                    </div>
                </div>

                <div className="admin-profile">
                    <div className="admin-avatar">
                        {user?.fotoPerfil ? (
                            <img src={user.fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.nombre?.[0] || 'E'
                        )}
                    </div>
                    <div>
                        <strong>{user?.nombre || 'Empleado'}</strong>
                        <span>En línea</span>
                    </div>
                </div>

                <nav className="admin-menu">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            className={activeSection === item.id ? 'active' : ''}
                            onClick={() => setActiveSection(item.id)}
                        >
                            <i className={`${item.icon} me-2`}></i>
                            {item.label}
                        </button>
                    ))}
                </nav>

                <div className="admin-sidebar-footer">
                    <button className="admin-logout" onClick={() => { logout(); navigate('/'); }}>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <section className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <p>Gestión Operativa (Empleado)</p>
                        <h1>{menuItems.find(i => i.id === activeSection)?.label}</h1>
                    </div>
                    <button className="ghost-button" onClick={fetchAll}>↻ Actualizar</button>
                </header>

                {/* ── RESERVAS ── */}
                {activeSection === 'reservas' && (
                    <section className="admin-panel">
                        <div className="reservation-toolbar">
                            <div>
                                <p>Fecha</p>
                                <div className="date-controls">
                                    <button type="button" onClick={() => shiftDate(-1)}>‹</button>
                                    <input type="date" value={selectedDate}
                                        onChange={e => { setSelectedDate(e.target.value); setReservaForm(f => ({ ...f, fecha: e.target.value })); }} />
                                    <button type="button" onClick={() => shiftDate(1)}>›</button>
                                </div>
                            </div>
                            <div className="status-tabs">
                                {statusFilters.map(f => (
                                    <button key={f} className={statusFilter === f ? 'active' : ''} onClick={() => setStatusFilter(f)}>{f}</button>
                                ))}
                            </div>
                            <button className="primary-action" onClick={() => setShowReservaForm(v => !v)}>
                                {showReservaForm ? 'Cancelar' : '+ Nueva reserva'}
                            </button>
                        </div>

                        <div className="metric-grid">
                            <article><span>Confirmadas</span><strong>{metrics.confirmed}</strong></article>
                            <article><span>Pendientes</span><strong>{metrics.pending}</strong></article>
                            <article><span>Canceladas</span><strong>{metrics.canceled}</strong></article>
                            <article><span>Ingresos del día</span><strong>{moneyFmt.format(metrics.revenue)}</strong></article>
                        </div>

                        {showReservaForm && (
                            <form className="admin-form reservation-form" onSubmit={handleCreateReserva}>
                                <select value={reservaForm.canchaId} onChange={e => setReservaForm(f => ({ ...f, canchaId: e.target.value }))} required>
                                    <option value="">Cancha</option>
                                    {canchas.map(c => <option key={c.id} value={c.id}>{c.superficie}</option>)}
                                </select>
                                <select value={reservaForm.personaId} onChange={e => setReservaForm(f => ({ ...f, personaId: e.target.value }))} required>
                                    <option value="">Cliente</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>)}
                                </select>
                                <input type="date" value={reservaForm.fecha} onChange={e => setReservaForm(f => ({ ...f, fecha: e.target.value }))} required />
                                <input type="time" value={reservaForm.horaInicio} onChange={e => setReservaForm(f => ({ ...f, horaInicio: e.target.value }))} required />
                                <input type="time" value={reservaForm.horaFin}    onChange={e => setReservaForm(f => ({ ...f, horaFin: e.target.value }))} required />
                                <input type="number" min="0" value={reservaForm.precio} onChange={e => setReservaForm(f => ({ ...f, precio: e.target.value }))} required />
                                <label className="check-field">
                                    <input type="checkbox" checked={reservaForm.pago} onChange={e => setReservaForm(f => ({ ...f, pago: e.target.checked }))} />
                                    Pago recibido
                                </label>
                                <button type="submit" className="primary-action">Guardar reserva</button>
                            </form>
                        )}

                        <div className="reservation-board">
                            {loading && <div className="empty-state">Cargando reservas...</div>}
                            {!loading && reservas.length === 0 && <div className="empty-state">No hay reservas.</div>}
                            {!loading && Object.entries(reservasByCancha).map(([name, rs]) => (
                                <section key={name} className="court-row">
                                    <div className="court-heading">
                                        <h2>Cancha: <span>{name}</span></h2>
                                        <small>{rs.length} turnos</small>
                                    </div>
                                    <div className="reservation-cards">
                                        {rs.map(r => (
                                            <article key={r.id} className={`reservation-card status-${r.estado.toLowerCase()}`}>
                                                <div className="reservation-card-head">
                                                    <strong>ID #{r.id}</strong>
                                                    <span>{r.estado}</span>
                                                </div>
                                                <dl>
                                                    <div><dt>Cliente</dt><dd>{r.cliente}</dd></div>
                                                    <div><dt>Precio</dt><dd>{moneyFmt.format(r.precio || 0)}</dd></div>
                                                    <div><dt>Horario</dt><dd>{r.horaInicio} – {r.horaFin}</dd></div>
                                                    <div><dt>Pago</dt><dd>{r.pago ? 'Recibido' : 'Pendiente'}</dd></div>
                                                </dl>
                                                <div className="reservation-actions">
                                                    {r.estado !== 'Confirmada' && <button onClick={() => updateReservaEstado(r.id, 'Confirmada')}>Confirmar</button>}
                                                    {r.estado !== 'Cancelada'  && <button className="danger" onClick={() => updateReservaEstado(r.id, 'Cancelada')}>Cancelar</button>}
                                                </div>
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    </section>
                )}

                {/* ── CANCHAS ── */}
                {activeSection === 'canchas' && (
                    <section className="admin-panel">
                        {/* Vista operacional de canchas */}
                        <div className="data-table" style={{ marginBottom: 32 }}>
                            <h3 style={{ margin: '0 0 16px', color: 'var(--text-primary)', fontWeight: 800 }}>Estado de canchas</h3>
                            <table>
                                <thead><tr><th>ID</th><th>Nombre</th><th>Tipo</th><th>Duración máx.</th><th>Precio/h</th><th>Estado</th></tr></thead>
                                <tbody>
                                    {canchas.map(c => (
                                        <tr key={c.id}>
                                            <td>#{c.id}</td>
                                            <td>{c.superficie}</td>
                                            <td>{c.tipoCancha || '—'}</td>
                                            <td>{c.duracionMaximaMinutos || 60} min</td>
                                            <td>{moneyFmt.format(c.precioHora || 4500)}</td>
                                            <td><span className={`pill ${c.estado === 'Disponible' ? 'success' : 'danger'}`}>{c.estado}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Panel de bloqueos de mantenimiento */}
                        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 24 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h3 style={{ margin: 0, color: 'var(--text-primary)', fontWeight: 800 }}>
                                    Bloqueos de Mantenimiento
                                </h3>
                                <button
                                    id="btn-nuevo-bloqueo"
                                    className="primary-action"
                                    onClick={() => { setShowBloqueoForm(v => !v); fetchBloqueos(); }}
                                >
                                    {showBloqueoForm ? 'Cancelar' : '+ Bloquear horario'}
                                </button>
                            </div>

                            {showBloqueoForm && (
                                <form className="admin-form" onSubmit={handleCrearBloqueo} style={{ marginBottom: 24 }}>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 12 }}>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Cancha</label>
                                            <select
                                                id="select-cancha-bloqueo"
                                                value={bloqueoForm.canchaId}
                                                onChange={e => setBloqueoForm(f => ({ ...f, canchaId: e.target.value }))}
                                                required
                                            >
                                                <option value="">Selecciona la cancha...</option>
                                                {canchas.map(c => (
                                                    <option key={c.id} value={c.id}>{c.superficie} ({c.tipoCancha || 'Cancha'})</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Motivo</label>
                                            <input
                                                type="text"
                                                placeholder="Ej: Reparacion del cesped"
                                                value={bloqueoForm.motivo}
                                                onChange={e => setBloqueoForm(f => ({ ...f, motivo: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Inicio del bloqueo</label>
                                            <input
                                                id="input-bloqueo-inicio"
                                                type="datetime-local"
                                                value={bloqueoForm.fechaHoraInicio}
                                                onChange={e => setBloqueoForm(f => ({ ...f, fechaHoraInicio: e.target.value }))}
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label style={{ fontSize: '0.78rem', color: '#8ca092', fontWeight: 700, display: 'block', marginBottom: 4 }}>Fin del bloqueo</label>
                                            <input
                                                id="input-bloqueo-fin"
                                                type="datetime-local"
                                                value={bloqueoForm.fechaHoraFin}
                                                onChange={e => setBloqueoForm(f => ({ ...f, fechaHoraFin: e.target.value }))}
                                                required
                                            />
                                        </div>
                                    </div>
                                    <button type="submit" className="primary-action" style={{ marginTop: 8 }}>
                                        Crear bloqueo de mantenimiento
                                    </button>
                                </form>
                            )}

                            {loadingBloqueos ? (
                                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem' }}>Cargando bloqueos...</p>
                            ) : (
                                <div className="data-table">
                                    <table>
                                        <thead><tr><th>ID</th><th>Cancha</th><th>Inicio</th><th>Fin</th><th>Motivo</th><th>Estado</th><th>Acciones</th></tr></thead>
                                        <tbody>
                                            {bloqueos.length === 0 && (
                                                <tr><td colSpan="7" style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '20px 0' }}>No hay bloqueos registrados.</td></tr>
                                            )}
                                            {bloqueos.map(b => (
                                                <tr key={b.id}>
                                                    <td>#{b.id}</td>
                                                    <td>{canchas.find(c => c.id === b.canchaId)?.superficie || `#${b.canchaId}`}</td>
                                                    <td>{new Date(b.fechaHoraInicio).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td>{new Date(b.fechaHoraFin).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}</td>
                                                    <td>{b.motivo}</td>
                                                    <td><span className={`pill ${b.estado === 'Activo' ? 'danger' : 'neutral'}`}>{b.estado}</span></td>
                                                    <td className="table-actions">
                                                        {b.estado === 'Activo' && (
                                                            <button
                                                                className="danger"
                                                                onClick={() => handleDesactivarBloqueo(b.id)}
                                                            >
                                                                Liberar
                                                            </button>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </section>
                )}

                {/* ── PAGOS Y RECIBOS ── */}
                {activeSection === 'pagos' && (
                    <section className="admin-panel">
                        <div className="pagos-tabs">
                            <button className={cobroTab === 'cobros'  ? 'active' : ''} onClick={() => setCobroTab('cobros')}>📋 Cobros</button>
                            <button className={cobroTab === 'recibos' ? 'active' : ''} onClick={() => setCobroTab('recibos')}>🧾 Recibos</button>
                        </div>

                        {cobroTab === 'cobros' && (
                            <>
                                <div className="metric-grid" style={{ marginTop: 16 }}>
                                    <article><span>Total cobros</span><strong>{cobros.length}</strong></article>
                                    <article><span>Cobrado</span><strong style={{ color: 'var(--accent)' }}>{moneyFmt.format(totalCobrado)}</strong></article>
                                    <article><span>Pendiente</span><strong style={{ color: 'var(--warning)' }}>{moneyFmt.format(totalPendiente)}</strong></article>
                                </div>

                                <div className="section-actions">
                                    <button className="primary-action" onClick={() => { setEditingCobro(null); setCobroForm({ concepto: '', monto: '', descuento: 0, estado: 'Pendiente', metodoPago: '' }); setShowCobroForm(v => !v); }}>
                                        {showCobroForm ? 'Cancelar' : '+ Nuevo cobro'}
                                    </button>
                                </div>

                                {showCobroForm && (
                                    <form className="admin-form cobro-form" onSubmit={handleSaveCobro}>
                                        <input placeholder="Concepto" value={cobroForm.concepto} onChange={e => setCobroForm(f => ({ ...f, concepto: e.target.value }))} required />
                                        <input type="number" min="0" placeholder="Monto" value={cobroForm.monto} onChange={e => setCobroForm(f => ({ ...f, monto: e.target.value }))} required />
                                        <input type="number" min="0" placeholder="Descuento" value={cobroForm.descuento} onChange={e => setCobroForm(f => ({ ...f, descuento: e.target.value }))} />
                                        <select value={cobroForm.estado} onChange={e => setCobroForm(f => ({ ...f, estado: e.target.value }))}>
                                            <option value="Pendiente">Pendiente</option>
                                            <option value="Pagado">Pagado</option>
                                            <option value="Rechazado">Rechazado</option>
                                        </select>
                                        <button type="submit" className="primary-action">Guardar cobro</button>
                                    </form>
                                )}

                                <div className="data-table">
                                    <table>
                                        <thead><tr><th>ID</th><th>Concepto</th><th>Total</th><th>Estado</th><th>Acciones</th></tr></thead>
                                        <tbody>
                                            {cobros.map(c => (
                                                <tr key={c.id}>
                                                    <td>#{c.id}</td>
                                                    <td>{c.concepto}</td>
                                                    <td style={{ fontWeight: 700 }}>{moneyFmt.format(c.montoFinal)}</td>
                                                    <td><span className={`pill ${estadoPill(c.estado)}`}>{c.estado}</span></td>
                                                    <td className="table-actions">
                                                        {c.estado === 'Pendiente' && <button onClick={() => handlePagarCobro(c)}>💳 Pagar</button>}
                                                        <button onClick={() => handlePrintCobro(c)}>🖨️</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </>
                        )}

                        {cobroTab === 'recibos' && (
                            <div className="data-table" style={{ marginTop: 16 }}>
                                <table>
                                    <thead><tr><th>N° Recibo</th><th>Cobro</th><th>Fecha</th><th>Detalles</th><th>Acciones</th></tr></thead>
                                    <tbody>
                                        {recibosList.map(r => (
                                            <tr key={r.id}>
                                                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{r.numero}</td>
                                                <td>#{r.cobroId}</td>
                                                <td>{new Date(r.fechaEmision).toLocaleDateString()}</td>
                                                <td>{r.datos}</td>
                                                <td className="table-actions">
                                                    <button onClick={() => handlePrintRecibo(r)}>🖨️ Imprimir</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </section>
                )}

                {/* ── SOLICITUDES KYC ── */}
                {activeSection === 'kyc' && (
                    <section className="admin-panel">
                        <div className="data-table">
                            <table>
                                <thead>
                                    <tr>
                                        <th>ID</th>
                                        <th>Nombre</th>
                                        <th>DNI</th>
                                        <th>Email</th>
                                        <th>Puesto Solicitado</th>
                                        <th>Documento</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingKycUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#8ca092' }}>
                                                No hay solicitudes pendientes (KYC).
                                            </td>
                                        </tr>
                                    ) : (
                                        pendingKycUsers.map(u => {
                                            const { role, pdfUrl } = getKycDetails(u.certificadoPdf);
                                            const fullUrl = pdfUrl.startsWith('http') ? pdfUrl : `http://localhost:5071${pdfUrl}`;
                                            return (
                                                <tr key={u.id}>
                                                    <td>#{u.id}</td>
                                                    <td>{u.nombre} {u.apellido}</td>
                                                    <td>{u.dni}</td>
                                                    <td>{u.email}</td>
                                                    <td>
                                                        <span className="pill neutral" style={{ fontWeight: 'bold', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                                                            {role}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="pill success">
                                                            📄 Ver PDF
                                                        </a>
                                                    </td>
                                                    <td className="table-actions">
                                                        <button onClick={() => handleKycAction(u, role, true)}>Aprobar</button>
                                                        <button className="danger" onClick={() => handleKycAction(u, 'Usuario', false)}>Rechazar</button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {/* ── MI PERFIL ── */}
                {activeSection === 'perfil' && (
                    <section className="admin-panel" style={{ display: 'grid', gap: '20px' }}>
                        <div className="profile-premium-card" style={{ marginTop: 0 }}>
                            <div className="profile-avatar-row">
                                <div className="profile-avatar-circle">
                                    {user?.fotoPerfil ? (
                                        <img src={user.fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        user?.nombre?.[0] || 'E'
                                    )}
                                </div>
                                <div className="profile-avatar-meta">
                                    <h4>Foto de perfil</h4>
                                    <p>Personaliza tu avatar en el panel de empleado</p>
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
                    </section>
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
            </section>
            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />
        </main>
    );
}
