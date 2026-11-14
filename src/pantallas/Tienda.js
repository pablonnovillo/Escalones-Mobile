


import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StatusBar,
} from "react-native";

// Direcciones de desarrollo de ESCALONES
const API_URL = "http://192.168.1.5:8000";
const IMAGENES_URL = "http://192.168.1.5:5173/images/tienda";

const formatoPrecio = (precio) =>
  Number(precio || 0).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

export default function Tienda({ navigation }) {
  const [productos, setProductos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [categoriaActual, setCategoriaActual] = useState(null);

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [carrito, setCarrito] = useState([]);
  const [mostrarCarrito, setMostrarCarrito] = useState(false);

  // Cargar productos y categorías desde Laravel
  useEffect(() => {
    const cargarTienda = async () => {
      try {
        setCargando(true);
        setError(null);

        const [respuestaProductos, respuestaCategorias] =
          await Promise.all([
            fetch(`${API_URL}/api/productos`),
            fetch(`${API_URL}/api/categorias`),
          ]);

        if (!respuestaProductos.ok) {
          throw new Error("No se pudieron obtener los productos");
        }

        const datosProductos = await respuestaProductos.json();

        if (!datosProductos.status) {
          throw new Error("La API no devolvió productos válidos");
        }

        setProductos(datosProductos.data || []);

        if (respuestaCategorias.ok) {
          const datosCategorias = await respuestaCategorias.json();

          if (datosCategorias.status) {
            setCategorias(datosCategorias.data || []);
          }
        }
      } catch (err) {
        console.log("Error de tienda:", err);
        setError("No se pudieron cargar los productos.");
      } finally {
        setCargando(false);
      }
    };

    cargarTienda();
  }, []);

  // Filtrar sin realizar una solicitud adicional
  const productosFiltrados = categoriaActual === null
    ? productos
    : productos.filter(
        (producto) =>
          Number(producto.category_id) === Number(categoriaActual)
      );

  // Agregar un producto al carrito
  const agregarAlCarrito = (producto) => {
    if (Number(producto.cantidad) <= 0) {
      Alert.alert("Sin stock", "Este producto no está disponible.");
      return;
    }

    const existente = carrito.find(
      (item) => item.id === producto.id
    );

    if (
      existente &&
      existente.cantidadCompra >= Number(producto.cantidad)
    ) {
      Alert.alert(
        "Stock disponible",
        "No podés agregar más unidades de este producto."
      );
      return;
    }

    if (existente) {
      setCarrito((actual) =>
        actual.map((item) =>
          item.id === producto.id
            ? {
                ...item,
                cantidadCompra: item.cantidadCompra + 1,
              }
            : item
        )
      );
    } else {
      setCarrito((actual) => [
        ...actual,
        {
          ...producto,
          cantidadCompra: 1,
        },
      ]);
    }

    Alert.alert(
      "Producto agregado",
      `${producto.nombre} se agregó al carrito.`
    );
  };

  // Aumentar o disminuir cantidades
  const cambiarCantidad = (id, diferencia) => {
    setCarrito((actual) =>
      actual
        .map((item) => {
          if (item.id !== id) return item;

          const nuevaCantidad = item.cantidadCompra + diferencia;

          if (nuevaCantidad > Number(item.cantidad)) {
            return item;
          }

          return {
            ...item,
            cantidadCompra: nuevaCantidad,
          };
        })
        .filter((item) => item.cantidadCompra > 0)
    );
  };

  // Quitar un producto
  const eliminarProducto = (id) => {
    setCarrito((actual) =>
      actual.filter((item) => item.id !== id)
    );
  };

  const cantidadTotal = carrito.reduce(
    (total, item) => total + item.cantidadCompra,
    0
  );

  const precioTotal = carrito.reduce(
    (total, item) =>
      total +
      Number(item.oferta_precio) * item.cantidadCompra,
    0
  );

  return (
    <View style={styles.pantalla}>
      <StatusBar barStyle="light-content" />

      {/* Encabezado */}
      <View style={styles.encabezado}>
        <TouchableOpacity
          onPress={() => {
            if (mostrarCarrito) {
              setMostrarCarrito(false);
            } else {
              navigation.goBack();
            }
          }}
          style={styles.botonVolver}
        >
          <Text style={styles.textoVolver}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.nombreMarca}>ESCALONES</Text>

        <TouchableOpacity
          style={styles.botonCarrito}
          onPress={() => setMostrarCarrito(!mostrarCarrito)}
        >
          <Text style={styles.textoCarrito}>
            🛒 {cantidadTotal}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.contenido}
        contentContainerStyle={styles.contenidoInterior}
      >
        {mostrarCarrito ? (
          <>
            <Text style={styles.titulo}>Mi carrito</Text>

            <Text style={styles.subtitulo}>
              Revisá los productos seleccionados
            </Text>

            {carrito.length === 0 ? (
              <View style={styles.mensajeVacio}>
                <Text style={styles.textoVacio}>
                  Todavía no agregaste productos.
                </Text>

                <TouchableOpacity
                  style={styles.botonAzul}
                  onPress={() => setMostrarCarrito(false)}
                >
                  <Text style={styles.textoBotonBlanco}>
                    Ver productos
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {carrito.map((item) => (
                  <View key={item.id} style={styles.itemCarrito}>
                    <Image
                      source={{
                        uri: `${IMAGENES_URL}/${item.image}`,
                      }}
                      style={styles.imagenCarrito}
                      resizeMode="contain"
                    />

                    <View style={styles.detalleCarrito}>
                      <Text style={styles.nombreProducto}>
                        {item.nombre}
                      </Text>

                      <Text style={styles.precioOferta}>
                        AR$ {formatoPrecio(item.oferta_precio)}
                      </Text>

                      <View style={styles.controlesCantidad}>
                        <TouchableOpacity
                          style={styles.botonCantidad}
                          onPress={() =>
                            cambiarCantidad(item.id, -1)
                          }
                        >
                          <Text style={styles.textoCantidad}>−</Text>
                        </TouchableOpacity>

                        <Text style={styles.numeroCantidad}>
                          {item.cantidadCompra}
                        </Text>

                        <TouchableOpacity
                          style={styles.botonCantidad}
                          onPress={() =>
                            cambiarCantidad(item.id, 1)
                          }
                        >
                          <Text style={styles.textoCantidad}>+</Text>
                        </TouchableOpacity>
                      </View>

                      <TouchableOpacity
                        onPress={() => eliminarProducto(item.id)}
                      >
                        <Text style={styles.eliminar}>
                          Eliminar
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                <View style={styles.resumen}>
                  <Text style={styles.textoResumen}>
                    Total de la compra
                  </Text>

                  <Text style={styles.total}>
                    AR$ {formatoPrecio(precioTotal)}
                  </Text>

                  <TouchableOpacity
                    style={styles.botonAzul}
                    onPress={() =>
                      Alert.alert(
                        "Finalizar compra",
                        "Próximamente conectaremos el carrito con el proceso de pedidos y pagos."
                      )
                    }
                  >
                    <Text style={styles.textoBotonBlanco}>
                      Finalizar compra
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </>
        ) : (
          <>
            <Text style={styles.titulo}>Tienda</Text>

            <Text style={styles.subtitulo}>
              Encontrá todo lo que necesitás en ESCALONES
            </Text>

            {cargando ? (
              <View style={styles.cargando}>
                <ActivityIndicator
                  size="large"
                  color="#0071BC"
                />
                <Text style={styles.textoCargando}>
                  Cargando productos...
                </Text>
              </View>
            ) : error ? (
              <Text style={styles.error}>{error}</Text>
            ) : (
              <>
                {/* Filtros por categorías */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.filtros}
                  contentContainerStyle={styles.filtrosInterior}
                >
                  <TouchableOpacity
                    style={[
                      styles.filtro,
                      categoriaActual === null &&
                        styles.filtroActivo,
                    ]}
                    onPress={() => setCategoriaActual(null)}
                  >
                    <Text
                      style={[
                        styles.textoFiltro,
                        categoriaActual === null &&
                          styles.textoFiltroActivo,
                      ]}
                    >
                      Todos
                    </Text>
                  </TouchableOpacity>

                  {categorias.map((categoria) => (
                    <TouchableOpacity
                      key={categoria.id}
                      style={[
                        styles.filtro,
                        categoriaActual === categoria.id &&
                          styles.filtroActivo,
                      ]}
                      onPress={() =>
                        setCategoriaActual(categoria.id)
                      }
                    >
                      <Text
                        style={[
                          styles.textoFiltro,
                          categoriaActual === categoria.id &&
                            styles.textoFiltroActivo,
                        ]}
                      >
                        {categoria.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.contador}>
                  {productosFiltrados.length} productos
                </Text>

                {/* Productos */}
                <View style={styles.grilla}>
                  {productosFiltrados.map((producto) => (
                    <View
                      key={producto.id}
                      style={styles.tarjeta}
                    >
                      <Image
                        source={{
                          uri: `${IMAGENES_URL}/${producto.image}`,
                        }}
                        style={styles.imagenProducto}
                        resizeMode="contain"
                      />

                      <Text style={styles.nombreProducto}>
                        {producto.nombre}
                      </Text>

                      <Text style={styles.precioOriginal}>
                        AR$ {formatoPrecio(producto.original_precio)}
                      </Text>

                      <Text style={styles.precioOferta}>
                        AR$ {formatoPrecio(producto.oferta_precio)}
                      </Text>

                      <TouchableOpacity
                        style={[
                          styles.botonAgregar,
                          Number(producto.cantidad) <= 0 &&
                            styles.botonAgotado,
                        ]}
                        onPress={() => agregarAlCarrito(producto)}
                        disabled={Number(producto.cantidad) <= 0}
                      >
                        <Text style={styles.textoBotonBlanco}>
                          {Number(producto.cantidad) > 0
                            ? "Agregar al carrito"
                            : "Sin stock"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },

  encabezado: {
    backgroundColor: "#0071BC",
    paddingTop: 58,
    paddingBottom: 15,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  botonVolver: {
    width: 35,
    alignItems: "center",
  },

  textoVolver: {
    fontSize: 34,
    color: "#FFFFFF",
    lineHeight: 38,
  },

  nombreMarca: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "bold",
  },

  botonCarrito: {
    backgroundColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 20,
  },

  textoCarrito: {
    color: "#FFFFFF",
    fontWeight: "bold",
    fontSize: 14,
  },

  contenido: {
    flex: 1,
  },

  contenidoInterior: {
    paddingHorizontal: 16,
    paddingTop: 25,
    paddingBottom: 40,
  },

  titulo: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003B65",
    marginBottom: 8,
  },

  subtitulo: {
    fontSize: 15,
    color: "#666666",
    marginBottom: 22,
  },

  cargando: {
    paddingVertical: 60,
    alignItems: "center",
  },

  textoCargando: {
    marginTop: 12,
    color: "#666666",
  },

  error: {
    color: "#C62828",
    textAlign: "center",
    marginVertical: 30,
  },

  filtros: {
    marginBottom: 15,
  },

  filtrosInterior: {
    gap: 8,
    paddingBottom: 5,
  },

  filtro: {
    borderWidth: 1,
    borderColor: "#0071BC",
    borderRadius: 25,
    paddingVertical: 9,
    paddingHorizontal: 17,
  },

  filtroActivo: {
    backgroundColor: "#0071BC",
  },

  textoFiltro: {
    color: "#0071BC",
    fontWeight: "600",
  },

  textoFiltroActivo: {
    color: "#FFFFFF",
  },

  contador: {
    color: "#777777",
    fontSize: 13,
    marginBottom: 12,
  },

  grilla: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  tarjeta: {
    width: "48%",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },

  imagenProducto: {
    width: "100%",
    height: 120,
    marginBottom: 12,
  },

  nombreProducto: {
    fontSize: 14,
    color: "#003B65",
    fontWeight: "bold",
    textAlign: "center",
    minHeight: 42,
    marginBottom: 8,
  },

  precioOriginal: {
    fontSize: 12,
    color: "#999999",
    textDecorationLine: "line-through",
    marginBottom: 5,
  },

  precioOferta: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#0071BC",
    marginBottom: 12,
  },

  botonAgregar: {
    backgroundColor: "#0071BC",
    borderRadius: 22,
    paddingVertical: 12,
    paddingHorizontal: 7,
    width: "100%",
    alignItems: "center",
    marginTop: "auto",
  },

  botonAgotado: {
    backgroundColor: "#999999",
  },

  textoBotonBlanco: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "bold",
    textAlign: "center",
  },

  itemCarrito: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EEEEEE",
  },

  imagenCarrito: {
    width: 90,
    height: 100,
    marginRight: 12,
  },

  detalleCarrito: {
    flex: 1,
  },

  controlesCantidad: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  botonCantidad: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#E8F3FA",
    alignItems: "center",
    justifyContent: "center",
  },

  textoCantidad: {
    fontSize: 21,
    color: "#0071BC",
    fontWeight: "bold",
  },

  numeroCantidad: {
    marginHorizontal: 17,
    fontSize: 16,
    fontWeight: "bold",
  },

  eliminar: {
    color: "#C62828",
    fontSize: 13,
    marginTop: 2,
  },

  resumen: {
    borderTopWidth: 1,
    borderTopColor: "#DDDDDD",
    marginTop: 10,
    paddingTop: 22,
  },

  textoResumen: {
    fontSize: 16,
    color: "#444444",
  },

  total: {
    fontSize: 28,
    color: "#0071BC",
    fontWeight: "bold",
    marginVertical: 14,
  },

  botonAzul: {
    backgroundColor: "#0071BC",
    borderRadius: 25,
    paddingVertical: 15,
    alignItems: "center",
  },

  mensajeVacio: {
    paddingVertical: 50,
    alignItems: "center",
    gap: 25,
  },

  textoVacio: {
    color: "#777777",
    fontSize: 16,
  },
});

