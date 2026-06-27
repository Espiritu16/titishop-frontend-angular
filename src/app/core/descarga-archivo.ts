export function descargarBlob(blob: Blob, nombreArchivo: string): void {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export function extensionExportacion(formato: 'excel' | 'pdf'): string {
  return formato === 'excel' ? 'xls' : 'pdf';
}

export function nombreArchivoExportacion(modulo: string, formato: 'excel' | 'pdf'): string {
  const fecha = new Date();
  const pad = (value: number) => String(value).padStart(2, '0');
  const timestamp = [
    fecha.getFullYear(),
    pad(fecha.getMonth() + 1),
    pad(fecha.getDate()),
  ].join('-') + '_' + [pad(fecha.getHours()), pad(fecha.getMinutes())].join('-');
  const moduloNormalizado = modulo
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return `titishop_${moduloNormalizado}_${timestamp}.${extensionExportacion(formato)}`;
}
