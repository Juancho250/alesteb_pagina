import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

// ============================================
// 🔐 MAPA DE PERMISOS POR ROL
// ============================================
const ROLE_PERMISSIONS = {
  admin: [
    "user.read", "user.create", "user.update", "user.delete",
    "sale.create", "sale.read", "sale.delete", "sale.update",
    "product.create", "product.read", "product.update", "product.delete",
    "category.create", "category.read", "category.update", "category.delete",
    "provider.read", "provider.create", "provider.update",
    "expense.create", "expense.read",
    "discount.create", "discount.read", "discount.update",
    "banner.create", "banner.read", "banner.update",
    "role.read", "role.update",
    "report.read",
  ],
  gerente: [
    "user.read",
    "sale.create", "sale.read", "sale.update",
    "product.read", "product.update",
    "category.read",
    "provider.read",
    "expense.create", "expense.read",
    "discount.read",
    "banner.read",
    "report.read",
  ],
  cliente: [
    "sale.create",   // Puede crear órdenes online (checkout)
    "sale.my.read",  // Puede ver SUS propias órdenes
    "sale.my.cancel", // Puede cancelar sus propios pedidos pending
    "product.read",
    "category.read",
  ],
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restaurar sesión guardada al cargar la app
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    }
    setLoading(false);
  }, []);

  // ============================================
  // ✅ LOGIN (guarda en estado y localStorage)
  // ============================================
  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  // Alias para compatibilidad con Auth.jsx
  const loginWithToken = login;

  // ============================================
  // 🚪 LOGOUT
  // ============================================
  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  // ============================================
  // 🔑 VERIFICACIÓN DE PERMISOS MEJORADA
  // Uso básico: can('sale.read') → true | false
  // Uso con ownership: can('sale.my.read', userId) → verifica si es dueño
  // ============================================
  const can = useCallback(
    (permission, resourceOwnerId = null) => {
      if (!user) return false;
      const userRoles = user.roles || [];

      // Caso especial: permisos "my.*" - verificar ownership
      if (permission.includes('.my.') && resourceOwnerId !== null) {
        // El usuario puede acceder si:
        // 1. Es el dueño del recurso
        // 2. Es admin o gerente (pueden ver todo)
        const isOwner = user.id === resourceOwnerId;
        const isPrivileged = userRoles.includes('admin') || userRoles.includes('gerente');
        
        return isOwner || isPrivileged;
      }

      // Verificación normal de permisos por rol
      return userRoles.some((role) => {
        const perms = ROLE_PERMISSIONS[role] || [];
        return perms.includes(permission);
      });
    },
    [user]
  );

  // Shortcut para verificar si el usuario es admin
  const isAdmin = user?.roles?.includes("admin") ?? false;
  const isGerente = user?.roles?.includes("gerente") ?? false;
  const isCliente = user?.roles?.includes("cliente") ?? false;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithToken,
        logout,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isGerente,
        isCliente,
        can,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};