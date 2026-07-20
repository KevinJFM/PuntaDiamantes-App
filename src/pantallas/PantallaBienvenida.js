import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Logo from '../componentes/Logo';

export default function PantallaBienvenida({ alContinuar }) {
  const margenes = useSafeAreaInsets();

  return (
    <View style={estilos.pantalla}>
      <View style={estilos.centro}>
        <View style={estilos.cajaLogo}>
          <Logo tamano={130} color="#E5388A" />
        </View>
        <Text style={estilos.titulo}>Te damos la bienvenida{'\n'}a Punta Diamantes 🎉</Text>
        <Text style={estilos.sub}>
          Consulta tus puntos, descubre tus recompensas y las promociones activas del hotel.
        </Text>
      </View>

      <Pressable style={[estilos.btn, { marginBottom: 16 + margenes.bottom }]} onPress={alContinuar}>
        <Text style={estilos.btnTxt}>Continuar</Text>
      </Pressable>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1259', paddingHorizontal: 26 },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  cajaLogo: { width: 130, height: 130, borderRadius: 30, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 26 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 34 },
  sub: { fontSize: 15, color: '#c9cef2', textAlign: 'center', marginTop: 14, lineHeight: 22 },
  btn: { backgroundColor: '#E5388A', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
