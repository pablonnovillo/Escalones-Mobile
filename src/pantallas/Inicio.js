
import React, { useState } from "react";
import {
  View,
  Text,
  Image,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  StatusBar,
  Linking,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { WebView } from "react-native-webview";

const AZUL = "#0071BC";
const VIDEO_ID = "VpkyIQoWAbw";
const VIDEO_URL = `https://www.youtube.com/watch?v=${VIDEO_ID}`;

const URL_IMAGENES = "http://192.168.1.5:5173/images";
const API_URL = "http://192.168.1.5:8000/api";

const REFERER_APP =
  "https://github.com/pablonnovillo/Escalones";

const EMAIL_LOCAL = "escalonesar@gmail.com";
const TELEFONO_LOCAL = "+5491168654741";
const DIRECCION_LOCAL =
  "Av. Alvarez Thomas 3971, CABA, Argentina";

const DIRECCION_MAPA = encodeURIComponent(DIRECCION_LOCAL);

const MAPA_URL =
  `https://www.google.com/maps/search/?api=1&query=${DIRECCION_MAPA}`;

const MAPA_EMBED =
  `https://maps.google.com/maps?q=${DIRECCION_MAPA}&z=16&output=embed`;

const preguntas = [
  {
    id: 1,
    pregunta: "¿Cómo funcionan las entregas?",
    respuesta:
      "Realizamos entregas de los pedidos de impresión según la disponibilidad y ubicación. Al realizar tu pedido te informaremos las opciones de entrega disponibles.",
  },
  {
    id: 2,
    pregunta: "¿Cuáles son los métodos de pago?",
    respuesta:
      "Podés abonar tus pedidos y reservas utilizando los medios de pago disponibles en nuestra tienda online.",
  },
  {
    id: 3,
    pregunta: "¿Qué servicios se pueden reservar?",
    respuesta:
      "Podés reservar los espacios y servicios disponibles de Escalones, según los horarios y la disponibilidad del momento.",
  },
  {
    id: 4,
    pregunta: "¿Hay descuentos para estudiantes?",
    respuesta:
      "Sí, contamos con beneficios y descuentos para estudiantes. Consultanos para conocer las promociones disponibles.",
  },
];

const socios = [
  { nombre: "Canon", imagen: "CANON.png" },
  { nombre: "Universidad de Belgrano", imagen: "UB.jpg" },
  { nombre: "HP", imagen: "hp.png" },
  { nombre: "Da Vinci", imagen: "da-vinci.jpg" },
];

const motivos = ["Pedido", "Reserva", "Pago", "Otro"];

export default function Inicio({ navigation }) {
  const [preguntaAbierta, setPreguntaAbierta] = useState(null);
  const [altoPantalla, setAltoPantalla] = useState(0);
  const [altoHeader, setAltoHeader] = useState(0);
  const [mapaError, setMapaError] = useState(false);

  const [contactoVisible, setContactoVisible] = useState(false);
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [celular, setCelular] = useState("");
  const [motivo, setMotivo] = useState("Otro");
  const [mensaje, setMensaje] = useState("");
  const [enviando, setEnviando] = useState(false);

  const altoPortada =
    altoPantalla > 0 && altoHeader > 0
      ? Math.max(altoPantalla - altoHeader, 400)
      : 590;

  const abrirEnlace = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert(
        "No se pudo abrir",
        "Intentá nuevamente desde tu celular."
      );
    }
  };

  const cerrarContacto = () => {
    if (!enviando) {
      setContactoVisible(false);
    }
  };

  const enviarContacto = async () => {
    if (enviando) return;

    const nombreLimpio = nombre.trim();
    const emailLimpio = email.trim();
    const celularLimpio = celular.trim();
    const mensajeLimpio = mensaje.trim();

    if (
      !nombreLimpio ||
      !emailLimpio ||
      !celularLimpio ||
      !mensajeLimpio
    ) {
      Alert.alert(
        "Faltan datos",
        "Completá tu nombre, correo, celular y mensaje."
      );
      return;
    }

    const emailValido =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpio);

    if (!emailValido) {
      Alert.alert(
        "Correo incorrecto",
        "Ingresá un correo electrónico válido."
      );
      return;
    }

    const digitos = celularLimpio.replace(/\D/g, "");

    if (digitos.length < 8 || digitos.length > 15) {
      Alert.alert(
        "Celular incorrecto",
        "Ingresá un número de celular válido, con código de área."
      );
      return;
    }

    setEnviando(true);

    try {
      const mensajeCompleto =
        `Motivo: ${motivo}\n` +
        `Celular: ${celularLimpio}\n\n` +
        `Consulta:\n${mensajeLimpio}`;

      const respuesta = await fetch(`${API_URL}/contacto`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          nombre: nombreLimpio,
          email: emailLimpio,
          mensaje: mensajeCompleto,
        }),
      });

      const datos = await respuesta.json().catch(() => ({}));

      if (!respuesta.ok) {
        throw new Error(
          datos.message || "No se pudo registrar la consulta."
        );
      }

      setContactoVisible(false);
      setNombre("");
      setEmail("");
      setCelular("");
      setMotivo("Otro");
      setMensaje("");

      Alert.alert(
        "Consulta registrada",
        "Tu consulta fue registrada correctamente."
      );
    } catch (error) {
      Alert.alert(
        "No se pudo enviar",
        error.message === "Network request failed"
          ? "No se pudo conectar con Laravel. Comprobá que el servidor esté funcionando y que el celular esté en la misma red."
          : error.message || "Intentá nuevamente."
      );
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View
      style={styles.container}
      onLayout={(event) =>
        setAltoPantalla(event.nativeEvent.layout.height)
      }
    >
      <StatusBar barStyle="light-content" />

      {/* ENCABEZADO */}
      <View
        style={styles.header}
        onLayout={(event) =>
          setAltoHeader(event.nativeEvent.layout.height)
        }
      >
        <Image
          source={require("../../assets/logo1.png")}
          style={styles.headerLogo}
          resizeMode="contain"
        />
        <Text style={styles.headerTitle}>ESCALONES</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* PORTADA ORIGINAL */}
        <ImageBackground
          source={require("../../assets/portada3.jpg")}
          style={[
            styles.portada,
            { minHeight: altoPortada },
          ]}
          resizeMode="cover"
          imageStyle={{
            transform: [{ scale: 1.2 }],
          }}
        >
          <View style={styles.overlay}>
            <Image
              source={require("../../assets/logo1.png")}
              style={styles.logo}
              resizeMode="contain"
            />

            <View style={styles.separador} />

            <Text style={styles.titulo}>
              Imprenta, bar, espacio creativo
            </Text>

            <Text style={styles.subtitulo}>
              Abierto 24 horas
            </Text>

            <Text style={styles.descripcion}>
              Pedí tus impresiones, reservá tu espacio
              {"\n"}o pasá a jugar un rato
            </Text>

            <TouchableOpacity
              style={styles.botonPrincipal}
              onPress={() => navigation.navigate("Servicios")}
            >
              <Text style={styles.textoPrincipal}>
                Hacé tu pedido
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.botonSecundario}
              onPress={() => navigation.navigate("Tienda")}
            >
              <Text style={styles.textoSecundario}>
                Ir a la tienda
              </Text>
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* SOBRE NOSOTROS */}
        <View style={styles.sobreNosotros}>
          <Text style={styles.etiqueta}>
            NUESTRA HISTORIA
          </Text>

          <Text style={styles.tituloSeccion}>
            Sobre nosotros
          </Text>

          <View style={styles.lineaAzul} />

          <Text style={styles.parrafo}>
            ESCALONES es un espacio innovador abierto
            las 24 horas, donde la imprenta se fusiona
            con un ambiente de bar y recreación.
          </Text>

          <Text style={styles.parrafo}>
            Fundado por Pablo Novillo y Sabrina Gigena,
            combinamos tecnología de impresión rápida,
            café de especialidad y zonas de ocio
            para que puedas estudiar, trabajar o
            desconectarte a cualquier hora.
          </Text>

          <View style={styles.mision}>
            <Text style={styles.misionTitulo}>
              Nuestra misión
            </Text>
            <Text style={styles.misionTexto}>
              Ofrecer un entorno cómodo y seguro,
              donde cada persona pueda avanzar
              en sus proyectos y disfrutar de
              un momento de ocio.
            </Text>
          </View>

          <Text style={styles.slogan}>
            Estudiá. Imprimí. Jugá.
          </Text>
        </View>

        {/* VIDEO DE YOUTUBE */}
        <View style={styles.seccionVideo}>
          <Text style={styles.etiquetaVideo}>
            DESCUBRÍ ESCALONES
          </Text>

          <Text style={styles.tituloVideo}>
            Mucho más que una imprenta
          </Text>

          <Text style={styles.subtituloVideo}>
            Un lugar para estudiar, trabajar
            y disfrutar, a cualquier hora.
          </Text>

          <View style={styles.tarjetaVideo}>
            <View style={styles.videoHeader}>
              <View style={styles.puntoRojo} />
              <Text style={styles.videoHeaderTexto}>
                CONOCÉ NUESTRO ESPACIO
              </Text>
            </View>

            <View style={styles.videoContenedor}>
              <WebView
                source={{
                  uri:
                    `https://www.youtube.com/embed/${VIDEO_ID}?playsinline=1`,
                  headers: {
                    Referer: REFERER_APP,
                  },
                }}
                style={styles.video}
                javaScriptEnabled={true}
                domStorageEnabled={true}
                allowsFullscreenVideo={true}
                allowsInlineMediaPlayback={true}
                mediaPlaybackRequiresUserAction={true}
                scrollEnabled={false}
              />
            </View>

            <TouchableOpacity
              style={styles.youtubeFooter}
              onPress={() => abrirEnlace(VIDEO_URL)}
              activeOpacity={0.8}
            >
              <Text style={styles.youtubeFooterTexto}>
                Ver video en YouTube
              </Text>
              <Text style={styles.youtubeFlecha}>↗</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* PREGUNTAS FRECUENTES */}
        <View style={styles.seccionFaq}>
          <Text style={styles.etiqueta}>TE AYUDAMOS</Text>

          <Text style={styles.tituloSeccion}>
            Preguntas frecuentes
          </Text>

          <View style={styles.lineaAzul} />

          {preguntas.map((item) => {
            const abierta = preguntaAbierta === item.id;

            return (
              <View
                key={item.id}
                style={styles.tarjetaPregunta}
              >
                <TouchableOpacity
                  style={styles.encabezadoPregunta}
                  onPress={() =>
                    setPreguntaAbierta(
                      abierta ? null : item.id
                    )
                  }
                  activeOpacity={0.8}
                >
                  <Text style={styles.textoPregunta}>
                    {item.pregunta}
                  </Text>

                  <Text style={styles.signoPregunta}>
                    {abierta ? "−" : "+"}
                  </Text>
                </TouchableOpacity>

                {abierta && (
                  <Text style={styles.respuesta}>
                    {item.respuesta}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        {/* SOCIOS DE LA MARCA */}
        <View style={styles.seccionSocios}>
          <Text style={styles.etiqueta}>
            QUIÉNES NOS ACOMPAÑAN
          </Text>

          <Text style={styles.tituloSeccion}>
            Socios de la marca
          </Text>

          <View style={styles.lineaAzul} />

          <View style={styles.grillaSocios}>
            {socios.map((socio) => (
              <View
                key={socio.nombre}
                style={styles.tarjetaSocio}
              >
                <Image
                  source={{
                    uri:
                      `${URL_IMAGENES}/socios/${socio.imagen}`,
                  }}
                  style={styles.imagenSocio}
                  resizeMode="contain"
                  accessibilityLabel={socio.nombre}
                />
              </View>
            ))}
          </View>
        </View>

        {/* NUESTRO LOCAL */}
        <View style={styles.seccionLocal}>
          <Text style={styles.etiqueta}>
            VISITANOS
          </Text>

          <Text style={styles.tituloSeccion}>
            Nuestro local
          </Text>

          <View style={styles.lineaAzul} />

          <Text style={styles.descripcionLocal}>
            Encontranos en Buenos Aires.
            ESCALONES está pensado para acompañarte
            a cualquier hora del día.
          </Text>

          {/* UNA SOLA TARJETA */}
          <View style={styles.tarjetaLocal}>

            {/* HORARIOS */}
            <View style={styles.datoLocal}>
              <Text style={styles.datoIcono}>◷</Text>
              <View style={styles.datoContenido}>
                <Text style={styles.datoTitulo}>
                  Horarios de atención
                </Text>
                <Text style={styles.datoValor}>
                  Abierto las 24 horas
                </Text>
              </View>
            </View>

            <View style={styles.divisorLocal} />

            {/* CORREO */}
            <TouchableOpacity
              style={styles.datoLocal}
              onPress={() =>
                abrirEnlace(`mailto:${EMAIL_LOCAL}`)
              }
            >
              <Text style={styles.datoIcono}>✉</Text>
              <View style={styles.datoContenido}>
                <Text style={styles.datoTitulo}>
                  Correo electrónico
                </Text>
                <Text style={styles.datoValor}>
                  {EMAIL_LOCAL}
                </Text>
              </View>
              <Text style={styles.enlaceFlecha}>↗</Text>
            </TouchableOpacity>

            <View style={styles.divisorLocal} />

            {/* TELÉFONO */}
            <TouchableOpacity
              style={styles.datoLocal}
              onPress={() =>
                abrirEnlace(`tel:${TELEFONO_LOCAL}`)
              }
            >
              <Text style={styles.datoIcono}>☎</Text>
              <View style={styles.datoContenido}>
                <Text style={styles.datoTitulo}>
                  Teléfono
                </Text>
                <Text style={styles.datoValor}>
                  +54 9 11 6865-4741
                </Text>
              </View>
              <Text style={styles.enlaceFlecha}>↗</Text>
            </TouchableOpacity>

            <View style={styles.divisorLocal} />

            {/* DIRECCIÓN */}
            <TouchableOpacity
              style={styles.datoLocal}
              onPress={() => abrirEnlace(MAPA_URL)}
            >
              <Text style={styles.datoIcono}>⌖</Text>
              <View style={styles.datoContenido}>
                <Text style={styles.datoTitulo}>
                  Dirección
                </Text>
                <Text style={styles.datoValor}>
                  {DIRECCION_LOCAL}
                </Text>
              </View>
              <Text style={styles.enlaceFlecha}>↗</Text>
            </TouchableOpacity>

            {/* MAPA DENTRO DE LA MISMA TARJETA */}
            <View style={styles.mapaEnTarjeta}>
              {mapaError ? (
                <TouchableOpacity
                  style={styles.mapaAlternativo}
                  onPress={() => abrirEnlace(MAPA_URL)}
                >
                  <Text style={styles.mapaIcono}>⌖</Text>
                  <Text style={styles.mapaErrorTexto}>
                    Tocá para ver la ubicación
                    en Google Maps
                  </Text>
                </TouchableOpacity>
              ) : (
                <WebView
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta
                            name="viewport"
                            content="width=device-width, initial-scale=1.0"
                          >
                          <style>
                            html, body {
                              margin: 0;
                              padding: 0;
                              width: 100%;
                              height: 100%;
                              overflow: hidden;
                            }
                            iframe {
                              width: 100%;
                              height: 100%;
                              border: 0;
                            }
                          </style>
                        </head>
                        <body>
                          <iframe
                            src="${MAPA_EMBED}"
                            allowfullscreen
                            loading="eager">
                          </iframe>
                        </body>
                      </html>
                    `,
                    baseUrl: "https://maps.google.com",
                  }}
                  style={styles.mapaWeb}
                  javaScriptEnabled={true}
                  domStorageEnabled={true}
                  scrollEnabled={false}
                  onError={() => setMapaError(true)}
                />
              )}
            </View>
          </View>
        </View>

        {/* AYUDA Y CONTACTO - AL FINAL */}
        <View style={styles.seccionContacto}>
          <View style={styles.iconoAyuda}>
            <Text style={styles.iconoAyudaTexto}>?</Text>
          </View>

          <Text style={styles.tituloContacto}>
            ¿Necesitás ayuda?
          </Text>

          <Text style={styles.descripcionContacto}>
            ¿Tuviste algún inconveniente con un pedido,
            una reserva o nuestros servicios?
            Estamos para ayudarte.
          </Text>

          <TouchableOpacity
            style={styles.botonContacto}
            onPress={() => setContactoVisible(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.botonContactoTexto}>
              Contactanos
            </Text>
          </TouchableOpacity>

          <Text style={styles.contactoHorario}>
            ESCALONES · Abierto 24 horas
          </Text>
        </View>
      </ScrollView>

      {/* FORMULARIO DE CONTACTO */}
      <Modal
        visible={contactoVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={cerrarContacto}
      >
        <KeyboardAvoidingView
          style={styles.modalPrincipal}
          behavior={
            Platform.OS === "ios" ? "padding" : undefined
          }
        >
          <View style={styles.modalEncabezado}>
            <View style={styles.modalEncabezadoTexto}>
              <Text style={styles.modalTitulo}>
                Ayuda y contacto
              </Text>
              <Text style={styles.modalSubtitulo}>
                ESCALONES
              </Text>
            </View>

            <TouchableOpacity
              onPress={cerrarContacto}
              disabled={enviando}
              style={styles.cerrarModal}
            >
              <Text style={styles.cerrarModalTexto}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScroll}
            contentContainerStyle={styles.modalContenido}
            keyboardShouldPersistTaps="handled"
          >
            <Text style={styles.formDescripcion}>
              Completá el formulario y contanos
              en qué podemos ayudarte.
            </Text>

            <Text style={styles.campoEtiqueta}>
              Nombre y apellido *
            </Text>
            <TextInput
              style={styles.campo}
              value={nombre}
              onChangeText={setNombre}
              placeholder="Tu nombre completo"
              placeholderTextColor="#94A3B0"
              autoCapitalize="words"
              maxLength={60}
              editable={!enviando}
            />

            <Text style={styles.campoEtiqueta}>
              Correo electrónico *
            </Text>
            <TextInput
              style={styles.campo}
              value={email}
              onChangeText={setEmail}
              placeholder="ejemplo@correo.com"
              placeholderTextColor="#94A3B0"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={60}
              editable={!enviando}
            />

            <Text style={styles.campoEtiqueta}>
              Número de celular *
            </Text>
            <TextInput
              style={styles.campo}
              value={celular}
              onChangeText={setCelular}
              placeholder="Ej.: 11 1234-5678"
              placeholderTextColor="#94A3B0"
              keyboardType="phone-pad"
              autoComplete="tel"
              maxLength={25}
              editable={!enviando}
            />

            <Text style={styles.campoEtiqueta}>
              Motivo de la consulta
            </Text>
            <View style={styles.opcionesMotivo}>
              {motivos.map((opcion) => {
                const activo = motivo === opcion;

                return (
                  <TouchableOpacity
                    key={opcion}
                    onPress={() => setMotivo(opcion)}
                    disabled={enviando}
                    style={[
                      styles.opcionMotivo,
                      activo && styles.opcionActiva,
                    ]}
                  >
                    <Text
                      style={[
                        styles.opcionTexto,
                        activo && styles.opcionTextoActiva,
                      ]}
                    >
                      {opcion}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.campoEtiqueta}>
              Tu mensaje *
            </Text>
            <TextInput
              style={[
                styles.campo,
                styles.campoMensaje,
              ]}
              value={mensaje}
              onChangeText={setMensaje}
              placeholder="Explicanos en qué podemos ayudarte..."
              placeholderTextColor="#94A3B0"
              multiline
              textAlignVertical="top"
              maxLength={2000}
              editable={!enviando}
            />

            <Text style={styles.camposObligatorios}>
              * Campos obligatorios
            </Text>

            <TouchableOpacity
              style={[
                styles.botonEnviar,
                enviando && styles.botonDeshabilitado,
              ]}
              onPress={enviarContacto}
              disabled={enviando}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.botonEnviarTexto}>
                  Enviar consulta
                </Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AZUL,
  },

  header: {
    paddingTop: 65,
    paddingBottom: 15,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: AZUL,
  },

  headerLogo: {
    width: 45,
    height: 45,
    marginRight: 10,
  },

  headerTitle: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
  },

  scroll: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  portada: {
    width: "100%",
    overflow: "hidden",
  },

  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
    paddingVertical: 35,
  },

  logo: {
    width: 120,
    height: 120,
    marginBottom: 15,
  },

  separador: {
    height: 1,
    width: "85%",
    backgroundColor: "#FFFFFF",
    marginBottom: 25,
  },

  titulo: {
    color: "#FFFFFF",
    fontSize: 27,
    fontWeight: "bold",
    textAlign: "center",
  },

  subtitulo: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 10,
  },

  descripcion: {
    color: "#FFFFFF",
    fontSize: 17,
    textAlign: "center",
    marginTop: 25,
    marginBottom: 30,
    lineHeight: 25,
  },

  botonPrincipal: {
    backgroundColor: AZUL,
    paddingVertical: 15,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
    marginBottom: 15,
  },

  textoPrincipal: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },

  botonSecundario: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 15,
    borderRadius: 12,
    width: "85%",
    alignItems: "center",
  },

  textoSecundario: {
    color: AZUL,
    fontSize: 18,
    fontWeight: "bold",
  },

  // SOBRE NOSOTROS
  sobreNosotros: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 25,
    paddingTop: 48,
    paddingBottom: 42,
  },

  etiqueta: {
    fontSize: 11,
    color: AZUL,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 10,
  },

  tituloSeccion: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#123A57",
    textAlign: "center",
  },

  lineaAzul: {
    width: 55,
    height: 4,
    borderRadius: 3,
    backgroundColor: AZUL,
    alignSelf: "center",
    marginTop: 14,
    marginBottom: 25,
  },

  parrafo: {
    fontSize: 16,
    color: "#425466",
    lineHeight: 27,
    marginBottom: 17,
  },

  mision: {
    backgroundColor: "#F0F7FC",
    borderLeftWidth: 4,
    borderLeftColor: AZUL,
    padding: 20,
    borderRadius: 12,
    marginTop: 8,
  },

  misionTitulo: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#123A57",
    marginBottom: 9,
  },

  misionTexto: {
    fontSize: 15,
    lineHeight: 24,
    color: "#425466",
  },

  slogan: {
    fontSize: 19,
    fontWeight: "bold",
    color: AZUL,
    textAlign: "center",
    marginTop: 30,
  },

  // VIDEO
  seccionVideo: {
    paddingHorizontal: 22,
    paddingTop: 43,
    paddingBottom: 48,
    backgroundColor: "#071D30",
  },

  etiquetaVideo: {
    color: "#68C1FF",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    textAlign: "center",
    marginBottom: 13,
  },

  tituloVideo: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "bold",
    textAlign: "center",
    lineHeight: 34,
  },

  subtituloVideo: {
    fontSize: 15,
    lineHeight: 23,
    textAlign: "center",
    color: "#B7CBD9",
    marginTop: 12,
    marginBottom: 28,
  },

  tarjetaVideo: {
    borderRadius: 17,
    overflow: "hidden",
    backgroundColor: "#102B40",
    borderWidth: 1,
    borderColor: "#29475D",
  },

  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 14,
  },

  puntoRojo: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#FF4444",
    marginRight: 10,
  },

  videoHeaderTexto: {
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1,
    color: "#FFFFFF",
  },

  videoContenedor: {
    width: "100%",
    aspectRatio: 16 / 9,
    backgroundColor: "#000000",
  },

  video: {
    flex: 1,
    backgroundColor: "#000000",
  },

  youtubeFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 17,
    paddingVertical: 16,
  },

  youtubeFooterTexto: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "bold",
  },

  youtubeFlecha: {
    fontSize: 22,
    color: "#68C1FF",
  },

  // PREGUNTAS FRECUENTES
  seccionFaq: {
    paddingHorizontal: 22,
    paddingVertical: 45,
    backgroundColor: "#FFFFFF",
  },

  tarjetaPregunta: {
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: "#FFFFFF",
    overflow: "hidden",
  },

  encabezadoPregunta: {
    padding: 17,
    flexDirection: "row",
    alignItems: "center",
  },

  textoPregunta: {
    flex: 1,
    color: "#123A57",
    fontSize: 15,
    fontWeight: "bold",
    lineHeight: 22,
  },

  signoPregunta: {
    color: AZUL,
    fontSize: 24,
    marginLeft: 12,
  },

  respuesta: {
    paddingHorizontal: 17,
    paddingBottom: 18,
    fontSize: 14,
    color: "#526473",
    lineHeight: 23,
  },

  // SOCIOS
  seccionSocios: {
    backgroundColor: "#F4F8FB",
    paddingHorizontal: 22,
    paddingTop: 45,
    paddingBottom: 55,
  },

  grillaSocios: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  tarjetaSocio: {
    width: "48%",
    height: 110,
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E9F0",
    borderRadius: 13,
    padding: 13,
    alignItems: "center",
    justifyContent: "center",
  },

  imagenSocio: {
    width: "100%",
    height: "100%",
  },

  // NUESTRO LOCAL
  seccionLocal: {
    backgroundColor: "#F4F8FB",
    paddingHorizontal: 22,
    paddingTop: 42,
    paddingBottom: 50,
  },

  descripcionLocal: {
    fontSize: 15,
    color: "#526473",
    lineHeight: 24,
    textAlign: "center",
    marginBottom: 23,
  },

  tarjetaLocal: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0E9F0",
    borderRadius: 17,
    paddingHorizontal: 17,
    paddingTop: 6,
    paddingBottom: 18,
  },

  datoLocal: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },

  datoIcono: {
    width: 34,
    fontSize: 26,
    color: AZUL,
    textAlign: "center",
    marginRight: 13,
  },

  datoContenido: {
    flex: 1,
    gap: 4,
  },

  datoTitulo: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#123A57",
  },

  datoValor: {
    fontSize: 14,
    color: "#526473",
    lineHeight: 21,
  },

  divisorLocal: {
    height: 1,
    backgroundColor: "#EDF1F5",
  },

  enlaceFlecha: {
    color: AZUL,
    fontSize: 20,
    marginLeft: 8,
  },

  // MAPA INTEGRADO EN LA MISMA TARJETA
  mapaEnTarjeta: {
    width: "100%",
    height: 230,
    marginTop: 10,
    backgroundColor: "#E7EDF1",
    borderRadius: 12,
    overflow: "hidden",
  },

  mapaWeb: {
    flex: 1,
    backgroundColor: "#E7EDF1",
  },

  mapaAlternativo: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 25,
  },

  mapaIcono: {
    color: AZUL,
    fontSize: 40,
    marginBottom: 12,
  },

  mapaErrorTexto: {
    fontSize: 15,
    lineHeight: 23,
    color: "#526473",
    textAlign: "center",
  },

  botonMapa: {
    backgroundColor: AZUL,
    borderRadius: 12,
    marginTop: 19,
    paddingHorizontal: 12,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },

  botonMapaTexto: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "bold",
    flexShrink: 1,
    textAlign: "center",
  },

  botonMapaFlecha: {
    color: "#FFFFFF",
    fontSize: 20,
    marginLeft: 8,
  },

  // AYUDA Y CONTACTO
  seccionContacto: {
    paddingHorizontal: 25,
    paddingTop: 48,
    paddingBottom: 60,
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },

  iconoAyuda: {
    width: 65,
    height: 65,
    borderRadius: 33,
    backgroundColor: "#E6F3FC",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 18,
  },

  iconoAyudaTexto: {
    color: AZUL,
    fontSize: 36,
    fontWeight: "bold",
  },

  tituloContacto: {
    fontSize: 25,
    fontWeight: "bold",
    color: "#123A57",
    textAlign: "center",
  },

  descripcionContacto: {
    fontSize: 15,
    lineHeight: 24,
    color: "#526473",
    textAlign: "center",
    marginTop: 15,
    marginBottom: 25,
  },

  botonContacto: {
    backgroundColor: AZUL,
    borderRadius: 12,
    paddingVertical: 16,
    width: "100%",
    alignItems: "center",
  },

  botonContactoTexto: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "bold",
  },

  contactoHorario: {
    color: "#63788A",
    fontSize: 13,
    marginTop: 23,
    textAlign: "center",
  },

  // FORMULARIO
  modalPrincipal: {
    flex: 1,
    backgroundColor: "#F6F9FC",
  },

  modalEncabezado: {
    backgroundColor: AZUL,
    paddingTop: Platform.OS === "android" ? 45 : 25,
    paddingHorizontal: 22,
    paddingBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  modalEncabezadoTexto: {
    flex: 1,
  },

  modalTitulo: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
  },

  modalSubtitulo: {
    color: "#D9EEFF",
    fontSize: 12,
    marginTop: 5,
    letterSpacing: 1,
  },

  cerrarModal: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

  cerrarModalTexto: {
    fontSize: 19,
    fontWeight: "bold",
    color: "#FFFFFF",
  },

  modalScroll: {
    flex: 1,
  },

  modalContenido: {
    padding: 23,
    paddingBottom: 55,
  },

  formDescripcion: {
    fontSize: 15,
    lineHeight: 24,
    color: "#526473",
    marginBottom: 25,
  },

  campoEtiqueta: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#123A57",
    marginBottom: 9,
  },

  campo: {
    borderWidth: 1,
    borderColor: "#D9E3EC",
    backgroundColor: "#FFFFFF",
    color: "#123A57",
    borderRadius: 11,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    marginBottom: 22,
  },

  campoMensaje: {
    minHeight: 140,
    paddingTop: 15,
  },

  opcionesMotivo: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 22,
  },

  opcionMotivo: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#C9D9E6",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    marginBottom: 8,
  },

  opcionActiva: {
    backgroundColor: AZUL,
    borderColor: AZUL,
  },

  opcionTexto: {
    color: "#526473",
    fontSize: 13,
    fontWeight: "600",
  },

  opcionTextoActiva: {
    color: "#FFFFFF",
  },

  camposObligatorios: {
    color: "#63788A",
    fontSize: 12,
    marginBottom: 20,
  },

  botonEnviar: {
    backgroundColor: AZUL,
    borderRadius: 12,
    paddingVertical: 17,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },

  botonDeshabilitado: {
    opacity: 0.65,
  },

  botonEnviarTexto: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
});
