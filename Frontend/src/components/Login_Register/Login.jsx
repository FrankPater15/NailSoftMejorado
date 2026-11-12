import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import { API_URL } from "../../config/api";
import { useAuth } from "../../context/AuthContext";
import { AuthShell, AlertaError, CampoTexto, CampoPassword, BotonPrincipal } from "./auth/AuthUI";

// Página de inicio según el rol
const rutaInicial = (role = "") => (role.toLowerCase() === "cliente" ? "/" : "/dashboard");

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login, user, loading: cargandoSesion } = useAuth();

  // Si ya hay una sesión activa, no mostrar el formulario
  useEffect(() => {
    if (!cargandoSesion && user?.token) {
      navigate(rutaInicial(user.role), { replace: true });
    }
  }, [cargandoSesion, user, navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/auth/login`, { email, password });
      const { token, role, permisos, user } = response.data;

      if (!token || !role || !user) {
        throw new Error("Respuesta incompleta del servidor");
      }

      login({
        token,
        role,
        _id: user.id || user._id,
        nombre: user.name || user.nombre,
        correo: user.email || user.correo,
        permisos: permisos || [],
      });

      navigate(rutaInicial(role), { replace: true });
    } catch (error) {
      if (error.response?.data?.cuentaInactiva) {
        Swal.fire({
          icon: "error",
          title: "Cuenta inactiva",
          text: "Tu cuenta ha sido desactivada. Por favor, contacta al administrador para reactivarla.",
          confirmButtonText: "Entendido",
        });
      } else if (error.response?.data?.rolDesactivado) {
        Swal.fire({
          icon: "error",
          title: "Acceso denegado",
          text: "Tu rol ha sido desactivado. Contacta al administrador.",
          confirmButtonText: "Entendido",
        });
      } else if (!error.response && error.request) {
        setError("No se pudo conectar con el servidor. Si es la primera visita del día, espera unos segundos y vuelve a intentarlo.");
      } else {
        setError(error.response?.data?.message || "Credenciales inválidas. Por favor, intenta de nuevo.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      titulo="¡Bienvenido de nuevo!"
      subtitulo="Ingresa con tu correo y contraseña para continuar."
      panelTitulo="Belleza y elegancia"
      panelTexto="Descubre un mundo de belleza y profesionalismo en tus manos."
      pie={
        <p>
          ¿No tienes cuenta?{" "}
          <Link to="/register" className="auth-link">
            Crear cuenta
          </Link>
        </p>
      }
    >
      <AlertaError>{error}</AlertaError>

      <form onSubmit={handleLogin} className="auth-form">
        <CampoTexto
          id="email"
          label="Correo electrónico"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          placeholder="tucorreo@ejemplo.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        <CampoPassword
          id="password"
          label="Contraseña"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <div className="auth-row-end">
          <Link to="/forgot-password" className="auth-link">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>

        <BotonPrincipal cargando={loading} textoCargando="Ingresando...">
          Iniciar sesión
        </BotonPrincipal>
      </form>
    </AuthShell>
  );
}
