
import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import Inicio from "./src/pantallas/Inicio";
import Servicios from "./src/pantallas/Servicios";
import Tienda from "./src/pantallas/Tienda";
import Reservas from "./src/pantallas/Reservas";
import Cuenta from "./src/pantallas/Cuenta";

import { AuthProvider } from "./src/context/AuthContext";

const Tab = createBottomTabNavigator();

const iconos = {
  Inicio: ["home", "home-outline"],
  Servicios: ["print", "print-outline"],
  Tienda: ["bag", "bag-outline"],
  Reservas: ["calendar", "calendar-outline"],
  Cuenta: ["person", "person-outline"],
};

function NavegacionPrincipal() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        initialRouteName="Inicio"
        screenOptions={({ route }) => ({
          headerShown: false,

          tabBarActiveTintColor: "#0071BC",
          tabBarInactiveTintColor: "#777777",

          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
          },

          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: "#EEEEEE",
            height: 65,
            paddingTop: 7,
          },

          tabBarIcon: ({ focused, color, size }) => {
            const opciones = iconos[route.name];

            const nombreIcono = focused
              ? opciones[0]
              : opciones[1];

            return (
              <Ionicons
                name={nombreIcono}
                size={size}
                color={color}
              />
            );
          },
        })}
      >
        <Tab.Screen name="Inicio" component={Inicio} />
        <Tab.Screen name="Servicios" component={Servicios} />
        <Tab.Screen name="Tienda" component={Tienda} />
        <Tab.Screen name="Reservas" component={Reservas} />
        <Tab.Screen name="Cuenta" component={Cuenta} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <NavegacionPrincipal />
    </AuthProvider>
  );
}
