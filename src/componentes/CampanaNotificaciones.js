import { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, Pressable, Modal, StyleSheet, ScrollView, ActivityIndicator, AppState,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { obtenerMisMovimientos } from '../servicios/api';
import { usarTema } from '../tema/tema';

// Recuerda hasta qué movimiento ya vio el cliente (para el globito de "nuevas")
const CLAVE_VISTO = 'notif_ultimo_visto';

// Convierte un movimiento de puntos en un mensaje de notificación amigable
function aNotificacion(movimiento) {
  const puntos = Number(movimiento.puntos) || 0;
  const esCanje = movimiento.tipo === 'canjeado' || puntos < 0;
  const abs = Math.abs(puntos);
  const plural = abs === 1 ? 'punto' : 'puntos';

  if (esCanje) {
    return {
      icono: 'gift',
      color: '#E5388A',
      titulo: `Canjeaste ${abs} ${plural}`,
      detalle: movimiento.descripcion || 'Canje de puntos en recepción',
    };
  }
  return {
    icono: 'add-circle',
    color: '#16a34a',
    titulo: `Acumulaste ${abs} ${plural}`,
    detalle: movimiento.descripcion || 'Puntos ganados por tu consumo',
  };
}

// Fecha corta y en palabras para las notificaciones
const fechaRelativa = (fecha) => {
  if (!fecha) return '';
  const d = new Date(fecha);
  const dias = Math.floor((Date.now() - d.getTime()) / 86400000);
  if (dias <= 0) return 'Hoy';
  if (dias === 1) return 'Ayer';
  if (dias < 7) return `Hace ${dias} días`;
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
};

export default function CampanaNotificaciones() {
  const { colores } = usarTema();
  const estilos = crearEstilos(colores);
  const [abierto, setAbierto] = useState(false);
  const [movimientos, setMovimientos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [ultimoVisto, setUltimoVisto] = useState(0);

  const cargar = useCallback(async () => {
    try {
      const historial = await obtenerMisMovimientos();
      const lista = Array.isArray(historial) ? historial : [];
      setMovimientos(lista);
      return lista;
    } catch {
      // Silencioso: la campana nunca debe romper la app si falla la red
      return null;
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    AsyncStorage.getItem(CLAVE_VISTO).then((v) => setUltimoVisto(Number(v) || 0));
    cargar();
  }, [cargar]);

  // Refresca solo al volver a la app (primer plano), sin recargar ni cerrar sesión:
  // así un movimiento recién hecho aparece cuando el cliente vuelve a mirar su teléfono.
  const estadoApp = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (siguiente) => {
      if (estadoApp.current.match(/inactive|background/) && siguiente === 'active') {
        cargar();
      }
      estadoApp.current = siguiente;
    });
    return () => sub.remove();
  }, [cargar]);

  const noLeidas = movimientos.filter(
    (m) => (Number(m.id_movimiento) || 0) > ultimoVisto
  ).length;

  // Al abrir: refresca y marca todo como visto
  const abrir = async () => {
    setAbierto(true);
    const lista = (await cargar()) || movimientos;
    const maxId = lista.reduce((max, m) => Math.max(max, Number(m.id_movimiento) || 0), 0);
    if (maxId > ultimoVisto) {
      await AsyncStorage.setItem(CLAVE_VISTO, String(maxId));
      setUltimoVisto(maxId);
    }
  };

  return (
    <>
      <Pressable onPress={abrir} hitSlop={10} style={estilos.boton}>
        <Ionicons name="notifications-outline" size={24} color={colores.texto} />
        {noLeidas > 0 && (
          <View style={estilos.globo}>
            <Text style={estilos.globoTxt}>{noLeidas > 9 ? '9+' : noLeidas}</Text>
          </View>
        )}
      </Pressable>

      <Modal visible={abierto} transparent animationType="fade" onRequestClose={() => setAbierto(false)}>
        <View style={estilos.overlay}>
          {/* Fondo para cerrar al tocar afuera (va DETRÁS del panel, no interfiere con el scroll) */}
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setAbierto(false)} />

          <View style={estilos.panel}>
            <View style={estilos.panelEncabezado}>
              <Text style={estilos.panelTitulo}>Notificaciones</Text>
              <Pressable onPress={() => setAbierto(false)} hitSlop={10}>
                <Ionicons name="close" size={22} color={colores.tenue} />
              </Pressable>
            </View>

            {cargando ? (
              <View style={estilos.centro}>
                <ActivityIndicator color={colores.rosa} />
              </View>
            ) : movimientos.length === 0 ? (
              <View style={estilos.centro}>
                <Ionicons name="notifications-off-outline" size={34} color={colores.tenue} />
                <Text style={estilos.vacio}>Aún no tienes notificaciones.</Text>
              </View>
            ) : (
              <ScrollView style={{ maxHeight: 380 }} nestedScrollEnabled showsVerticalScrollIndicator>
                {movimientos.map((movimiento) => {
                  const n = aNotificacion(movimiento);
                  return (
                    <View key={movimiento.id_movimiento} style={estilos.item}>
                      <View style={[estilos.iconoCaja, { backgroundColor: `${n.color}22` }]}>
                        <Ionicons name={n.icono} size={20} color={n.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={estilos.itemTitulo}>{n.titulo}</Text>
                        <Text style={estilos.itemDetalle} numberOfLines={2}>{n.detalle}</Text>
                        <Text style={estilos.itemFecha}>{fechaRelativa(movimiento.fecha)}</Text>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  boton: { padding: 4 },
  globo: {
    position: 'absolute', top: -2, right: -2, minWidth: 18, height: 18, borderRadius: 9,
    backgroundColor: '#E5388A', alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 4, borderWidth: 2, borderColor: c.fondoBarra,
  },
  globoTxt: { color: '#fff', fontSize: 10, fontWeight: '800' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', paddingTop: 64, paddingHorizontal: 12 },
  panel: {
    alignSelf: 'flex-end', width: 330, maxWidth: '94%',
    backgroundColor: c.tarjeta, borderRadius: 18, padding: 8,
    borderWidth: 1, borderColor: c.borde,
    shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 12,
  },
  panelEncabezado: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 8, paddingVertical: 8 },
  panelTitulo: { fontSize: 16, fontWeight: '800', color: c.texto },

  centro: { alignItems: 'center', justifyContent: 'center', paddingVertical: 34, gap: 10 },
  vacio: { color: c.tenue, fontSize: 14 },

  item: { flexDirection: 'row', gap: 12, alignItems: 'flex-start', padding: 10, borderRadius: 12 },
  iconoCaja: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  itemTitulo: { fontSize: 14.5, fontWeight: '700', color: c.texto },
  itemDetalle: { fontSize: 13, color: c.tenue, marginTop: 1 },
  itemFecha: { fontSize: 11.5, color: c.tenue, marginTop: 4, fontWeight: '600' },
});
