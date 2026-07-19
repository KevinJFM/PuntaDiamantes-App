import { useEffect, useState } from 'react';
import { View, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeProvider, useTheme, NAVY } from './src/theme';
import LoginScreen from './src/LoginScreen';
import Home from './src/Home';
import Logo from './src/Logo';

function Root() {
  const { colors, dark } = useTheme();
  const [logueado, setLogueado] = useState(false);
  const [listo, setListo] = useState(false);

  // Al abrir la app, revisa si ya hay un token guardado
  useEffect(() => {
    AsyncStorage.getItem('portal_token')
      .then((t) => setLogueado(!!t))
      .finally(() => setListo(true));
  }, []);

  const fondo = logueado ? colors.bg : colors.navy;

  if (!listo) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: NAVY }}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <View style={{ width: 120, height: 120, borderRadius: 26, overflow: 'hidden' }}>
          <Logo size={120} color="#E5388A" />
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: fondo }} edges={['top']}>
      <StatusBar
        barStyle={logueado && !dark ? 'dark-content' : 'light-content'}
        backgroundColor="transparent"
        translucent
      />
      {logueado
        ? <Home onLogout={() => setLogueado(false)} />
        : <LoginScreen onLogin={() => setLogueado(true)} />}
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <Root />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
