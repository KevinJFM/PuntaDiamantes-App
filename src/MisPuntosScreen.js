import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getMisPuntos, getMisMovimientos, mensajeError } from './api';

const fmtFecha = (f) => {
  if (!f) return '';
  const d = new Date(f);
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MisPuntosScreen({ onLogout }) {
  const [datos, setDatos] = useState(null);
  const [movs, setMovs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('recompensas');

  const cargar = async () => {
    setError('');
    try {
      const [p, m] = await Promise.all([getMisPuntos(), getMisMovimientos()]);
      setDatos(p);
      setMovs(m);
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar tus puntos'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const salir = async () => {
    await AsyncStorage.removeItem('portal_token');
    onLogout();
  };

  if (cargando) {
    return (
      <View style={s.centro}>
        <ActivityIndicator size="large" color="#E5388A" />
        <Text style={s.cargandoTxt}>Cargando tus puntos…</Text>
      </View>
    );
  }

  if (error && !datos) {
    return (
      <View style={s.centro}>
        <Text style={s.errorTxt}>{error}</Text>
        <Pressable style={s.btn} onPress={cargar}><Text style={s.btnTxt}>Reintentar</Text></Pressable>
        <Pressable style={s.linkSalir} onPress={salir}><Text style={s.linkSalirTxt}>Salir</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.pantalla}
      contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} />}
    >
      <View style={s.header}>
        <View>
          <Text style={s.hola}>Hola,</Text>
          <Text style={s.nombre}>{datos.nombres} {datos.apellidos}</Text>
        </View>
        <Pressable style={s.salir} onPress={salir}><Text style={s.salirTxt}>Salir</Text></Pressable>
      </View>

      {/* Tarjeta de puntos */}
      <View style={s.puntosCard}>
        <Text style={s.puntosLabel}>Tus puntos</Text>
        <Text style={s.puntosNum}>{datos.puntos_acumulados}</Text>
        <Text style={s.puntosValor}>equivalen a <Text style={s.puntosValorFuerte}>${datos.valor_en_dinero.toFixed(2)}</Text></Text>
        <Text style={s.doc}>{datos.tipo_documento}: {datos.numero_documento}</Text>
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        {['recompensas', 'historial'].map((t) => (
          <Pressable key={t} style={[s.tab, tab === t && s.tabActivo]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtActivo]}>
              {t === 'recompensas' ? 'Recompensas' : 'Historial'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'recompensas' && (
        <View style={{ gap: 10 }}>
          {datos.recompensas.map((r) => (
            <View key={r.id} style={[s.recompensa, r.alcanzable && s.recompensaOk]}>
              <View style={{ flex: 1 }}>
                <Text style={s.recompensaNombre}>{r.nombre}</Text>
                <Text style={s.recompensaSub}>{r.puntos} pts · ${r.valor.toFixed(2)}</Text>
              </View>
              {r.alcanzable
                ? <Text style={[s.badge, s.badgeOk]}>¡Ya puedes!</Text>
                : <Text style={s.badge}>Faltan {r.faltan}</Text>}
            </View>
          ))}
          <Text style={s.aviso}>El canje se realiza en recepción del hotel.</Text>
        </View>
      )}

      {tab === 'historial' && (
        <View style={{ gap: 10 }}>
          {movs.length === 0
            ? <Text style={s.vacio}>Aún no tienes movimientos.</Text>
            : movs.map((m) => (
              <View key={m.id_movimiento} style={s.mov}>
                <View style={{ flex: 1 }}>
                  <Text style={s.movDesc}>
                    {m.descripcion || (m.tipo === 'ganado' ? 'Puntos ganados' : m.tipo === 'canjeado' ? 'Canje' : 'Ajuste')}
                  </Text>
                  <Text style={s.movFecha}>{fmtFecha(m.fecha)}</Text>
                </View>
                <Text style={[s.movPts, Number(m.puntos) < 0 ? s.movNeg : s.movPos]}>
                  {Number(m.puntos) > 0 ? '+' : ''}{m.puntos}
                </Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: '#f4f5fb' },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f5fb', padding: 24 },
  cargandoTxt: { color: '#6b7280', marginTop: 12 },
  errorTxt: { color: '#6b7280', textAlign: 'center', marginBottom: 16 },

  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, marginTop: 8 },
  hola: { fontSize: 13, color: '#6b7280' },
  nombre: { fontSize: 19, fontWeight: '800', color: '#0A1259' },
  salir: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#e2e4ee', borderRadius: 10, paddingVertical: 8, paddingHorizontal: 14 },
  salirTxt: { fontSize: 13, fontWeight: '700', color: '#1a1f4b' },

  puntosCard: { backgroundColor: '#0A1259', borderRadius: 22, padding: 26, alignItems: 'center', marginBottom: 18 },
  puntosLabel: { fontSize: 14, color: '#c9cef2' },
  puntosNum: { fontSize: 56, fontWeight: '800', color: '#fff', lineHeight: 62, marginVertical: 4 },
  puntosValor: { fontSize: 15, color: '#e7e9fb' },
  puntosValorFuerte: { color: '#ffd9ec', fontWeight: '800' },
  doc: { marginTop: 12, fontSize: 12, color: '#a9b0e0' },

  tabs: { flexDirection: 'row', backgroundColor: '#eceefa', borderRadius: 13, padding: 5, gap: 6, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActivo: { backgroundColor: '#fff' },
  tabTxt: { fontSize: 14, fontWeight: '700', color: '#6b7280' },
  tabTxtActivo: { color: '#0A1259' },

  recompensa: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#edeef6', borderRadius: 15, padding: 14 },
  recompensaOk: { borderColor: '#bfe6c7', backgroundColor: '#e8f5e9' },
  recompensaNombre: { fontSize: 15, fontWeight: '700', color: '#1a1f4b' },
  recompensaSub: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  badge: { fontSize: 12, fontWeight: '700', color: '#6b7280', backgroundColor: '#eef0fb', paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
  badgeOk: { backgroundColor: '#16a34a', color: '#fff' },
  aviso: { textAlign: 'center', fontSize: 12, color: '#6b7280', marginTop: 6 },

  mov: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#edeef6', borderRadius: 14, padding: 13 },
  movDesc: { fontSize: 14, fontWeight: '600', color: '#1a1f4b' },
  movFecha: { fontSize: 12, color: '#6b7280', marginTop: 2 },
  movPts: { fontSize: 16, fontWeight: '800' },
  movPos: { color: '#16a34a' },
  movNeg: { color: '#E5388A' },
  vacio: { textAlign: 'center', color: '#6b7280', paddingVertical: 30 },

  btn: { backgroundColor: '#E5388A', borderRadius: 13, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
  linkSalir: { marginTop: 14 },
  linkSalirTxt: { color: '#6b7280', fontWeight: '600' },
});
