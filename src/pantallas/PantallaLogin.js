import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../componentes/Logo';
import { iniciarSesionCliente, mensajeError } from '../servicios/api';
import { formatearDocumento, esDuiValido, esPasaporteValido } from '../utilidades/formato';

export default function PantallaLogin({ alIniciarSesion }) {
  const [tipo, setTipo] = useState('DUI');
  const [numero, setNumero] = useState('');
  const [pin, setPin] = useState('');
  const [verPin, setVerPin] = useState(false);
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (tipo === 'DUI' && !esDuiValido(numero)) {
      return Alert.alert('DUI inválido', 'El DUI debe tener el formato 00000000-0');
    }
    if (tipo === 'Pasaporte' && !esPasaporteValido(numero)) {
      return Alert.alert('Pasaporte inválido', 'El pasaporte debe tener de 6 a 12 caracteres (letras y números)');
    }
    if (!/^\d{4,6}$/.test(pin)) return Alert.alert('PIN inválido', 'El PIN debe tener entre 4 y 6 dígitos');

    setCargando(true);
    try {
      const respuesta = await iniciarSesionCliente({ tipo_documento: tipo, numero_documento: numero.trim(), pin });
      await AsyncStorage.setItem('portal_token', respuesta.token);
      alIniciarSesion(respuesta);
    } catch (error) {
      Alert.alert('No se pudo entrar', mensajeError(error, 'No se pudo iniciar sesión'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={estilos.scroll} keyboardShouldPersistTaps="handled">
        <View style={estilos.tarjeta}>
          <View style={estilos.cajaLogo}>
            <Logo tamano={120} color="#E5388A" />
          </View>
          <Text style={estilos.marca}>Punta Diamantes</Text>
          <Text style={estilos.sub}>Consulta tus puntos de fidelidad</Text>

          {/* Tipo de documento */}
          <Text style={estilos.etiqueta}>Tipo de documento</Text>
          <View style={estilos.selector}>
            {['DUI', 'Pasaporte'].map((opcion) => (
              <Pressable
                key={opcion}
                onPress={() => { setTipo(opcion); setNumero(''); }}
                style={[estilos.selectorBtn, tipo === opcion && estilos.selectorActivo]}
              >
                <Text style={[estilos.selectorTxt, tipo === opcion && estilos.selectorTxtActivo]}>{opcion}</Text>
              </Pressable>
            ))}
          </View>

          {/* Número */}
          <Text style={estilos.etiqueta}>N° de documento</Text>
          <TextInput
            style={estilos.campo}
            value={numero}
            onChangeText={(texto) => setNumero(formatearDocumento(tipo, texto))}
            placeholder={tipo === 'DUI' ? '00000000-0' : 'Ej. A1234567'}
            placeholderTextColor="#A6AEEF"
            keyboardType={tipo === 'DUI' ? 'number-pad' : 'default'}
            autoCapitalize="characters"
            maxLength={tipo === 'DUI' ? 10 : 12}
          />

          {/* PIN */}
          <Text style={estilos.etiqueta}>PIN (4 a 6 dígitos)</Text>
          <View style={estilos.cajaPin}>
            <TextInput
              style={estilos.campoPin}
              value={pin}
              onChangeText={(texto) => setPin(texto.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              placeholderTextColor="#A6AEEF"
              keyboardType="number-pad"
              secureTextEntry={!verPin}
              maxLength={6}
            />
            <Pressable onPress={() => setVerPin((v) => !v)} hitSlop={8}>
              <Ionicons name={verPin ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
            </Pressable>
          </View>

          <Pressable style={[estilos.btn, cargando && { opacity: 0.6 }]} onPress={entrar} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.btnTxt}>Ingresar</Text>}
          </Pressable>

          <Text style={estilos.nota}>
            Si es tu primera vez, el PIN que ingreses quedará guardado como tu clave.
            Si no reconoces tus datos, contacta al hotel.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const estilos = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0A1259' },
  tarjeta: { backgroundColor: '#fff', borderRadius: 24, padding: 26 },
  cajaLogo: { width: 120, height: 120, borderRadius: 26, overflow: 'hidden', alignSelf: 'center', marginBottom: 14 },
  marca: { fontSize: 22, fontWeight: '800', color: '#0A1259', textAlign: 'center' },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  etiqueta: { fontSize: 13, fontWeight: '600', color: '#1a1f4b', marginBottom: 6, marginTop: 8 },
  campo: {
    borderWidth: 1.5, borderColor: '#e2e4ee', borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f4b', marginBottom: 4,
  },
  selector: { flexDirection: 'row', backgroundColor: '#eceefa', borderRadius: 13, padding: 5, gap: 6 },
  selectorBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  selectorActivo: { backgroundColor: '#E5388A' },
  selectorTxt: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  selectorTxtActivo: { color: '#fff' },
  cajaPin: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e4ee', borderRadius: 13, paddingRight: 12, marginBottom: 4 },
  campoPin: { flex: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f4b', letterSpacing: 4 },
  btn: { backgroundColor: '#E5388A', borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nota: { fontSize: 12, color: '#6b7280', marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
