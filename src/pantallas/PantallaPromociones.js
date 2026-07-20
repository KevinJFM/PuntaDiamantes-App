import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerPromocionesActivas, mensajeError } from '../servicios/api';
import { usarTema } from '../tema/tema';

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
              </View>
            </View>
          ))}
          <Text style={estilos.pie}>Las promociones se aplican al registrar tu consumo en el hotel.</Text>
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
  pie: { textAlign: 'center', fontSize: 12, color: c.tenue, marginTop: 6 },
  aviso: { color: c.tenue, textAlign: 'center', marginTop: 20 },
  cajaVacia: { alignItems: 'center', gap: 12, paddingVertical: 50 },
  vacio: { color: c.tenue, fontSize: 15, textAlign: 'center' },
});
