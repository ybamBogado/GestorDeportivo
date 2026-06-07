import { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

const STORAGE_KEY = 'ticket_user';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (parsed && typeof parsed === 'object' && parsed.email) {
                    if (parsed.fotoPerfil && !parsed.fotoPerfil.startsWith('data:') && !parsed.fotoPerfil.startsWith('http://') && !parsed.fotoPerfil.startsWith('https://')) {
                        const backendBase = 'http://localhost:5071';
                        parsed.fotoPerfil = `${backendBase}${parsed.fotoPerfil}`;
                    }
                    if (parsed.certificadoPdf && !parsed.certificadoPdf.startsWith('data:') && !parsed.certificadoPdf.startsWith('http://') && !parsed.certificadoPdf.startsWith('https://')) {
                        const backendBase = 'http://localhost:5071';
                        parsed.certificadoPdf = `${backendBase}${parsed.certificadoPdf}`;
                    }
                    return parsed;
                }
                localStorage.removeItem(STORAGE_KEY);
                return null;
            } catch {
                localStorage.removeItem(STORAGE_KEY);
                return null;
            }
        }
        return null;
    });
    const [loading, setLoading] = useState(false);


    const login = (userData) => {
        if (userData && userData.fotoPerfil && !userData.fotoPerfil.startsWith('data:') && !userData.fotoPerfil.startsWith('http://') && !userData.fotoPerfil.startsWith('https://')) {
            const backendBase = 'http://localhost:5071';
            userData.fotoPerfil = `${backendBase}${userData.fotoPerfil}`;
        }
        if (userData && userData.certificadoPdf && !userData.certificadoPdf.startsWith('data:') && !userData.certificadoPdf.startsWith('http://') && !userData.certificadoPdf.startsWith('https://')) {
            const backendBase = 'http://localhost:5071';
            userData.certificadoPdf = `${backendBase}${userData.certificadoPdf}`;
        }
        setUser(userData);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(userData));
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem(STORAGE_KEY);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
