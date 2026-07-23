import { useState, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { borrarToken } from '../servicios/api';
import { usarAvisos } from '../componentes/Avisos';
import { usarTema } from '../tema/tema';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function PantallaConfiguracion({ alCerrarSesion }) {
  const { colores, oscuro, alternarTema } = usarTema();
  const mostrarAviso = usarAvisos();
  const estilos = crearEstilos(colores);
  const [cerrando, setCerrando] = useState(false);
  const [enLinea, setEnLinea] = useState(true);

  // Vigila la conexión en vivo: si no hay internet, se deshabilita el botón de cerrar sesión.
  useEffect(() => {
    const quitar = NetInfo.addEventListener((estado) => {
      setEnLinea(estado.isConnected !== false); // false solo cuando de verdad no hay red
    });
    return () => quitar();
  }, []);

  const salir = async () => {
    setCerrando(true);
    const inicio = Date.now();
    // Cerrar sesión requiere internet: para volver a entrar se necesita un código nuevo.
    // Usamos borrarToken para, de paso, confirmar que hay conexión con el servidor.
    try {
      await borrarToken(); // limpia el push_token en el backend
    } catch (e) {
      if (!e?.response) {
        // Sin respuesta del servidor = sin internet → no cerramos sesión
        setCerrando(false);
        return mostrarAviso(
          'error',
          'Sin conexión',
          'Necesitas internet para cerrar sesión, porque deberás ingresar de nuevo con un código.'
        );
      }
      // Hubo respuesta (p. ej. la sesión ya venció): el servidor está accesible, seguimos.
    }
    await AsyncStorage.removeItem('portal_token');
    // Mínimo ~1s para que se note el "Cerrando sesión…"
    const restante = Math.max(0, 1000 - (Date.now() - inicio));
    setTimeout(() => alCerrarSesion(), restante);
  };

  return (
    <View style={estilos.pantalla}>
      {/* Capa "Cerrando sesión…" mientras se cierra la sesión */}
      <Modal transparent visible={cerrando} animationType="fade" statusBarTranslucent>
        <View style={[estilos.overlayCerrando, { backgroundColor: oscuro ? 'rgba(11,16,32,0.95)' : 'rgba(255,255,255,0.96)' }]}>
          <ActivityIndicator size="large" color={colores.rosa} />
          <Text style={estilos.cerrandoTxt}>Cerrando sesión…</Text>
        </View>
      </Modal>

      <Text style={estilos.titulo}>Configuración</Text>

      {/* Modo claro / oscuro */}
      <View style={estilos.tarjeta}>
        <View style={estilos.fila}>
          <View style={estilos.filaIzq}>
            <Ionicons name={oscuro ? 'moon' : 'sunny'} size={22} color={colores.rosa} />
            <Text style={estilos.filaTxt}>{oscuro ? 'Modo oscuro' : 'Modo claro'}</Text>
          </View>

          {/* Interruptor sol/luna */}
          <Pressable onPress={alternarTema} style={[estilos.interruptor, oscuro && estilos.interruptorEncendido]}>
            <View style={[estilos.perilla, oscuro && estilos.perillaEncendida]}>
              <Ionicons name={oscuro ? 'moon' : 'sunny'} size={14} color={oscuro ? colores.azul : '#f5a623'} />
            </View>
          </Pressable>
        </View>
        <Text style={estilos.ayuda}>Cambia entre tema claro y oscuro.</Text>
      </View>

      {/* Cerrar sesión */}
      <View style={estilos.salirInfo}>
        <Text style={estilos.salirInfo1}>Presiona el botón</Text>
        <Text style={estilos.salirInfo2}>Deberás ingresar tus datos de nuevo</Text>
      </View>
      <Pressable
        style={[estilos.btnSalir, !enLinea && estilos.btnSalirDeshab]}
        onPress={salir}
        disabled={!enLinea}
      >
        <Ionicons name="log-out-outline" size={20} color={enLinea ? '#fff' : colores.tenue} />
        <Text style={[estilos.btnSalirTxt, !enLinea && { color: colores.tenue }]}>Cerrar sesión</Text>
      </Pressable>
      {!enLinea && (
        <Text style={estilos.salirOffline}>Sin conexión: necesitas internet para cerrar sesión.</Text>
      )}

      <View style={estilos.cajaPie}>
        <Text style={estilos.pie}>Punta Diamantes · Fidelización de Clientes</Text>
        <Text style={estilos.version}>Versión {VERSION}</Text>
      </View>
    </View>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  overlayCerrando: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 },
  cerrandoTxt: { color: c.texto, fontSize: 16, fontWeight: '700' },
  pantalla: { flex: 1, backgroundColor: c.fondo, padding: 16 },
  titulo: { fontSize: 20, fontWeight: '800', color: c.texto, marginBottom: 16, marginTop: 4 },

  tarjeta: { backgroundColor: c.tarjeta, borderWidth: 1.5, borderColor: c.borde, borderRadius: 16, padding: 16, marginBottom: 18 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaTxt: { fontSize: 16, fontWeight: '700', color: c.texto },
  ayuda: { fontSize: 12, color: c.tenue, marginTop: 8 },

  interruptor: { width: 56, height: 32, borderRadius: 20, backgroundColor: c.ficha, padding: 3, justifyContent: 'center' },
  interruptorEncendido: { backgroundColor: c.azul },
  perilla: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  perillaEncendida: { alignSelf: 'flex-end' },

  salirInfo: { alignItems: 'center', marginBottom: 10 },
  salirInfo1: { fontSize: 14, fontWeight: '700', color: c.texto },
  salirInfo2: { fontSize: 12, color: c.tenue, marginTop: 2 },
  btnSalir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.rosa, borderRadius: 14, paddingVertical: 15 },
  btnSalirDeshab: { backgroundColor: c.ficha },
  btnSalirTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  salirOffline: { textAlign: 'center', fontSize: 12.5, color: c.tenue, marginTop: 10 },

  cajaPie: { marginTop: 'auto', paddingBottom: 8 },
  pie: { textAlign: 'center', fontSize: 12, color: c.tenue },
  version: { textAlign: 'center', fontSize: 12, color: c.tenue, marginTop: 3 },
});
