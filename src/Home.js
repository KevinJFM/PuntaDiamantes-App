import { useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme';
import MisPuntosScreen from './MisPuntosScreen';
import PromocionesScreen from './PromocionesScreen';
import ConfiguracionScreen from './ConfiguracionScreen';

const TABS = [
  { key: 'inicio', label: 'Inicio',       icon: 'home' },
  { key: 'promos', label: 'Promociones',  icon: 'pricetags' },
  { key: 'config', label: 'Configuración', icon: 'settings' },
];

export default function Home({ onLogout }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const s = estilos(colors);
  const [tab, setTab] = useState('inicio');

  return (
    <View style={s.contenedor}>
      <View style={s.pantalla}>
        {tab === 'inicio' && <MisPuntosScreen />}
        {tab === 'promos' && <PromocionesScreen />}
        {tab === 'config' && <ConfiguracionScreen onLogout={onLogout} />}
      </View>

      {/* Barra inferior */}
      <View style={[s.barra, { paddingBottom: 10 + insets.bottom }]}>
        {TABS.map((t) => {
          const activo = tab === t.key;
          return (
            <Pressable key={t.key} style={s.item} onPress={() => setTab(t.key)}>
              <Ionicons
                name={activo ? t.icon : `${t.icon}-outline`}
                size={24}
                color={activo ? colors.pink : colors.muted}
              />
              <Text style={[s.itemTxt, { color: activo ? colors.pink : colors.muted }]}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const estilos = (c) => StyleSheet.create({
  contenedor: { flex: 1, backgroundColor: c.bg },
  pantalla: { flex: 1 },
  barra: {
    flexDirection: 'row',
    backgroundColor: c.barBg,
    borderTopWidth: 1,
    borderTopColor: c.barBorder,
    paddingTop: 8,
    paddingBottom: 12,
  },
  item: { flex: 1, alignItems: 'center', gap: 3 },
  itemTxt: { fontSize: 11, fontWeight: '700' },
});
