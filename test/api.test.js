// Mock de axios: capturamos la instancia para poder invocar los interceptores
// a mano (sin servidor real).
jest.mock('axios', () => {
  const instance = {
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    post: jest.fn(),
    get: jest.fn(),
  };
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance), __instance: instance },
  };
});

import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { mensajeError, registrarManejadorSesion } from '../src/servicios/api';

const instancia = axios.__instance;

// Los interceptores se registran una sola vez al importar el módulo:
// capturamos sus callbacks aquí (antes de limpiar mocks en cada test).
const interceptorPeticion = instancia.interceptors.request.use.mock.calls[0][0];
const interceptorErrorRespuesta = instancia.interceptors.response.use.mock.calls[0][1];

beforeEach(() => {
  SecureStore.getItemAsync.mockReset();
  SecureStore.deleteItemAsync.mockReset();
});

describe('mensajeError', () => {
  it('devuelve el mensaje del servidor cuando hay respuesta', () => {
    const error = { response: { data: { message: 'Documento no encontrado' } } };
    expect(mensajeError(error)).toBe('Documento no encontrado');
  });

  it('usa el respaldo cuando el servidor responde sin message', () => {
    const error = { response: { data: {} } };
    expect(mensajeError(error, 'Falló algo')).toBe('Falló algo');
  });

  it('avisa de falta de conexión cuando no hay respuesta', () => {
    expect(mensajeError({})).toBe('No se pudo conectar. Revisa tu conexión a internet.');
  });
});

describe('interceptor de petición', () => {
  it('adjunta el Bearer token cuando existe en SecureStore', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce('token-123');
    const config = await interceptorPeticion({ headers: {} });
    expect(config.headers.Authorization).toBe('Bearer token-123');
  });

  it('no adjunta Authorization cuando no hay token', async () => {
    SecureStore.getItemAsync.mockResolvedValueOnce(null);
    const config = await interceptorPeticion({ headers: {} });
    expect(config.headers.Authorization).toBeUndefined();
  });
});

describe('interceptor de respuesta (sesión expirada)', () => {
  it('en un 401 de ruta normal: borra el token y avisa', async () => {
    const manejador = jest.fn();
    registrarManejadorSesion(manejador);
    const error = {
      config: { url: '/portal/mis-puntos' },
      response: { status: 401, data: { message: 'Sesión inválida' } },
    };

    await expect(interceptorErrorRespuesta(error)).rejects.toBe(error);

    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('portal_token');
    expect(manejador).toHaveBeenCalledWith('Sesión inválida');
  });

  it('NO cierra sesión en un 401 de las rutas de acceso (código incorrecto)', async () => {
    const manejador = jest.fn();
    registrarManejadorSesion(manejador);
    const error = {
      config: { url: '/portal/verificar-codigo' },
      response: { status: 401, data: { message: 'Código incorrecto' } },
    };

    await expect(interceptorErrorRespuesta(error)).rejects.toBe(error);

    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(manejador).not.toHaveBeenCalled();
  });

  it('ignora errores que no son 401 (ej. 500)', async () => {
    const manejador = jest.fn();
    registrarManejadorSesion(manejador);
    const error = { config: { url: '/portal/mis-puntos' }, response: { status: 500 } };

    await expect(interceptorErrorRespuesta(error)).rejects.toBe(error);

    expect(SecureStore.deleteItemAsync).not.toHaveBeenCalled();
    expect(manejador).not.toHaveBeenCalled();
  });
});
