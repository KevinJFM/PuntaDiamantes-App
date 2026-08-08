// URL base de la API. Apunta al dominio HTTPS real: el mismo backend que usa el portal web
// (puntos.puntadiamantes.com), que sirve la API en /api. Con esto la app funciona desde
// cualquier lugar con internet, sin depender de la WiFi ni de la PC.
//
// Solo para PRUEBAS contra el backend local (teléfono en la misma WiFi que la PC): cambia
// temporalmente esta URL a la IP de tu PC, p. ej. 'http://192.168.1.4:4000/api'
// (averíguala con `ipconfig`, campo IPv4). No subas ese cambio: producción siempre va con el dominio.
export const URL_API = 'https://puntadiamantes.com/api';

