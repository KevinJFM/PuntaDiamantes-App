import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
});

// Adjunta el token del cliente (guardado en el teléfono) a cada petición
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('portal_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// ---------- Servicios del portal ----------
export const loginCliente = async (datos) => {
  const { data } = await api.post('/portal/login', datos);
  return data;
};

export const getMisPuntos = async () => {
  const { data } = await api.get('/portal/mis-puntos');
  return data;
};

export const getMisMovimientos = async () => {
  const { data } = await api.get('/portal/mis-movimientos');
  return data;
};

// Mensaje amigable: distingue "sin conexión" de error del servidor
export const mensajeError = (err, fallback = 'Ocurrió un error') => {
  if (err?.response) return err.response.data?.message || fallback;
  return 'No se pudo conectar. Revisa tu conexión y la IP del servidor.';
};
