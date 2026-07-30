import { render, fireEvent } from '@testing-library/react-native';
import { ProveedorTema } from '../tema/tema';
import PantallaMisPuntos from './PantallaMisPuntos';
import { obtenerMisPuntos, obtenerMisMovimientos } from '../servicios/api';

jest.mock('../servicios/api', () => ({
  obtenerMisPuntos: jest.fn(),
  obtenerMisMovimientos: jest.fn(),
  mensajeError: (_e, respaldo) => respaldo,
}));

const PUNTOS = {
  nombres: 'Ana',
  apellidos: 'López',
  puntos_acumulados: 120,
  tipo_documento: 'DUI',
  numero_documento: '12345678-9',
  recompensas: [
    { id: 1, nombre: 'Noche gratis', puntos: 200, tipo: 'Suite', alcanzable: false, faltan: 80 },
    { id: 2, nombre: 'Desayuno', puntos: 100, tipo: null, alcanzable: true },
  ],
};

const MOVIMIENTOS = [
  { id_movimiento: 1, descripcion: 'Compra en restaurante', tipo: 'ganado', fecha: '2026-07-20', puntos: 50 },
  { id_movimiento: 2, descripcion: 'Canje de premio', tipo: 'canjeado', fecha: '2026-07-22', puntos: -30 },
];

const renderizar = () =>
  render(
    <ProveedorTema>
      <PantallaMisPuntos />
    </ProveedorTema>
  );

beforeEach(() => {
  jest.clearAllMocks();
  obtenerMisPuntos.mockResolvedValue(PUNTOS);
  obtenerMisMovimientos.mockResolvedValue(MOVIMIENTOS);
});

it('muestra el indicador de carga mientras se resuelve la petición', async () => {
  // Promesa que no resolvemos: la pantalla queda en estado "cargando".
  obtenerMisPuntos.mockReturnValueOnce(new Promise(() => {}));
  obtenerMisMovimientos.mockReturnValueOnce(new Promise(() => {}));
  const { getByText } = await renderizar();

  expect(getByText('Cargando tus puntos…')).toBeOnTheScreen();
});

it('muestra los puntos y el documento del cliente al cargar', async () => {
  const { getByText, findByText } = await renderizar();

  expect(await findByText('Ana López')).toBeOnTheScreen();
  expect(getByText('120')).toBeOnTheScreen();
  expect(getByText('DUI: 12345678-9')).toBeOnTheScreen();
});

it('marca la recompensa alcanzable y la que aún falta', async () => {
  const { getByText, findByText } = await renderizar();
  await findByText('Ana López');

  expect(getByText('¡Ya puedes!')).toBeOnTheScreen();     // Desayuno (alcanzable)
  expect(getByText('Faltan 80')).toBeOnTheScreen();       // Noche gratis
});

it('en la pestaña Historial muestra los movimientos con su signo', async () => {
  const { getByText, findByText } = await renderizar();
  await findByText('Ana López');

  await fireEvent.press(getByText('Historial'));

  expect(await findByText('Compra en restaurante')).toBeOnTheScreen();
  expect(getByText('+50')).toBeOnTheScreen();   // ganado -> con '+'
  expect(getByText('-30')).toBeOnTheScreen();   // canjeado -> negativo sin '+'
});

it('muestra el botón Reintentar cuando falla la carga', async () => {
  obtenerMisPuntos.mockRejectedValueOnce(new Error('offline'));
  obtenerMisMovimientos.mockRejectedValueOnce(new Error('offline'));
  const { findByText } = await renderizar();

  expect(await findByText('Reintentar')).toBeOnTheScreen();
});
