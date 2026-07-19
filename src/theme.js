import { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Acento de marca (constante en ambos temas)
export const PINK = '#E5388A';
export const NAVY = '#0A1259';

export const lightColors = {
  bg: '#f4f5fb',
  card: '#ffffff',
  text: '#1a1f4b',
  muted: '#6b7280',
  border: '#edeef6',
  inputBorder: '#e2e4ee',
  barBg: '#ffffff',
  barBorder: '#e8eaf3',
  chip: '#eceefa',
  pink: PINK,
  navy: NAVY,
  pointsCard: NAVY,
  okBg: '#e8f5e9',
  okBorder: '#bfe6c7',
  ok: '#16a34a',
};

export const darkColors = {
  bg: '#0b1020',
  card: '#151b33',
  text: '#eef0fb',
  muted: '#9aa2c4',
  border: '#26304f',
  inputBorder: '#2c3557',
  barBg: '#12172b',
  barBorder: '#232c4a',
  chip: '#1c2340',
  pink: PINK,
  navy: NAVY,
  pointsCard: '#1b2350',
  okBg: '#123024',
  okBorder: '#1f5c3d',
  ok: '#34d399',
};

const ThemeContext = createContext({ dark: false, colors: lightColors, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem('portal_theme')
      .then((v) => setDark(v === 'dark'))
      .finally(() => setListo(true));
  }, []);

  const toggle = () => {
    setDark((d) => {
      const nuevo = !d;
      AsyncStorage.setItem('portal_theme', nuevo ? 'dark' : 'light');
      return nuevo;
    });
  };

  const value = { dark, colors: dark ? darkColors : lightColors, toggle, listo };
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
