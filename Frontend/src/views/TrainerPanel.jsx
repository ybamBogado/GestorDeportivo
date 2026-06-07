import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from '../components/Toast.jsx';
import { users as usersApi } from '../services/api.js';
import ConfirmModal from '../components/ConfirmModal.jsx';
import './TrainerPanel.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5071/api/v1';

export default function TrainerPanel() {
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

    const [activeSection, setActiveSection] = useState('clases');
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileForm, setProfileForm] = useState({
        nombre: '', apellido: '', dni: '', email: '', telefono: '', direccion: ''
    });
    const [editingField, setEditingField] = useState(null);
    const [tempValue, setTempValue] = useState({
        nombre: '', apellido: '', dni: '', email: '', telefono: '', direccion: ''
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
                    rol: user.rol || 'Entrenador',
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

    const [clases, setClases] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedClaseId, setSelectedClaseId] = useState(null);
    const [claseDetails, setClaseDetails] = useState(null);

    const fetchClases = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/clases`);
            if (res.ok) {
                const data = await res.json();
                // Filter classes where the professor name matches or professorId matches
                // Check user name matches or if backend returns profesorId matching user.id
                const myClases = data.filter(c => 
                    c.profesorId === user.id || 
                    c.profesor?.toLowerCase().includes(user.nombre?.toLowerCase())
                );
                setClases(myClases);
            }
        } catch (error) {
            notify('Error al cargar clases: ' + error.message, 'error');
        } finally {
            setLoading(false);
        }
    }, [user, notify]);

    useEffect(() => {
        if (authLoading) return;
        if (!user || (user.rol !== 'Profesor' && user.rol !== 'Entrenador' && user.rol !== 'Administrador')) {
            navigate('/');
        }
    }, [user, authLoading, navigate]);

    useEffect(() => {
        fetchClases();
    }, [fetchClases]);

    const loadClaseDetails = async (id) => {
        try {
            const res = await fetch(`${API_URL}/clases/${id}`);
            if (res.ok) {
                setClaseDetails(await res.json());
                setSelectedClaseId(id);
            }
        } catch (error) {
            notify('Error al cargar alumnos: ' + error.message, 'error');
        }
    };

    const handleToggleAsistencia = async (usuarioId, currentPresent) => {
        try {
            const res = await fetch(`${API_URL}/clases/${selectedClaseId}/asistencias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usuarioId: Number(usuarioId),
                    presente: !currentPresent
                })
            });
            if (res.ok) {
                notify('Asistencia actualizada', 'success');
                loadClaseDetails(selectedClaseId);
            } else {
                notify('Error al actualizar asistencia', 'error');
            }
        } catch (error) {
            notify('Error: ' + error.message, 'error');
        }
    };

    const formatLocalDateTime = (isoString) => {
        if (!isoString) return '—';
        return new Date(isoString).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
    };

    const hasCert = user?.certificacion ?? user?.certificado ?? false;
    const certExpiry = user?.fechaVencimientoCertificacion 
        ? new Date(user.fechaVencimientoCertificacion).toLocaleDateString('es-AR')
        : 'N/A';

    return (
        <main className="admin-shell">
            <aside className="admin-sidebar">
                <div className="admin-brand">
                    <img src="/logo.png" alt="Gol Ahora" />
                    <div>
                        <strong>Gol Ahora</strong>
                        <span>Panel Deportivo</span>
                    </div>
                </div>

                <div className="admin-profile">
                    <div className="admin-avatar">
                        {user?.fotoPerfil ? (
                            <img src={user.fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.nombre?.[0] || 'P'
                        )}
                    </div>
                    <div>
                        <strong>{user?.nombre || 'Profesor'}</strong>
                        <span>{user?.rol}</span>
                    </div>
                </div>

                <nav className="admin-menu" style={{ margin: '15px 0' }}>
                    <button className={activeSection === 'clases' ? 'active' : ''} onClick={() => setActiveSection('clases')}>
                        <i className="bi bi-calendar-check me-2"></i> Mis Clases
                    </button>
                    <button className={activeSection === 'perfil' ? 'active' : ''} onClick={() => setActiveSection('perfil')}>
                        <i className="bi bi-person-circle me-2"></i> Mi Perfil
                    </button>
                </nav>

                <div className="cert-status-card" style={{ padding: 12, margin: '12px', background: 'rgba(255,255,255,0.03)', borderRadius: 8, border: `1px solid ${hasCert ? 'rgba(49,217,79,0.2)' : 'rgba(239,68,68,0.2)'}` }}>
                    <p style={{ fontSize: '0.8rem', color: '#8ca092', margin: 0, textTransform: 'uppercase' }}>Certificación Deportiva</p>
                    <strong style={{ color: hasCert ? '#31d94f' : '#ef4444', fontSize: '0.9rem' }}>
                        {hasCert ? '✓ VERIFICADA' : '✗ PENDIENTE / VENCIDA'}
                    </strong>
                    {hasCert && <p style={{ fontSize: '0.75rem', color: '#8ca092', margin: '4px 0 0 0' }}>Vence: {certExpiry}</p>}
                </div>

                <div className="admin-sidebar-footer" style={{ marginTop: 'auto' }}>
                    <button className="admin-theme-btn" onClick={toggleTheme}>
                        {theme === 'dark' ? '☀ Modo claro' : '☾ Modo oscuro'}
                    </button>
                    <button className="admin-logout" onClick={() => { logout(); navigate('/'); }}>
                        Cerrar sesión
                    </button>
                </div>
            </aside>

            <section className="admin-main">
                <header className="admin-topbar">
                    <div>
                        <p>Gestión Deportiva ({user?.rol})</p>
                        <h1>{activeSection === 'clases' ? 'Mis Clases y Entrenamientos' : 'Mi Perfil'}</h1>
                    </div>
                    {activeSection === 'clases' && <button className="ghost-button" onClick={fetchClases}>↻ Actualizar</button>}
                </header>

                <section className="admin-panel" style={{ display: 'grid', gap: '20px' }}>
                    {activeSection === 'clases' && (
                        <>
                            {loading ? (
                                <div className="empty-state">Cargando mis clases...</div>
                            ) : clases.length === 0 ? (
                                <div className="empty-state">No tienes clases o entrenamientos grupales asignados.</div>
                            ) : (
                                <div className="data-table">
                                    <table>
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Clase / Tipo</th>
                                                <th>Fecha / Hora</th>
                                                <th>Cancha</th>
                                                <th>Inscriptos</th>
                                                <th>Capacidad Máx</th>
                                                <th>Estado</th>
                                                <th>Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {clases.map(c => (
                                                <tr key={c.id} className={selectedClaseId === c.id ? 'active-row' : ''} style={selectedClaseId === c.id ? { background: 'rgba(49, 217, 79, 0.05)' } : {}}>
                                                    <td>#{c.id}</td>
                                                    <td style={{ fontWeight: 700 }}>{c.tipo}</td>
                                                    <td>{formatLocalDateTime(c.fechaHora)}</td>
                                                    <td>{c.cancha}</td>
                                                    <td>{c.alumnos}</td>
                                                    <td>{c.capacidadMax}</td>
                                                    <td>
                                                        <span className={`pill ${c.estado === 'Programada' ? 'success' : 'danger'}`}>
                                                            {c.estado}
                                                        </span>
                                                    </td>
                                                    <td className="table-actions">
                                                        <button onClick={() => loadClaseDetails(c.id)}>👥 Alumnos & Asistencia</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {selectedClaseId && claseDetails && (
                                <div style={{ marginTop: 20, padding: 20, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(149, 255, 172, 0.08)', borderRadius: 8 }}>
                                    <h3>Asistencia de Alumnos — Clase: <span style={{ color: '#31d94f' }}>{claseDetails.tipo}</span></h3>
                                    <div className="data-table" style={{ marginTop: 12 }}>
                                        <table>
                                            <thead>
                                                <tr>
                                                    <th>Nombre</th>
                                                    <th>Email</th>
                                                    <th>Asistencia</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {claseDetails.asistencias?.length === 0 ? (
                                                    <tr>
                                                        <td colSpan="3" style={{ textAlign: 'center', padding: 12, color: '#8ca092' }}>No hay alumnos inscritos.</td>
                                                    </tr>
                                                ) : (
                                                    claseDetails.asistencias?.map(a => (
                                                        <tr key={a.id}>
                                                            <td>{a.usuario?.nombre} {a.usuario?.apellido}</td>
                                                            <td>{a.usuario?.email}</td>
                                                            <td>
                                                                <label className="check-field" style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={a.presente}
                                                                        onChange={() => handleToggleAsistencia(a.usuarioId, a.presente)}
                                                                        style={{ width: 18, height: 18 }}
                                                                    />
                                                                    <span style={{ color: a.presente ? '#31d94f' : '#ef4444', fontWeight: 'bold' }}>
                                                                        {a.presente ? 'Presente' : 'Ausente'}
                                                                    </span>
                                                                </label>
                                                            </td>
                                                        </tr>
                                                    ))
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </>
                    )}

                    {activeSection === 'perfil' && (
                        <div className="profile-premium-card" style={{ marginTop: 0 }}>
                            <div className="profile-avatar-row">
                                <div className="profile-avatar-circle">
                                    {user?.fotoPerfil ? (
                                        <img src={user.fotoPerfil} alt="Avatar" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                    ) : (
                                        user?.nombre?.[0] || 'P'
                                    )}
                                </div>
                                <div className="profile-avatar-meta">
                                    <h4>Foto de perfil</h4>
                                    <p>Personaliza tu avatar en el panel deportivo</p>
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
            </section>
        </main>
    );
}
