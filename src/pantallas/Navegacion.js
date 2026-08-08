import { useCallback, useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, StyleSheet, AppState } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usarTema } from '../tema/tema';
import CampanaNotificaciones from '../componentes/CampanaNotificaciones';
import { obtenerPromocionesActivas } from '../servicios/api';
import PantallaMisPuntos from './PantallaMisPuntos';
import PantallaPromociones from './PantallaPromociones';
import PantallaConfiguracion from './PantallaConfiguracion';

// Recuerda hasta qué promoción ya vio el cliente (para el puntito de "nueva")
const CLAVE_PROMO_VISTO = 'promos_ultimo_visto';

const PESTANAS = [
  { clave: 'inicio', etiqueta: 'Inicio',        icono: 'home' },
  { clave: 'promos', etiqueta: 'Promociones',   icono: 'pricetags' },
  { clave: 'config', etiqueta: 'Configuración', icono: 'settings' },
];

export default function Navegacion({ alCerrarSesion }) {
  const { colores } = usarTema();
  const margenes = useSafeAreaInsets();
  const estilos = crearEstilos(colores);
  const [pestana, setPestana] = useState('inicio');
  const [promoNueva, setPromoNueva] = useState(false);
  const promoMaxId = useRef(0);

  // Revisa si hay una promoción con id mayor a la última que el cliente vio.
  // Reusa el endpoint que ya existe (/portal/promociones); no requiere cambios en el backend.
  const revisarPromos = useCallback(async () => {
    try {
      const promos = await obtenerPromocionesActivas();
      const lista = Array.isArray(promos) ? promos : [];
      const maxId = lista.reduce((m, p) => Math.max(m, Number(p.id_escenario) || 0), 0);
      promoMaxId.current = maxId;
      const visto = Number(await AsyncStorage.getItem(CLAVE_PROMO_VISTO)) || 0;
      setPromoNueva(maxId > visto);
    } catch {
      // Silencioso: el aviso nunca debe romper la app si falla la red
    }
  }, []);

  useEffect(() => { revisarPromos(); }, [revisarPromos]);

  // Revisa de nuevo al volver la app al primer plano (por si crearon una promo mientras no miraba).
  const estadoApp = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (siguiente) => {
      if (estadoApp.current.match(/inactive|background/) && siguiente === 'active') revisarPromos();
      estadoApp.current = siguiente;
    });
    return () => sub.remove();
  }, [revisarPromos]);

  // Al entrar a Promociones, marca las actuales como vistas (apaga el puntito)
  const irA = (clave) => {
    setPestana(clave);
    if (clave === 'promos' && promoNueva) {
      setPromoNueva(false);
      if (promoMaxId.current > 0) AsyncStorage.setItem(CLAVE_PROMO_VISTO, String(promoMaxId.current));
    }
  };

  return (
    <View style={estilos.contenedor}>
      {/* Encabezado superior con la campana de notificaciones a la derecha */}
      <View style={estilos.header}>
        <Text style={estilos.marca}>Punta Diamantes</Text>
        <CampanaNotificaciones />
      </View>

      <View style={estilos.pantalla}>
        {pestana === 'inicio' && <PantallaMisPuntos />}
        {pestana === 'promos' && <PantallaPromociones />}
        {pestana === 'config' && <PantallaConfiguracion alCerrarSesion={alCerrarSesion} />}
      </View>

      {/* Barra inferior */}
      <View style={[estilos.barra, { paddingBottom: 10 + margenes.bottom }]}>
        {PESTANAS.map((item) => {
          const activo = pestana === item.clave;
          const mostrarPunto = item.clave === 'promos' && promoNueva;
          return (
            <Pressable key={item.clave} style={estilos.item} onPress={() => irA(item.clave)}>
              <View>
                <Ionicons
                  name={activo ? item.icono : `${item.icono}-outline`}
                  size={24}
                  color={activo ? colores.rosa : colores.tenue}
                />
                {mostrarPunto && <View style={estilos.punto} />}
              </View>
              <Text style={[estilos.itemTxt, { color: activo ? colores.rosa : colores.tenue }]}>
                {item.etiqueta}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: c.fondo },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    backgroundColor: c.fondoBarra,
    borderBottomWidth: 1,
    borderBottomColor: c.bordeBarra,
  },
  marca: { fontSize: 17, fontWeight: '800', color: c.rosa },
  pantalla: { flex: 1 },
  barra: {
    flexDirection: 'row',
    backgroundColor: c.fondoBarra,
    borderTopWidth: 1,
    borderTopColor: c.bordeBarra,
    paddingTop: 8,
    paddingBottom: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  itemTxt: { fontSize: 11, fontWeight: '700' },
  // Puntito rojo de "promoción nueva" sobre el ícono de Promociones
  punto: {
    position: 'absolute', top: -3, right: -6,
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E5388A', borderWidth: 1.5, borderColor: c.fondoBarra,
  },
});
