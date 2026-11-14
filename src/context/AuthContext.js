
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";

export const API_URL = "http://192.168.1.5:8000/api";

const CLAVE_TOKEN = "escalones_token";
const CLAVE_USUARIO = "escalones_usuario";

const AuthContext = createContext(null);

const mensajeError = (data, alternativo) => {
  if (data?.errors) {
    if (Array.isArray(data.errors)) {
      return data.errors.flat().join("\n");
    }

    if (typeof data.errors === "object") {
      return Object.values(data.errors).flat().join("\n");
    }
  }

  return data?.error || data?.message || alternativo;
};

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [token, setToken] = useState(null);
  const [cargandoSesion, setCargandoSesion] =
    useState(true);

  useEffect(() => {
    const recuperarSesion = async () => {
      try {
        const tokenGuardado =
          await SecureStore.getItemAsync(CLAVE_TOKEN);

        const usuarioGuardado =
          await SecureStore.getItemAsync(CLAVE_USUARIO);

        if (tokenGuardado && usuarioGuardado) {
          setToken(tokenGuardado);
          setUsuario(JSON.parse(usuarioGuardado));
        }
      } catch (error) {
        console.log("Error al recuperar sesión:", error);
      } finally {
        setCargandoSesion(false);
      }
    };

    recuperarSesion();
  }, []);

  const peticion = useCallback(
    async (ruta, opciones = {}, usarToken = false) => {
      const headers = {
        Accept: "application/json",
        ...(opciones.headers || {}),
      };

      if (usarToken) {
        if (!token) {
          throw new Error("Tenés que iniciar sesión.");
        }

        headers.Authorization = `Bearer ${token}`;
      }

      let respuesta;

      try {
        respuesta = await fetch(`${API_URL}${ruta}`, {
          ...opciones,
          headers,
        });
      } catch {
        throw new Error(
          "No se pudo conectar con el servidor. Revisá Laravel, la IP y la conexión Wi-Fi."
        );
      }

      const data = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            data,
            `Error del servidor (${respuesta.status}).`
          )
        );
      }

      return data;
    },
    [token]
  );

  const iniciarSesion = async (email, password) => {
    const data = await peticion("/iniciar-sesion", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
        password,
      }),
    });

    if (!data.token || !data.user) {
      throw new Error(
        "El servidor no devolvió los datos de la sesión."
      );
    }

    await SecureStore.setItemAsync(
      CLAVE_TOKEN,
      data.token
    );

    await SecureStore.setItemAsync(
      CLAVE_USUARIO,
      JSON.stringify(data.user)
    );

    setToken(data.token);
    setUsuario(data.user);

    return data;
  };

  const registrarse = async (
    nombre_usuario,
    email,
    password
  ) => {
    return peticion("/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        nombre_usuario: nombre_usuario.trim(),
        email: email.trim().toLowerCase(),
        password,
      }),
    });
  };

  const recuperarContrasena = async (email) => {
    return peticion("/forgot-password", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });
  };

  const actualizarPerfil = async ({
    nombre_usuario,
    apellido,
    telefono,
  }) => {
    const formData = new FormData();

    formData.append(
      "nombre_usuario",
      nombre_usuario.trim()
    );
    formData.append("apellido", apellido.trim());
    formData.append("telefono", telefono.trim());

    const resultado = await peticion(
      "/update-profile",
      {
        method: "POST",
        body: formData,
      },
      true
    );

    const usuarioActualizado = {
      ...usuario,
      nombre_usuario: nombre_usuario.trim(),
      apellido: apellido.trim(),
      telefono: telefono.trim(),
    };

    await SecureStore.setItemAsync(
      CLAVE_USUARIO,
      JSON.stringify(usuarioActualizado)
    );

    setUsuario(usuarioActualizado);
    return resultado;
  };

  const consultarImpresiones = async () => {
    return peticion("/mis-impresiones", {}, true);
  };

  const consultarReservas = async () => {
    return peticion("/mis-reservas", {}, true);
  };

  const cerrarSesion = async () => {
    await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    await SecureStore.deleteItemAsync(CLAVE_USUARIO);

    setToken(null);
    setUsuario(null);
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        token,
        autenticado: Boolean(token && usuario),
        cargandoSesion,
        iniciarSesion,
        registrarse,
        recuperarContrasena,
        actualizarPerfil,
        consultarImpresiones,
        consultarReservas,
        cerrarSesion,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const contexto = useContext(AuthContext);

  if (!contexto) {
    throw new Error(
      "useAuth debe utilizarse dentro de AuthProvider."
    );
  }

  return contexto;
};
