import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getMisPuntos, getMisMovimientos, mensajeError } from './api';
import { useTheme } from './theme';

const fmtFecha = (f) => {
  if (!f) return '';
  const d = new Date(f);
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function MisPuntosScreen() {
  const { colors } = useTheme();
  const s = estilos(colors);
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

  if (cargando) {
    return (
      <View style={s.centro}>
        <ActivityIndicator size="large" color={colors.pink} />
        <Text style={s.cargandoTxt}>Cargando tus puntos…</Text>
      </View>
    );
  }

  if (!datos) {
    return (
      <View style={s.centro}>
        <Text style={s.errorTxt}>{error || 'No se pudieron cargar tus datos.'}</Text>
        <Pressable style={s.btn} onPress={cargar}><Text style={s.btnTxt}>Reintentar</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={s.pantalla}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} tintColor={colors.pink} />}
    >
      <View style={s.header}>
        <Text style={s.hola}>Hola,</Text>
        <Text style={s.nombre}>{datos.nombres} {datos.apellidos}</Text>
      </View>

      {/* Tarjeta de puntos */}
      <View style={s.puntosCard}>
        <Text style={s.puntosLabel}>Tus puntos</Text>
        <Text style={s.puntosNum}>{datos.puntos_acumulados}</Text>
        <View style={s.reglas}>
          <Text style={s.reglaChip}>$1 = 1 punto</Text>
        </View>
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
          <View style={s.avisoBanner}>
            <Ionicons name="storefront" size={20} color={colors.pink} />
            <Text style={s.avisoBannerTxt}>El canje de puntos se realiza en recepción del hotel.</Text>
          </View>
          {datos.recompensas.map((r) => (
            <View key={r.id} style={[s.recompensa, r.alcanzable && s.recompensaOk]}>
              <View style={{ flex: 1 }}>
                <Text style={s.recompensaNombre}>{r.nombre}</Text>
                <Text style={s.recompensaSub}>
                  {r.puntos} pts
                  {r.tipo ? <Text style={s.recompensaTipo}> · Habitación {r.tipo}</Text> : null}
                </Text>
              </View>
              {r.alcanzable
                ? <Text style={[s.badge, s.badgeOk]}>¡Ya puedes!</Text>
                : <Text style={s.badge}>Faltan {r.faltan}</Text>}
            </View>
          ))}
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

const estilos = (c) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: c.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg, padding: 24 },
  cargandoTxt: { color: c.muted, marginTop: 12 },
  errorTxt: { color: c.muted, textAlign: 'center', marginBottom: 16 },

  header: { marginBottom: 16, marginTop: 4 },
  hola: { fontSize: 13, color: c.muted },
  nombre: { fontSize: 20, fontWeight: '800', color: c.text },

  puntosCard: { backgroundColor: c.pointsCard, borderRadius: 22, padding: 26, alignItems: 'center', marginBottom: 18 },
  puntosLabel: { fontSize: 14, color: '#c9cef2' },
  puntosNum: { fontSize: 56, fontWeight: '800', color: '#fff', lineHeight: 62, marginVertical: 4 },
  puntosValor: { fontSize: 15, color: '#e7e9fb' },
  puntosValorFuerte: { color: '#ffd9ec', fontWeight: '800' },
  reglas: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  reglaChip: { fontSize: 12, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  doc: { marginTop: 12, fontSize: 12, color: '#a9b0e0' },

  tabs: { flexDirection: 'row', backgroundColor: c.chip, borderRadius: 13, padding: 5, gap: 6, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  tabActivo: { backgroundColor: c.pink },
  tabTxt: { fontSize: 14, fontWeight: '700', color: c.muted },
  tabTxtActivo: { color: '#fff' },

  recompensa: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, borderRadius: 15, padding: 14 },
  recompensaOk: { borderColor: c.okBorder, backgroundColor: c.okBg },
  recompensaNombre: { fontSize: 15, fontWeight: '700', color: c.text },
  recompensaSub: { fontSize: 13, color: c.muted, marginTop: 2 },
  recompensaTipo: { color: c.pink, fontWeight: '800' },
  badge: { fontSize: 12, fontWeight: '700', color: c.muted, backgroundColor: c.chip, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
  badgeOk: { backgroundColor: c.ok, color: '#fff' },
  avisoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.chip, borderRadius: 12, padding: 13, borderLeftWidth: 4, borderLeftColor: c.pink, marginBottom: 2 },
  avisoBannerTxt: { flex: 1, fontSize: 13.5, fontWeight: '700', color: c.text },

  mov: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, borderRadius: 14, padding: 13 },
  movDesc: { fontSize: 14, fontWeight: '600', color: c.text },
  movFecha: { fontSize: 12, color: c.muted, marginTop: 2 },
  movPts: { fontSize: 16, fontWeight: '800' },
  movPos: { color: c.ok },
  movNeg: { color: c.pink },
  vacio: { textAlign: 'center', color: c.muted, paddingVertical: 30 },

  btn: { backgroundColor: c.pink, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
