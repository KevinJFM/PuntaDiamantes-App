// React 19 exige este flag para que act(...) (y los flush de estado en las
// pruebas) funcionen bajo Jest.
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

// Mocks de los módulos nativos de Expo que no corren en Node (jest).
// Se registran para TODAS las pruebas; cada test puede sobreescribir el
// valor de retorno con mockResolvedValueOnce / mockReturnValueOnce.

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => {}),
  deleteItemAsync: jest.fn(async () => {}),
}));

// __esModule: true evita que interopRequireWildcard copie el namespace,
// para que Device.isDevice sea el MISMO objeto en el test y en el código.
jest.mock('expo-device', () => ({
  __esModule: true,
  isDevice: true,
}));

jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  setNotificationChannelAsync: jest.fn(async () => {}),
  getExpoPushTokenAsync: jest.fn(async () => ({ data: 'ExponentPushToken[test]' })),
  addNotificationResponseReceivedListener: jest.fn(() => ({ remove: jest.fn() })),
  AndroidImportance: { MAX: 5 },
}));

// Los íconos arrastran expo-font/expo-asset (nativos); los sustituimos por un
// componente trivial. Cualquier familia (Ionicons, MaterialIcons, …) sirve.
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icono = (props) => React.createElement(Text, props, null);
  return new Proxy({}, { get: () => Icono });
});

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-constants', () => ({
  __esModule: true,
  default: {
    expoConfig: { extra: { eas: { projectId: 'test-project-id' } } },
    easConfig: { projectId: 'test-project-id' },
  },
}));
