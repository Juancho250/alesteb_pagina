import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al cargar la app, revisamos si hay sesión guardada
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // ✅ Función Original: Iniciar Sesión (guarda en estado y localStorage)
  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  // ✅ NUEVA Función: loginWithToken (alias de login para mayor claridad)
  const loginWithToken = (userData, token) => {
    login(userData, token);
  };

  // Función para Cerrar Sesión
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    // Opcional: window.location.href = "/"; para recargar y limpiar todo
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        login, 
        loginWithToken, // ✅ Exportamos ambas funciones
        logout, 
        loading, 
        isAuthenticated: !!user 
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};