import { useEffect, useState } from 'react';
import { View, StatusBar, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { ProveedorTema, usarTema } from './src/tema/tema';
import { ProveedorAvisos, usarAvisos } from './src/componentes/Avisos';
import { registrarManejadorSesion, registrarToken } from './src/servicios/api';
import { registrarTokenSiHayPermiso } from './src/servicios/notificaciones';
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
  const [splashActivo, setSplashActivo] = useState(true);            // pantalla blanca con el logo (3 seg)

  // Al abrir la app: revisa el token, si ya pasó la bienvenida inicial y si ya se mostró el splash del logo alguna vez.
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {}); // ocultamos el splash nativo enseguida y pintamos el logo desde React
    Promise.all([
      SecureStore.getItemAsync('portal_token'),   // el token vive cifrado en SecureStore
      AsyncStorage.getItem('bienvenida_vista'),    // no sensible: sigue en AsyncStorage
      AsyncStorage.getItem('splash_visto'),        // para mostrar el logo solo la 1ª vez tras instalar
    ])
      .then(([token, bienvenida, splashVisto]) => {
        setLogueado(!!token);
        setBienvenidaVista(!!bienvenida);
        // Si ya hay sesión y el permiso sigue concedido, refresca el token en el backend al abrir la app
        // (no solo al iniciar sesión). Así, si el cliente activó el permiso en los ajustes del teléfono,
        // la próxima vez que abra la app ya vuelve a recibir notificaciones sin tener que cerrar sesión.
        if (token) {
          registrarTokenSiHayPermiso().then((push) => {
            if (push.ok && push.token) registrarToken(push.token).catch(() => {});
          });
        }
        // El splash con el logo (~3 seg) se muestra SOLO la primera vez que se abre la app tras instalar.
        // Las siguientes veces se salta: solo se ve el instante que tarda en leerse el token.
        if (splashVisto) {
          setSplashActivo(false);
        } else {
          AsyncStorage.setItem('splash_visto', '1');
          setTimeout(() => setSplashActivo(false), 3000);
        }
      })
      .finally(() => setListo(true));
  }, []);

  // Cuando el token expira o deja de servir: cerrar sesión y avisar para que el cliente reingrese (en vez de ver errores).
  useEffect(() => {
    registrarManejadorSesion((mensaje) => {
      // El token ya se borró en el interceptor (SecureStore). Aquí solo avisamos.
      setLogueado(false);
      const otroDispositivo = mensaje?.includes('dispositivo');
      mostrarAviso(
        'info',
        otroDispositivo ? 'Sesión cerrada' : 'Tu sesión expiró',
        otroDispositivo ? mensaje : 'Por tu seguridad, vuelve a iniciar sesión.'
      );
    });
  }, [mostrarAviso]);

  // Al ingresar: la primera vez muestra la pantalla "Te damos la bienvenida" (botón Continuar); las siguientes, una transición "¡Bienvenido!" de ~2 seg.
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

  // Splash: pantalla blanca con el logo (mientras dura el splash y/o se revisa el token)
  if (splashActivo || !listo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
        {/* Misma imagen del splash nativo (esquinas redondeadas), para que no haya salto entre uno y otro */}
        <Image source={require('./assets/splash-logo.png')} style={{ width: 200, height: 200 }} resizeMode="contain" />
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
