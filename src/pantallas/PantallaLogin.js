import { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet,
  Keyboard, ScrollView, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import Logo from '../componentes/Logo';
import { usarAvisos } from '../componentes/Avisos';
import { solicitarCodigo, verificarCodigo, mensajeError } from '../servicios/api';
import { formatearDocumento, esDuiValido, esPasaporteValido } from '../utilidades/formato';

const SEGUNDOS_REENVIO = 60;

export default function PantallaLogin({ alIniciarSesion }) {
  const mostrarAviso = usarAvisos();
  const [paso, setPaso] = useState('documento'); // 'documento' | 'codigo'
  const [tipo, setTipo] = useState('DUI');
  const [numero, setNumero] = useState('');
  const [codigo, setCodigo] = useState('');
  const [destino, setDestino] = useState('');
  const [modoDev, setModoDev] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [segundos, setSegundos] = useState(0);
  const refCodigo = useRef(null);
  const refScroll = useRef(null);
  const [alturaTeclado, setAlturaTeclado] = useState(0);

  const bajarAlCampo = () => setTimeout(() => refScroll.current?.scrollToEnd({ animated: true }), 120);

  // Sube la tarjeta cuando aparece el teclado (funciona en Expo Go y en el APK)
  useEffect(() => {
    const alMostrar = Keyboard.addListener('keyboardDidShow', (e) => {
      setAlturaTeclado(e.endCoordinates?.height ?? 0);
      setTimeout(() => refScroll.current?.scrollToEnd({ animated: true }), 60);
    });
    const alOcultar = Keyboard.addListener('keyboardDidHide', () => setAlturaTeclado(0));
    return () => { alMostrar.remove(); alOcultar.remove(); };
  }, []);

  // Cuenta regresiva para reenviar el código
  useEffect(() => {
    if (segundos <= 0) return;
    const id = setInterval(() => setSegundos((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [segundos]);

  // Al pasar al paso del código, enfoca la primera casilla para que salga el teclado
  useEffect(() => {
    if (paso === 'codigo') {
      const t = setTimeout(() => refCodigo.current?.focus(), 350);
      return () => clearTimeout(t);
    }
  }, [paso]);

  // Verifica automáticamente cuando se completan los 6 dígitos
  useEffect(() => {
    if (paso === 'codigo' && codigo.length === 6 && !cargando) confirmar();
  }, [codigo]);

  const enviarCodigo = async () => {
    if (tipo === 'DUI' && !esDuiValido(numero)) {
      return mostrarAviso('error', 'DUI inválido', 'El DUI debe tener el formato 00000000-0');
    }
    if (tipo === 'Pasaporte' && !esPasaporteValido(numero)) {
      return mostrarAviso('error', 'Pasaporte inválido', 'El pasaporte debe tener de 6 a 12 caracteres (letras y números)');
    }
    setCargando(true);
    try {
      const r = await solicitarCodigo({ tipo_documento: tipo, numero_documento: numero.trim() });
      setDestino(r.destino || 'tu correo');
      setModoDev(!!r.modo_dev);
      setCodigo('');
      setSegundos(SEGUNDOS_REENVIO);
      setPaso('codigo');
    } catch (error) {
      mostrarAviso('error', 'No se pudo enviar', mensajeError(error, 'No se pudo enviar el código'));
    } finally {
      setCargando(false);
    }
  };

  const confirmar = async () => {
    if (codigo.length !== 6) return;
    setCargando(true);
    try {
      const r = await verificarCodigo({ tipo_documento: tipo, numero_documento: numero.trim(), codigo });
      await AsyncStorage.setItem('portal_token', r.token);
      alIniciarSesion(r);
    } catch (error) {
      setCodigo('');
      mostrarAviso('error', 'Código incorrecto', mensajeError(error, 'No se pudo verificar el código'));
    } finally {
      setCargando(false);
    }
  };

  const reenviar = async () => {
    if (segundos > 0) return;
    await enviarCodigo();
  };

  return (
    <ScrollView
      ref={refScroll}
      contentContainerStyle={[estilos.scroll, { paddingBottom: 24 + alturaTeclado }]}
      keyboardShouldPersistTaps="handled"
    >
      <View style={estilos.tarjeta}>
          <View style={estilos.cajaLogo}>
            <Logo tamano={120} color="#E5388A" />
          </View>
          <Text style={estilos.marca}>Punta Diamantes</Text>
          <Text style={estilos.sub}>Consulta tus puntos de fidelidad</Text>

          {paso === 'documento' ? (
            <>
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
                onFocus={bajarAlCampo}
                placeholder={tipo === 'DUI' ? '00000000-0' : 'Ej. A1234567'}
                placeholderTextColor="#A6AEEF"
                keyboardType={tipo === 'DUI' ? 'number-pad' : 'default'}
                autoCapitalize="characters"
                maxLength={tipo === 'DUI' ? 10 : 12}
              />

              <Pressable style={[estilos.btn, cargando && { opacity: 0.6 }]} onPress={enviarCodigo} disabled={cargando}>
                {cargando ? <ActivityIndicator color="#fff" /> : <Text style={estilos.btnTxt}>Enviar código</Text>}
              </Pressable>

              <Text style={estilos.nota}>
                Te enviaremos un código de verificación a tu correo registrado para un ingreso único y seguro.
              </Text>
            </>
          ) : (
            <>
              {/* Paso 2: código */}
              <Text style={estilos.tituloCodigo}>Ingresa el código</Text>
              <Text style={estilos.sub}>Lo enviamos a {destino}</Text>

              <View style={estilos.cajasWrap}>
                <View style={estilos.cajasCodigo} pointerEvents="none">
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View key={i} style={[estilos.cajaDigito, codigo.length === i && estilos.cajaDigitoActiva]}>
                      <Text style={estilos.digito}>{codigo[i] ?? ''}</Text>
                    </View>
                  ))}
                </View>
                {/* Input real transparente encima de las casillas: tocar cualquier casilla lo enfoca */}
                <TextInput
                  ref={refCodigo}
                  value={codigo}
                  onChangeText={(texto) => setCodigo(texto.replace(/[^0-9]/g, '').slice(0, 6))}
                  onFocus={bajarAlCampo}
                  keyboardType="number-pad"
                  maxLength={6}
                  autoFocus
                  caretHidden
                  style={estilos.inputCodigo}
                />
              </View>

              {cargando && <ActivityIndicator color="#E5388A" style={{ marginTop: 14 }} />}

              {modoDev && (
                <Text style={estilos.notaDev}>
                  Modo prueba: el código está en la consola del backend (no se configuró el correo).
                </Text>
              )}

              <Pressable onPress={reenviar} disabled={segundos > 0} style={{ marginTop: 18 }}>
                <Text style={[estilos.reenviar, segundos > 0 && estilos.reenviarInactivo]}>
                  {segundos > 0 ? `Reenviar código en ${segundos}s` : 'Reenviar código'}
                </Text>
              </Pressable>

              <Pressable onPress={() => { setPaso('documento'); setCodigo(''); }} style={{ marginTop: 14 }}>
                <Text style={estilos.volver}>‹ Cambiar documento</Text>
              </Pressable>
            </>
          )}
        </View>
    </ScrollView>
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
  btn: { backgroundColor: '#E5388A', borderRadius: 13, paddingVertical: 15, alignItems: 'center', marginTop: 16 },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  nota: { fontSize: 12, color: '#6b7280', marginTop: 16, lineHeight: 18, textAlign: 'center' },

  // Paso código
  tituloCodigo: { fontSize: 18, fontWeight: '800', color: '#0A1259', textAlign: 'center' },
  cajasWrap: { position: 'relative', marginTop: 4 },
  cajasCodigo: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  cajaDigito: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 1.5, borderColor: '#e2e4ee',
    backgroundColor: '#f7f8fc', alignItems: 'center', justifyContent: 'center',
  },
  cajaDigitoActiva: { borderColor: '#E5388A', backgroundColor: '#fff' },
  digito: { fontSize: 24, fontWeight: '800', color: '#0A1259' },
  inputCodigo: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0 },
  notaDev: { fontSize: 12, color: '#b45309', backgroundColor: '#fff7ed', padding: 10, borderRadius: 10, marginTop: 16, textAlign: 'center' },
  reenviar: { color: '#E5388A', fontWeight: '700', fontSize: 14, textAlign: 'center' },
  reenviarInactivo: { color: '#9ca3af' },
  volver: { color: '#6b7280', fontWeight: '600', fontSize: 14, textAlign: 'center' },
});
