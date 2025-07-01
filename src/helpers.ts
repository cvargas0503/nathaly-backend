export function toCamelCase(obj: any): any{
  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  } else if (obj !== null && obj.constructor === Object) {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [
        key.replace(/_([a-z])/g, (_, char) => char.toUpperCase()).replace(/^([A-Z])/, c => c.toLowerCase()),
        toCamelCase(value)
      ])
    );
  }
  return obj;
}
export const normalizar = (valor: string) => valor.toLowerCase().replace(/[-\s]/g, '');
