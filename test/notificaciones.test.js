import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import {
  tienePermisoPush,
  solicitarPermisoPush,
  registrarTokenSiHayPermiso,
} from '../src/servicios/notificaciones';

beforeEach(() => {
  jest.clearAllMocks();
  Device.isDevice = true;
});

describe('tienePermisoPush', () => {
  it('es false en emulador (no es dispositivo real)', async () => {
    Device.isDevice = false;
    expect(await tienePermisoPush()).toBe(false);
    expect(Notifications.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('es true cuando el permiso ya está concedido', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    expect(await tienePermisoPush()).toBe(true);
  });

  it('es false cuando el permiso no está concedido', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    expect(await tienePermisoPush()).toBe(false);
  });
});

describe('solicitarPermisoPush', () => {
  it('rechaza en emulador con motivo', async () => {
    Device.isDevice = false;
    const r = await solicitarPermisoPush();
    expect(r.ok).toBe(false);
    expect(r.motivo).toMatch(/teléfono real/i);
  });

  it('marca denegado si el usuario rechaza el diálogo', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
    const r = await solicitarPermisoPush();
    expect(r).toEqual({ ok: false, denegado: true });
  });

  it('devuelve el token cuando se concede el permiso', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({ data: 'ExponentPushToken[abc]' });
    const r = await solicitarPermisoPush();
    expect(r).toEqual({ ok: true, token: 'ExponentPushToken[abc]' });
  });
});

describe('registrarTokenSiHayPermiso', () => {
  it('no hace nada si aún no hay permiso (no muestra diálogo)', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'undetermined' });
    const r = await registrarTokenSiHayPermiso();
    expect(r).toEqual({ ok: false });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(Notifications.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('obtiene el token si el permiso ya estaba concedido', async () => {
    Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    Notifications.getExpoPushTokenAsync.mockResolvedValueOnce({ data: 'ExponentPushToken[xyz]' });
    const r = await registrarTokenSiHayPermiso();
    expect(r).toEqual({ ok: true, token: 'ExponentPushToken[xyz]' });
    expect(Notifications.requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
