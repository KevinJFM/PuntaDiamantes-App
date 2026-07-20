import { useEffect, useState } from 'react';
import {
  View, Text, Pressable, StyleSheet, ScrollView, ActivityIndicator, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { obtenerMisPuntos, obtenerMisMovimientos, mensajeError } from '../servicios/api';
import { usarTema } from '../tema/tema';

const formatearFecha = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default function PantallaMisPuntos() {
  const { colores } = usarTema();
  const estilos = crearEstilos(colores);
  const [datos, setDatos] = useState(null);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  const [pestana, setPestana] = useState('recompensas');

  const cargar = async () => {
    setError('');
    try {
      const [puntos, historial] = await Promise.all([obtenerMisPuntos(), obtenerMisMovimientos()]);
      setDatos(puntos);
      setMovimientos(historial);
    } catch (e) {
      setError(mensajeError(e, 'No se pudieron cargar tus puntos'));
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  if (cargando) {
    return (
      <View style={estilos.centro}>
        <ActivityIndicator size="large" color={colores.rosa} />
        <Text style={estilos.cargandoTxt}>Cargando tus puntos…</Text>
      </View>
    );
  }

  if (!datos) {
    return (
      <View style={estilos.centro}>
        <Text style={estilos.errorTxt}>{error || 'No se pudieron cargar tus datos.'}</Text>
        <Pressable style={estilos.btn} onPress={cargar}><Text style={estilos.btnTxt}>Reintentar</Text></Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      style={estilos.pantalla}
      contentContainerStyle={{ padding: 16, paddingBottom: 30 }}
      refreshControl={<RefreshControl refreshing={false} onRefresh={cargar} tintColor={colores.rosa} />}
    >
      <View style={estilos.encabezado}>
        <Text style={estilos.hola}>Hola,</Text>
        <Text style={estilos.nombre}>{datos.nombres} {datos.apellidos}</Text>
      </View>

      {/* Tarjeta de puntos */}
      <View style={estilos.tarjetaPuntos}>
        <Text style={estilos.puntosLabel}>Tus puntos</Text>
        <Text style={estilos.puntosNum}>{datos.puntos_acumulados}</Text>
        <View style={estilos.reglas}>
          <Text style={estilos.reglaFicha}>$1 = 1 punto</Text>
        </View>
        <Text style={estilos.doc}>{datos.tipo_documento}: {datos.numero_documento}</Text>
      </View>

      {/* Pestañas */}
      <View style={estilos.pestanas}>
        {['recompensas', 'historial'].map((clave) => (
          <Pressable key={clave} style={[estilos.pestana, pestana === clave && estilos.pestanaActiva]} onPress={() => setPestana(clave)}>
            <Text style={[estilos.pestanaTxt, pestana === clave && estilos.pestanaTxtActiva]}>
              {clave === 'recompensas' ? 'Recompensas' : 'Historial'}
            </Text>
          </Pressable>
        ))}
      </View>

      {pestana === 'recompensas' && (
        <View style={{ gap: 10 }}>
          <View style={estilos.avisoBanner}>
            <Ionicons name="storefront" size={20} color={colores.rosa} />
            <Text style={estilos.avisoBannerTxt}>El canje de puntos se realiza en recepción del hotel.</Text>
          </View>
          {datos.recompensas.map((recompensa) => (
            <View key={recompensa.id} style={[estilos.recompensa, recompensa.alcanzable && estilos.recompensaOk]}>
              <View style={{ flex: 1 }}>
                <Text style={estilos.recompensaNombre}>{recompensa.nombre}</Text>
                <Text style={estilos.recompensaSub}>
                  {recompensa.puntos} pts
                  {recompensa.tipo ? <Text style={estilos.recompensaTipo}> · Habitación {recompensa.tipo}</Text> : null}
                </Text>
              </View>
              {recompensa.alcanzable
                ? <Text style={[estilos.ficha, estilos.fichaOk]}>¡Ya puedes!</Text>
                : <Text style={estilos.ficha}>Faltan {recompensa.faltan}</Text>}
            </View>
          ))}
        </View>
      )}

      {pestana === 'historial' && (
        <View style={{ gap: 10 }}>
          {movimientos.length === 0
            ? <Text style={estilos.vacio}>Aún no tienes movimientos.</Text>
            : movimientos.map((movimiento) => (
              <View key={movimiento.id_movimiento} style={estilos.movimiento}>
                <View style={{ flex: 1 }}>
                  <Text style={estilos.movDesc}>
                    {movimiento.descripcion || (movimiento.tipo === 'ganado' ? 'Puntos ganados' : movimiento.tipo === 'canjeado' ? 'Canje' : 'Ajuste')}
                  </Text>
                  <Text style={estilos.movFecha}>{formatearFecha(movimiento.fecha)}</Text>
                </View>
                <Text style={[estilos.movPts, Number(movimiento.puntos) < 0 ? estilos.movNeg : estilos.movPos]}>
                  {Number(movimiento.puntos) > 0 ? '+' : ''}{movimiento.puntos}
                </Text>
              </View>
            ))}
        </View>
      )}
    </ScrollView>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: c.fondo },
  centro: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: c.fondo, padding: 24 },
  cargandoTxt: { color: c.tenue, marginTop: 12 },
  errorTxt: { color: c.tenue, textAlign: 'center', marginBottom: 16 },

  encabezado: { marginBottom: 16, marginTop: 4 },
  hola: { fontSize: 13, color: c.tenue },
  nombre: { fontSize: 20, fontWeight: '800', color: c.texto },

  tarjetaPuntos: { backgroundColor: c.tarjetaPuntos, borderRadius: 22, padding: 26, alignItems: 'center', marginBottom: 18 },
  puntosLabel: { fontSize: 14, color: '#c9cef2' },
  puntosNum: { fontSize: 56, fontWeight: '800', color: '#fff', lineHeight: 62, marginVertical: 4 },
  reglas: { flexDirection: 'row', gap: 8, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' },
  reglaFicha: { fontSize: 12, fontWeight: '700', color: '#fff', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 11, paddingVertical: 5, borderRadius: 20, overflow: 'hidden' },
  doc: { marginTop: 12, fontSize: 12, color: '#a9b0e0' },

  pestanas: { flexDirection: 'row', backgroundColor: c.ficha, borderRadius: 13, padding: 5, gap: 6, marginBottom: 16 },
  pestana: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: 'center' },
  pestanaActiva: { backgroundColor: c.rosa },
  pestanaTxt: { fontSize: 14, fontWeight: '700', color: c.tenue },
  pestanaTxtActiva: { color: '#fff' },

  avisoBanner: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.ficha, borderRadius: 12, padding: 13, borderLeftWidth: 4, borderLeftColor: c.rosa, marginBottom: 2 },
  avisoBannerTxt: { flex: 1, fontSize: 13.5, fontWeight: '700', color: c.texto },

  recompensa: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.tarjeta, borderWidth: 1.5, borderColor: c.borde, borderRadius: 15, padding: 14 },
  recompensaOk: { borderColor: c.okBorde, backgroundColor: c.okFondo },
  recompensaNombre: { fontSize: 15, fontWeight: '700', color: c.texto },
  recompensaSub: { fontSize: 13, color: c.tenue, marginTop: 2 },
  recompensaTipo: { color: c.rosa, fontWeight: '800' },
  ficha: { fontSize: 12, fontWeight: '700', color: c.tenue, backgroundColor: c.ficha, paddingHorizontal: 11, paddingVertical: 6, borderRadius: 20, overflow: 'hidden' },
  fichaOk: { backgroundColor: c.ok, color: '#fff' },

  movimiento: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.tarjeta, borderWidth: 1.5, borderColor: c.borde, borderRadius: 14, padding: 13 },
  movDesc: { fontSize: 14, fontWeight: '600', color: c.texto },
  movFecha: { fontSize: 12, color: c.tenue, marginTop: 2 },
  movPts: { fontSize: 16, fontWeight: '800' },
  movPos: { color: c.ok },
  movNeg: { color: c.rosa },
  vacio: { textAlign: 'center', color: c.tenue, paddingVertical: 30 },

  btn: { backgroundColor: c.rosa, borderRadius: 13, paddingVertical: 14, paddingHorizontal: 28, alignItems: 'center' },
  btnTxt: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
