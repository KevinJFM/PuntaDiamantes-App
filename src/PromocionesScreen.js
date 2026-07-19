import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getPromocionesActivas, mensajeError } from './api';
import { useTheme } from './theme';

export default function PromocionesScreen() {
  const { colors } = useTheme();
  const s = estilos(colors);
  const [promos, setPromos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setError('');
    try {
      setPromos(await getPromocionesActivas());
    } catch (err) {
      setError(mensajeError(err, 'No se pudieron cargar las promociones'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) {
    return (
      <View style={s.centro}>
        <ActivityIndicator size="large" color={colors.pink} />
      </View>
    );
  }

  return (
    <ScrollView
      style={s.pantalla}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} tintColor={colors.pink} />}
    >
      <Text style={s.titulo}>Promociones activas</Text>

      {error && !promos.length ? (
        <Text style={s.aviso}>{error}</Text>
      ) : promos.length === 0 ? (
        <View style={s.vacioBox}>
          <Ionicons name="pricetags-outline" size={40} color={colors.muted} />
          <Text style={s.vacio}>No hay promociones activas por ahora.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {promos.map((p) => (
            <View key={p.id_escenario} style={s.card}>
              <View style={s.icono}>
                <Ionicons name="gift" size={22} color={colors.pink} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.nombre}>{p.nombre}</Text>
                <View style={s.tags}>
                  {Number(p.puntos_extra) > 0 && (
                    <Text style={[s.tag, s.tagPts]}>+{p.puntos_extra} pts</Text>
                  )}
                  {Number(p.descuento_extra) > 0 && (
                    <Text style={[s.tag, s.tagDesc]}>{Number(p.descuento_extra)}% descuento</Text>
                  )}
                </View>
              </View>
            </View>
          ))}
          <Text style={s.pie}>Las promociones se aplican al registrar tu consumo en el hotel.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const estilos = (c) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: c.bg },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.bg },
  titulo: { fontSize: 20, fontWeight: '800', color: c.text, marginBottom: 16, marginTop: 4 },
  card: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.card, borderWidth: 1.5, borderColor: c.border, borderRadius: 16, padding: 14 },
  icono: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.okBg, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 16, fontWeight: '700', color: c.text },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  tag: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  tagPts: { backgroundColor: c.pink, color: '#fff' },
  tagDesc: { backgroundColor: c.chip, color: c.text },
  pie: { textAlign: 'center', fontSize: 12, color: c.muted, marginTop: 6 },
  aviso: { color: c.muted, textAlign: 'center', marginTop: 20 },
  vacioBox: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  vacio: { color: c.muted, fontSize: 15, textAlign: 'center' },
});
