import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import Swal from "sweetalert2";
import axiosInstance from "../util/axiosConfig";
import { cerrarSesionLocal, obtenerExpiracionToken, tokenExpirado } from "../util/sesion";

const AuthContext = createContext();

// Campos del usuario en el contexto → clave en localStorage
const CLAVE_LOCAL = {
  token: "token",
  role: "userRole",
  _id: "userId",
  nombre: "userName",
  correo: "userEmail",
  permisos: "permisos",
  fotoUrl: "userFoto",
};

const guardarUsuarioLocal = (datos) => {
  Object.entries(datos).forEach(([campo, valor]) => {
    const clave = CLAVE_LOCAL[campo];
    if (!clave || valor === undefined || valor === null) return;
    localStorage.setItem(clave, campo === "permisos" ? JSON.stringify(valor) : String(valor));
  });
};

const leerUsuarioLocal = () => {
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("userRole");
  const userId = localStorage.getItem("userId");

  if (!token || !role || !userId || userId === "undefined") return null;

  let permisos = [];
  try {
    permisos = JSON.parse(localStorage.getItem("permisos") || "[]");
  } catch {
    permisos = [];
  }

  return {
    token,
    role: role.toLowerCase(),
    _id: userId,
    nombre: localStorage.getItem("userName") || "",
    correo: localStorage.getItem("userEmail") || "",
    fotoUrl: localStorage.getItem("userFoto") || "",
    permisos,
  };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const temporizadorExpiracion = useRef(null);

  const limpiarTemporizador = () => {
    if (temporizadorExpiracion.current) {
      clearTimeout(temporizadorExpiracion.current);
      temporizadorExpiracion.current = null;
    }
  };

  const logout = useCallback(() => {
    limpiarTemporizador();
    cerrarSesionLocal();
    setUser(null);
  }, []);

  // Cerrar la sesión automáticamente cuando el token expire
  const programarExpiracion = useCallback(
    (token) => {
      limpiarTemporizador();
      const expiracion = obtenerExpiracionToken(token);
      if (!expiracion) return;

      // setTimeout no admite esperas mayores a ~24,8 días
      const espera = Math.min(expiracion - Date.now(), 2147483647);
      temporizadorExpiracion.current = setTimeout(() => {
        logout();
        Swal.fire({
          icon: "info",
          title: "Sesión expirada",
          text: "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          confirmButtonText: "Entendido",
        });
      }, Math.max(espera, 0));
    },
    [logout],
  );

  // Consulta al backend los datos y permisos actuales del usuario.
  // Si el token no es válido, el interceptor de axios cierra la sesión.
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      const response = await axiosInstance.get("/auth/user");
      const { role, _id, nombre, correo, permisos, fotoUrl } = response.data;

      const actualizado = {
        token,
        role: (role || "").toLowerCase(),
        _id,
        nombre,
        correo,
        fotoUrl: fotoUrl || "",
        permisos: permisos || [],
      };

      guardarUsuarioLocal(actualizado);
      setUser(actualizado);
    } catch (error) {
      // Sin conexión o servidor dormido (Render tarda en despertar):
      // se mantiene la sesión guardada y se reintentará en la próxima carga.
      if (!error.response) {
        console.warn("No se pudo validar la sesión con el servidor:", error.message);
      }
    }
  }, []);

  const refreshUser = fetchUserData;

  useEffect(() => {
    const guardado = leerUsuarioLocal();

    if (guardado && !tokenExpirado(guardado.token)) {
      setUser(guardado);
      programarExpiracion(guardado.token);
      // Validar en segundo plano que la sesión siga activa (cuenta, rol y permisos)
      fetchUserData();
    } else if (guardado || localStorage.getItem("token")) {
      // Sesión vencida o incompleta: limpiarla
      cerrarSesionLocal();
    }

    setLoading(false);
    return limpiarTemporizador;
  }, [fetchUserData, programarExpiracion]);

  const login = (userData) => {
    const { token, role, _id, nombre, correo, permisos } = userData;

    const nuevo = {
      token,
      role: role ? role.toLowerCase() : "",
      _id,
      nombre,
      correo,
      permisos: permisos || [],
    };

    guardarUsuarioLocal(nuevo);
    setUser(nuevo);
    programarExpiracion(token);
  };

  const updateUser = (updatedUserData) => {
    setUser((prevUser) => {
      const updatedUser = {
        ...prevUser,
        ...updatedUserData,
      };
      guardarUsuarioLocal(updatedUserData);
      return updatedUser;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        updateUser,
        fetchUserData,
        refreshUser,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
