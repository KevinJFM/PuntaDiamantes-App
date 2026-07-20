import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ProveedorTema, usarTema } from './src/tema/tema';
import PantallaLogin from './src/pantallas/PantallaLogin';
import Navegacion from './src/pantallas/Navegacion';

function Raiz() {
  const { colores, oscuro } = usarTema();
  const [logueado, setLogueado] = useState(false);
  const [listo, setListo] = useState(false);

  // Al abrir la app, revisa si ya hay un token guardado
  useEffect(() => {
    AsyncStorage.getItem('portal_token')
      .then((token) => setLogueado(!!token))
      .finally(() => setListo(true));
  }, []);

  const fondo = logueado ? colores.fondo : colores.azul;

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
        barStyle={logueado && !oscuro ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      {logueado
        ? <Navegacion alCerrarSesion={() => setLogueado(false)} />
        : <PantallaLogin alIniciarSesion={() => setLogueado(true)} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ProveedorTema>
        <Raiz />
      </ProveedorTema>
    </SafeAreaProvider>
  );
}
