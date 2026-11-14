
import React, {
  useEffect,
  useRef,
  useState,
} from "react";

import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
  AppState,
} from "react-native";

import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const API = "http://192.168.1.5:8001/api";
const IMAGENES =
  "http://192.168.1.5:5173/images/services";

const AZUL = "#0071BC";
const OSCURO = "#123A57";
const GRIS = "#526473";
const FONDO = "#F4F8FB";

const PRECIO_HORA = 1000;
const MAX_BYTES = 4 * 1024 * 1024;

const SERVICIOS = [
  {
    id: "impresiones",
    titulo: "Impresiones 24 hs",
    descripcion:
      "Subí tus archivos, elegí el papel y la cantidad de copias.",
    imagen: "impresiones.jpg",
    boton: "Encargar impresión",
  },
  {
    id: "coworking",
    titulo: "Espacio coworking",
    descripcion:
      "Reservá tu lugar para estudiar, trabajar o compartir proyectos.",
    imagen: "estudio.jpg",
    boton: "Reservar espacio",
  },
  {
    id: "juegos",
    titulo: "Juegos recreativos",
    descripcion:
      "Disfrutá del pool, metegol y otras actividades.",
    imagen: "juegos.jpg",
    boton: "Reservar juego",
  },
];

const JUEGOS = [
  "Pool",
  "Metegol",
  "Ping pong",
  "Juegos de mesa",
];

const CAFE_PRECIOS = {
  "Sin café": 0,
  "Café": 1500,
  "Café express": 1800,
  "Café cortado": 1900,
  "Café con leche": 2000,
  "Capuchino": 2300,
};

const DULCES_PRECIOS = {
  "Sin adicional": 0,
  "1 medialuna": 700,
  "2 medialunas": 1300,
  "Brownie": 2500,
  "Galletita": 1200,
};

const HORARIOS = Array.from(
  { length: 24 },
  (_, i) => `${String(i).padStart(2, "0")}:00`
);

const DURACIONES = [1, 2, 3, 4];

function fechaISO(fecha) {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, "0");
  const dia = String(fecha.getDate()).padStart(2, "0");

  return `${anio}-${mes}-${dia}`;
}

function crearDias() {
  const ahora = new Date();

  return Array.from({ length: 14 }, (_, i) => {
    const fecha = new Date(
      ahora.getFullYear(),
      ahora.getMonth(),
      ahora.getDate() + i
    );

    return {
      valor: fechaISO(fecha),
      dia: fecha
        .toLocaleDateString("es-AR", {
          weekday: "short",
        })
        .replace(".", ""),
      numero: fecha.getDate(),
      mes: fecha
        .toLocaleDateString("es-AR", {
          month: "short",
        })
        .replace(".", ""),
    };
  });
}

function esFechaValida(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(valor)) {
    return false;
  }

  const [anio, mes, dia] = valor.split("-").map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  return (
    fecha.getFullYear() === anio &&
    fecha.getMonth() === mes - 1 &&
    fecha.getDate() === dia &&
    valor >= fechaISO(new Date())
  );
}

function minutos(hora) {
  const partes = String(hora).split(":").map(Number);

  if (
    partes.length < 2 ||
    !Number.isFinite(partes[0]) ||
    !Number.isFinite(partes[1])
  ) {
    return NaN;
  }

  return partes[0] * 60 + partes[1];
}

function finHorario(hora, duracion) {
  const fin = minutos(hora) + duracion * 60;

  return `${String(Math.floor(fin / 60)).padStart(
    2,
    "0"
  )}:00`;
}

function dinero(valor) {
  return `$ ${Number(valor).toLocaleString("es-AR")}`;
}

function mensajeError(datos, alternativa) {
  if (datos?.errors) {
    const mensajes = Object.values(datos.errors).flat();

    if (mensajes.length) {
      return mensajes.join("\n");
    }
  }

  return datos?.message || datos?.error || alternativa;
}

function Opcion({
  texto,
  seleccionada,
  onPress,
  deshabilitada = false,
  flexible = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.85}
      disabled={deshabilitada}
      onPress={onPress}
      style={[
        styles.opcion,
        flexible && styles.opcionFlexible,
        seleccionada && styles.opcionSeleccionada,
        deshabilitada && styles.opcionDeshabilitada,
      ]}
    >
      <Text
        style={[
          styles.opcionTexto,
          seleccionada && styles.opcionTextoSeleccionada,
        ]}
      >
        {texto}
      </Text>
    </TouchableOpacity>
  );
}

function Campo({
  titulo,
  valor,
  cambiar,
  placeholder,
  teclado = "default",
  multiline = false,
  editable = true,
}) {
  return (
    <View style={styles.grupoCampo}>
      <Text style={styles.label}>{titulo}</Text>

      <TextInput
        style={[
          styles.input,
          multiline && styles.inputGrande,
          !editable && styles.inputDeshabilitado,
        ]}
        value={valor}
        onChangeText={cambiar}
        placeholder={placeholder}
        placeholderTextColor="#94A3B0"
        keyboardType={teclado}
        autoCapitalize={
          teclado === "email-address"
            ? "none"
            : "sentences"
        }
        autoCorrect={false}
        multiline={multiline}
        editable={editable}
        textAlignVertical={
          multiline ? "top" : "center"
        }
      />
    </View>
  );
}

function Bloque({ numero, titulo, children }) {
  return (
    <View style={styles.bloque}>
      <View style={styles.bloqueEncabezado}>
        <Text style={styles.numeroPaso}>
          {numero}
        </Text>

        <Text style={styles.tituloPaso}>
          {titulo}
        </Text>
      </View>

      {children}
    </View>
  );
}

function Fila({ titulo, valor, importante = false }) {
  return (
    <View style={styles.fila}>
      <Text style={styles.filaEtiqueta}>
        {titulo}
      </Text>

      <Text
        style={[
          styles.filaValor,
          importante && styles.filaImportante,
        ]}
      >
        {String(valor)}
      </Text>
    </View>
  );
}

