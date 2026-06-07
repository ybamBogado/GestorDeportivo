import React from 'react';

export default function ConfirmModal({ isOpen, title = 'Confirmación', message, onConfirm, onCancel }) {
    if (!isOpen) return null;
    return (
        <div className="modal fade show" style={{ display: 'block', backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1055 }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content text-white border-secondary" style={{ background: '#111d13', borderRadius: '12px' }}>
                    <div className="modal-header border-secondary">
                        <h5 className="modal-title d-flex align-items-center gap-2">
                            <i className="bi bi-exclamation-triangle-fill text-warning"></i>
                            {title}
                        </h5>
                        <button type="button" className="btn-close btn-close-white" onClick={onCancel}></button>
                    </div>
                    <div className="modal-body">
                        <p style={{ margin: 0, fontSize: '1rem', color: '#e0e5e1' }}>{message}</p>
                    </div>
                    <div className="modal-footer border-secondary">
                        <button type="button" className="btn btn-secondary" style={{ borderRadius: '8px' }} onClick={onCancel}>
                            Cancelar
                        </button>
                        <button type="button" className="btn btn-success" style={{ backgroundColor: '#28a745', border: 'none', borderRadius: '8px' }} onClick={onConfirm}>
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
