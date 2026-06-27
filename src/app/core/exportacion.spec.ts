import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  crearContenidoPdf,
  crearTablaHtmlExcel,
  descargarArchivo,
  ExportacionSinDatosError,
  filasExportables,
} from './exportacion';

describe('utilidades de exportacion', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('convierte registros a filas usando encabezados y valores definidos', () => {
    const filas = filasExportables(
      [
        { producto: 'Audifonos', stock: 12 },
        { producto: 'Cargador', stock: 0 },
      ],
      [
        { encabezado: 'Producto', valor: (item) => item.producto },
        { encabezado: 'Stock', valor: (item) => item.stock },
      ]
    );

    expect(filas).toEqual([
      ['Producto', 'Stock'],
      ['Audifonos', '12'],
      ['Cargador', '0'],
    ]);
  });

  it('rechaza exportaciones sin datos con un mensaje claro', () => {
    expect(() => filasExportables([], [{ encabezado: 'Producto', valor: () => 'A' }])).toThrow(
      new ExportacionSinDatosError('No hay datos para exportar.')
    );
  });

  it('genera una tabla Excel escapando caracteres especiales', () => {
    const html = crearTablaHtmlExcel('Productos', [
      ['Producto', 'Descripcion'],
      ['Base <nude>', 'Tono & medio'],
    ]);

    expect(html).toContain('<table>');
    expect(html).toContain('Base &lt;nude&gt;');
    expect(html).toContain('Tono &amp; medio');
  });

  it('genera contenido PDF con encabezado valido y texto escapado', () => {
    const pdf = crearContenidoPdf('Reporte', [
      ['Producto', 'Motivo'],
      ['Serum', 'Ajuste (conteo)'],
    ]);

    expect(pdf.startsWith('%PDF-1.4')).toBe(true);
    expect(pdf).toContain('Reporte');
    expect(pdf).toContain('Ajuste \\(conteo\\)');
  });

  it('genera PDF tabular sin unir toda la fila con separadores visibles', () => {
    const pdf = crearContenidoPdf('Productos', [
      ['Producto', 'SKU', 'Descripcion', 'Estado'],
      ['Paleta sombras nude', 'BEL-003', 'Paleta de sombras tonos nude con descripcion larga', 'ACTIVO'],
    ]);

    expect(pdf).toContain('0.95 g');
    expect(pdf).toContain('BT /F1 8 Tf 42');
    expect(pdf).toContain('Paleta sombras');
    expect(pdf).not.toContain('Paleta sombras nude | BEL-003');
  });

  it('descarga el archivo mediante un enlace temporal', () => {
    const appendChild = vi.spyOn(document.body, 'appendChild');
    const removeChild = vi.spyOn(document.body, 'removeChild');
    const createObjectURL = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:export');
    const revokeObjectURL = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => undefined);
    const enlace = document.createElement('a');
    const click = vi.spyOn(enlace, 'click').mockImplementation(() => undefined);
    vi.spyOn(document, 'createElement').mockReturnValue(enlace);

    descargarArchivo('contenido', 'reporte.xls', 'application/vnd.ms-excel');

    expect(createObjectURL).toHaveBeenCalledOnce();
    expect(appendChild).toHaveBeenCalledOnce();
    expect(click).toHaveBeenCalledOnce();
    expect(removeChild).toHaveBeenCalledOnce();
    expect(revokeObjectURL).toHaveBeenCalledWith('blob:export');
  });
});
