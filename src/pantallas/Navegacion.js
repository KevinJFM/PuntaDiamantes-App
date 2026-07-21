import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { usarTema } from '../tema/tema';
import CampanaNotificaciones from '../componentes/CampanaNotificaciones';
import PantallaMisPuntos from './PantallaMisPuntos';
import PantallaPromociones from './PantallaPromociones';
import PantallaConfiguracion from './PantallaConfiguracion';

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
          return (
            <Pressable key={item.clave} style={estilos.item} onPress={() => setPestana(item.clave)}>
              <Ionicons
                name={activo ? item.icono : `${item.icono}-outline`}
                size={24}
                color={activo ? colores.rosa : colores.tenue}
              />
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
});
