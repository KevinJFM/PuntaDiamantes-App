# Mis Puntos · Punta Diamantes (App móvil)

App **móvil nativa** (React Native + **Expo**) para que el cliente del Hotel Punta Diamantes consulte sus **puntos de fidelidad** desde su teléfono.

Es la versión **nativa** del portal del cliente. **Usa el MISMO backend** del sistema de fidelización (los endpoints `/api/portal/*`); no tiene base de datos propia.

> Proyecto **independiente** (repo aparte) porque React Native tiene un stack y tooling distintos al de la web. El backend es compartido.

---

## Qué hace
- **Login** del cliente: DUI/Pasaporte + PIN de 4–6 dígitos (la primera vez, el PIN queda guardado).
- **Mis puntos**: saldo, su valor en dólares (1 punto = $0.05), recompensas que puede canjear e historial de movimientos.
- Solo lectura (el canje se hace en recepción).

## Requisitos
- Node.js instalado.
- La app **Expo Go** en tu teléfono (Play Store / App Store).
- El **backend corriendo** en una PC de la **misma red WiFi**.

## Configurar la IP del backend (IMPORTANTE)
La app corre en el teléfono, así que `localhost` NO sirve. Debe apuntar a la **IP de la PC** donde corre el backend.

Edita [`src/config.js`](src/config.js):
```js
export const API_URL = 'http://192.168.1.2:4000/api'; // <-- IP de tu PC
```
Para ver la IP de la PC (Windows): `ipconfig` → "Dirección IPv4".
La PC y el teléfono deben estar en la **misma red WiFi**, y el firewall de Windows debe permitir el puerto 4000.

## Correr en desarrollo
```bash
npm install        # solo la primera vez
npx expo start     # muestra un QR
```
Escanea el **QR** con la app **Expo Go** (Android) o la cámara (iPhone). La app se abre en tu teléfono.

## Generar el APK / publicar (más adelante)
Se usa **EAS Build** (en la nube, no necesitas Android Studio):
```bash
npm install -g eas-cli
eas login
eas build -p android --profile preview   # genera un APK instalable
```
Para la Play Store se requiere la cuenta de desarrollador de Google ($25 pago único).

## Estructura
```
puntadiamantes-app/
├── App.js                 Decide Login vs Mis Puntos según el token
├── app.json               Config de Expo (nombre, íconos, colores)
└── src/
    ├── config.js          URL del backend (IP de la PC)
    ├── api.js             axios + token (AsyncStorage) + servicios
    ├── Logo.js            Logo oficial (react-native-svg)
    ├── LoginScreen.js     Documento + PIN
    └── MisPuntosScreen.js Puntos, recompensas e historial
```

## Notas de seguridad
- El PIN se guarda **hasheado (bcrypt)** en el backend, nunca en texto plano.
- La app **no enforcea CORS** (eso es cosa de navegadores); solo necesita alcanzar la IP del backend por la red.
- Solo lectura: no permite canjear ni modificar datos.
- Consideración: la "primera vez fija el PIN" conviene cambiarla en producción a que recepción asigne el PIN u OTP por WhatsApp/correo.
