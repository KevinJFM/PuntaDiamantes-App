import { useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';
import { loginCliente, mensajeError } from './api';

export default function LoginScreen({ onLogin }) {
  const [tipo, setTipo] = useState('DUI');
  const [numero, setNumero] = useState('');
  const [pin, setPin] = useState('');
  const [verPin, setVerPin] = useState(false);
  const [cargando, setCargando] = useState(false);

  const entrar = async () => {
    if (!numero.trim()) return Alert.alert('Falta el documento', 'Ingresa tu número de documento');
    if (!/^\d{4,6}$/.test(pin)) return Alert.alert('PIN inválido', 'El PIN debe tener entre 4 y 6 dígitos');

    setCargando(true);
    try {
      const r = await loginCliente({ tipo_documento: tipo, numero_documento: numero.trim(), pin });
      await AsyncStorage.setItem('portal_token', r.token);
      onLogin(r);
    } catch (err) {
      Alert.alert('No se pudo entrar', mensajeError(err, 'No se pudo iniciar sesión'));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
        <View style={s.card}>
          <View style={s.logoBox}>
            <Logo size={120} color="#E5388A" />
          </View>
          <Text style={s.brand}>Punta Diamantes</Text>
          <Text style={s.sub}>Consulta tus puntos de fidelidad</Text>

          {/* Tipo de documento */}
          <Text style={s.label}>Tipo de documento</Text>
          <View style={s.toggle}>
            {['DUI', 'Pasaporte'].map((t) => (
              <Pressable
                key={t}
                onPress={() => setTipo(t)}
                style={[s.toggleBtn, tipo === t && s.toggleActivo]}
              >
                <Text style={[s.toggleTxt, tipo === t && s.toggleTxtActivo]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Número */}
          <Text style={s.label}>N° de documento</Text>
          <TextInput
            style={s.input}
            value={numero}
            onChangeText={setNumero}
            placeholder={tipo === 'DUI' ? '00000000-0' : 'Ej. A1234567'}
            placeholderTextColor="#A6AEEF"
            keyboardType={tipo === 'DUI' ? 'numbers-and-punctuation' : 'default'}
            autoCapitalize="characters"
          />

          {/* PIN */}
          <Text style={s.label}>PIN (4 a 6 dígitos)</Text>
          <View style={s.pinWrap}>
            <TextInput
              style={[s.input, { flex: 1, marginBottom: 0, letterSpacing: 4 }]}
              value={pin}
              onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ''))}
              placeholder="••••"
              placeholderTextColor="#A6AEEF"
              keyboardType="number-pad"
              secureTextEntry={!verPin}
              maxLength={6}
            />
            <Pressable style={s.ojo} onPress={() => setVerPin((v) => !v)} hitSlop={8}>
              <Ionicons name={verPin ? 'eye-off-outline' : 'eye-outline'} size={22} color="#6b7280" />
            </Pressable>
          </View>

          <Pressable style={[s.btn, cargando && { opacity: 0.6 }]} onPress={entrar} disabled={cargando}>
            {cargando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnTxt}>Ingresar</Text>}
          </Pressable>

          <Text style={s.nota}>
            Si es tu primera vez, el PIN que ingreses quedará guardado como tu clave.
            Si no reconoces tus datos, contacta al hotel.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 20, backgroundColor: '#0A1259' },
  card: { backgroundColor: '#fff', borderRadius: 24, padding: 26 },
  logoBox: { width: 120, height: 120, borderRadius: 26, overflow: 'hidden', alignSelf: 'center', marginBottom: 14 },
  brand: { fontSize: 22, fontWeight: '800', color: '#0A1259', textAlign: 'center' },
  sub: { fontSize: 14, color: '#6b7280', textAlign: 'center', marginTop: 4, marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '600', color: '#1a1f4b', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1.5, borderColor: '#e2e4ee', borderRadius: 13,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#1a1f4b', marginBottom: 4,
  },
  toggle: { flexDirection: 'row', backgroundColor: '#eceefa', borderRadius: 13, padding: 5, gap: 6 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  toggleActivo: { backgroundColor: '#fff' },
  toggleTxt: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  toggleTxtActivo: { color: '#0A1259' },
  pinWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ojo: { paddingHorizontal: 12, paddingVertical: 12 },
  ojoTxt: { color: '#E5388A', fontWeight: '700', fontSize: 13 },
  btn: { backgroundColor: '#E5388A', borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nota: { fontSize: 12, color: '#6b7280', marginTop: 16, lineHeight: 18, textAlign: 'center' },
});
