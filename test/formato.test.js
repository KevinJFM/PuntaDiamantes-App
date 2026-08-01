import {
  formatearDui,
  formatearPasaporte,
  formatearDocumento,
  esDuiValido,
  esPasaporteValido,
} from '../src/utilidades/formato';

describe('formatearDui', () => {
  it('inserta el guion tras 8 dígitos', () => {
    expect(formatearDui('123456789')).toBe('12345678-9');
  });

  it('no pone guion mientras hay 8 o menos dígitos', () => {
    expect(formatearDui('12345678')).toBe('12345678');
    expect(formatearDui('1234')).toBe('1234');
  });

  it('descarta caracteres no numéricos', () => {
    expect(formatearDui('12ab34')).toBe('1234');
    expect(formatearDui('1234-5678-9')).toBe('12345678-9');
  });

  it('trunca a 9 dígitos (8 + verificador)', () => {
    expect(formatearDui('1234567890123')).toBe('12345678-9');
  });
});

describe('formatearPasaporte', () => {
  it('pasa a mayúsculas y quita símbolos/espacios', () => {
    expect(formatearPasaporte('a1 234-567')).toBe('A1234567');
  });

  it('trunca a 12 caracteres', () => {
    expect(formatearPasaporte('ABCDEFGHIJKLMNOP')).toBe('ABCDEFGHIJKL');
  });
});

describe('formatearDocumento', () => {
  it('usa el formato de pasaporte cuando el tipo es Pasaporte', () => {
    expect(formatearDocumento('Pasaporte', 'a12-34')).toBe('A1234');
  });

  it('usa el formato de DUI para cualquier otro tipo', () => {
    expect(formatearDocumento('DUI', '123456789')).toBe('12345678-9');
  });
});

describe('esDuiValido', () => {
  it('acepta el formato 00000000-0', () => {
    expect(esDuiValido('12345678-9')).toBe(true);
  });

  it('rechaza sin guion, incompleto o con letras', () => {
    expect(esDuiValido('123456789')).toBe(false);
    expect(esDuiValido('1234567-8')).toBe(false);
    expect(esDuiValido('1234567a-9')).toBe(false);
    expect(esDuiValido('')).toBe(false);
  });
});

describe('esPasaporteValido', () => {
  it('acepta 6 a 12 caracteres alfanuméricos en mayúscula', () => {
    expect(esPasaporteValido('A12345')).toBe(true);
    expect(esPasaporteValido('ABC123DEF456')).toBe(true);
  });

  it('rechaza demasiado corto, demasiado largo o con minúsculas/símbolos', () => {
    expect(esPasaporteValido('A1234')).toBe(false);
    expect(esPasaporteValido('ABC123DEF4567')).toBe(false);
    expect(esPasaporteValido('a12345')).toBe(false);
    expect(esPasaporteValido('A1234-')).toBe(false);
  });
});
