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

// Pide permiso y devuelve el token de push del dispositivo (o null).
// OJO: solo funciona en un build real (APK/dev-client), NO en Expo Go.
export const registrarParaPush = async () => {
  if (!Device.isDevice) return null; // solo en teléfono físico

  const permisoActual = await Notifications.getPermissionsAsync();
  let estado = permisoActual.status;
  if (estado !== 'granted') {
    const solicitado = await Notifications.requestPermissionsAsync();
    estado = solicitado.status;
  }
  if (estado !== 'granted') return null;

  // Canal de Android (necesario para que se muestren)
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Notificaciones',
      importance: Notifications.AndroidImportance.MAX,
      lightColor: '#E5388A',
    });
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;

  try {
    const respuesta = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return respuesta.data; // ExponentPushToken[xxxxxxxx]
  } catch {
    return null;
  }
};

// Suscribe un callback para cuando el usuario TOCA una notificación (para navegar si se quiere)
export const alTocarNotificacion = (callback) =>
  Notifications.addNotificationResponseReceivedListener(callback);
