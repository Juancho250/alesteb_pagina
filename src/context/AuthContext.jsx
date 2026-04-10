/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useState } from "react";

const AuthContext = createContext();

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
    "sale.create",
    "sale.my.read",
    "sale.my.cancel",
    "product.read",
    "category.read",
  ],
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");
    if (!storedUser || !storedToken) return null;
    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      return null;
    }
  });

  const login = useCallback((userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const loginWithToken = login;

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedData) => {
    setUser(prev => {
      const merged = { ...prev, ...updatedData };
      localStorage.setItem("user", JSON.stringify(merged));
      return merged;
    });
  }, []);

  const can = useCallback(
    (permission, resourceOwnerId = null) => {
      if (!user) return false;
      const userRoles = user.roles || [];

      if (permission.includes(".my.") && resourceOwnerId !== null) {
        const isOwner = user.id === resourceOwnerId;
        const isPrivileged = userRoles.includes("admin") || userRoles.includes("gerente");
        return isOwner || isPrivileged;
      }

      return userRoles.some((role) => {
        const perms = ROLE_PERMISSIONS[role] || [];
        return perms.includes(permission);
      });
    },
    [user]
  );

  const isAdmin   = user?.roles?.includes("admin")   ?? false;
  const isGerente = user?.roles?.includes("gerente") ?? false;
  const isCliente = user?.roles?.includes("cliente") ?? false;
  const loading   = false;

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithToken,
        logout,
        updateUser,
        loading,
        isAuthenticated: !!user,
        isAdmin,
        isGerente,
        isCliente,
        can,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};