import { useEffect, useState } from 'react';
import { View, StatusBar, Image, AppState, Platform } from 'react-native';
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
  const { colores, oscuro, listo: temaListo } = usarTema();
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
  // El área de la barra de estado (arriba) toma el color de lo que va justo debajo: azul en
  // login/bienvenida; el color del encabezado (fondoBarra) en el home, para que no se cuele una
  // franja de otro color en la barra de notificaciones (igual que abajo la barra respeta su color).
  const fondo = enAzul ? colores.azul : colores.fondoBarra;

  // Estilo de los íconos de la barra de estado según el fondo que tienen debajo:
  //  - claros (light-content) cuando el fondo es oscuro: tema oscuro, o el azul del login/bienvenida
  //  - oscuros (dark-content) cuando el fondo es claro (tema claro)
  // En el splash se decide SOLO por el tema (su fondo es el del tema, no el azul), para que el estilo NO
  // cambie al pasar del splash al home y no se quede "pegado" el de un modo al abrir en el otro.
  const enSplash = splashActivo || !listo || !temaListo;
  const barraClara = enSplash ? oscuro : (enAzul || oscuro);
  const estiloBarra = barraClara ? 'light-content' : 'dark-content';

  // Android a veces resetea la barra de estado al reabrir o volver del segundo plano: la re-aplicamos
  // —transparente y con el estilo correcto— al montar, al volver a primer plano y si cambia el estilo.
  useEffect(() => {
    const aplicarBarra = () => {
      StatusBar.setBarStyle(estiloBarra);
      if (Platform.OS === 'android') {
        StatusBar.setTranslucent(true);
        StatusBar.setBackgroundColor('transparent', false);
      }
    };
    aplicarBarra();
    const sub = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') aplicarBarra();
    });
    return () => sub.remove();
  }, [estiloBarra]);

  // Splash / carga: el logo sobre el fondo del tema (claro u oscuro), así los íconos de la barra ya
  // combinan desde el arranque y no hay salto de color al pasar al home.
  if (enSplash) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colores.fondo }}>
        <StatusBar barStyle={estiloBarra} backgroundColor="transparent" translucent />
        {/* El logo (tarjeta rosa) se ve bien tanto sobre fondo claro como oscuro */}
        <Image source={require('./assets/splash-logo.png')} style={{ width: 200, height: 200 }} resizeMode="contain" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: fondo }} edges={['top']}>
      <StatusBar
        barStyle={estiloBarra}
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
