import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

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

// Obtiene el Expo Push Token (asume permiso ya concedido). Configura el canal en Android.
// OJO: solo funciona en un build real (APK/dev-client), NO en Expo Go.
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

// Muestra el diálogo del sistema (Permitir / No permitir) y, si lo conceden, devuelve el token.
// Devuelve { ok, token, denegado, motivo }.  Se usa la 1ª vez, al tocar "Activar".
export const solicitarPermisoPush = async () => {
  if (!Device.isDevice) return { ok: false, motivo: 'Debe ser un teléfono real (no emulador)' };

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    ({ status } = await Notifications.requestPermissionsAsync()); // aquí aparece el diálogo del sistema
  }
  if (status !== 'granted') return { ok: false, denegado: true };

  return obtenerToken();
};

// Registra el token SOLO si ya hay permiso, sin mostrar ningún diálogo.
// Se usa en cada inicio de sesión para refrescar el token en el backend.
export const registrarTokenSiHayPermiso = async () => {
  if (!(await tienePermisoPush())) return { ok: false };
  return obtenerToken();
};

// Suscribe un callback para cuando el usuario TOCA una notificación (para navegar si se quiere)
export const alTocarNotificacion = (callback) =>
  Notifications.addNotificationResponseReceivedListener(callback);
