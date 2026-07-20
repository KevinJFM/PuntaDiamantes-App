import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Acento de marca (constante en ambos temas)
export const ROSA = '#E5388A';
export const AZUL = '#0A1259';

export const coloresClaro = {
  fondo: '#f4f5fb',
  tarjeta: '#ffffff',
  texto: '#1a1f4b',
  tenue: '#6b7280',
  borde: '#edeef6',
  bordeCampo: '#e2e4ee',
  fondoBarra: '#ffffff',
  bordeBarra: '#e8eaf3',
  ficha: '#eceefa',
  rosa: ROSA,
  azul: AZUL,
  tarjetaPuntos: AZUL,
  okFondo: '#e8f5e9',
  okBorde: '#bfe6c7',
  ok: '#16a34a',
};

export const coloresOscuro = {
  fondo: '#0b1020',
  tarjeta: '#151b33',
  texto: '#eef0fb',
  tenue: '#9aa2c4',
  borde: '#26304f',
  bordeCampo: '#2c3557',
  fondoBarra: '#12172b',
  bordeBarra: '#232c4a',
  ficha: '#1c2340',
  rosa: ROSA,
  azul: AZUL,
  tarjetaPuntos: '#1b2350',
  okFondo: '#123024',
  okBorde: '#1f5c3d',
  ok: '#34d399',
};

const ContextoTema = createContext({ oscuro: false, colores: coloresClaro, alternarTema: () => {} });

export function ProveedorTema({ children }) {
  const [oscuro, setOscuro] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('portal_tema')
      .then((v) => setOscuro(v === 'oscuro'))
      .finally(() => setListo(true));
  }, []);

  const alternarTema = () => {
    setOscuro((valorActual) => {
      const nuevo = !valorActual;
      AsyncStorage.setItem('portal_tema', nuevo ? 'oscuro' : 'claro');
      return nuevo;
    });
  };

  const valor = { oscuro, colores: oscuro ? coloresOscuro : coloresClaro, alternarTema, listo };
  return <ContextoTema.Provider value={valor}>{children}</ContextoTema.Provider>;
}

export const usarTema = () => useContext(ContextoTema);
