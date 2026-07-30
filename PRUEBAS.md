# Pruebas de la app

Pruebas automatizadas con **Jest** (`jest-expo`) y **@testing-library/react-native**.
Todo el gestor de paquetes de la app es **npm** (no pnpm).

## Cómo correrlas

```bash
npm test            # corre toda la suite una vez
npm run test:watch  # modo interactivo (re-corre al guardar)
npm test -- formato # filtra por nombre de archivo o de prueba
```

Estado actual: **37 pruebas / 5 suites**, todo en verde. No necesitan backend,
BD ni teléfono: los módulos nativos y las llamadas de red van mockeados.

## Qué se prueba

Los tests viven **junto al archivo** que prueban, con extensión `.test.js`:

| Archivo | Cubre |
|---|---|
| `src/utilidades/formato.test.js` | Formato y validación de DUI / pasaporte (mismo criterio que el sistema web). |
| `src/servicios/api.test.js` | `mensajeError` (sin conexión vs. error del servidor) y el interceptor de sesión: un 401 normal borra el token y avisa; en las rutas de acceso (pedir/verificar código) **no** cierra sesión. |
| `src/servicios/notificaciones.test.js` | Permisos push y obtención del token (emulador, permiso concedido/denegado). |
| `src/pantallas/PantallaLogin.test.js` | DUI inválido no llama al backend; con DUI válido pasa al paso del código; auto-verifica al completar los 6 dígitos y guarda el token; error limpia el código. |
| `src/pantallas/PantallaMisPuntos.test.js` | Estados de carga / datos / error; recompensas alcanzables; historial con el signo correcto. |

## Cómo está armado

- **Config:** el bloque `jest` está en `package.json` (preset `jest-expo`,
  `transformIgnorePatterns` y `setupFiles`).
- **Mocks globales:** en `jest.setup.js` se sustituyen los módulos que no corren
  en Node — `expo-secure-store`, `expo-notifications`, `expo-device`,
  `expo-constants`, `@react-native-async-storage/async-storage` y
  `@expo/vector-icons` (los íconos, para no arrastrar `expo-font`/`expo-asset`).
- Cada test mockea lo suyo: `PantallaLogin` y `PantallaMisPuntos` mockean
  `../servicios/api`; `api.test.js` mockea `axios`.

## Notas para escribir más pruebas

Usamos **@testing-library/react-native v14**, con dos diferencias respecto a
versiones/tutoriales viejos:

- `render(...)` y `fireEvent(...)` son **asíncronos** → usar `await`:
  ```js
  const { getByText, findByText } = await render(<Pantalla />);
  await fireEvent.press(getByText('Enviar código'));
  ```
- El renderer es el paquete `test-renderer` (peer de RNTL), **no**
  `react-test-renderer`.

## Qué queda fuera (por ahora)

Pruebas end-to-end en un dispositivo/emulador real (Detox o Maestro). Es un
montaje bastante más pesado; se deja para más adelante si hace falta.
