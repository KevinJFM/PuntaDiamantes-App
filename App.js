import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LoginScreen from './src/LoginScreen';
import MisPuntosScreen from './src/MisPuntosScreen';

export default function App() {
  const [logueado, setLogueado] = useState(false);
  const [listo, setListo] = useState(false);

  // Al abrir la app, revisa si ya hay un token guardado
  useEffect(() => {
    AsyncStorage.getItem('portal_token')
      .then((t) => setLogueado(!!t))
      .finally(() => setListo(true));
  }, []);

  if (!listo) {
    return (
      <View style={styles.cargando}>
        <ActivityIndicator size="large" color="#E5388A" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#0A1259" />
      {logueado
        ? <MisPuntosScreen onLogout={() => setLogueado(false)} />
        : <LoginScreen onLogin={() => setLogueado(true)} />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#0A1259' },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0A1259' },
});
