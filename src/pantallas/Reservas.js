
import React, {
  useCallback,
  useMemo,
  useRef,
  useState,
  useEffect,
} from "react";

import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
  Modal,
  Platform,
  Alert,
  Linking,
  AppState,
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

const AZUL = "#0071BC";
const OSCURO = "#123A57";
const GRIS = "#526473";
const FONDO = "#F4F8FB";

const API = "http://192.168.1.5:8001/api";

const FILTROS = [
  { id: "proximas", nombre: "Próximas" },
  { id: "pasadas", nombre: "Pasadas" },
  { id: "canceladas", nombre: "Canceladas" },
];

function fechaTexto(valor) {
  if (!valor) return "Fecha no disponible";

  const partes = String(valor)
    .slice(0, 10)
    .split("-");

  if (partes.length !== 3) {
    return String(valor);
  }

  const [anio, mes, dia] = partes.map(Number);
  const fecha = new Date(anio, mes - 1, dia);

  if (Number.isNaN(fecha.getTime())) {
    return String(valor);
  }

  return fecha.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function horaTexto(valor) {
  return valor
    ? String(valor).slice(0, 5)
    : "--:--";
}

function dinero(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return "A confirmar";
  }

  const numero = Number(valor);

  return Number.isFinite(numero)
    ? `$ ${numero.toLocaleString("es-AR")}`
    : "A confirmar";
}

function nombreServicio(valor) {
  const tipo = String(valor || "").toLowerCase();

  if (
    tipo === "co-working" ||
    tipo === "coworking"
  ) {
    return "Espacio coworking";
  }

  if (tipo === "juegos") {
    return "Juegos recreativos";
  }

  return valor || "Servicio ESCALONES";
}

function iconoServicio(valor) {
  return String(valor || "").toLowerCase() === "juegos"
    ? "game-controller-outline"
    : "laptop-outline";
}

function estadoReserva(reserva) {
  const estado = String(reserva?.estado || "")
    .toLowerCase()
    .trim();

  if (
    estado === "pendiente_pago" ||
    estado === "pendiente"
  ) {
    return {
      clave: "pendiente",
      texto: "Pendiente de pago",
      color: "#986000",
      fondo: "#FFF4DE",
      icono: "time-outline",
    };
  }

  if (
    estado === "confirmada" ||
    estado === "confirmado" ||
    estado === "pagada"
  ) {
    return {
      clave: "confirmada",
      texto: "Confirmada",
      color: "#176D3C",
      fondo: "#E7F7EC",
      icono: "checkmark-circle-outline",
    };
  }

  if (
    estado === "cancelada" ||
    estado === "cancelado"
  ) {
    return {
      clave: "cancelada",
      texto: "Cancelada",
      color: "#B42318",
      fondo: "#FDEAEA",
      icono: "close-circle-outline",
    };
  }

  return {
    clave: "desconocida",
    texto: "Estado no informado",
    color: GRIS,
    fondo: "#EAF0F5",
    icono: "help-circle-outline",
  };
}

function clasificar(reserva) {
  if (estadoReserva(reserva).clave === "cancelada") {
    return "canceladas";
  }

  if (!reserva.fecha || !reserva.hora_final) {
    return "proximas";
  }

  const fecha = String(reserva.fecha).slice(0, 10);
  const hora = horaTexto(reserva.hora_final);
  const fin = new Date(`${fecha}T${hora}:00`);

  return (
    !Number.isNaN(fin.getTime()) &&
    fin < new Date()
  )
    ? "pasadas"
    : "proximas";
}

function obtenerId(reserva) {
  return Number(reserva?.id);
}

function mensajeError(datos, alternativa) {
  if (datos?.errors) {
    const errores = Object.values(datos.errors).flat();

    if (errores.length) {
      return errores.join("\n");
    }
  }

  return datos?.message || alternativa;
}

function enlaceMercadoPago(url) {
  if (!url || typeof url !== "string") {
    return false;
  }

  try {
    const analizada = new URL(url);
    const dominio = analizada.hostname.toLowerCase();

    return (
      analizada.protocol === "https:" &&
      (
        dominio === "mercadopago.com" ||
        dominio.endsWith(".mercadopago.com") ||
        dominio === "mercadopago.com.ar" ||
        dominio.endsWith(".mercadopago.com.ar")
      )
    );
  } catch {
    return false;
  }
}

