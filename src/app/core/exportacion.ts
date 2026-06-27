export interface ColumnaExportacion<T> {
  encabezado: string;
  valor: (item: T) => string | number | boolean | null | undefined;
}

export class ExportacionSinDatosError extends Error {
  constructor(message = 'No hay datos para exportar.') {
    super(message);
    this.name = 'ExportacionSinDatosError';
  }
}

export function filasExportables<T>(items: readonly T[], columnas: readonly ColumnaExportacion<T>[]): string[][] {
  if (!items.length) throw new ExportacionSinDatosError();

  return [
    columnas.map((columna) => columna.encabezado),
    ...items.map((item) => columnas.map((columna) => normalizarCelda(columna.valor(item)))),
  ];
}

export function crearTablaHtmlExcel(titulo: string, filas: readonly string[][]): string {
  const encabezado = escapeHtml(titulo);
  const cuerpo = filas
    .map((fila, index) => {
      const tag = index === 0 ? 'th' : 'td';
      const celdas = fila.map((celda) => `<${tag}>${escapeHtml(celda)}</${tag}>`).join('');
      return `<tr>${celdas}</tr>`;
    })
    .join('');

  return `<!doctype html><html><head><meta charset="utf-8"><style>table{border-collapse:collapse;font-family:Arial,sans-serif;font-size:12px}th{background:#eef2ff;color:#1f2937}th,td{border:1px solid #d1d5db;padding:6px 8px;text-align:left}h1{font-family:Arial,sans-serif;font-size:18px}</style></head><body><h1>${encabezado}</h1><table>${cuerpo}</table></body></html>`;
}

export function crearContenidoPdf(titulo: string, filas: readonly string[][]): string {
  const paginas = crearPaginasPdf(titulo, filas);
  const pageIds = paginas.map((_, index) => 3 + index * 2);
  const fontId = 3 + paginas.length * 2;
  const objetos = [
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj',
    `2 0 obj << /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${paginas.length} >> endobj`,
  ];
  paginas.forEach((contenido, index) => {
    const pageId = pageIds[index];
    const contentId = pageId + 1;
    objetos.push(`${pageId} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 842 595] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >> endobj`);
    objetos.push(`${contentId} 0 obj << /Length ${contenido.length} >> stream\n${contenido}\nendstream endobj`);
  });
  objetos.push(`${fontId} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj`);

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const objeto of objetos) {
    offsets.push(pdf.length);
    pdf += `${objeto}\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objetos.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer << /Size ${objetos.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return pdf;
}

export function descargarArchivo(contenido: string, nombreArchivo: string, tipoMime: string): void {
  const blob = new Blob([contenido], { type: `${tipoMime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

export function exportarExcel<T>(titulo: string, nombreArchivo: string, items: readonly T[], columnas: readonly ColumnaExportacion<T>[]): void {
  const filas = filasExportables(items, columnas);
  descargarArchivo(crearTablaHtmlExcel(titulo, filas), `${nombreArchivo}.xls`, 'application/vnd.ms-excel');
}

export function exportarPdf<T>(titulo: string, nombreArchivo: string, items: readonly T[], columnas: readonly ColumnaExportacion<T>[]): void {
  const filas = filasExportables(items, columnas);
  descargarArchivo(crearContenidoPdf(titulo, filas), `${nombreArchivo}.pdf`, 'application/pdf');
}

function normalizarCelda(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined || value === '') return '-';
  return String(value);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapePdf(value: string): string {
  return normalizarTextoPdf(value).replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function crearPaginasPdf(titulo: string, filas: readonly string[][]): string[] {
  const encabezados = filas[0] ?? [];
  const datos = filas.slice(1);
  const columnas = calcularColumnasPdf(filas);
  const filasPorPagina = 28;
  const paginas: string[] = [];

  for (let inicio = 0; inicio < Math.max(datos.length, 1); inicio += filasPorPagina) {
    const bloque = datos.slice(inicio, inicio + filasPorPagina);
    const lineas: string[] = [
      '0.95 g',
      '40 520 762 22 re f',
      '0 g',
      textoPdf(titulo, 40, 552, 14, true),
      textoPdf(`Generado: ${new Date().toLocaleString('es-PE')}`, 650, 552, 8),
      ...dibujarFilaPdf(encabezados, columnas, 510, true),
    ];

    bloque.forEach((fila, index) => {
      const y = 492 - index * 16;
      if (index % 2 === 0) {
        lineas.push('0.98 g', `40 ${y - 4} 762 15 re f`, '0 g');
      }
      lineas.push(...dibujarFilaPdf(fila, columnas, y, false));
    });

    lineas.push(
      '0.75 g',
      ...Array.from({ length: bloque.length + 2 }, (_, index) => {
        const y = 524 - index * 16;
        return `40 ${y} m 802 ${y} l S`;
      }),
      '0 g',
      textoPdf(`Pagina ${paginas.length + 1}`, 748, 28, 8)
    );
    paginas.push(lineas.join('\n'));
  }

  return paginas;
}

function calcularColumnasPdf(filas: readonly string[][]): Array<{ x: number; ancho: number; caracteres: number }> {
  const totalColumnas = Math.max(filas[0]?.length ?? 1, 1);
  const margen = 40;
  const anchoDisponible = 762;
  const pesos = Array.from({ length: totalColumnas }, (_, columna) => {
    const maximo = Math.max(...filas.map((fila) => (fila[columna] ?? '').length), 8);
    return Math.min(Math.max(maximo, 10), 28);
  });
  const totalPesos = pesos.reduce((total, peso) => total + peso, 0);
  let x = margen;

  return pesos.map((peso) => {
    const ancho = Math.max(54, Math.floor((peso / totalPesos) * anchoDisponible));
    const columna = {
      x,
      ancho,
      caracteres: Math.max(7, Math.floor(ancho / 4.7)),
    };
    x += ancho;
    return columna;
  });
}

function dibujarFilaPdf(fila: readonly string[], columnas: Array<{ x: number; ancho: number; caracteres: number }>, y: number, encabezado: boolean): string[] {
  return columnas.map((columna, index) => {
    const texto = recortarTexto(fila[index] ?? '-', columna.caracteres);
    return textoPdf(texto, columna.x + 2, y, encabezado ? 8 : 7);
  });
}

function textoPdf(texto: string, x: number, y: number, size: number, negrita = false): string {
  const escala = negrita ? '0.15 0.15 0.15 rg' : '0 g';
  return `${escala}\nBT /F1 ${size} Tf ${x} ${y} Td (${escapePdf(texto)}) Tj ET`;
}

function recortarTexto(value: string, max: number): string {
  if (value.length <= max) return value;
  if (max <= 3) return value.slice(0, max);
  return `${value.slice(0, max - 3)}...`;
}

function normalizarTextoPdf(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\x20-\x7E]/g, '');
}
