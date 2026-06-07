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