function Estado({ reserva }) {
  const estado = estadoReserva(reserva);

  return (
    <View
      style={[
        styles.estado,
        { backgroundColor: estado.fondo },
      ]}
    >
      <Ionicons
        name={estado.icono}
        size={16}
        color={estado.color}
      />

      <Text
        style={[
          styles.estadoTexto,
          { color: estado.color },
        ]}
      >
        {estado.texto}
      </Text>
    </View>
  );
}

function Resumen({ icono, numero, titulo }) {
  return (
    <View style={styles.tarjetaResumen}>
      <View style={styles.iconoResumen}>
        <Ionicons
          name={icono}
          size={23}
          color={AZUL}
        />
      </View>

      <Text style={styles.numeroResumen}>
        {numero}
      </Text>

      <Text style={styles.textoResumen}>
        {titulo}
      </Text>
    </View>
  );
}

function FilaDetalle({ icono, titulo, valor }) {
  return (
    <View style={styles.filaDetalle}>
      <Ionicons
        name={icono}
        size={20}
        color={AZUL}
      />

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={styles.filaEtiqueta}>
          {titulo}
        </Text>

        <Text style={styles.filaValor}>
          {String(valor ?? "Sin especificar")}
        </Text>
      </View>
    </View>
  );
}

function TarjetaReserva({
  reserva,
  onDetalles,
  onPagar,
  onVerificar,
  pagando,
  verificando,
}) {
  const estado = estadoReserva(reserva);
  const proxima = clasificar(reserva) === "proximas";
  const pendiente = estado.clave === "pendiente";

  return (
    <View style={styles.tarjetaReserva}>
      <View style={styles.reservaEncabezado}>
        <View style={styles.reservaIcono}>
          <Ionicons
            name={iconoServicio(reserva.tipo_servicio)}
            size={24}
            color={AZUL}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={styles.reservaTitulo}>
            {nombreServicio(reserva.tipo_servicio)}
          </Text>

          <Text style={styles.reservaCodigo}>
            Reserva N.º{" "}
            {reserva.numero_reserva || reserva.id}
          </Text>
        </View>
      </View>

      <View style={styles.etiquetas}>
        <Estado reserva={reserva} />

        {estado.clave !== "cancelada" && (
          <View style={styles.etiquetaFecha}>
            <Ionicons
              name={
                proxima
                  ? "calendar-outline"
                  : "time-outline"
              }
              size={15}
              color={GRIS}
            />

            <Text style={styles.etiquetaFechaTexto}>
              {proxima
                ? "Fecha futura"
                : "Fecha pasada"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.divisor} />

      <View style={styles.dato}>
        <Ionicons
          name="calendar-outline"
          size={19}
          color={AZUL}
        />

        <Text style={styles.datoTexto}>
          {fechaTexto(reserva.fecha)}
        </Text>
      </View>

      <View style={styles.dato}>
        <Ionicons
          name="time-outline"
          size={19}
          color={AZUL}
        />

        <Text style={styles.datoTexto}>
          {horaTexto(reserva.hora_inicio)} a{" "}
          {horaTexto(reserva.hora_final)}
        </Text>
      </View>

      <View style={styles.dato}>
        <Ionicons
          name="location-outline"
          size={19}
          color={AZUL}
        />

        <Text style={styles.datoTexto}>
          Mesa:{" "}
          {reserva.mesa_asignada || "Sin asignar"}
        </Text>
      </View>

      <View style={styles.precioFila}>
        <Text style={styles.precioEtiqueta}>
          Precio total
        </Text>

        <Text style={styles.precioValor}>
          {dinero(reserva.precio_total)}
        </Text>
      </View>

      <TouchableOpacity
        style={styles.botonPrincipal}
        onPress={onDetalles}
      >
        <Text style={styles.botonPrincipalTexto}>
          Ver detalles
        </Text>

        <Ionicons
          name="chevron-forward"
          color="#FFFFFF"
          size={18}
        />
      </TouchableOpacity>

      {pendiente && proxima && (
        <>
          <TouchableOpacity
            style={[
              styles.botonPago,
              pagando && styles.botonDeshabilitado,
            ]}
            onPress={onPagar}
            disabled={pagando || verificando}
          >
            {pagando ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Ionicons
                  name="card-outline"
                  size={20}
                  color="#FFFFFF"
                />

                <Text style={styles.botonPagoTexto}>
                  Pagar seña con Mercado Pago
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.botonVerificar,
              verificando && styles.botonDeshabilitado,
            ]}
            onPress={onVerificar}
            disabled={verificando || pagando}
          >
            {verificando ? (
              <ActivityIndicator color={AZUL} />
            ) : (
              <>
                <Ionicons
                  name="checkmark-circle-outline"
                  size={19}
                  color={AZUL}
                />

                <Text style={styles.botonVerificarTexto}>
                  Verificar pago
                </Text>
              </>
            )}
          </TouchableOpacity>

          <Text style={styles.ayudaPago}>
            Pagá únicamente con los medios de prueba
            de Mercado Pago. El estado se actualizará
            después de verificar el pago.
          </Text>
        </>
      )}
    </View>
  );
}

export default function Reservas({ navigation }) {
  const {
    usuario,
    autenticado,
    token,
    consultarReservas,
  } = useAuth();

  const consultarRef = useRef(consultarReservas);
  consultarRef.current = consultarReservas;

  const appStateRef = useRef(AppState.currentState);
  const reservaPagoRef = useRef(null);

  const [reservas, setReservas] = useState([]);
  const [filtro, setFiltro] = useState("proximas");

  const [cargando, setCargando] = useState(false);
  const [actualizando, setActualizando] = useState(false);
  const [consultado, setConsultado] = useState(false);
  const [error, setError] = useState("");

  const [detalle, setDetalle] = useState(null);
  const [pagandoId, setPagandoId] = useState(null);
  const [verificandoId, setVerificandoId] = useState(null);

  const cargarReservas = useCallback(
    async (actualizacion = false) => {
      if (!autenticado || !token) {
        setReservas([]);
        setConsultado(false);
        setError("");
        return;
      }

      if (actualizacion) {
        setActualizando(true);
      } else {
        setCargando(true);
      }

      setError("");

      try {
        const respuesta =
          await consultarRef.current();

        if (!Array.isArray(respuesta?.data)) {
          throw new Error(
            "Laravel no devolvió las reservas correctamente."
          );
        }

        setReservas(respuesta.data);
        setConsultado(true);
      } catch (e) {
        setError(
          e.message ||
            "No se pudieron consultar las reservas."
        );
      } finally {
        setCargando(false);
        setActualizando(false);
      }
    },
    [autenticado, token]
  );

  useFocusEffect(
    useCallback(() => {
      cargarReservas();
    }, [cargarReservas])
  );

  useEffect(() => {
    const suscripcion = AppState.addEventListener(
      "change",
      (nuevoEstado) => {
        const regreso =
          /inactive|background/.test(appStateRef.current) &&
          nuevoEstado === "active";

        appStateRef.current = nuevoEstado;

        if (regreso && reservaPagoRef.current) {
          // Refrescamos al volver del navegador.
          // No damos el pago por aprobado por regresar.
          cargarReservas(true);
        }
      }
    );

    return () => suscripcion.remove();
  }, [cargarReservas]);

  const resumen = useMemo(
    () => ({
      proximas: reservas.filter(
        (r) => clasificar(r) === "proximas"
      ).length,

      pasadas: reservas.filter(
        (r) => clasificar(r) === "pasadas"
      ).length,

      canceladas: reservas.filter(
        (r) => clasificar(r) === "canceladas"
      ).length,
    }),
    [reservas]
  );

  const filtradas = useMemo(
    () =>
      reservas.filter(
        (r) => clasificar(r) === filtro
      ),
    [reservas, filtro]
  );

  const pagarSenia = async (reserva) => {
    if (pagandoId !== null || verificandoId !== null) {
      return;
    }

    if (!autenticado || !token) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás iniciar sesión para pagar."
      );
      return;
    }

    if (
      estadoReserva(reserva).clave !== "pendiente" ||
      clasificar(reserva) !== "proximas"
    ) {
      Alert.alert(
        "Reserva no disponible",
        "Esta reserva no admite un nuevo pago."
      );
      return;
    }

    const bookingId = obtenerId(reserva);

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      Alert.alert(
        "Error",
        "No encontramos el identificador de la reserva."
      );
      return;
    }

    setPagandoId(bookingId);

    try {
      // Laravel obtiene la seña desde MySQL.
      // La app solamente envía el ID de la reserva.
      const respuesta = await fetch(
        `${API}/reservas/movil/pago/preferencia`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            booking_id: bookingId,
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
            "No se pudo preparar el pago."
          )
        );
      }

      const pago = datos?.data;

      if (
        !pago?.preference_id ||
        !enlaceMercadoPago(pago?.url_pago)
      ) {
        throw new Error(
          "Mercado Pago no devolvió un enlace válido."
        );
      }

      const disponible = await Linking.canOpenURL(
        pago.url_pago
      );

      if (!disponible) {
        throw new Error(
          "El iPhone no puede abrir el checkout."
        );
      }

      reservaPagoRef.current = bookingId;

      // Abre el navegador con Checkout Pro.
      await Linking.openURL(pago.url_pago);

    } catch (e) {
      Alert.alert(
        "No se pudo abrir Mercado Pago",
        e.message === "Network request failed"
          ? "No hay conexión con Laravel en el puerto 8001."
          : e.message || "Intentá nuevamente."
      );
    } finally {
      setPagandoId(null);
    }
  };

  const verificarPago = async (reserva) => {
    if (pagandoId !== null || verificandoId !== null) {
      return;
    }

    if (!autenticado || !token) {
      Alert.alert(
        "Iniciá sesión",
        "Necesitás iniciar sesión."
      );
      return;
    }

    const bookingId = obtenerId(reserva);

    if (!Number.isInteger(bookingId) || bookingId < 1) {
      Alert.alert(
        "Error",
        "No encontramos el identificador de la reserva."
      );
      return;
    }

    setVerificandoId(bookingId);

    try {
      const respuesta = await fetch(
        `${API}/reservas/movil/pago/estado?booking_id=${bookingId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

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
        reservaPagoRef.current = null;

        await cargarReservas(true);

        setDetalle(null);

        Alert.alert(
          "¡Reserva confirmada!",
          `Mercado Pago verificó la seña de la reserva N.º ${
            datos.numero_reserva ||
            reserva.numero_reserva ||
            bookingId
          }.\n\nLa reserva ya está confirmada.`,
          [{ text: "Entendido" }]
        );

        return;
      }

      await cargarReservas(true);

      Alert.alert(
        "Pago pendiente",
        "Mercado Pago todavía no informó un pago aprobado para esta reserva. Si acabás de pagar, podés volver a verificar dentro de unos instantes.",
        [{ text: "Entendido" }]
      );
    } catch (e) {
      Alert.alert(
        "No se pudo verificar",
        e.message === "Network request failed"
          ? "No hay conexión con Laravel en el puerto 8001."
          : e.message || "Intentá nuevamente."
      );
    } finally {
      setVerificandoId(null);
    }
  };

  const vacios = {
    proximas: {
      titulo: "No tenés próximas reservas",
      texto:
        "Cuando registres una reserva futura, aparecerá acá.",
    },
    pasadas: {
      titulo: "No tenés reservas pasadas",
      texto: "Tus visitas anteriores aparecerán acá.",
    },
    canceladas: {
      titulo: "No tenés reservas canceladas",
      texto:
        "Las reservas canceladas aparecerán acá.",
    },
  };

  return (
    <View style={styles.pantalla}>
      <StatusBar barStyle="light-content" />

      <View style={styles.header}>
        <Image
          source={require("../../assets/logo1.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />

        <Text style={styles.headerMarca}>
          ESCALONES
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.contenido}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={actualizando}
            onRefresh={() => cargarReservas(true)}
            tintColor={AZUL}
            enabled={autenticado}
          />
        }
      >
        <View style={styles.presentacion}>
          <Text style={styles.etiqueta}>
            ORGANIZÁ TUS VISITAS
          </Text>

          <Text style={styles.tituloPrincipal}>
            Mis reservas
          </Text>

          <View style={styles.lineaAzul} />

          <Text style={styles.descripcionPrincipal}>
            Consultá tus reservas, pagá las señas
            pendientes y verificá los pagos.
          </Text>
        </View>

        {!autenticado ? (
          <View style={styles.tarjetaVacia}>
            <Ionicons
              name="person-circle-outline"
              size={49}
              color={AZUL}
            />

            <Text style={styles.tituloVacio}>
              Iniciá sesión para ver tus reservas
            </Text>

            <Text style={styles.descripcionVacio}>
              Ingresá con tu cuenta de ESCALONES.
            </Text>

            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={() =>
                navigation.navigate("Cuenta")
              }
            >
              <Text style={styles.botonPrincipalTexto}>
                Ir a Mi cuenta
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.seccion}>
            <View style={styles.saludo}>
              <Ionicons
                name="person-circle-outline"
                size={27}
                color={AZUL}
              />

              <View
                style={{
                  flex: 1,
                  marginLeft: 10,
                }}
              >
                <Text style={styles.saludoTitulo}>
                  Hola,{" "}
                  {usuario?.nombre_usuario || "usuario"}
                </Text>

                <Text style={styles.saludoTexto}>
                  Estas son tus reservas en ESCALONES.
                </Text>
              </View>
            </View>

            <Text style={styles.subtitulo}>
              Resumen de reservas
            </Text>

            <View style={styles.grillaResumen}>
              <Resumen
                icono="calendar-outline"
                numero={resumen.proximas}
                titulo="Próximas"
              />

              <Resumen
                icono="time-outline"
                numero={resumen.pasadas}
                titulo="Pasadas"
              />

              <Resumen
                icono="close-circle-outline"
                numero={resumen.canceladas}
                titulo="Canceladas"
              />
            </View>

            <Text style={styles.subtitulo}>
              Historial de reservas
            </Text>

            <View style={styles.filtros}>
              {FILTROS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => setFiltro(item.id)}
                  style={[
                    styles.filtro,
                    filtro === item.id &&
                      styles.filtroActivo,
                  ]}
                >
                  <Text
                    style={[
                      styles.filtroTexto,
                      filtro === item.id &&
                        styles.filtroTextoActivo,
                    ]}
                  >
                    {item.nombre}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {cargando ? (
              <View style={styles.tarjetaVacia}>
                <ActivityIndicator
                  color={AZUL}
                  size="large"
                />

                <Text style={styles.tituloVacio}>
                  Cargando reservas...
                </Text>
              </View>
            ) : error ? (
              <View style={styles.tarjetaVacia}>
                <Ionicons
                  name="alert-circle-outline"
                  color="#B42318"
                  size={42}
                />

                <Text style={styles.tituloVacio}>
                  No pudimos cargar las reservas
                </Text>

                <Text style={styles.descripcionVacio}>
                  {error}
                </Text>

                <TouchableOpacity
                  style={styles.botonPrincipal}
                  onPress={() => cargarReservas()}
                >
                  <Text style={styles.botonPrincipalTexto}>
                    Reintentar
                  </Text>
                </TouchableOpacity>
              </View>
            ) : filtradas.length === 0 ? (
              <View style={styles.tarjetaVacia}>
                <Ionicons
                  name="calendar-outline"
                  size={43}
                  color={AZUL}
                />

                <Text style={styles.tituloVacio}>
                  {vacios[filtro].titulo}
                </Text>

                <Text style={styles.descripcionVacio}>
                  {vacios[filtro].texto}
                </Text>

                {filtro === "proximas" && (
                  <TouchableOpacity
                    style={styles.botonPrincipal}
                    onPress={() =>
                      navigation.navigate("Servicios")
                    }
                  >
                    <Text style={styles.botonPrincipalTexto}>
                      Explorar servicios
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              filtradas.map((reserva) => (
                <TarjetaReserva
                  key={String(reserva.id)}
                  reserva={reserva}
                  onDetalles={() => setDetalle(reserva)}
                  onPagar={() => pagarSenia(reserva)}
                  onVerificar={() =>
                    verificarPago(reserva)
                  }
                  pagando={
                    pagandoId === obtenerId(reserva)
                  }
                  verificando={
                    verificandoId === obtenerId(reserva)
                  }
                />
              ))
            )}

            {!cargando && !error && consultado && (
              <TouchableOpacity
                style={styles.actualizar}
                onPress={() => cargarReservas(true)}
                disabled={actualizando}
              >
                <Ionicons
                  name="refresh-outline"
                  color={AZUL}
                  size={20}
                />

                <Text style={styles.actualizarTexto}>
                  Actualizar mis reservas
                </Text>
              </TouchableOpacity>
            )}

            <View style={styles.informacion}>
              <Ionicons
                name="information-circle-outline"
                size={23}
                color={AZUL}
              />

              <Text style={styles.informacionTexto}>
                Abrir Mercado Pago no confirma
                automáticamente la reserva. El pago
                debe estar aprobado y Laravel debe
                verificarlo para actualizar su estado.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={detalle !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setDetalle(null)}
      >
        <View style={styles.modalPantalla}>
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.modalTitulo}>
                Detalles de reserva
              </Text>

              <Text style={styles.modalSubtitulo}>
                ESCALONES
              </Text>
            </View>

            <TouchableOpacity
              style={styles.cerrar}
              onPress={() => setDetalle(null)}
            >
              <Ionicons
                name="close"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>

          {detalle && (
            <ScrollView
              contentContainerStyle={styles.modalContenido}
            >
              <View style={styles.modalTarjeta}>
                <View style={styles.detalleIcono}>
                  <Ionicons
                    name={iconoServicio(
                      detalle.tipo_servicio
                    )}
                    size={32}
                    color={AZUL}
                  />
                </View>

                <Text style={styles.detalleTitulo}>
                  {nombreServicio(detalle.tipo_servicio)}
                </Text>

                <Text style={styles.detalleCodigo}>
                  Reserva N.º{" "}
                  {detalle.numero_reserva || detalle.id}
                </Text>

                <View style={{ marginTop: 18 }}>
                  <Estado reserva={detalle} />
                </View>

                <View style={styles.divisor} />

                <FilaDetalle
                  icono="calendar-outline"
                  titulo="Fecha"
                  valor={fechaTexto(detalle.fecha)}
                />

                <FilaDetalle
                  icono="time-outline"
                  titulo="Horario"
                  valor={`${horaTexto(
                    detalle.hora_inicio
                  )} a ${horaTexto(
                    detalle.hora_final
                  )}`}
                />

                <FilaDetalle
                  icono="location-outline"
                  titulo="Mesa asignada"
                  valor={
                    detalle.mesa_asignada ||
                    "Sin asignar"
                  }
                />

                <FilaDetalle
                  icono="cash-outline"
                  titulo="Precio total"
                  valor={dinero(detalle.precio_total)}
                />

                {estadoReserva(detalle).clave ===
                  "pendiente" && (
                  <Text style={styles.avisoPendiente}>
                    Esta solicitud todavía no tiene
                    un pago aprobado y verificado.
                    Podés pagar la seña desde la
                    tarjeta de reserva.
                  </Text>
                )}
              </View>

              <TouchableOpacity
                style={styles.botonPrincipal}
                onPress={() => setDetalle(null)}
              >
                <Text style={styles.botonPrincipalTexto}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
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

  headerLogo: {
    width: 45,
    height: 45,
    marginRight: 10,
  },

  headerMarca: {
    color: "#FFFFFF",
    fontSize: 26,
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

  seccion: {
    paddingHorizontal: 18,
    paddingTop: 20,
  },

  saludo: {
    backgroundColor: "#EAF5FE",
    borderRadius: 13,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 26,
  },

  saludoTitulo: {
    color: OSCURO,
    fontSize: 15,
    fontWeight: "bold",
  },

  saludoTexto: {
    color: GRIS,
    fontSize: 12,
    lineHeight: 19,
    marginTop: 4,
  },

  subtitulo: {
    color: OSCURO,
    fontSize: 19,
    fontWeight: "bold",
    marginBottom: 17,
  },

  grillaResumen: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },

  tarjetaResumen: {
    width: "31.5%",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 14,
    paddingVertical: 17,
    paddingHorizontal: 6,
    alignItems: "center",
  },

  iconoResumen: {
    backgroundColor: "#EAF5FE",
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },

  numeroResumen: {
    color: OSCURO,
    fontSize: 29,
    fontWeight: "bold",
    marginBottom: 5,
  },

  textoResumen: {
    color: GRIS,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },

  filtros: {
    backgroundColor: "#E6EEF5",
    padding: 5,
    borderRadius: 12,
    flexDirection: "row",
    marginBottom: 19,
  },

  filtro: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 9,
    alignItems: "center",
  },

  filtroActivo: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DCE7F0",
  },

  filtroTexto: {
    color: GRIS,
    fontSize: 13,
    fontWeight: "600",
  },

  filtroTextoActivo: {
    color: AZUL,
    fontWeight: "bold",
  },

  tarjetaVacia: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 17,
    paddingHorizontal: 20,
    paddingVertical: 32,
    marginBottom: 18,
    alignItems: "center",
  },

  tituloVacio: {
    color: OSCURO,
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 11,
  },

  descripcionVacio: {
    color: GRIS,
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    marginBottom: 20,
  },

  tarjetaReserva: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 16,
    padding: 18,
    marginBottom: 15,
  },

  reservaEncabezado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },

  reservaIcono: {
    backgroundColor: "#EAF5FE",
    width: 45,
    height: 45,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  reservaTitulo: {
    color: OSCURO,
    fontSize: 17,
    fontWeight: "bold",
  },

  reservaCodigo: {
    color: GRIS,
    fontSize: 12,
    marginTop: 5,
  },

  etiquetas: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    marginBottom: 14,
  },

  estado: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 11,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 7,
    marginBottom: 5,
  },

  estadoTexto: {
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },

  etiquetaFecha: {
    backgroundColor: "#EAF0F5",
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 11,
    marginBottom: 5,
  },

  etiquetaFechaTexto: {
    color: GRIS,
    fontWeight: "bold",
    fontSize: 12,
    marginLeft: 6,
  },

  divisor: {
    height: 1,
    backgroundColor: "#E7EDF2",
    marginVertical: 15,
  },

  dato: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  datoTexto: {
    color: GRIS,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
  },

  precioFila: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 5,
    marginBottom: 16,
  },

  precioEtiqueta: {
    color: GRIS,
    fontSize: 13,
  },

  precioValor: {
    color: OSCURO,
    fontSize: 16,
    fontWeight: "bold",
  },

  botonPrincipal: {
    backgroundColor: AZUL,
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  botonPrincipalTexto: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "bold",
    textAlign: "center",
    marginRight: 5,
  },

  botonPago: {
    backgroundColor: "#176D3C",
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 14,
    marginTop: 11,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  botonPagoTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
    flexShrink: 1,
    textAlign: "center",
  },

  botonVerificar: {
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: AZUL,
    minHeight: 49,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  botonVerificarTexto: {
    color: AZUL,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 8,
  },

  botonDeshabilitado: {
    opacity: 0.5,
  },

  ayudaPago: {
    fontSize: 11,
    color: GRIS,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 12,
  },

  actualizar: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  actualizarTexto: {
    color: AZUL,
    fontSize: 14,
    fontWeight: "bold",
    marginLeft: 7,
  },

  informacion: {
    flexDirection: "row",
    backgroundColor: "#EAF5FE",
    borderRadius: 13,
    padding: 17,
    marginTop: 12,
    marginBottom: 15,
  },

  informacionTexto: {
    flex: 1,
    color: GRIS,
    fontSize: 12,
    lineHeight: 20,
    marginLeft: 10,
  },

  modalPantalla: {
    flex: 1,
    backgroundColor: FONDO,
  },

  modalHeader: {
    backgroundColor: AZUL,
    paddingTop:
      Platform.OS === "ios" ? 25 : 45,
    paddingBottom: 20,
    paddingHorizontal: 21,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalTitulo: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },

  modalSubtitulo: {
    color: "#D9EEFF",
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 1,
  },

  cerrar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    justifyContent: "center",
    alignItems: "center",
  },

  modalContenido: {
    padding: 20,
    paddingBottom: 45,
  },

  modalTarjeta: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E1E8EF",
    padding: 20,
    marginBottom: 20,
  },

  detalleIcono: {
    width: 60,
    height: 60,
    borderRadius: 17,
    backgroundColor: "#EAF5FE",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },

  detalleTitulo: {
    color: OSCURO,
    fontSize: 21,
    fontWeight: "bold",
  },

  detalleCodigo: {
    color: GRIS,
    fontSize: 13,
    marginTop: 6,
  },

  filaDetalle: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 18,
  },

  filaEtiqueta: {
    color: GRIS,
    fontSize: 12,
    marginBottom: 5,
  },

  filaValor: {
    color: OSCURO,
    fontSize: 15,
    fontWeight: "bold",
  },

  avisoPendiente: {
    backgroundColor: "#FFF4DE",
    borderRadius: 10,
    padding: 14,
    color: "#986000",
    fontSize: 12,
    lineHeight: 19,
  },
});
