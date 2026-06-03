import { useState, useCallback, useEffect, useRef } from 'react';
import './Toast.css';

let externalNotify = null;

export function useToast() {
    const notify = useCallback((message, type = 'success', duration = 4000) => {
        if (externalNotify) externalNotify(message, type, duration);
    }, []);
    return { notify };
}

let idCounter = 0;

export function ToastContainer() {
    const [toasts, setToasts] = useState([]);

    useEffect(() => {
        externalNotify = (message, type, duration) => {
            const id = ++idCounter;
            setToasts(prev => [...prev, { id, message, type }]);
            setTimeout(() => {
                setToasts(prev => prev.filter(t => t.id !== id));
            }, duration);
        };
        return () => { externalNotify = null; };
    }, []);

    const remove = (id) => setToasts(prev => prev.filter(t => t.id !== id));

    return (
        <div className="toast-container" aria-live="polite">
            {toasts.map(t => (
                <div key={t.id} className={`toast toast--${t.type}`} role="alert">
                    <span className="toast-icon">
                        {t.type === 'success' ? '✓' : t.type === 'error' ? '✕' : 'ℹ'}
                    </span>
                    <span className="toast-message">{t.message}</span>
                    <button className="toast-close" onClick={() => remove(t.id)} aria-label="Cerrar">×</button>
                </div>
            ))}
        </div>
    );
}
