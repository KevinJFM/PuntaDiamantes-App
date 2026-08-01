import { render, fireEvent, waitFor } from '@testing-library/react-native';
import * as SecureStore from 'expo-secure-store';
import PantallaLogin from '../src/pantallas/PantallaLogin';
import { solicitarCodigo, verificarCodigo } from '../src/servicios/api';

// Aviso compartido: un mismo jest.fn que devuelve usarAvisos()
const mockMostrarAviso = jest.fn();
jest.mock('../src/componentes/Avisos', () => ({
  usarAvisos: () => mockMostrarAviso,
}));

// El logo usa SVG; no aporta a la lógica de la pantalla.
jest.mock('../src/componentes/Logo', () => () => null);

jest.mock('../src/servicios/api', () => ({
  solicitarCodigo: jest.fn(),
  verificarCodigo: jest.fn(),
  registrarToken: jest.fn(),
  mensajeError: (_e, respaldo) => respaldo,
}));

jest.mock('../src/servicios/notificaciones', () => ({
  registrarTokenSiHayPermiso: jest.fn(async () => ({ ok: false })),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

it('rechaza un DUI mal formado sin llamar al backend', async () => {
  const { getByText, getByPlaceholderText } = await render(<PantallaLogin alIniciarSesion={jest.fn()} />);

  await fireEvent.changeText(getByPlaceholderText('00000000-0'), '123');
  await fireEvent.press(getByText('Enviar código'));

  expect(mockMostrarAviso).toHaveBeenCalledWith('error', 'DUI inválido', expect.any(String));
  expect(solicitarCodigo).not.toHaveBeenCalled();
});

it('con un DUI válido pide el código y pasa al paso de verificación', async () => {
  solicitarCodigo.mockResolvedValueOnce({ destino: 'a***@correo.com', modo_dev: false });
  const { getByText, getByPlaceholderText, findByText } = await render(
    <PantallaLogin alIniciarSesion={jest.fn()} />
  );

  await fireEvent.changeText(getByPlaceholderText('00000000-0'), '123456789');
  await fireEvent.press(getByText('Enviar código'));

  await waitFor(() =>
    expect(solicitarCodigo).toHaveBeenCalledWith({
      tipo_documento: 'DUI',
      numero_documento: '12345678-9',
    })
  );
  expect(await findByText(/Lo enviamos a a\*\*\*@correo\.com/)).toBeOnTheScreen();
});

it('verifica automáticamente al completar los 6 dígitos y guarda el token', async () => {
  solicitarCodigo.mockResolvedValueOnce({ destino: 'tu correo', modo_dev: false });
  verificarCodigo.mockResolvedValueOnce({ token: 'jwt-123' });
  const alIniciarSesion = jest.fn();
  const { getByText, getByPlaceholderText, findByText, getByDisplayValue } = await render(
    <PantallaLogin alIniciarSesion={alIniciarSesion} />
  );

  // Paso 1: documento
  await fireEvent.changeText(getByPlaceholderText('00000000-0'), '123456789');
  await fireEvent.press(getByText('Enviar código'));

  // Paso 2: escribir los 6 dígitos (input transparente sobre las casillas)
  await findByText('Ingresa el código');
  await fireEvent.changeText(getByDisplayValue(''), '654321');

  await waitFor(() =>
    expect(verificarCodigo).toHaveBeenCalledWith({
      tipo_documento: 'DUI',
      numero_documento: '12345678-9',
      codigo: '654321',
    })
  );
  expect(SecureStore.setItemAsync).toHaveBeenCalledWith('portal_token', 'jwt-123');
  expect(alIniciarSesion).toHaveBeenCalled();
});

it('muestra aviso y limpia el código cuando la verificación falla', async () => {
  solicitarCodigo.mockResolvedValueOnce({ destino: 'tu correo', modo_dev: false });
  verificarCodigo.mockRejectedValueOnce({ response: { data: { message: 'Código incorrecto' } } });
  const { getByText, getByPlaceholderText, findByText, getByDisplayValue } = await render(
    <PantallaLogin alIniciarSesion={jest.fn()} />
  );

  await fireEvent.changeText(getByPlaceholderText('00000000-0'), '123456789');
  await fireEvent.press(getByText('Enviar código'));
  await findByText('Ingresa el código');
  await fireEvent.changeText(getByDisplayValue(''), '000000');

  await waitFor(() =>
    expect(mockMostrarAviso).toHaveBeenCalledWith('error', 'Código incorrecto', expect.any(String))
  );
  expect(SecureStore.setItemAsync).not.toHaveBeenCalled();
});
