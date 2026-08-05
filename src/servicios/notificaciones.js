import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Preferencia local: el cliente apagó las notificaciones a mano desde Configuración.
// Sirve para que el registro automático (al abrir la app / al entrar) NO las vuelva a prender solo.
const CLAVE_DESACTIVADO = 'push_desactivado';

export const pushDesactivadoPorUsuario = async () =>
  (await AsyncStorage.getItem(CLAVE_DESACTIVADO)) === '1';

export const marcarPushDesactivado = (desactivado) =>
  desactivado
    ? AsyncStorage.setItem(CLAVE_DESACTIVADO, '1')
    : AsyncStorage.removeItem(CLAVE_DESACTIVADO);

// Cómo se muestran las notificaciones cuando la app está ABIERTA
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,   // compat SDK viejos
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// true si el cliente YA concedió el permiso (no muestra ningún diálogo)
export const tienePermisoPush = async () => {
  if (!Device.isDevice) return false;
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
};

// Obtiene el Expo Push Token (asume permiso concedido) y configura el canal en Android. Solo funciona en build real (APK/dev-client), no en Expo Go.
const obtenerToken = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones',
      importance: Notifications.AndroidImportance.MAX,
      lightColor: '#E5388A',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  if (!projectId) return { ok: false, motivo: 'Falta projectId (EAS) en app.json' };

  try {
    const respuesta = await Notifications.getExpoPushTokenAsync({ projectId });
    return { ok: true, token: respuesta.data }; // ExponentPushToken[xxxxxxxx]
  } catch (e) {
    return { ok: false, motivo: 'Error al obtener token: ' + (e?.message || String(e)) };
  }
};

// Muestra el diálogo del sistema y, si conceden, devuelve el token. Devuelve { ok, token, denegado, motivo }; se usa la 1ª vez al tocar "Activar".
export const solicitarPermisoPush = async () => {
  if (!Device.isDevice) return { ok: false, motivo: 'Debe ser un teléfono real (no emulador)' };

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync()); // aquí aparece el diálogo del sistema
  }
  if (status !== 'granted') return { ok: false, denegado: true };

  // Conceder el permiso es un "sí" explícito: limpia cualquier apagado manual previo.
  await marcarPushDesactivado(false);
  return obtenerToken();
};

// Registra el token solo si ya hay permiso y el cliente no lo apagó a mano (sin diálogo);
// se usa al abrir la app y en cada login para refrescarlo en el backend.
export const registrarTokenSiHayPermiso = async () => {
  if (await pushDesactivadoPorUsuario()) return { ok: false };
  if (!(await tienePermisoPush())) return { ok: false };
  return obtenerToken();
};

// Suscribe un callback para cuando el usuario TOCA una notificación (para navegar si se quiere)
export const alTocarNotificacion = (callback) =>
  Notifications.addNotificationResponseReceivedListener(callback);

// Suscribe un callback para cuando LLEGA una notificación con la app abierta (para refrescar la campana al instante)
export const alRecibirNotificacion = (callback) =>
  Notifications.addNotificationReceivedListener(callback);
