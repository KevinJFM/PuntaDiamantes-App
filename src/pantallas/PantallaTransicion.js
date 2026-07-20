import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import Logo from '../componentes/Logo';

// Pantalla breve de "¡Bienvenido!" que aparece al ingresar (después del código).
export default function PantallaTransicion() {
  const opacidad = useRef(new Animated.Value(0)).current;
  const escala = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacidad, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(escala, { toValue: 1, friction: 6, tension: 60, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <View style={estilos.pantalla}>
      <Animated.View style={{ opacity: opacidad, transform: [{ scale: escala }], alignItems: 'center' }}>
        <View style={estilos.cajaLogo}>
          <Logo tamano={110} color="#E5388A" />
        </View>
        <Text style={estilos.texto}>¡Bienvenido a{'\n'}Punta Diamantes! 🎉</Text>
      </Animated.View>
    </View>
  );
}

const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#0A1259', alignItems: 'center', justifyContent: 'center', padding: 26 },
  cajaLogo: { width: 110, height: 110, borderRadius: 26, overflow: 'hidden', backgroundColor: '#fff', marginBottom: 22 },
  texto: { fontSize: 24, fontWeight: '800', color: '#fff', textAlign: 'center', lineHeight: 32 },
});
