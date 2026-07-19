import { View, Text, Pressable, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useTheme } from './theme';

const VERSION = Constants.expoConfig?.version ?? '1.0.0';

export default function ConfiguracionScreen({ onLogout }) {
  const { colors, dark, toggle } = useTheme();
  const s = estilos(colors);

  const salir = async () => {
    await AsyncStorage.removeItem('portal_token');
    onLogout();
  };

  return (
    <View style={s.pantalla}>
      <Text style={s.titulo}>Configuración</Text>

      {/* Modo claro / oscuro */}
      <View style={s.card}>
        <View style={s.fila}>
          <View style={s.filaIzq}>
            <Ionicons name={dark ? 'moon' : 'sunny'} size={22} color={colors.pink} />
            <Text style={s.filaTxt}>{dark ? 'Modo oscuro' : 'Modo claro'}</Text>
          </View>

          {/* Interruptor sol/luna */}
          <Pressable onPress={toggle} style={[s.switch, dark && s.switchOn]}>
            <View style={[s.perilla, dark && s.perillaOn]}>
              <Ionicons name={dark ? 'moon' : 'sunny'} size={14} color={dark ? colors.navy : '#f5a623'} />
            </View>
          </Pressable>
        </View>
        <Text style={s.ayuda}>Cambia entre tema claro y oscuro.</Text>
      </View>

      {/* Cerrar sesión */}
      <View style={s.salirInfo}>
        <Text style={s.salirInfo1}>Presiona el botón</Text>
        <Text style={s.salirInfo2}>Deberás ingresar tus datos de nuevo</Text>
      </View>
      <Pressable style={s.btnSalir} onPress={salir}>
        <Ionicons name="log-out-outline" size={20} color="#fff" />
        <Text style={s.btnSalirTxt}>Cerrar sesión</Text>
      </Pressable>

      <View style={s.pieBox}>
        <Text style={s.pie}>Punta Diamantes · Fidelización de Clientes</Text>
        <Text style={s.version}>Versión {VERSION}</Text>
      </View>
    </View>
  );
}

const estilos = (c) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: c.bg, padding: 16 },
  titulo: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 16, marginTop: 4 },

  card: { backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, borderRadius: 16, padding: 16, marginBottom: 18 },
  fila: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filaIzq: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  filaTxt: { fontSize: 16, fontWeight: '700', color: c.text },
  ayuda: { fontSize: 12, color: c.muted, marginTop: 8 },

  switch: { width: 56, height: 32, borderRadius: 20, backgroundColor: c.chip, padding: 3, justifyContent: 'center' },
  switchOn: { backgroundColor: c.navy },
  perilla: { width: 26, height: 26, borderRadius: 13, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' },
  perillaOn: { alignSelf: 'flex-end' },

  salirInfo: { alignItems: 'center', marginBottom: 10 },
  salirInfo1: { fontSize: 14, fontWeight: '700', color: c.text },
  salirInfo2: { fontSize: 12, color: c.muted, marginTop: 2 },
  btnSalir: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: c.pink, borderRadius: 14, paddingVertical: 15 },
  btnSalirTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },

  pieBox: { marginTop: 'auto', paddingBottom: 8 },
  pie: { textAlign: 'center', fontSize: 12, color: c.muted },
  version: { textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 3 },
});
