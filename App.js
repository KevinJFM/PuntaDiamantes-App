import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProveedorTema, usarTema } from './src/tema/tema';
import { ProveedorAvisos, usarAvisos } from './src/componentes/Avisos';
import { registrarManejadorSesion } from './src/servicios/api';
import PantallaLogin from './src/pantallas/PantallaLogin';
import PantallaBienvenida from './src/pantallas/PantallaBienvenida';
import PantallaTransicion from './src/pantallas/PantallaTransicion';
import Navegacion from './src/pantallas/Navegacion';
import * as SplashScreen from 'expo-splash-screen';

// Mantener el splash (pantalla blanca con el logo) visible hasta ocultarlo a los 3 segundos
SplashScreen.preventAutoHideAsync();

function Raiz() {
  const { colores, oscuro } = usarTema();
  const mostrarAviso = usarAvisos();
  const [logueado, setLogueado] = useState(false);
  const [bienvenidaVista, setBienvenidaVista] = useState(true);
  const [mostrarBienvenida, setMostrarBienvenida] = useState(false); // 1ª vez: pantalla con "Continuar"
  const [transicion, setTransicion] = useState(false);               // siguientes: "¡Bienvenido!" 2 seg
  const [listo, setListo] = useState(false);

  // Al abrir la app, revisa el token y si ya pasó la bienvenida inicial alguna vez
  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem('portal_token'),
      AsyncStorage.getItem('bienvenida_vista'),
    ])
      .then(([token, bienvenida]) => {
        setLogueado(!!token);
        setBienvenidaVista(!!bienvenida);
      })
      .finally(() => setListo(true));
  }, []);

  // Oculta el splash (blanco con el logo) a los 3 segundos
  useEffect(() => {
    const t = setTimeout(() => { SplashScreen.hideAsync().catch(() => {}); }, 3000);
    return () => clearTimeout(t);
  }, []);

  // Cuando el token expira (sesión de 1 año) o deja de servir: cerrar sesión y avisar,
  // para que el cliente sepa que debe ingresar de nuevo (en vez de ver errores).
  useEffect(() => {
    registrarManejadorSesion(async () => {
      await AsyncStorage.removeItem('portal_token');
      setLogueado(false);
      mostrarAviso('info', 'Tu sesión expiró', 'Por tu seguridad, vuelve a iniciar sesión.');
    });
  }, [mostrarAviso]);

  // Al ingresar (código correcto):
  //  - Primera vez de todas -> pantalla "Te damos la bienvenida" con botón Continuar
  //  - Siguientes veces      -> transición "¡Bienvenido!" ~2 seg
  const manejarIngreso = () => {
    setLogueado(true);
    if (!bienvenidaVista) {
      setMostrarBienvenida(true);
    } else {
      setTransicion(true);
      setTimeout(() => setTransicion(false), 2000);
    }
  };

  // Botón "Continuar" de la bienvenida inicial (solo la primera vez)
  const marcarBienvenida = () => {
    AsyncStorage.setItem('bienvenida_vista', '1');
    setBienvenidaVista(true);
    setMostrarBienvenida(false);
  };

  const enAzul = mostrarBienvenida || transicion || !logueado;
  const fondo = enAzul ? colores.azul : colores.fondo;

  if (!listo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        <ActivityIndicator size="large" color="#E5388A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: fondo }} edges={['top']}>
      <StatusBar
        barStyle={!enAzul && !oscuro ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      {!logueado
        ? <PantallaLogin alIniciarSesion={manejarIngreso} />
        : mostrarBienvenida
          ? <PantallaBienvenida alContinuar={marcarBienvenida} />
          : transicion
            ? <PantallaTransicion />
            : <Navegacion alCerrarSesion={() => setLogueado(false)} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ProveedorTema>
        <ProveedorAvisos>
          <Raiz />
        </ProveedorAvisos>
      </ProveedorTema>
    </SafeAreaProvider>
  );
}
