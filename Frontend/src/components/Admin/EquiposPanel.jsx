import { useState, useEffect } from 'react';
import { equipos as equiposApi, users as usersApi } from '../../services/api.js';
import ConfirmModal from '../ConfirmModal.jsx';
import './EquiposPanel.css';

export default function EquiposPanel({ setMessage }) {
    const [items, setItems] = useState([]);
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [confirmConfig, setConfirmConfig] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({ nombre: '', categoria: 'Primera', estado: 'Activo', capitanId: null });
    const [editingId, setEditingId] = useState(null);
    const [editForm, setEditForm] = useState({});

    const load = async () => {
        setLoading(true);
        try {
            const [e, u] = await Promise.all([
                equiposApi.getAll(),
                usersApi.getAll()
            ]);
            setItems(e);
            setUsuarios(u);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

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

    const handleCreate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await equiposApi.create({
                nombre: form.nombre,
                categoria: form.categoria,
                estado: form.estado,
                capitanId: form.capitanId ? Number(form.capitanId) : null
            });
            setSuccess('Equipo creado exitosamente');
            setShowForm(false);
            setForm({ nombre: '', categoria: 'Primera', estado: 'Activo', capitanId: null });
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleEdit = (item) => {
        setEditingId(item.id);
        setEditForm({
            id: item.id,
            nombre: item.nombre,
            categoria: item.categoria,
            estado: item.estado,
            capitanId: item.capitanId || null
        });
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await equiposApi.update(editForm.id, {
                nombre: editForm.nombre,
                categoria: editForm.categoria,
                estado: editForm.estado,
                capitanId: editForm.capitanId ? Number(editForm.capitanId) : null
            });
            setSuccess('Equipo actualizado exitosamente');
            setEditingId(null);
            load();
        } catch (e) {
            setError(e.message);
        }
    };

    const handleDelete = (id) => {
        showConfirm('¿Estás seguro de eliminar este equipo? Esta acción no se puede deshacer.', () => {
            equiposApi.remove(id)
                .then(() => {
                    setSuccess('Equipo eliminado');
                    load();
                })
                .catch(e => setError(e.message));
        }, 'Eliminar equipo');
    };

    if (loading) return <div className="equipos-panel">Cargando equipos...</div>;

    return (
        <div className="equipos-panel">
            {error && <div className="equipos-msg equipos-msg--error">{error}</div>}
            {success && <div className="equipos-msg equipos-msg--success">{success}</div>}

            <div className="equipos-toolbar">
                <h3><i className="bi bi-people-fill"></i> Gestión de Equipos</h3>
                <button className="btn-nuevo" onClick={() => { setShowForm(!showForm); setEditingId(null); }}>
                    {showForm ? 'Cancelar' : <><i className="bi bi-plus-lg"></i> Nuevo Equipo</>}
                </button>
            </div>

            {showForm && (
                <form className="equipo-form" onSubmit={handleCreate}>
                    <div className="equipo-form__grid">
                        <div className="eq-field">
                            <label>Nombre</label>
                            <input
                                type="text"
                                value={form.nombre}
                                onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                                required
                            />
                        </div>
                        <div className="eq-field">
                            <label>Categoría</label>
                            <select value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}>
                                <option>Primera</option>
                                <option>Segunda</option>
                                <option>Tercera</option>
                                <option>Libre</option>
                            </select>
                        </div>
                        <div className="eq-field">
                            <label>Estado</label>
                            <select value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}>
                                <option>Activo</option>
                                <option>Inactivo</option>
                                <option>Suspendido</option>
                            </select>
                        </div>
                        <div className="eq-field">
                            <label>Capitán</label>
                            <select value={form.capitanId || ''} onChange={e => setForm(f => ({ ...f, capitanId: e.target.value || null }))}>
                                <option value="">Sin asignar</option>
                                {usuarios.map(u => (
                                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button type="submit" className="btn-submit">Crear Equipo</button>
                </form>
            )}

            <div className="equipos-lista">
                {items.length === 0 ? (
                    <div className="equipos-empty">No hay equipos registrados</div>
                ) : (
                    items.map(equipo => (
                        <div key={equipo.id} className="equipo-card">
                            {editingId === equipo.id ? (
                                <form className="equipo-edit" onSubmit={handleUpdate}>
                                    <input
                                        type="text"
                                        value={editForm.nombre}
                                        onChange={e => setEditForm(f => ({ ...f, nombre: e.target.value }))}
                                        required
                                    />
                                    <select value={editForm.categoria} onChange={e => setEditForm(f => ({ ...f, categoria: e.target.value }))}>
                                        <option>Primera</option>
                                        <option>Segunda</option>
                                        <option>Tercera</option>
                                        <option>Libre</option>
                                    </select>
                                    <select value={editForm.estado} onChange={e => setEditForm(f => ({ ...f, estado: e.target.value }))}>
                                        <option>Activo</option>
                                        <option>Inactivo</option>
                                        <option>Suspendido</option>
                                    </select>
                                    <select value={editForm.capitanId || ''} onChange={e => setEditForm(f => ({ ...f, capitanId: e.target.value || null }))}>
                                        <option value="">Sin asignar</option>
                                        {usuarios.map(u => (
                                            <option key={u.id} value={u.id}>{u.nombre} {u.apellido}</option>
                                        ))}
                                    </select>
                                    <div className="eq-form-actions">
                                        <button type="submit" className="btn-save">Guardar</button>
                                        <button type="button" className="btn-cancel" onClick={() => setEditingId(null)}>Cancelar</button>
                                    </div>
                                </form>
                            ) : (
                                <>
                                    <div className="equipo-header">
                                        <h4>{equipo.nombre}</h4>
                                        <span className={`estado-badge estado-${equipo.estado.toLowerCase()}`}>{equipo.estado}</span>
                                    </div>
                                    <div className="equipo-info">
                                        <p><strong>Categoría:</strong> {equipo.categoria}</p>
                                        <p><strong>Capitán:</strong> {equipo.capitan || 'Sin asignar'}</p>
                                        <p><strong>Jugadores:</strong> {equipo.jugadores}</p>
                                    </div>
                                    <div className="equipo-actions">
                                        <button className="btn-edit" onClick={() => handleEdit(equipo)}>
                                            <i className="bi bi-pencil-square"></i> Editar
                                        </button>
                                        <button className="btn-delete" onClick={() => handleDelete(equipo.id)}>
                                            <i className="bi bi-trash3"></i> Eliminar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))
                )}
            </div>

            <ConfirmModal
                isOpen={confirmConfig.isOpen}
                title={confirmConfig.title}
                message={confirmConfig.message}
                onConfirm={confirmConfig.onConfirm}
                onCancel={() => setConfirmConfig(c => ({ ...c, isOpen: false }))}
            />
        </div>
    );
}
