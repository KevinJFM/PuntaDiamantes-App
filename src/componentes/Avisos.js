import { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usarTema } from '../tema/tema';

// Icono, color y tinte según el tipo (el fondo del cuadro y el texto salen del tema)
const ACENTOS = {
  error: { icono: 'alert-circle',      color: '#dc2626', tinte: 'rgba(220,38,38,0.12)' },
  exito: { icono: 'checkmark-circle',  color: '#16a34a', tinte: 'rgba(22,163,74,0.12)' },
  info:  { icono: 'information-circle', color: '#E5388A', tinte: 'rgba(229,56,138,0.12)' },
};

const ContextoAvisos = createContext(() => {});
export const usarAvisos = () => useContext(ContextoAvisos);

export function ProveedorAvisos({ children }) {
  const { colores } = usarTema();
  const [aviso, setAviso] = useState(null); // { tipo, titulo, mensaje }

  // mostrarAviso(tipo, titulo, mensaje) — tipo: 'error' | 'exito' | 'info'
  const mostrarAviso = useCallback((tipo, titulo, mensaje) => {
    setAviso({ tipo: tipo || 'info', titulo, mensaje });
  }, []);

  const cerrar = () => setAviso(null);
  const acento = aviso ? (ACENTOS[aviso.tipo] || ACENTOS.info) : ACENTOS.info;
  const estilos = crearEstilos(colores);

  return (
    <ContextoAvisos.Provider value={mostrarAviso}>
      {children}
      <Modal transparent visible={!!aviso} animationType="fade" onRequestClose={cerrar} statusBarTranslucent>
        <Pressable style={estilos.fondo} onPress={cerrar}>
          <Pressable style={estilos.cuadro} onPress={() => {}}>
            <View style={[estilos.circulo, { backgroundColor: acento.tinte }]}>
              <Ionicons name={acento.icono} size={34} color={acento.color} />
            </View>
            {!!aviso?.titulo && <Text style={estilos.titulo}>{aviso.titulo}</Text>}
            {!!aviso?.mensaje && <Text style={estilos.mensaje}>{aviso.mensaje}</Text>}
            <Pressable style={[estilos.boton, { backgroundColor: acento.color }]} onPress={cerrar}>
              <Text style={estilos.botonTxt}>Entendido</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </ContextoAvisos.Provider>
  );
}

const crearEstilos = (c) => StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  cuadro: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: c.tarjeta,
    borderRadius: 22,
    padding: 24,
    alignItems: 'center',
  },
  circulo: {
    width: 66, height: 66, borderRadius: 33,
    alignItems: 'center', justifyContent: 'center', marginBottom: 14,
  },
  titulo: { fontSize: 18, fontWeight: '800', color: c.texto, textAlign: 'center' },
  mensaje: { fontSize: 14, color: c.tenue, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  boton: { marginTop: 20, alignSelf: 'stretch', borderRadius: 13, paddingVertical: 13, alignItems: 'center' },
  botonTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
});
