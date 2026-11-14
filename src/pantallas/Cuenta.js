
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";

const AZUL = "#0071BC";
const OSCURO = "#123A57";
const GRIS = "#526473";
const FONDO = "#F4F8FB";

function Boton({
  titulo,
  onPress,
  secundario = false,
  cargando = false,
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={cargando}
      activeOpacity={0.85}
      style={[
        styles.boton,
        secundario && styles.botonSecundario,
        cargando && { opacity: 0.6 },
      ]}
    >
      {cargando ? (
        <ActivityIndicator
          color={secundario ? AZUL : "#FFFFFF"}
        />
      ) : (
        <Text
          style={[
            styles.botonTexto,
            secundario && styles.botonTextoSecundario,
          ]}
        >
          {titulo}
        </Text>
      )}
    </TouchableOpacity>
  );
}

function Campo({
  titulo,
  valor,
  onChangeText,
  placeholder,
  tipo = "default",
  seguro = false,
  capitalizar = "sentences",
}) {
  const [mostrar, setMostrar] = useState(false);

  return (
    <View style={styles.grupoCampo}>
      <Text style={styles.label}>{titulo}</Text>

      <View style={styles.contenedorInput}>
        <TextInput
          style={styles.input}
          value={valor}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#95A5B3"
          keyboardType={tipo}
          autoCapitalize={capitalizar}
          autoCorrect={false}
          secureTextEntry={seguro && !mostrar}
        />

        {seguro && (
          <TouchableOpacity
            style={styles.ojo}
            onPress={() => setMostrar(!mostrar)}
          >
            <Ionicons
              name={mostrar ? "eye-off-outline" : "eye-outline"}
              size={21}
              color={GRIS}
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function FilaAcceso({
  icono,
  titulo,
  descripcion,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.filaAcceso}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconoAcceso}>
        <Ionicons
          name={icono}
          size={23}
          color={AZUL}
        />
      </View>

      <View style={styles.accesoTexto}>
        <Text style={styles.accesoTitulo}>
          {titulo}
        </Text>
        <Text style={styles.accesoDescripcion}>
          {descripcion}
        </Text>
      </View>

      <Ionicons
        name="chevron-forward"
        size={19}
        color="#8296A7"
      />
    </TouchableOpacity>
  );
}

const dinero = (valor) =>
  valor == null
    ? "A confirmar"
    : `$ ${Number(valor).toLocaleString("es-AR")}`;

export default function Cuenta({ navigation }) {
  const {
    usuario,
    autenticado,
    cargandoSesion,
    iniciarSesion,
    registrarse,
    recuperarContrasena,
    actualizarPerfil,
    consultarImpresiones,
    cerrarSesion,
  } = useAuth();

  const [vista, setVista] = useState("login");
  const [procesando, setProcesando] = useState(false);

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [apellidoPerfil, setApellidoPerfil] =
    useState("");
  const [telefonoPerfil, setTelefonoPerfil] =
    useState("");

  const [impresiones, setImpresiones] = useState([]);
  const [cargandoImpresiones, setCargandoImpresiones] =
    useState(false);
  const [impresionesConsultadas, setImpresionesConsultadas] =
    useState(false);

  useEffect(() => {
    if (usuario) {
      setNombre(usuario.nombre_usuario || "");
      setEmail(usuario.email || "");
      setApellidoPerfil(usuario.apellido || "");
      setTelefonoPerfil(usuario.telefono || "");
    }
  }, [usuario]);

  const ejecutar = async (accion) => {
    if (procesando) return;

    setProcesando(true);

    try {
      await accion();
    } catch (error) {
      Alert.alert(
        "ESCALONES",
        error.message || "Ocurrió un error."
      );
    } finally {
      setProcesando(false);
    }
  };

  const entrar = () => {
    if (!email.trim() || !password) {
      Alert.alert(
        "Faltan datos",
        "Ingresá tu correo y contraseña."
      );
      return;
    }

    ejecutar(async () => {
      await iniciarSesion(email, password);
      setPassword("");
      setVista("login");
    });
  };

  const registrar = () => {
    if (!nombre.trim() || !email.trim()) {
      Alert.alert(
        "Faltan datos",
        "Completá tu nombre y correo."
      );
      return;
    }

    if (password.length < 8) {
      Alert.alert(
        "Contraseña muy corta",
        "Debe tener al menos 8 caracteres."
      );
      return;
    }

    ejecutar(async () => {
      const respuesta = await registrarse(
        nombre,
        email,
        password
      );

      setPassword("");

      Alert.alert(
        "Registro realizado",
        respuesta.message ||
          "Revisá tu correo para activar la cuenta.",
        [
          {
            text: "Entendido",
            onPress: () => setVista("login"),
          },
        ]
      );
    });
  };

  const recuperar = () => {
    if (!email.trim()) {
      Alert.alert(
        "Falta el correo",
        "Ingresá tu correo electrónico."
      );
      return;
    }

    ejecutar(async () => {
      await recuperarContrasena(email);

      Alert.alert(
        "Solicitud enviada",
        "Si el correo está registrado, revisá tu casilla para continuar con la recuperación.",
        [
          {
            text: "Entendido",
            onPress: () => setVista("login"),
          },
        ]
      );
    });
  };

  const guardarPerfil = () => {
    if (!nombre.trim()) {
      Alert.alert(
        "Falta el nombre",
        "Ingresá tu nombre de usuario."
      );
      return;
    }

    ejecutar(async () => {
      await actualizarPerfil({
        nombre_usuario: nombre,
        apellido: apellidoPerfil,
        telefono: telefonoPerfil,
      });

      setVista("perfil");

      Alert.alert(
        "Perfil actualizado",
        "Tus datos se guardaron correctamente."
      );
    });
  };

  const salir = () => {
    Alert.alert(
      "Cerrar sesión",
      "¿Querés salir de tu cuenta de ESCALONES?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            try {
              await cerrarSesion();
              setImpresiones([]);
              setImpresionesConsultadas(false);
              setPassword("");
              setVista("login");
            } catch (error) {
              Alert.alert(
                "Error",
                error.message ||
                  "No se pudo cerrar sesión."
              );
            }
          },
        },
      ]
    );
  };

  const cargarImpresiones = async () => {
    if (cargandoImpresiones) return;

    setCargandoImpresiones(true);

    try {
      const respuesta = await consultarImpresiones();

      setImpresiones(
        Array.isArray(respuesta.data)
          ? respuesta.data
          : []
      );

      setImpresionesConsultadas(true);
    } catch (error) {
      Alert.alert(
        "No se pudieron cargar las impresiones",
        error.message
      );
    } finally {
      setCargandoImpresiones(false);
    }
  };

  const abrirImpresiones = () => {
    setVista("impresiones");
    cargarImpresiones();
  };

  if (cargandoSesion) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color={AZUL} />
        <Text style={styles.cargandoTexto}>
          Cargando tu cuenta...
        </Text>
      </View>
    );
  }

  const tieneSesion = autenticado;
  const editando = tieneSesion && vista === "editar";
  const viendoImpresiones =
    tieneSesion && vista === "impresiones";
  const viendoRegistro =
    !tieneSesion && vista === "registro";
  const viendoRecuperacion =
    !tieneSesion && vista === "recuperar";

  const titulo =
    viendoRegistro
      ? "Crear una cuenta"
      : viendoRecuperacion
      ? "Recuperar contraseña"
      : editando
      ? "Editar perfil"
      : viendoImpresiones
      ? "Mis impresiones"
      : tieneSesion
      ? "Mi cuenta"
      : "Iniciar sesión";

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

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios" ? "padding" : undefined
        }
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.contenido}
        >
          <View style={styles.presentacion}>
            <Text style={styles.etiqueta}>
              TU ESPACIO PERSONAL
            </Text>

            <Text style={styles.tituloPrincipal}>
              {titulo}
            </Text>

            <View style={styles.lineaAzul} />

            <Text style={styles.descripcionPrincipal}>
              {tieneSesion
                ? "Administrá tus datos y consultá tu actividad en ESCALONES."
                : "Una cuenta para tus pedidos, reservas y beneficios."}
            </Text>
          </View>

          {!tieneSesion ? (
            <View style={styles.tarjeta}>
              {viendoRecuperacion ? (
                <>
                  <Text style={styles.tarjetaTitulo}>
                    ¿Olvidaste tu contraseña?
                  </Text>

                  <Text style={styles.descripcion}>
                    Ingresá el correo de tu cuenta.
                    Te enviaremos las instrucciones
                    de recuperación.
                  </Text>

                  <Campo
                    titulo="Correo electrónico"
                    valor={email}
                    onChangeText={setEmail}
                    placeholder="tuemail@correo.com"
                    tipo="email-address"
                    capitalizar="none"
                  />

                  <Boton
                    titulo="Enviar instrucciones"
                    onPress={recuperar}
                    cargando={procesando}
                  />

                  <Boton
                    titulo="Volver al inicio de sesión"
                    secundario
                    onPress={() => setVista("login")}
                  />
                </>
              ) : (
                <>
                  <Text style={styles.tarjetaTitulo}>
                    {viendoRegistro
                      ? "Registrate en ESCALONES"
                      : "Bienvenido a ESCALONES"}
                  </Text>

                  <Text style={styles.descripcion}>
                    {viendoRegistro
                      ? "Completá tus datos para crear tu cuenta."
                      : "Ingresá con la misma cuenta que utilizás en nuestra página web."}
                  </Text>

                  {viendoRegistro && (
                    <Campo
                      titulo="Nombre de usuario"
                      valor={nombre}
                      onChangeText={setNombre}
                      placeholder="Tu nombre"
                      capitalizar="words"
                    />
                  )}

                  <Campo
                    titulo="Correo electrónico"
                    valor={email}
                    onChangeText={setEmail}
                    placeholder="tuemail@correo.com"
                    tipo="email-address"
                    capitalizar="none"
                  />

                  <Campo
                    titulo="Contraseña"
                    valor={password}
                    onChangeText={setPassword}
                    placeholder="Mínimo 8 caracteres"
                    seguro
                    capitalizar="none"
                  />

                  <Boton
                    titulo={
                      viendoRegistro
                        ? "Crear cuenta"
                        : "Iniciar sesión"
                    }
                    cargando={procesando}
                    onPress={
                      viendoRegistro ? registrar : entrar
                    }
                  />

                  <Boton
                    titulo={
                      viendoRegistro
                        ? "Ya tengo cuenta"
                        : "Registrarme"
                    }
                    secundario
                    onPress={() => {
                      setPassword("");
                      setVista(
                        viendoRegistro
                          ? "login"
                          : "registro"
                      );
                    }}
                  />

                  {!viendoRegistro && (
                    <TouchableOpacity
                      style={styles.enlace}
                      onPress={() => setVista("recuperar")}
                    >
                      <Text style={styles.enlaceTexto}>
                        ¿Olvidaste tu contraseña?
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>
          ) : editando ? (
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaTitulo}>
                Datos personales
              </Text>

              <Campo
                titulo="Nombre de usuario"
                valor={nombre}
                onChangeText={setNombre}
                placeholder="Nombre"
              />

              <Campo
                titulo="Apellido"
                valor={apellidoPerfil}
                onChangeText={setApellidoPerfil}
                placeholder="Apellido"
              />

              <Campo
                titulo="Teléfono"
                valor={telefonoPerfil}
                onChangeText={setTelefonoPerfil}
                placeholder="11 1234-5678"
                tipo="phone-pad"
              />

              <Campo
                titulo="Correo electrónico"
                valor={usuario.email || ""}
                onChangeText={() => {}}
                placeholder="Correo"
                capitalizar="none"
              />

              <Text style={styles.nota}>
                El correo está asociado a tu cuenta
                y no se puede modificar desde
                este formulario.
              </Text>

              <Boton
                titulo="Guardar cambios"
                onPress={guardarPerfil}
                cargando={procesando}
              />

              <Boton
                titulo="Cancelar"
                secundario
                onPress={() => {
                  setNombre(usuario.nombre_usuario || "");
                  setApellidoPerfil(usuario.apellido || "");
                  setTelefonoPerfil(usuario.telefono || "");
                  setVista("perfil");
                }}
              />
            </View>
          ) : viendoImpresiones ? (
            <View style={styles.tarjeta}>
              <Text style={styles.tarjetaTitulo}>
                Historial de impresiones
              </Text>

              {cargandoImpresiones ? (
                <ActivityIndicator
                  color={AZUL}
                  style={{ marginVertical: 25 }}
                />
              ) : impresionesConsultadas &&
                impresiones.length === 0 ? (
                <View style={styles.vacio}>
                  <Ionicons
                    name="print-outline"
                    size={38}
                    color={AZUL}
                  />
                  <Text style={styles.vacioTitulo}>
                    No tenés impresiones registradas
                  </Text>
                  <Text style={styles.descripcion}>
                    Los pedidos asociados a tu cuenta
                    aparecerán acá.
                  </Text>
                </View>
              ) : (
                impresiones.map((item, indice) => (
                  <View
                    key={String(item.id || indice)}
                    style={styles.pedido}
                  >
                    <Text style={styles.pedidoTitulo}>
                      Pedido #
                      {item.numero_pedido || item.id}
                    </Text>

                    <Text style={styles.pedidoDato}>
                      Papel: {item.tipo_papel || "—"}
                    </Text>

                    <Text style={styles.pedidoDato}>
                      Copias: {item.num_copias || "—"}
                    </Text>

                    <Text style={styles.pedidoDato}>
                      Entrega: {item.modo_entrega || "—"}
                    </Text>

                    <Text style={styles.pedidoPrecio}>
                      Total: {dinero(item.precio_orden)}
                    </Text>
                  </View>
                ))
              )}

              <Boton
                titulo="Actualizar listado"
                onPress={cargarImpresiones}
                cargando={cargandoImpresiones}
              />

              <Boton
                titulo="Volver a Mi cuenta"
                secundario
                onPress={() => setVista("perfil")}
              />
            </View>
          ) : (
            <>
              <View style={styles.perfil}>
                <View style={styles.avatar}>
                  <Ionicons
                    name="person"
                    size={35}
                    color={AZUL}
                  />
                </View>

                <Text style={styles.nombrePerfil}>
                  {usuario.nombre_usuario || "Usuario"}
                  {usuario.apellido
                    ? ` ${usuario.apellido}`
                    : ""}
                </Text>

                <Text style={styles.emailPerfil}>
                  {usuario.email}
                </Text>

                <View style={styles.estadoSesion}>
                  <Ionicons
                    name="checkmark-circle"
                    color="#18804C"
                    size={16}
                  />
                  <Text style={styles.estadoSesionTexto}>
                    Sesión iniciada
                  </Text>
                </View>
              </View>

              <Text style={styles.seccionTitulo}>
                Mi actividad
              </Text>

              <View style={styles.tarjetaAccesos}>
                <FilaAcceso
                  icono="calendar-outline"
                  titulo="Mis reservas"
                  descripcion="Consultá tus reservas y horarios"
                  onPress={() =>
                    navigation.navigate("Reservas")
                  }
                />

                <View style={styles.divisor} />

                <FilaAcceso
                  icono="print-outline"
                  titulo="Mis impresiones"
                  descripcion="Historial de pedidos de impresión"
                  onPress={abrirImpresiones}
                />

                <View style={styles.divisor} />

                <FilaAcceso
                  icono="bag-outline"
                  titulo="Tienda"
                  descripcion="Explorá nuestros productos"
                  onPress={() =>
                    navigation.navigate("Tienda")
                  }
                />
              </View>

              <Text style={styles.seccionTitulo}>
                Configuración
              </Text>

              <View style={styles.tarjetaAccesos}>
                <FilaAcceso
                  icono="person-outline"
                  titulo="Mis datos personales"
                  descripcion="Nombre, apellido y teléfono"
                  onPress={() => setVista("editar")}
                />

                <View style={styles.divisor} />

                <FilaAcceso
                  icono="log-out-outline"
                  titulo="Cerrar sesión"
                  descripcion="Salir de tu cuenta en este dispositivo"
                  onPress={salir}
                />
              </View>

              <Text style={styles.notaInferior}>
                Tus reservas y pedidos se asociarán
                a esta cuenta cuando integremos
                su creación con Laravel.
              </Text>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  flex: { flex: 1 },
  cargando: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: FONDO,
  },
  cargandoTexto: {
    color: GRIS,
    marginTop: 12,
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
  contenido: {
    backgroundColor: FONDO,
    flexGrow: 1,
    paddingBottom: 45,
  },
  presentacion: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 22,
    paddingTop: 30,
    paddingBottom: 27,
    alignItems: "center",
  },
  etiqueta: {
    color: AZUL,
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 10,
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
    fontSize: 14,
    color: GRIS,
    lineHeight: 22,
    textAlign: "center",
  },
  tarjeta: {
    margin: 18,
    padding: 21,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 16,
  },
  tarjetaTitulo: {
    fontSize: 20,
    fontWeight: "bold",
    color: OSCURO,
    marginBottom: 12,
  },
  descripcion: {
    fontSize: 14,
    lineHeight: 22,
    color: GRIS,
    marginBottom: 20,
  },
  grupoCampo: {
    marginBottom: 18,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: OSCURO,
    marginBottom: 9,
  },
  contenedorInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#D6E1EB",
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  input: {
    flex: 1,
    minHeight: 49,
    paddingHorizontal: 13,
    color: OSCURO,
    fontSize: 15,
  },
  ojo: {
    padding: 12,
  },
  boton: {
    backgroundColor: AZUL,
    minHeight: 52,
    borderRadius: 10,
    paddingHorizontal: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 9,
  },
  botonSecundario: {
    backgroundColor: "#F0F8FF",
    borderWidth: 1,
    borderColor: "#C9E3F8",
  },
  botonTexto: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 15,
    textAlign: "center",
  },
  botonTextoSecundario: {
    color: AZUL,
  },
  enlace: {
    paddingVertical: 18,
    alignItems: "center",
  },
  enlaceTexto: {
    color: AZUL,
    fontSize: 14,
    fontWeight: "600",
  },
  perfil: {
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    padding: 27,
    marginBottom: 25,
  },
  avatar: {
    width: 75,
    height: 75,
    borderRadius: 38,
    backgroundColor: "#EAF5FE",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  nombrePerfil: {
    fontSize: 23,
    fontWeight: "bold",
    color: OSCURO,
    textAlign: "center",
  },
  emailPerfil: {
    fontSize: 14,
    color: GRIS,
    marginTop: 6,
  },
  estadoSesion: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E9F8EF",
    paddingVertical: 8,
    paddingHorizontal: 13,
    borderRadius: 20,
    marginTop: 15,
  },
  estadoSesionTexto: {
    color: "#17633B",
    fontSize: 12,
    fontWeight: "bold",
    marginLeft: 6,
  },
  seccionTitulo: {
    color: OSCURO,
    fontSize: 19,
    fontWeight: "bold",
    marginHorizontal: 19,
    marginBottom: 13,
  },
  tarjetaAccesos: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 18,
    marginBottom: 26,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 16,
  },
  filaAcceso: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 17,
  },
  iconoAcceso: {
    width: 43,
    height: 43,
    borderRadius: 12,
    backgroundColor: "#EAF5FE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  accesoTexto: {
    flex: 1,
  },
  accesoTitulo: {
    color: OSCURO,
    fontSize: 15,
    fontWeight: "bold",
  },
  accesoDescripcion: {
    color: GRIS,
    fontSize: 12,
    marginTop: 5,
    lineHeight: 18,
  },
  divisor: {
    height: 1,
    backgroundColor: "#E6EDF3",
  },
  nota: {
    fontSize: 12,
    lineHeight: 19,
    color: GRIS,
    marginBottom: 15,
  },
  notaInferior: {
    color: GRIS,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 20,
    marginHorizontal: 25,
    marginBottom: 20,
  },
  vacio: {
    alignItems: "center",
    paddingVertical: 30,
  },
  vacioTitulo: {
    fontSize: 16,
    fontWeight: "bold",
    color: OSCURO,
    marginTop: 15,
    marginBottom: 10,
    textAlign: "center",
  },
  pedido: {
    borderWidth: 1,
    borderColor: "#E1E8EF",
    borderRadius: 12,
    padding: 15,
    marginBottom: 14,
  },
  pedidoTitulo: {
    fontSize: 16,
    color: OSCURO,
    fontWeight: "bold",
    marginBottom: 10,
  },
  pedidoDato: {
    fontSize: 13,
    color: GRIS,
    marginBottom: 7,
  },
  pedidoPrecio: {
    fontSize: 15,
    color: AZUL,
    fontWeight: "bold",
    marginTop: 4,
  },
});