function Cantidad({ valor, cambiar, maximo }) {
  const numero = Number(valor) || 0;

  return (
    <View style={styles.filaCantidad}>
      <TouchableOpacity
        style={styles.botonCantidad}
        onPress={() =>
          cambiar(
            String(Math.max(1, numero - 1))
          )
        }
      >
        <Text style={styles.simboloCantidad}>
          −
        </Text>
      </TouchableOpacity>

      <TextInput
        style={styles.inputCantidad}
        value={valor}
        keyboardType="number-pad"
        textAlign="center"
        maxLength={String(maximo).length}
        onChangeText={(texto) =>
          cambiar(
            texto.replace(/[^0-9]/g, "")
          )
        }
      />

      <TouchableOpacity
        style={styles.botonCantidad}
        onPress={() =>
          cambiar(
            String(Math.min(maximo, numero + 1))
          )
        }
      >
        <Text style={styles.simboloCantidad}>
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}

export default function Servicios({ navigation }) {
  const { usuario, autenticado, token } = useAuth();

  // MODALES
  const [modalImpresion, setModalImpresion] =
    useState(false);

  const [modalReserva, setModalReserva] =
    useState(false);

  const [tipo, setTipo] =
    useState("coworking");

  // IMPRESIONES
  const [archivos, setArchivos] =
    useState([]);

  const [papel, setPapel] =
    useState("A4");

  const [copias, setCopias] =
    useState("1");

  const [nombre, setNombre] =
    useState("");

  const [telefono, setTelefono] =
    useState("");

  const [email, setEmail] =
    useState("");

  const [comentario, setComentario] =
    useState("");

  const [entrega, setEntrega] =
    useState("retiro-local");

  const [direccion, setDireccion] =
    useState("");

  const [
    validandoImpresion,
    setValidandoImpresion,
  ] = useState(false);

  const [
    impresionValidada,
    setImpresionValidada,
  ] = useState(false);

  // RESERVAS
  const [dias] = useState(crearDias);

  const [fecha, setFecha] =
    useState(fechaISO(new Date()));

  const [hora, setHora] =
    useState("09:00");

  const [duracion, setDuracion] =
    useState(1);

  const [juego, setJuego] =
    useState("Pool");

  const [personas, setPersonas] =
    useState("1");

  const [emailReserva, setEmailReserva] =
    useState("");

  const [cafe, setCafe] =
    useState("Sin café");

  const [dulce, setDulce] =
    useState("Sin adicional");

  const [
    observaciones,
    setObservaciones,
  ] = useState("");

  const [
    validandoReserva,
    setValidandoReserva,
  ] = useState(false);

  const [
    reservaValidada,
    setReservaValidada,
  ] = useState(false);

  const [
    registrando,
    setRegistrando,
  ] = useState(false);

  // DISPONIBILIDAD
  const [ocupados, setOcupados] =
    useState([]);

  const [
    cargandoHorarios,
    setCargandoHorarios,
  ] = useState(false);

  const [
    errorHorarios,
    setErrorHorarios,
  ] = useState("");

  const [
    horariosConsultados,
    setHorariosConsultados,
  ] = useState(false);

  const [recarga, setRecarga] =
    useState(0);

  // MERCADO PAGO
  const [
    verificandoPago,
    setVerificandoPago,
  ] = useState(false);

  const [reservaParaVerificar, setReservaParaVerificar] =
    useState(null);

  const appState = useRef(AppState.currentState);
  const verificacionEnCurso = useRef(false);
  const reservaPendienteRef = useRef(null);

  const esCoworking = tipo === "coworking";

  const tipoAPI = esCoworking
    ? "co-working"
    : "juegos";

  const precioConsumo =
    (CAFE_PRECIOS[cafe] || 0) +
    (DULCES_PRECIOS[dulce] || 0);

  const total =
    duracion * PRECIO_HORA +
    precioConsumo;

  const senia = total / 2;

  // DISPONIBILIDAD DESDE LARAVEL
  useEffect(() => {
    if (!modalReserva) return;

    if (!esFechaValida(fecha)) {
      setHorariosConsultados(false);
      setOcupados([]);
      setErrorHorarios(
        "Ingresá una fecha válida."
      );
      return;
    }

    let vigente = true;
    const controlador = new AbortController();

    async function consultar() {
      setCargandoHorarios(true);
      setHorariosConsultados(false);
      setErrorHorarios("");
      setOcupados([]);

      try {
        const params =
          `fecha=${encodeURIComponent(fecha)}` +
          `&tipo_servicio=${encodeURIComponent(tipoAPI)}`;

        const respuesta = await fetch(
          `${API}/reservas/disponibilidad?${params}`,
          {
            headers: {
              Accept: "application/json",
            },
            signal: controlador.signal,
          }
        );

        const datos = await respuesta.json();

        if (!respuesta.ok) {
          throw new Error(
            mensajeError(
              datos,
              "No pudimos consultar los horarios."
            )
          );
        }

        if (!Array.isArray(datos.ocupados)) {
          throw new Error(
            "Laravel no devolvió los horarios correctamente."
          );
        }

        if (vigente) {
          setOcupados(datos.ocupados);
          setHorariosConsultados(true);
        }
      } catch (error) {
        if (vigente) {
          setErrorHorarios(
            error.message === "Network request failed"
              ? "No hay conexión con Laravel."
              : error.message
          );

          setHorariosConsultados(false);
        }
      } finally {
        if (vigente) {
          setCargandoHorarios(false);
        }
      }
    }

    consultar();

    return () => {
      vigente = false;
      controlador.abort();
    };
  }, [
    modalReserva,
    fecha,
    tipoAPI,
    recarga,
  ]);

  function horarioOcupado(
    horaInicio,
    horas = duracion
  ) {
    const comienzo = minutos(horaInicio);
    const final = comienzo + horas * 60;

    return ocupados.some((reserva) => {
      const inicioOcupado =
        minutos(reserva.hora_inicio);

      const finOcupado =
        minutos(reserva.hora_final);

      return (
        Number.isFinite(inicioOcupado) &&
        Number.isFinite(finOcupado) &&
        comienzo < finOcupado &&
        final > inicioOcupado
      );
    });
  }

  function horarioPasado(horaInicio) {
    if (fecha !== fechaISO(new Date())) {
      return false;
    }

    return (
      minutos(horaInicio) <=
      new Date().getHours() * 60 +
        new Date().getMinutes()
    );
  }

  function horarioNoSeleccionable(horaInicio) {
    return (
      !horariosConsultados ||
      minutos(horaInicio) +
        duracion * 60 > 1440 ||
      horarioPasado(horaInicio) ||
      horarioOcupado(horaInicio)
    );
  }

  function cambiarDatosReserva(funcion) {
    funcion();
    setReservaValidada(false);
  }

  function abrirReserva(servicio) {
    setTipo(servicio);
    setFecha(fechaISO(new Date()));
    setHora("09:00");
    setDuracion(1);
    setJuego("Pool");
    setPersonas("1");
    setEmailReserva(usuario?.email || "");
    setCafe("Sin café");
    setDulce("Sin adicional");
    setObservaciones("");
    setReservaValidada(false);
    setOcupados([]);
    setHorariosConsultados(false);
    setErrorHorarios("");
    setModalReserva(true);
    setRecarga((n) => n + 1);
  }

  function abrirImpresion() {
    setNombre(
      usuario?.nombre_usuario
        ? `${usuario.nombre_usuario} ${
            usuario.apellido || ""
          }`.trim()
        : ""
    );

    setTelefono(usuario?.telefono || "");
    setEmail(usuario?.email || "");
    setImpresionValidada(false);
    setModalImpresion(true);
  }

  // SELECCIONAR ARCHIVOS
  async function seleccionarArchivos() {
    try {
      const resultado =
        await DocumentPicker.getDocumentAsync({
          type: [
            "application/pdf",
            "image/jpeg",
            "image/png",
          ],
          multiple: true,
          copyToCacheDirectory: true,
        });

      if (
        resultado.canceled ||
        !resultado.assets?.length
      ) {
        return;
      }

      const nuevos = [
        ...archivos,
        ...resultado.assets,
      ];

      if (
        nuevos.some(
          (archivo) =>
            !/\.(pdf|jpg|jpeg|png)$/i.test(
              archivo.name
            )
        )
      ) {
        Alert.alert(
          "Formato incorrecto",
          "Solo se permiten PDF, JPG, JPEG y PNG."
        );
        return;
      }

      if (
        nuevos.some(
          (archivo) =>
            typeof archivo.size !== "number"
        )
      ) {
        Alert.alert(
          "Error",
          "No se pudo comprobar el tamaño de un archivo."
        );
        return;
      }

      if (
        nuevos.reduce(
          (total, archivo) =>
            total + archivo.size,
          0
        ) > MAX_BYTES
      ) {
        Alert.alert(
          "Archivos grandes",
          "El tamaño total no puede superar los 4 MB."
        );
        return;
      }

      setArchivos(nuevos);
      setImpresionValidada(false);
    } catch (error) {
      Alert.alert(
        "Error",
        error.message ||
          "No pudimos seleccionar los archivos."
      );
    }
  }

  // VALIDAR IMPRESIÓN
  async function validarImpresion() {
    if (validandoImpresion) return;

    if (!archivos.length) {
      Alert.alert(
        "Faltan archivos",
        "Seleccioná al menos un archivo."
      );
      return;
    }

    const cantidad = Number(copias);

    if (
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 999
    ) {
      Alert.alert(
        "Cantidad incorrecta",
        "Elegí entre 1 y 999 copias."
      );
      return;
    }

    if (!nombre.trim()) {
      Alert.alert(
        "Falta tu nombre",
        "Ingresá tu nombre."
      );
      return;
    }

    const digitos =
      telefono.replace(/\D/g, "");

    if (
      digitos.length < 10 ||
      digitos.length > 15
    ) {
      Alert.alert(
        "Teléfono incorrecto",
        "Ingresá un teléfono válido."
      );
      return;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email.trim()
      )
    ) {
      Alert.alert(
        "Correo incorrecto",
        "Ingresá un correo válido."
      );
      return;
    }

    if (
      entrega === "envio" &&
      !direccion.trim()
    ) {
      Alert.alert(
        "Falta dirección",
        "Ingresá la dirección de envío."
      );
      return;
    }

    setValidandoImpresion(true);
    setImpresionValidada(false);

    try {
      const formulario = new FormData();

      archivos.forEach((archivo) => {
        const extension = archivo.name
          .split(".")
          .pop()
          .toLowerCase();

        formulario.append("files[]", {
          uri: archivo.uri,
          name: archivo.name,
          type:
            extension === "pdf"
              ? "application/pdf"
              : extension === "png"
                ? "image/png"
                : "image/jpeg",
        });
      });

      formulario.append("tipo_papel", papel);
      formulario.append(
        "num_copias",
        String(cantidad)
      );

      formulario.append(
        "nombre_cliente",
        nombre.trim()
      );

      formulario.append(
        "telefono_cliente",
        telefono.trim()
      );

      formulario.append(
        "email_cliente",
        email.trim()
      );

      formulario.append(
        "comentario_cliente",
        comentario.trim()
      );

      formulario.append(
        "modo_entrega",
        entrega
      );

      formulario.append(
        "direccion_envio",
        entrega === "envio"
          ? direccion.trim()
          : ""
      );

      const respuesta = await fetch(
        `${API}/validar-impresion`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
          },
          body: formulario,
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            datos,
            "No se pudo validar el pedido."
          )
        );
      }

      setImpresionValidada(true);

      Alert.alert(
        "Datos validados",
        "Laravel aceptó los datos. El pedido todavía no fue confirmado ni pagado."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message
      );
    } finally {
      setValidandoImpresion(false);
    }
  }

  // COMPROBAR RESERVA
  function comprobarReserva() {
    if (!esFechaValida(fecha)) {
      Alert.alert(
        "Fecha incorrecta",
        "Ingresá una fecha válida."
      );
      return false;
    }

    if (!horariosConsultados) {
      Alert.alert(
        "Disponibilidad sin verificar",
        "Primero necesitamos consultar los horarios."
      );
      return false;
    }

    if (horarioNoSeleccionable(hora)) {
      Alert.alert(
        "Horario no disponible",
        "Elegí otro horario disponible."
      );
      return false;
    }

    const cantidad = Number(personas);

    if (
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > 20
    ) {
      Alert.alert(
        "Cantidad incorrecta",
        "Ingresá entre 1 y 20 personas."
      );
      return false;
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        emailReserva.trim()
      )
    ) {
      Alert.alert(
        "Correo incorrecto",
        "Ingresá un correo válido."
      );
      return false;
    }

    return true;
  }

  // VALIDACIÓN PREVIA DE LARAVEL
  async function validarReserva() {
    if (
      validandoReserva ||
      !comprobarReserva()
    ) {
      return;
    }

    setValidandoReserva(true);
    setReservaValidada(false);

    try {
      const respuesta = await fetch(
        `${API}/validar-reserva`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            fecha,
            hora_inicio: hora,
            hora_final: finHorario(
              hora,
              duracion
            ),
            email_cliente:
              emailReserva.trim(),
          }),
        }
      );

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            datos,
            "No se pudo validar la reserva."
          )
        );
      }

      setReservaValidada(true);

      Alert.alert(
        "Datos validados",
        "Ya podés continuar con la reserva y el pago de la seña."
      );
    } catch (error) {
      Alert.alert(
        "Error",
        error.message
      );
    } finally {
      setValidandoReserva(false);
    }
  }

  // CONSULTAR EL RESULTADO DE MERCADO PAGO
  async function verificarPago(bookingId, mostrarAviso = true) {
    if (
      !bookingId ||
      !token ||
      verificacionEnCurso.current
    ) {
      return;
    }

    verificacionEnCurso.current = true;
    setVerificandoPago(true);

    try {
      const url =
        `${API}/reservas/movil/pago/estado` +
        `?booking_id=${encodeURIComponent(bookingId)}`;

      const respuesta = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const datos = await respuesta
        .json()
        .catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          mensajeError(
            datos,
            "No se pudo verificar el pago."
          )
        );
      }

      if (datos.estado === "confirmada") {
        reservaPendienteRef.current = null;
        setReservaParaVerificar(null);

        Alert.alert(
          "¡Reserva confirmada!",
          `Mercado Pago verificó la seña de la reserva N.º ${
            datos.numero_reserva || bookingId
          }.\n\nPodés verla en Mis reservas.`,
          [
            {
              text: "Ver mis reservas",
              onPress: () =>
                navigation.navigate("Reservas"),
            },
            {
              text: "Cerrar",
            },
          ]
        );

        return;
      }

      if (mostrarAviso) {
        Alert.alert(
          "Pago todavía pendiente",
          "Mercado Pago todavía no informó un pago aprobado.\n\nLa solicitud sigue pendiente de pago. Podés verificar nuevamente más tarde desde esta pantalla.",
          [
            {
              text: "Entendido",
            },
          ]
        );
      }
    } catch (error) {
      if (mostrarAviso) {
        Alert.alert(
          "No se pudo verificar",
          error.message ||
            "Intentá nuevamente."
        );
      }
    } finally {
      verificacionEnCurso.current = false;
      setVerificandoPago(false);
    }
  }

  // DETECTAR CUANDO EL USUARIO REGRESA
  // DESDE MERCADO PAGO AL IPHONE
  useEffect(() => {
    const suscripcion =
      AppState.addEventListener(
        "change",
        (siguienteEstado) => {
          const volvio =
            appState.current.match(
              /inactive|background/
            ) &&
            siguienteEstado === "active";

          appState.current = siguienteEstado;

          if (
            volvio &&
            reservaPendienteRef.current
          ) {
            verificarPago(
              reservaPendienteRef.current,
              false
            );
          }
        }
      );

    return () => {
      suscripcion.remove();
    };
  }, [token]);

  // CREAR LA RESERVA Y ABRIR EL CHECKOUT
  async function reservarYPagar() {
    if (registrando) return;

    if (!autenticado || !token) {
      Alert.alert(
        "Iniciá sesión",
        "Para reservar necesitás iniciar sesión.",
        [
          {
            text: "Cancelar",
            style: "cancel",
          },
          {
            text: "Ir a Mi cuenta",
            onPress: () => {
              setModalReserva(false);
              navigation.navigate("Cuenta");
            },
          },
        ]
      );

      return;
    }

    if (
      emailReserva.trim().toLowerCase() !==
      String(usuario?.email || "")
        .trim()
        .toLowerCase()
    ) {
      Alert.alert(
        "Correo diferente",
        "Utilizá el correo de tu cuenta."
      );
      return;
    }

    if (
      !reservaValidada ||
      !comprobarReserva()
    ) {
      Alert.alert(
        "Validación pendiente",
        "Primero validá los datos de la reserva."
      );
      return;
    }

    setRegistrando(true);

    let bookingIdCreado = null;

    try {
      // 1. CREAR LA SOLICITUD TEMPORAL
      const respuestaReserva = await fetch(
        `${API}/reservas/movil`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            tipo_servicio: tipoAPI,
            juego: esCoworking
              ? null
              : juego,
            fecha,
            hora_inicio: hora,
            hora_final: finHorario(
              hora,
              duracion
            ),
            personas: Number(personas),
            cafe,
            dulce,
          }),
        }
      );

      const datosReserva =
        await respuestaReserva
          .json()
          .catch(() => ({}));

      if (!respuestaReserva.ok) {
        if (respuestaReserva.status === 409) {
          setReservaValidada(false);
          setRecarga((n) => n + 1);
        }

        throw new Error(
          mensajeError(
            datosReserva,
            "No se pudo registrar la solicitud."
          )
        );
      }

      bookingIdCreado =
        datosReserva?.data?.booking_id;

      if (!bookingIdCreado) {
        throw new Error(
          "La reserva se registró, pero Laravel no devolvió su identificador."
        );
      }

      reservaPendienteRef.current =
        bookingIdCreado;

      setReservaParaVerificar({
        booking_id: bookingIdCreado,
        numero_reserva:
          datosReserva?.data?.numero_reserva,
      });

      // 2. PEDIR PREFERENCIA A LARAVEL
      const respuestaPago = await fetch(
        `${API}/reservas/movil/pago/preferencia`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: bookingIdCreado,
          }),
        }
      );

      const datosPago =
        await respuestaPago
          .json()
          .catch(() => ({}));

      if (!respuestaPago.ok) {
        throw new Error(
          mensajeError(
            datosPago,
            "No se pudo preparar Mercado Pago."
          )
        );
      }

      const urlPago =
        datosPago?.data?.url_pago;

      if (
        !urlPago ||
        !/^https:\/\/(www\.)?mercadopago\.com(\.[a-z]{2})?(\/|$)/i.test(
          urlPago
        ) &&
        !/^https:\/\/(www\.)?mercadopago\.com\.ar(\/|$)/i.test(
          urlPago
        )
      ) {
        throw new Error(
          "Mercado Pago devolvió un enlace de pago no válido."
        );
      }

      // 3. ABRIR MERCADO PAGO
      const puedeAbrir =
        await Linking.canOpenURL(urlPago);

      if (!puedeAbrir) {
        throw new Error(
          "El iPhone no pudo abrir el enlace de Mercado Pago."
        );
      }

      setModalReserva(false);
      setReservaValidada(false);
      setRecarga((n) => n + 1);

      await Linking.openURL(urlPago);

    } catch (error) {
      Alert.alert(
        bookingIdCreado
          ? "Solicitud creada, pago pendiente"
          : "No se pudo reservar",
        bookingIdCreado
          ? `${error.message}\n\nLa solicitud ya está registrada, pero no está pagada. No vuelvas a crear la misma reserva. Podés revisar su estado en Mis reservas.`
          : error.message,
        [
          {
            text: "Entendido",
          },
        ]
      );
    } finally {
      setRegistrando(false);
    }
  }

  function confirmarReservaYPago() {
    Alert.alert(
      "Reservar y pagar",
      `Total estimado: ${dinero(total)}\n` +
        `Seña del 50%: ${dinero(senia)}\n\n` +
        "Se creará una solicitud provisional y se abrirá Mercado Pago para abonar la seña de prueba.",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Continuar",
          onPress: reservarYPagar,
        },
      ]
    );
  }

  return (
    <View style={styles.pantalla}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Image
          source={require("../../assets/logo1.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        <Text style={styles.marca}>
          ESCALONES
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.presentacion}>
          <Text style={styles.etiqueta}>
            TODO EN UN SOLO LUGAR
          </Text>

          <Text style={styles.tituloPrincipal}>
            Nuestros servicios
          </Text>

          <View style={styles.lineaAzul} />

          <Text style={styles.descripcionPrincipal}>
            Elegí lo que necesitás y empezá
            directamente desde tu celular.
          </Text>
        </View>

        {/* VERIFICAR UNA SEÑA PENDIENTE */}
        {reservaParaVerificar && (
          <View style={styles.avisoPago}>
            <Ionicons
              name="time-outline"
              size={23}
              color="#986000"
            />

            <View style={{ flex: 1 }}>
              <Text style={styles.avisoPagoTitulo}>
                Pago pendiente de verificar
              </Text>

              <Text style={styles.avisoPagoTexto}>
                Reserva N.º{" "}
                {reservaParaVerificar.numero_reserva ||
                  reservaParaVerificar.booking_id}
              </Text>

              <TouchableOpacity
                style={styles.botonVerificar}
                disabled={verificandoPago}
                onPress={() =>
                  verificarPago(
                    reservaParaVerificar.booking_id
                  )
                }
              >
                {verificandoPago ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <Text style={styles.botonVerificarTexto}>
                    Verificar pago
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.listaServicios}>
          {SERVICIOS.map((servicio) => (
            <View
              key={servicio.id}
              style={styles.tarjetaServicio}
            >
              <Image
                source={{
                  uri: `${IMAGENES}/${servicio.imagen}`,
                }}
                style={styles.imagenServicio}
                resizeMode="cover"
              />

              <View style={styles.contenidoServicio}>
                <Text style={styles.nombreServicio}>
                  {servicio.titulo}
                </Text>

                <Text style={styles.descripcionServicio}>
                  {servicio.descripcion}
                </Text>

                <TouchableOpacity
                  style={styles.botonServicio}
                  onPress={() =>
                    servicio.id === "impresiones"
                      ? abrirImpresion()
                      : abrirReserva(servicio.id)
                  }
                >
                  <Text style={styles.botonServicioTexto}>
                    {servicio.boton}
                  </Text>

                  <Ionicons
                    name="arrow-forward"
                    size={17}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* MODAL DE IMPRESIONES */}
      <Modal
        visible={modalImpresion}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!validandoImpresion) {
            setModalImpresion(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalPantalla}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitulo}>
                Encargar impresión
              </Text>

              <Text style={styles.modalSubtitulo}>
                ESCALONES · IMPRENTA 24 HS
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cerrar}
              onPress={() =>
                setModalImpresion(false)
              }
            >
              <Ionicons
                name="close"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContenido}
            keyboardShouldPersistTaps="handled"
          >
            <Bloque
              numero="1"
              titulo="Archivos e impresión"
            >
              <Text style={styles.label}>
                Seleccioná tus archivos
              </Text>

              <Text style={styles.ayuda}>
                PDF, JPG, JPEG o PNG.
                Máximo 4 MB en total.
              </Text>

              <TouchableOpacity
                style={styles.botonArchivo}
                onPress={seleccionarArchivos}
              >
                <Ionicons
                  name="add-circle-outline"
                  size={22}
                  color={AZUL}
                />

                <Text style={styles.botonArchivoTexto}>
                  Agregar archivos
                </Text>
              </TouchableOpacity>

              {archivos.map(
                (archivo, indice) => (
                  <View
                    key={`${archivo.name}-${indice}`}
                    style={styles.archivoFila}
                  >
                    <Text
                      style={styles.archivoTexto}
                      numberOfLines={2}
                    >
                      {archivo.name}
                    </Text>

                    <TouchableOpacity
                      onPress={() => {
                        setArchivos(
                          (anteriores) =>
                            anteriores.filter(
                              (_, i) =>
                                i !== indice
                            )
                        );

                        setImpresionValidada(false);
                      }}
                    >
                      <Ionicons
                        name="close-circle"
                        size={22}
                        color="#B42318"
                      />
                    </TouchableOpacity>
                  </View>
                )
              )}

              <Text style={styles.label}>
                Tipo de papel
              </Text>

              <View style={styles.opcionesFila}>
                {["A4", "carta", "oficio"].map(
                  (item) => (
                    <Opcion
                      key={item}
                      texto={item.toUpperCase()}
                      flexible
                      seleccionada={
                        papel === item
                      }
                      onPress={() => {
                        setPapel(item);
                        setImpresionValidada(false);
                      }}
                    />
                  )
                )}
              </View>

              <Text style={styles.label}>
                Cantidad de copias
              </Text>

              <Cantidad
                valor={copias}
                maximo={999}
                cambiar={(valor) => {
                  setCopias(valor);
                  setImpresionValidada(false);
                }}
              />
            </Bloque>

            <Bloque
              numero="2"
              titulo="Tus datos"
            >
              <Campo
                titulo="Nombre y apellido *"
                valor={nombre}
                cambiar={(valor) => {
                  setNombre(valor);
                  setImpresionValidada(false);
                }}
                placeholder="Tu nombre completo"
              />

              <Campo
                titulo="Teléfono *"
                valor={telefono}
                cambiar={(valor) => {
                  setTelefono(valor);
                  setImpresionValidada(false);
                }}
                placeholder="11 1234-5678"
                teclado="phone-pad"
              />

              <Campo
                titulo="Correo electrónico *"
                valor={email}
                cambiar={(valor) => {
                  setEmail(valor);
                  setImpresionValidada(false);
                }}
                placeholder="ejemplo@correo.com"
                teclado="email-address"
              />

              <Campo
                titulo="Comentarios (opcional)"
                valor={comentario}
                cambiar={(valor) => {
                  setComentario(valor);
                  setImpresionValidada(false);
                }}
                placeholder="Indicaciones..."
                multiline
              />
            </Bloque>

            <Bloque
              numero="3"
              titulo="Método de entrega"
            >
              <View style={styles.opcionesColumna}>
                <Opcion
                  texto="Retiro en el local · aprox. 45 minutos"
                  seleccionada={
                    entrega === "retiro-local"
                  }
                  onPress={() => {
                    setEntrega("retiro-local");
                    setImpresionValidada(false);
                  }}
                />

                <Opcion
                  texto="Envío a domicilio · aprox. 2 horas"
                  seleccionada={
                    entrega === "envio"
                  }
                  onPress={() => {
                    setEntrega("envio");
                    setImpresionValidada(false);
                  }}
                />
              </View>

              {entrega === "envio" && (
                <Campo
                  titulo="Dirección *"
                  valor={direccion}
                  cambiar={(valor) => {
                    setDireccion(valor);
                    setImpresionValidada(false);
                  }}
                  placeholder="Calle, número y piso"
                />
              )}
            </Bloque>

            <View style={styles.resumen}>
              <Text style={styles.resumenTitulo}>
                Resumen de impresión
              </Text>

              <Fila
                titulo="Archivos"
                valor={archivos.length}
              />

              <Fila
                titulo="Papel"
                valor={papel.toUpperCase()}
              />

              <Fila
                titulo="Copias"
                valor={copias || "0"}
              />

              <Fila
                titulo="Entrega"
                valor={
                  entrega === "envio"
                    ? "A domicilio"
                    : "Retiro en local"
                }
              />

              <Text style={styles.nota}>
                El presupuesto y el pago de
                impresiones se integrarán
                posteriormente.
              </Text>
            </View>

            {impresionValidada && (
              <Text style={styles.textoExito}>
                ✓ Datos de impresión validados
              </Text>
            )}

            <TouchableOpacity
              style={styles.botonPrincipal}
              disabled={validandoImpresion}
              onPress={validarImpresion}
            >
              {validandoImpresion ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.botonPrincipalTexto}>
                  Validar datos de impresión
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* MODAL DE RESERVAS */}
      <Modal
        visible={modalReserva}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => {
          if (!registrando) {
            setModalReserva(false);
          }
        }}
      >
        <KeyboardAvoidingView
          style={styles.modalPantalla}
          behavior={
            Platform.OS === "ios"
              ? "padding"
              : undefined
          }
        >
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitulo}>
                {esCoworking
                  ? "Reservar espacio"
                  : "Reservar juego"}
              </Text>

              <Text style={styles.modalSubtitulo}>
                ESCALONES · RESERVAS 24 HS
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cerrar}
              disabled={registrando}
              onPress={() =>
                setModalReserva(false)
              }
            >
              <Ionicons
                name="close"
                size={23}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContenido}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.introReserva}>
              <Text style={styles.introTitulo}>
                {esCoworking
                  ? "Tu espacio para estudiar y trabajar"
                  : "Un momento para divertirte"}
              </Text>

              <Text style={styles.introTexto}>
                Elegí fecha, duración y horario.
                Al finalizar, podrás pagar la
                seña mediante Mercado Pago.
              </Text>
            </View>

            <Bloque
              numero="1"
              titulo={
                esCoworking
                  ? "Tu espacio"
                  : "Elegí tu juego"
              }
            >
              {esCoworking ? (
                <Text style={styles.ayuda}>
                  Un espacio para estudiar,
                  trabajar y desarrollar proyectos.
                </Text>
              ) : (
                <>
                  <Text style={styles.label}>
                    ¿Qué querés jugar?
                  </Text>

                  <View style={styles.opcionesFlexibles}>
                    {JUEGOS.map((item) => (
                      <Opcion
                        key={item}
                        texto={item}
                        seleccionada={
                          juego === item
                        }
                        onPress={() =>
                          cambiarDatosReserva(
                            () =>
                              setJuego(item)
                          )
                        }
                      />
                    ))}
                  </View>
                </>
              )}

              <Text style={styles.label}>
                Cantidad de personas
              </Text>

              <Cantidad
                valor={personas}
                maximo={20}
                cambiar={(valor) =>
                  cambiarDatosReserva(
                    () =>
                      setPersonas(valor)
                  )
                }
              />

              <Text style={styles.ayuda}>
                Sujeto a la capacidad del local.
              </Text>
            </Bloque>

            <Bloque
              numero="2"
              titulo="Día y horario"
            >
              <Text style={styles.label}>
                Elegí una fecha
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.scrollDias}
              >
                {dias.map((dia) => {
                  const seleccionado =
                    fecha === dia.valor;

                  return (
                    <TouchableOpacity
                      key={dia.valor}
                      style={[
                        styles.dia,
                        seleccionado &&
                          styles.diaActivo,
                      ]}
                      onPress={() =>
                        cambiarDatosReserva(
                          () => {
                            setFecha(
                              dia.valor
                            );

                            setHora(
                              "09:00"
                            );
                          }
                        )
                      }
                    >
                      <Text
                        style={[
                          styles.diaTexto,
                          seleccionado &&
                            styles.diaTextoActivo,
                        ]}
                      >
                        {dia.dia}
                      </Text>

                      <Text
                        style={[
                          styles.diaNumero,
                          seleccionado &&
                            styles.diaTextoActivo,
                        ]}
                      >
                        {dia.numero}
                      </Text>

                      <Text
                        style={[
                          styles.diaTexto,
                          seleccionado &&
                            styles.diaTextoActivo,
                        ]}
                      >
                        {dia.mes}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <Campo
                titulo="Otra fecha (AAAA-MM-DD)"
                valor={fecha}
                cambiar={(valor) =>
                  cambiarDatosReserva(
                    () => {
                      setFecha(valor);
                      setHora("09:00");
                    }
                  )
                }
                placeholder="2026-11-24"
              />

              <Text style={styles.label}>
                Duración
              </Text>

              <View style={styles.opcionesFila}>
                {DURACIONES.map(
                  (cantidad) => (
                    <Opcion
                      key={cantidad}
                      texto={`${cantidad} h`}
                      flexible
                      seleccionada={
                        duracion === cantidad
                      }
                      onPress={() =>
                        cambiarDatosReserva(
                          () => {
                            setDuracion(
                              cantidad
                            );

                            setHora(
                              "09:00"
                            );
                          }
                        )
                      }
                    />
                  )
                )}
              </View>

              <View style={styles.horariosEncabezado}>
                <Text style={styles.label}>
                  Horarios disponibles
                </Text>

                <TouchableOpacity
                  onPress={() =>
                    setRecarga(
                      (n) => n + 1
                    )
                  }
                  disabled={cargandoHorarios}
                >
                  <Ionicons
                    name="refresh-outline"
                    size={22}
                    color={AZUL}
                  />
                </TouchableOpacity>
              </View>

              <View style={styles.leyenda}>
                <Text style={styles.leyendaLibre}>
                  ● Disponible
                </Text>

                <Text style={styles.leyendaElegida}>
                  ● Elegido
                </Text>

                <Text style={styles.leyendaOcupada}>
                  ● Ocupado
                </Text>
              </View>

              {cargandoHorarios && (
                <View style={styles.cargandoFila}>
                  <ActivityIndicator
                    color={AZUL}
                  />

                  <Text style={styles.ayuda}>
                    Consultando Laravel...
                  </Text>
                </View>
              )}

              {!!errorHorarios && (
                <View style={styles.errorHorarios}>
                  <Text style={styles.errorHorariosTexto}>
                    {errorHorarios}
                  </Text>

                  <TouchableOpacity
                    onPress={() =>
                      setRecarga(
                        (n) => n + 1
                      )
                    }
                  >
                    <Text style={styles.reintentar}>
                      Reintentar
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={styles.grillaHorarios}>
                {HORARIOS.map((item) => {
                  const fueraDelDia =
                    minutos(item) +
                      duracion * 60 >
                    1440;

                  const pasado =
                    horarioPasado(item);

                  const ocupado =
                    horariosConsultados &&
                    !fueraDelDia &&
                    horarioOcupado(item);

                  const noSeleccionable =
                    horarioNoSeleccionable(
                      item
                    );

                  const seleccionado =
                    hora === item &&
                    !noSeleccionable;

                  return (
                    <TouchableOpacity
                      key={item}
                      disabled={
                        noSeleccionable
                      }
                      onPress={() =>
                        cambiarDatosReserva(
                          () =>
                            setHora(item)
                        )
                      }
                      style={[
                        styles.horario,
                        horariosConsultados &&
                          !noSeleccionable &&
                          styles.horarioLibre,
                        seleccionado &&
                          styles.horarioSeleccionado,
                        ocupado &&
                          styles.horarioOcupado,
                        (pasado ||
                          fueraDelDia) &&
                          styles.horarioDeshabilitado,
                      ]}
                    >
                      <Text
                        style={[
                          styles.horarioTexto,
                          seleccionado &&
                            styles.horarioTextoSeleccionado,
                          ocupado &&
                            styles.horarioTextoOcupado,
                        ]}
                      >
                        {item}
                      </Text>

                      {ocupado && (
                        <Ionicons
                          name="lock-closed"
                          size={12}
                          color="#B42318"
                        />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <View style={styles.horarioResumen}>
                <Text style={styles.horarioResumenTitulo}>
                  Horario seleccionado
                </Text>

                <Text style={styles.horarioResumenValor}>
                  {hora} a{" "}
                  {finHorario(
                    hora,
                    duracion
                  )}
                </Text>

                {horariosConsultados &&
                  horarioNoSeleccionable(
                    hora
                  ) && (
                    <Text style={styles.advertencia}>
                      Elegí un horario verde
                      para continuar.
                    </Text>
                  )}
              </View>
            </Bloque>

            <Bloque
              numero="3"
              titulo="Consumo opcional"
            >
              <Text style={styles.ayuda}>
                Podés agregar café o
                algo para comer.
              </Text>

              <Text style={styles.label}>
                Café
              </Text>

              <View style={styles.opcionesFlexibles}>
                {Object.keys(
                  CAFE_PRECIOS
                ).map((item) => (
                  <Opcion
                    key={item}
                    texto={item}
                    seleccionada={
                      cafe === item
                    }
                    onPress={() =>
                      cambiarDatosReserva(
                        () =>
                          setCafe(item)
                      )
                    }
                  />
                ))}
              </View>

              <Text style={styles.label}>
                Para comer
              </Text>

              <View style={styles.opcionesFlexibles}>
                {Object.keys(
                  DULCES_PRECIOS
                ).map((item) => (
                  <Opcion
                    key={item}
                    texto={item}
                    seleccionada={
                      dulce === item
                    }
                    onPress={() =>
                      cambiarDatosReserva(
                        () =>
                          setDulce(item)
                      )
                    }
                  />
                ))}
              </View>

              <Fila
                titulo="Adicionales"
                valor={dinero(
                  precioConsumo
                )}
                importante
              />
            </Bloque>

            <Bloque
              numero="4"
              titulo="Tus datos"
            >
              {autenticado && (
                <Text style={styles.textoCuenta}>
                  Cuenta conectada:{" "}
                  {usuario?.email || ""}
                </Text>
              )}

              <Campo
                titulo="Correo electrónico *"
                valor={emailReserva}
                cambiar={(valor) =>
                  cambiarDatosReserva(
                    () =>
                      setEmailReserva(
                        valor
                      )
                  )
                }
                placeholder="ejemplo@correo.com"
                teclado="email-address"
                editable={!autenticado}
              />

              <Campo
                titulo="Observaciones (opcional)"
                valor={observaciones}
                cambiar={(valor) =>
                  cambiarDatosReserva(
                    () =>
                      setObservaciones(
                        valor
                      )
                  )
                }
                placeholder="Indicaciones especiales..."
                multiline
              />
            </Bloque>

            <View style={styles.resumen}>
              <Text style={styles.resumenTitulo}>
                Resumen de la reserva
              </Text>

              <Fila
                titulo="Servicio"
                valor={
                  esCoworking
                    ? "Coworking"
                    : juego
                }
              />

              <Fila
                titulo="Fecha"
                valor={fecha}
              />

              <Fila
                titulo="Horario"
                valor={`${hora} a ${finHorario(
                  hora,
                  duracion
                )}`}
              />

              <Fila
                titulo="Duración"
                valor={`${duracion} h`}
              />

              <Fila
                titulo="Personas"
                valor={personas || "0"}
              />

              <View style={styles.divisor} />

              <Fila
                titulo="Precio total estimado"
                valor={dinero(total)}
                importante
              />

              <View style={styles.cajaSenia}>
                <Text style={styles.cajaSeniaEtiqueta}>
                  Seña a pagar ahora
                </Text>

                <Text style={styles.cajaSeniaMonto}>
                  {dinero(senia)}
                </Text>

                <Text style={styles.cajaSeniaDetalle}>
                  50% del total
                </Text>
              </View>

              <Fila
                titulo="Restante en el local"
                valor={dinero(
                  total - senia
                )}
              />

              <Text style={styles.nota}>
                El importe definitivo
                lo calcula Laravel.
                Esta es una prueba
                de integración con
                Mercado Pago.
              </Text>
            </View>

            {reservaValidada && (
              <Text style={styles.textoExito}>
                ✓ Datos validados por Laravel
              </Text>
            )}

            <TouchableOpacity
              style={[
                styles.botonPrincipal,
                (validandoReserva ||
                  registrando ||
                  !horariosConsultados) &&
                  styles.botonDeshabilitado,
              ]}
              disabled={
                validandoReserva ||
                registrando ||
                !horariosConsultados
              }
              onPress={
                validarReserva
              }
            >
              {validandoReserva ? (
                <ActivityIndicator
                  color="#FFFFFF"
                />
              ) : (
                <Text style={styles.botonPrincipalTexto}>
                  Validar datos de reserva
                </Text>
              )}
            </TouchableOpacity>

            {reservaValidada && (
              <TouchableOpacity
                style={[
                  styles.botonPrincipal,
                  styles.botonPagar,
                  registrando &&
                    styles.botonDeshabilitado,
                ]}
                disabled={
                  registrando
                }
                onPress={
                  confirmarReservaYPago
                }
              >
                {registrando ? (
                  <ActivityIndicator
                    color="#FFFFFF"
                  />
                ) : (
                  <>
                    <Ionicons
                      name="card-outline"
                      size={21}
                      color="#FFFFFF"
                    />

                    <Text
                      style={[
                        styles.botonPrincipalTexto,
                        {
                          marginLeft: 8,
                        },
                      ]}
                    >
                      Reservar y pagar seña
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            <Text style={styles.notaFinal}>
              La solicitud se crea
              provisionalmente.
              Solo quedará confirmada
              después de que Laravel
              verifique el pago.
            </Text>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  header: {
    backgroundColor: AZUL,
    paddingTop: 65,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
  },

  logo: {
    width: 45,
    height: 45,
    marginRight: 10,
  },

  marca: {
    fontSize: 26,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  scroll: {
    flex: 1,
    backgroundColor: FONDO,
  },

  contenido: {
    paddingBottom: 45,
  },

  presentacion: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 35,
    paddingBottom: 27,
    alignItems: "center",
  },

  etiqueta: {
    color: AZUL,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 11,
  },

  tituloPrincipal: {
    color: OSCURO,
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
  },

  lineaAzul: {
    width: 54,
    height: 4,
    borderRadius: 3,
    backgroundColor: AZUL,
    marginTop: 14,
    marginBottom: 17,
  },

  descripcionPrincipal: {
    color: GRIS,
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
  },

  listaServicios: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  tarjetaServicio: {
    backgroundColor: "#FFFFFF",
    borderRadius: 15,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    marginBottom: 15,
    flexDirection: "row",
    minHeight: 153,
  },

  imagenServicio: {
    width: 115,
    height: "100%",
    minHeight: 153,
    backgroundColor: "#DDE9F0",
  },

  contenidoServicio: {
    flex: 1,
    padding: 13,
    justifyContent: "space-between",
  },

  nombreServicio: {
    color: OSCURO,
    fontSize: 17,
    fontWeight: "bold",
    marginBottom: 6,
  },

  descripcionServicio: {
    color: GRIS,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 11,
  },

  botonServicio: {
    backgroundColor: AZUL,
    borderRadius: 9,
    paddingHorizontal: 11,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  botonServicioTexto: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    flexShrink: 1,
  },

  avisoPago: {
    marginHorizontal: 18,
    marginTop: 18,
    padding: 16,
    backgroundColor: "#FFF4DE",
    borderRadius: 13,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },

  avisoPagoTitulo: {
    color: "#986000",
    fontSize: 15,
    fontWeight: "bold",
  },

  avisoPagoTexto: {
    color: OSCURO,
    fontSize: 13,
    marginTop: 5,
  },

  botonVerificar: {
    backgroundColor: AZUL,
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 9,
    alignSelf: "flex-start",
    marginTop: 12,
  },

  botonVerificarTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  modalPantalla: {
    flex: 1,
    backgroundColor: FONDO,
  },

  modalHeader: {
    backgroundColor: AZUL,
    paddingTop:
      Platform.OS === "ios"
        ? 24
        : 43,
    paddingBottom: 20,
    paddingHorizontal: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  modalSubtitulo: {
    color: "#D9EEFF",
    fontSize: 11,
    letterSpacing: 1,
    marginTop: 6,
  },

  cerrar: {
    width: 37,
    height: 37,
    borderRadius: 19,
    backgroundColor:
      "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  modalScroll: {
    flex: 1,
  },

  modalContenido: {
    padding: 20,
    paddingBottom: 50,
  },

  introReserva: {
    backgroundColor: "#E8F4FC",
    borderRadius: 14,
    padding: 19,
    marginBottom: 18,
  },

  introTitulo: {
    color: OSCURO,
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 9,
  },

  introTexto: {
    color: GRIS,
    fontSize: 14,
    lineHeight: 22,
  },

  bloque: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 17,
  },

  bloqueEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },

  numeroPaso: {
    backgroundColor: AZUL,
    color: "#FFFFFF",
    width: 31,
    height: 31,
    lineHeight: 31,
    borderRadius: 16,
    textAlign: "center",
    overflow: "hidden",
    fontWeight: "bold",
    fontSize: 16,
    marginRight: 11,
  },

  tituloPaso: {
    color: OSCURO,
    fontSize: 19,
    fontWeight: "bold",
    flex: 1,
  },

  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: OSCURO,
    marginBottom: 9,
  },

  grupoCampo: {
    marginBottom: 18,
  },

  input: {
    borderWidth: 1,
    borderColor: "#D6E1EB",
    backgroundColor: "#FFFFFF",
    color: OSCURO,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 48,
    fontSize: 15,
  },

  inputGrande: {
    height: 105,
    paddingTop: 13,
  },

  inputDeshabilitado: {
    backgroundColor: "#F4F8FB",
    color: GRIS,
  },

  ayuda: {
    color: "#64788A",
    fontSize: 12,
    lineHeight: 19,
    marginBottom: 13,
  },

  opcionesFila: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 18,
  },

  opcionesColumna: {
    marginBottom: 15,
  },

  opcionesFlexibles: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  opcion: {
    borderWidth: 1,
    borderColor: "#D1E0EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 13,
    paddingVertical: 12,
    marginRight: 8,
    marginBottom: 8,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  opcionFlexible: {
    flex: 1,
  },

  opcionSeleccionada: {
    backgroundColor: AZUL,
    borderColor: AZUL,
  },

  opcionDeshabilitada: {
    opacity: 0.4,
  },

  opcionTexto: {
    color: OSCURO,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
  },

  opcionTextoSeleccionada: {
    color: "#FFFFFF",
  },

  filaCantidad: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  botonCantidad: {
    width: 48,
    height: 47,
    backgroundColor: "#EDF5FC",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  simboloCantidad: {
    fontSize: 24,
    fontWeight: "bold",
    color: AZUL,
  },

  inputCantidad: {
    flex: 1,
    height: 47,
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: "#D1E0EB",
    borderRadius: 10,
    color: OSCURO,
    fontSize: 17,
    backgroundColor: "#FFFFFF",
  },

  botonArchivo: {
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: AZUL,
    backgroundColor: "#F0F8FF",
    borderRadius: 11,
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },

  botonArchivoTexto: {
    color: AZUL,
    fontWeight: "bold",
    marginLeft: 9,
  },

  archivoFila: {
    backgroundColor: "#FAFCFE",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 9,
  },

  archivoTexto: {
    color: OSCURO,
    flex: 1,
    marginRight: 10,
    fontSize: 13,
  },

  scrollDias: {
    marginBottom: 18,
  },

  dia: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D1E0EB",
    borderRadius: 12,
    width: 66,
    alignItems: "center",
    paddingVertical: 12,
    marginRight: 9,
  },

  diaActivo: {
    backgroundColor: AZUL,
    borderColor: AZUL,
  },

  diaTexto: {
    color: GRIS,
    fontSize: 12,
    textTransform: "capitalize",
  },

  diaNumero: {
    color: OSCURO,
    fontSize: 23,
    fontWeight: "bold",
    marginVertical: 4,
  },

  diaTextoActivo: {
    color: "#FFFFFF",
  },

  horariosEncabezado: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },

  leyenda: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 15,
  },

  leyendaLibre: {
    fontSize: 11,
    color: "#21834C",
    marginRight: 13,
  },

  leyendaElegida: {
    fontSize: 11,
    color: AZUL,
    marginRight: 13,
  },

  leyendaOcupada: {
    fontSize: 11,
    color: "#B42318",
  },

  cargandoFila: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  errorHorarios: {
    backgroundColor: "#FDEAEA",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },

  errorHorariosTexto: {
    color: "#B42318",
    fontSize: 13,
  },

  reintentar: {
    color: AZUL,
    fontWeight: "bold",
    marginTop: 8,
  },

  grillaHorarios: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  horario: {
    width: "23%",
    minHeight: 46,
    borderWidth: 1,
    borderColor: "#D1E0EB",
    backgroundColor: "#F1F3F5",
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  horarioLibre: {
    backgroundColor: "#E7F7EC",
    borderColor: "#83C99F",
  },

  horarioSeleccionado: {
    backgroundColor: AZUL,
    borderColor: AZUL,
  },

  horarioOcupado: {
    backgroundColor: "#FDEAEA",
    borderColor: "#D44A4A",
  },

  horarioDeshabilitado: {
    backgroundColor: "#ECEFF2",
    borderColor: "#D8DEE5",
    opacity: 0.5,
  },

  horarioTexto: {
    color: OSCURO,
    fontSize: 13,
    fontWeight: "bold",
  },

  horarioTextoSeleccionado: {
    color: "#FFFFFF",
  },

  horarioTextoOcupado: {
    color: "#B42318",
    marginRight: 4,
  },

  horarioResumen: {
    backgroundColor: "#F0F8FF",
    borderRadius: 11,
    padding: 15,
    alignItems: "center",
  },

  horarioResumenTitulo: {
    color: GRIS,
    fontSize: 12,
    marginBottom: 6,
  },

  horarioResumenValor: {
    color: AZUL,
    fontSize: 20,
    fontWeight: "bold",
  },

  advertencia: {
    color: "#B42318",
    fontSize: 12,
    marginTop: 9,
    textAlign: "center",
  },

  textoCuenta: {
    backgroundColor: "#F0F8FF",
    color: OSCURO,
    padding: 12,
    borderRadius: 10,
    fontSize: 12,
    marginBottom: 16,
  },

  resumen: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#D6E1EB",
    borderRadius: 16,
    padding: 19,
    marginBottom: 17,
  },

  resumenTitulo: {
    color: OSCURO,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 17,
  },

  fila: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 13,
  },

  filaEtiqueta: {
    color: GRIS,
    fontSize: 14,
    flex: 1,
  },

  filaValor: {
    color: OSCURO,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 12,
    flexShrink: 1,
    textAlign: "right",
  },

  filaImportante: {
    color: AZUL,
    fontSize: 17,
  },

  divisor: {
    height: 1,
    backgroundColor: "#E5ECF2",
    marginVertical: 15,
  },

  cajaSenia: {
    borderRadius: 12,
    padding: 17,
    backgroundColor: "#E7F7EC",
    alignItems: "center",
    marginBottom: 16,
  },

  cajaSeniaEtiqueta: {
    color: "#176D3C",
    fontSize: 14,
    fontWeight: "bold",
  },

  cajaSeniaMonto: {
    color: "#176D3C",
    fontSize: 30,
    fontWeight: "bold",
    marginTop: 6,
  },

  cajaSeniaDetalle: {
    color: "#176D3C",
    fontSize: 12,
    marginTop: 4,
  },

  nota: {
    color: GRIS,
    fontSize: 12,
    lineHeight: 20,
  },

  textoExito: {
    backgroundColor: "#E9F8EF",
    color: "#17633B",
    padding: 14,
    borderRadius: 10,
    marginBottom: 15,
    fontWeight: "bold",
  },

  botonPrincipal: {
    backgroundColor: AZUL,
    minHeight: 55,
    borderRadius: 11,
    padding: 14,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  botonPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
  },

  botonPagar: {
    backgroundColor: "#176D3C",
    marginTop: 12,
  },

  botonDeshabilitado: {
    opacity: 0.55,
  },

  notaFinal: {
    color: GRIS,
    textAlign: "center",
    fontSize: 12,
    lineHeight: 20,
    marginTop: 16,
  },
});
