import { UnitOfMeasure } from '../types';

const MAX_NAME_LENGTH = 64;

const WHOLE_UNITS: UnitOfMeasure[] = [
  'unidad',
  'paquete',
  'docena',
  'lata',
  'botella',
];

const NAME_PATTERN = /^[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ0-9\s.,\-()]+$/;

export function validateProductName(value: string): string | null {
  if (!value.trim()) {
    return 'no puede estar vacío';
  }
  if (value.trim().length > MAX_NAME_LENGTH) {
    return `máximo ${MAX_NAME_LENGTH} caracteres`;
  }
  if (!NAME_PATTERN.test(value.trim())) {
    return 'contiene caracteres no permitidos';
  }
  return null;
}

export function validateNumericValue(
  value: string,
  unit: UnitOfMeasure
): string | null {
  if (value === '' || value.trim() === '') {
    return null;
  }

  const num = Number(value);

  if (isNaN(num)) {
    return 'no es un número válido';
  }

  if (num < 0) {
    return 'no puede ser negativo';
  }

  if (WHOLE_UNITS.includes(unit) && !Number.isInteger(num)) {
    return 'debe ser un número entero';
  }

  const decimalPart = value.includes('.') ? value.split('.')[1] : '';
  if (!WHOLE_UNITS.includes(unit) && decimalPart.length > 2) {
    return 'máximo 2 decimales';
  }

  return null;
}

export interface ProductFormData {
  name: string;
  quantity: string;
  minStock: string;
  unit: UnitOfMeasure;
}

export function validateProductForm(data: ProductFormData): string[] {
  const errors: string[] = [];

  const nameError = validateProductName(data.name);
  if (nameError) {
    errors.push(`Nombre: ${nameError}`);
  }

  const quantityError = validateNumericValue(data.quantity, data.unit);
  if (quantityError) {
    errors.push(`Cantidad: ${quantityError}`);
  }

  const minStockError = validateNumericValue(data.minStock, data.unit);
  if (minStockError) {
    errors.push(`Stock mínimo: ${minStockError}`);
  }

  return errors;
}
