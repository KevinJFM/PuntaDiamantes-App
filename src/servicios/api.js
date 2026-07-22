import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { URL_API } from '../configuracion/configuracion';

const api = axios.create({
  baseURL: URL_API,
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
// Acceso con código por correo (DUI + código de 6 dígitos)
export const solicitarCodigo = async (datos) => {
  const { data } = await api.post('/portal/solicitar-codigo', datos);
  return data;
};

export const verificarCodigo = async (datos) => {
  const { data } = await api.post('/portal/verificar-codigo', datos);
  return data;
};

export const obtenerMisPuntos = async () => {
  const { data } = await api.get('/portal/mis-puntos');
  return data;
};

export const obtenerMisMovimientos = async () => {
  const { data } = await api.get('/portal/mis-movimientos');
  return data;
};

export const obtenerPromocionesActivas = async () => {
  const { data } = await api.get('/portal/promociones');
  return data;
};

// Registra el token de notificaciones push del dispositivo para este cliente
export const registrarToken = async (token) => {
  const { data } = await api.post('/portal/registrar-token', { token });
  return data;
};

// Borra el token de notificaciones (al cerrar sesión)
export const borrarToken = async () => {
  const { data } = await api.post('/portal/borrar-token');
  return data;
};

// Mensaje amigable: distingue "sin conexión" de error del servidor
export const mensajeError = (error, respaldo = 'Ocurrió un error') => {
  if (error?.response) return error.response.data?.message || respaldo;
  return 'No se pudo conectar. Revisa tu conexión y la IP del servidor.';
};
