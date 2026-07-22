import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerPromocionesActivas, mensajeError } from '../servicios/api';
import { usarTema } from '../tema/tema';

// Convierte 'YYYY-MM-DD' en una fecha local, sin desfase por zona horaria
const soloFecha = (valor) => {
  if (!valor) return null;
  const [y, m, d] = String(valor).slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
};

// '25 jul 2026' (o '25 jul' si conAno = false)
const fmtFecha = (fecha, conAno = true) =>
  fecha.toLocaleDateString('es-SV', { day: 'numeric', month: 'short', ...(conAno ? { year: 'numeric' } : {}) });

// Texto de vigencia según cómo se configuró la promoción en el sistema
const textoVigencia = (promo) => {
  const especial = soloFecha(promo.fecha_especial);
  if (especial) return `Solo el ${fmtFecha(especial)}`;

  const ini = soloFecha(promo.fecha_inicio);
  const fin = soloFecha(promo.fecha_fin);
  if (ini && fin) {
    const mismoAno = ini.getFullYear() === fin.getFullYear();
    return `Del ${fmtFecha(ini, !mismoAno)} al ${fmtFecha(fin)}`;
  }
  if (fin) return `Hasta el ${fmtFecha(fin)}`;
  return null;
};

export default function PantallaPromociones() {
  const { colores } = usarTema();
  const estilos = crearEstilos(colores);
  const [promociones, setPromociones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargar = async () => {
    setError('');
    try {
      setPromociones(await obtenerPromocionesActivas());
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar las promociones'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.rosa} />
      </View>
    );
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} tintColor={colores.rosa} />}
    >
      <Text style={estilos.titulo}>Promociones activas</Text>

      {error && !promociones.length ? (
        <Text style={estilos.aviso}>{error}</Text>
      ) : promociones.length === 0 ? (
        <View style={estilos.cajaVacia}>
          <Ionicons name="pricetags-outline" size={40} color={colores.tenue} />
          <Text style={estilos.vacio}>No hay promociones activas por ahora.</Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={estilos.avisoBanner}>
            <Ionicons name="pricetags" size={20} color={colores.rosa} />
            <Text style={estilos.avisoBannerTxt}>Las promociones se aplican al registrar tu consumo en el hotel.</Text>
          </View>
          {promociones.map((promocion) => (
            <View key={promocion.id_escenario} style={estilos.tarjeta}>
              <View style={estilos.icono}>
                <Ionicons name="gift" size={22} color={colores.rosa} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={estilos.nombre}>{promocion.nombre}</Text>
                <View style={estilos.fichas}>
                  {Number(promocion.puntos_extra) > 0 && (
                    <Text style={[estilos.ficha, estilos.fichaPts]}>+{promocion.puntos_extra} pts</Text>
                  )}
                  {Number(promocion.descuento_extra) > 0 && (
                    <Text style={[estilos.ficha, estilos.fichaDesc]}>{Number(promocion.descuento_extra)}% descuento</Text>
                  )}
                </View>
                {textoVigencia(promocion) && (
                  <View style={estilos.fecha}>
                    <Ionicons name="calendar-outline" size={13} color={colores.tenue} />
                    <Text style={estilos.fechaTxt}>{textoVigencia(promocion)}</Text>
                  </View>
                )}
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: c.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fondo },
  titulo: { fontSize: 20, fontWeight: '800', color: c.texto, marginBottom: 16, marginTop: 4 },
  tarjeta: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.tarjeta, borderWidth: 1.5, borderColor: c.borde, borderRadius: 16, padding: 14 },
  icono: { width: 44, height: 44, borderRadius: 12, backgroundColor: c.okFondo, alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 16, fontWeight: '700', color: c.texto },
  fichas: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  ficha: { fontSize: 12, fontWeight: '700', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  fichaPts: { backgroundColor: c.rosa, color: '#fff' },
  fichaDesc: { backgroundColor: c.ficha, color: c.texto },
  fecha: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  fechaTxt: { fontSize: 12.5, color: c.tenue, fontWeight: '600' },
  avisoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.ficha, borderRadius: 12, padding: 13, borderLeftWidth: 4, borderLeftColor: c.rosa },
  avisoBannerTxt: { flex: 1, fontSize: 13.5, fontWeight: '700', color: c.texto },
  aviso: { color: c.tenue, textAlign: 'center', marginTop: 20 },
  cajaVacia: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  vacio: { color: c.tenue, fontSize: 15, textAlign: 'center' },
});
