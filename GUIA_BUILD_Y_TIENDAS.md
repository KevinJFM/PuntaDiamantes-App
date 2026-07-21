# Guía: generar el APK y publicar en Play Store / App Store

App **Punta Diamantes** (Expo / React Native). Guía paso a paso para crear el instalable
y dejarla lista para las tiendas.

---

## ⚠️ ANTES DE EMPEZAR (muy importante)

1. **Backend desplegado.** El APK final debe apuntar al **dominio real** del backend, NO a la IP local.
   Antes del build de producción, en [`src/configuracion/configuracion.js`](src/configuracion/configuracion.js) cambia:
   ```js
   export const URL_API = 'https://api.puntadiamantes.com/api'; // el dominio real
   ```
   (Mientras pruebas por WiFi puedes dejar la IP local, pero para publicar debe ser el dominio.)

2. **Cuenta de Expo** (gratis): créala en https://expo.dev/signup

3. **Node instalado** (ya lo tienes).

---

## PASO 1 — Instalar EAS CLI e iniciar sesión

```bash
npm install -g eas-cli
eas login          # con tu cuenta de expo.dev
```

## PASO 2 — Vincular el proyecto (genera el projectId, necesario para las push)

Dentro de la carpeta `puntadiamantes-app`:

```bash
eas init
```

Esto crea/vincula el proyecto en tu cuenta de Expo y agrega el `projectId` en `app.json`
(`extra.eas.projectId`). **Sin esto las notificaciones push no obtienen token.**

---

## PASO 3 — Configurar notificaciones push

Las push **solo funcionan en el build** (APK/dev-client), NO en Expo Go.

### Android (FCM)
Android necesita credenciales de **Firebase Cloud Messaging (FCM V1)**:
1. Entra a https://console.firebase.google.com/ → crea un proyecto (ej. "Punta Diamantes").
2. Agrega una app Android con el paquete **`com.puntadiamantes.app`**.
3. En el proyecto de Firebase: ⚙️ → *Configuración del proyecto* → *Cuentas de servicio* →
   **Genera una nueva clave privada** (descarga el archivo JSON).
   **Dar clic en generar clave privada y se descarga el archivo .json.**

4. Sube ese JSON a EAS:
   ```bash
   eas credentials
   ```
### Haz esto en la terminal (carpeta de la app)

### **eas credentials**
### Y ve eligiendo con las flechas + Enter:

### Select platform → **Android**
### Si pregunta el perfil (build profile) → **production**
### En el menú que aparece, busca y elige → **Google Service Account**
### Luego → **Manage your Google Service Account Key for Push Notifications (FCM V1)**
### Elige → **Set up a Google Service Account Key for Push Notifications (o "Upload")**
### Te pedirá la ruta del archivo .json → **arrastra el archivo descargado o pega su ruta (ej. C:\Users\kevin\Downloads\punta-diamantes-firebase-adminsdk-xxxxx.json)**

   Elige **Android → Push Notifications (FCM V1)** → sube el JSON.
   (También se puede desde el panel: https://expo.dev → tu proyecto → Credentials.)

### iOS (APNs) — solo si algún día publican en iPhone
Con una **cuenta de Apple Developer**, EAS configura los certificados de push (APNs) solo
durante el build. No necesitas Mac.

---

## PASO 4 — Generar un APK de prueba (para instalar y probar)

```bash
eas build -p android --profile preview
```

- Se compila **en la nube** (~10-20 min). Al terminar te da un **enlace** para descargar el `.apk`.
- Descárgalo en el teléfono e instálalo (Android pedirá permitir "instalar apps desconocidas").
- Con este APK **ya se prueban las push** (asegúrate de que el backend esté corriendo y accesible).

> Para probar una push manual: registra una transacción del cliente desde el panel → debe
> llegar la notificación a la barra del teléfono.

---

## PASO 5 — Generar para la Play Store (AAB de producción)

```bash
eas build -p android --profile production
```

Genera un **.aab** (Android App Bundle), que es lo que pide Google Play.
Luego puedes subirlo a mano en Play Console, o automatizar con:

```bash
eas submit -p android --profile production
```

---

## PASO 6 — Requisitos de Google Play Store ✅

- [ ] **Cuenta de desarrollador de Google Play**: pago único **$25** (https://play.google.com/console).
- [ ] **Nombre de la app**: Punta Diamantes.
- [ ] **Ícono** 512×512 (ya lo tenemos: `assets/icon-pd.png`, se puede exportar a 512).
- [ ] **Gráfico destacado** (feature graphic) 1024×500.
- [ ] **Capturas de pantalla** (mín. 2, teléfono).
- [ ] **Descripción corta** (80 caracteres) y **descripción completa**.
- [ ] **Política de privacidad (URL)** — obligatoria (ver Paso 8).
- [ ] **Clasificación de contenido** (cuestionario).
- [ ] **Sección "Seguridad de los datos"** (qué datos recopila: documento, correo, teléfono, puntos).
- [ ] **Público objetivo** y país.
- [ ] **Firma de la app**: usa **Play App Signing** (EAS/Google manejan la llave; no la pierdas).
- [ ] Categoría sugerida: *Estilo de vida* o *Compras*.

---

## PASO 7 — Requisitos de App Store (iPhone) — a futuro 

- [ ] **Cuenta Apple Developer**: **$99/año** (https://developer.apple.com).
- [ ] **Bundle ID**: `com.puntadiamantes.app` (ya configurado en `app.json`).
- [ ] Build con `eas build -p ios --profile production` (EAS maneja certificados; **no necesitas Mac**).
- [ ] **Ícono** 1024×1024 (sin transparencia).
- [ ] **Capturas** para los tamaños de iPhone que pida App Store Connect.
- [ ] **Política de privacidad (URL)** + **"App Privacy"** (detalle de datos recopilados).
- [ ] Revisar las **App Store Review Guidelines** (Apple revisa manualmente; suele tardar 1-3 días).
- [ ] Se sube con `eas submit -p ios` o desde App Store Connect (TestFlight para probar antes).

---

## PASO 8 — Política de privacidad (obligatoria en ambas tiendas)

Como la app maneja **documento (DUI), correo, teléfono y puntos**, ambas tiendas exigen una
**política de privacidad publicada en una URL**. Opciones:
- Una página en el sitio del hotel (`puntadiamantes.com/privacidad`).
- Un generador gratuito (ej. termsfeed, freeprivacypolicy) y publicarla.

> Te puedo **redactar el texto** de la política cuando lo necesites.

---

## Orden recomendado (resumen)

1. **Desplegar el backend** en Hostinger (dominio + SSL).
2. Cambiar `URL_API` al **dominio real**.
3. `eas init` (projectId) → configurar **FCM** (push).
4. `eas build --profile preview` → **APK de prueba** (instalar + probar push).
5. Cuenta Play ($25) + política de privacidad + capturas/textos.
6. `eas build --profile production` (AAB) → **subir a Play Store**.
7. (Opcional/futuro) iPhone: cuenta Apple ($99/año) + `eas build -p ios`.

---

## Notas
- El **ícono de notificación** en Android se ve mejor con una imagen **blanca sobre transparente**;
  por ahora usa el color de marca. Se puede afinar antes de publicar.
- Las **push necesitan** que el cliente haya **iniciado sesión al menos una vez** en la app real
  (ahí se registra el token de su dispositivo).
