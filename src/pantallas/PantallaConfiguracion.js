import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { borrarToken } from '../servicios/api';
import { usarTema } from '../tema/tema';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function PantallaConfiguracion({ alCerrarSesion }) {
  const { colores, oscuro, alternarTema } = usarTema();
  const estilos = crearEstilos(colores);
  const [cerrando, setCerrando] = useState(false);

  const salir = async () => {
    setCerrando(true);
    const inicio = Date.now();
    await borrarToken().catch(() => {}); // limpia el push_token en el backend
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
      <Pressable style={estilos.btnSalir} onPress={salir}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={estilos.btnSalirTxt}>Cerrar sesión</Text>
      </Pressable>

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
  btnSalirTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cajaPie: { marginTop: 'auto', paddingBottom: 8 },
  pie: { textAlign: 'center', fontSize: 12, color: c.tenue },
  version: { textAlign: 'center', fontSize: 12, color: c.tenue, marginTop: 3 },
});
