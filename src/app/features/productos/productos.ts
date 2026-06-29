import { DatePipe } from '@angular/common';
import { Component, OnDestroy } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, forkJoin, Observable, of, switchMap } from 'rxjs';
import { getApiErrorMessage } from '../../core/api-error';
import { hayCambios, normalizarSnapshot } from '../../core/cambios-formulario';
import { ConfirmacionService } from '../../core/confirmacion.service';
import { descargarBlob, nombreArchivoExportacion } from '../../core/descarga-archivo';
import { EstadoCarga } from '../../core/estado-carga';
import { AccionDebounced, crearAccionDebounced, FiltroTodos, listarTodasLasPaginas } from '../../core/listado-utils';
import { NotificacionService } from '../../core/notificacion.service';
import {
  CategoriaResponse,
  ArchivoResponse,
  EstadoCatalogo,
  EstadoProducto,
  MarcaResponse,
  ProductoResponse,
  ProveedorResponse,
} from '../../core/models';
import { CategoriasService } from './categorias.service';
import { MarcasService } from './marcas.service';
import { ProductosService } from './productos.service';
import { ProveedoresService } from '../proveedores/proveedores.service';

@Component({
  host: { class: 'flex-1 flex flex-col overflow-hidden min-h-0' },
  selector: 'app-productos',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  templateUrl: './productos.html',
  styleUrl: './productos.scss',
})
export class Productos implements OnDestroy {
  readonly pageSize = 10;
  mensaje = '';
  errorListado = '';
  estadoListado: EstadoCarga = 'inicial';
  editandoId: string | null = null;
  mostrarModal = false;
  mostrarModalCategorias = false;
  mostrarModalMarcas = false;
  productos: ProductoResponse[] = [];
  categorias: CategoriaResponse[] = [];
  categoriasModal: CategoriaResponse[] = [];
  marcas: MarcaResponse[] = [];
  marcasModal: MarcaResponse[] = [];
  proveedores: ProveedorResponse[] = [];
  categoriaError = '';
  categoriaMensaje = '';
  categoriaTexto = '';
  categoriaBusqueda = '';
  categoriaEditandoId: string | null = null;
  categoriaPaginaActual = 0;
  categoriaTotalPaginas = 0;
  categoriaTotalRegistros = 0;
  marcaError = '';
  marcaMensaje = '';
  marcaTexto = '';
  marcaBusqueda = '';
  marcaEditandoId: string | null = null;
  marcaPaginaActual = 0;
  marcaTotalPaginas = 0;
  marcaTotalRegistros = 0;
  enviando = false;
  imagenProductoSeleccionada: File | null = null;
  imagenProductoNombre = '';
  imagenProductoPreview = '';
  imagenProductoError = '';
  productoSnapshotOriginal: Record<string, string | number | boolean | null> | null = null;
  categoriaNombreOriginal = '';
  marcaNombreOriginal = '';
  filtrosProducto = {
    busqueda: '',
    estado: 'TODOS' as FiltroTodos<EstadoProducto>,
    categoriaId: 'TODOS',
    marcaId: 'TODOS',
    proveedorId: 'TODOS',
  };

  readonly productoForm;
  readonly estadosProducto: Array<FiltroTodos<EstadoProducto>> = ['TODOS', 'ACTIVO', 'INACTIVO'];
  paginaActual = 0;
  totalPaginas = 0;
  totalRegistros = 0;
  private readonly busquedaDebounced: AccionDebounced = crearAccionDebounced(() => this.irAPagina(0));
  private readonly categoriaBusquedaDebounced: AccionDebounced = crearAccionDebounced(() => {
    this.categoriaPaginaActual = 0;
    this.cargarCategoriasModal();
  });
  private readonly marcaBusquedaDebounced: AccionDebounced = crearAccionDebounced(() => {
    this.marcaPaginaActual = 0;
    this.cargarMarcasModal();
  });

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private categoriasService: CategoriasService,
    private marcasService: MarcasService,
    private proveedoresService: ProveedoresService,
    private router: Router,
    private confirmacion: ConfirmacionService,
    private notificacion: NotificacionService
  ) {
    this.productoForm = this.fb.nonNullable.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(120)]],
      sku: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(40)]],
      descripcion: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(2000)]],
      imagenUrl: ['', [Validators.maxLength(500)]],
      categoriaId: ['', [Validators.required]],
      marcaId: ['', [Validators.required]],
      proveedorId: ['', [Validators.required]],
      paisOrigen: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(80)]],
      precioCompra: [0, [Validators.required, Validators.min(0)]],
      precioVenta: [0, [Validators.required, Validators.min(0)]],
    });
    this.cargarDatos();
  }

  get categoriasActivas(): CategoriaResponse[] {
    return this.categorias.filter((categoria) => categoria.estado === 'ACTIVO');
  }

  get marcasActivas(): MarcaResponse[] {
    return this.marcas.filter((marca) => marca.estado === 'ACTIVO');
  }

  get proveedoresActivos(): ProveedorResponse[] {
    return this.proveedores.filter((proveedor) => proveedor.estado === 'ACTIVO');
  }

  get opcionesCategoriaProducto(): CategoriaResponse[] {
    const seleccionada = this.productoForm.controls.categoriaId.value;
    const categoria = this.categorias.find((item) => item.id === seleccionada);
    if (!categoria || categoria.estado === 'ACTIVO') return this.categoriasActivas;
    return [categoria, ...this.categoriasActivas];
  }

  get opcionesMarcaProducto(): MarcaResponse[] {
    const seleccionada = this.productoForm.controls.marcaId.value;
    const marca = this.marcas.find((item) => item.id === seleccionada);
    if (!marca || marca.estado === 'ACTIVO') return this.marcasActivas;
    return [marca, ...this.marcasActivas];
  }

  get opcionesProveedorProducto(): ProveedorResponse[] {
    const seleccionado = this.productoForm.controls.proveedorId.value;
    const proveedor = this.proveedores.find((item) => item.id === seleccionado);
    if (!proveedor || proveedor.estado === 'ACTIVO') return this.proveedoresActivos;
    return [proveedor, ...this.proveedoresActivos];
  }

  get categoriaEditando(): CategoriaResponse | null {
    if (!this.categoriaEditandoId) return null;
    return this.categorias.find((categoria) => categoria.id === this.categoriaEditandoId) ?? null;
  }

  get marcaEditando(): MarcaResponse | null {
    if (!this.marcaEditandoId) return null;
    return this.marcas.find((marca) => marca.id === this.marcaEditandoId) ?? null;
  }

  bloquearTeclasNumeroInvalido(event: KeyboardEvent): void {
    if (['e', 'E', '+', '-'].includes(event.key)) {
      event.preventDefault();
    }
  }

  limpiarFiltrosProductos(): void {
    this.filtrosProducto = {
      busqueda: '',
      estado: 'TODOS',
      categoriaId: 'TODOS',
      marcaId: 'TODOS',
      proveedorId: 'TODOS',
    };
    this.irAPagina(0);
  }

  abrirModalProducto(): void {
    this.cancelarEdicion();
    this.mostrarModal = true;
  }

  abrirModalCategorias(): void {
    this.mostrarModalCategorias = true;
    this.categoriaMensaje = '';
    this.reiniciarEditorCategoria();
    this.categoriaPaginaActual = 0;
    this.cargarCategoriasModal();
  }

  abrirModalMarcas(): void {
    this.mostrarModalMarcas = true;
    this.marcaMensaje = '';
    this.reiniciarEditorMarca();
    this.marcaPaginaActual = 0;
    this.cargarMarcasModal();
  }

  cerrarModalCategorias(): void {
    this.mostrarModalCategorias = false;
    this.categoriaMensaje = '';
    this.reiniciarEditorCategoria();
  }

  cerrarModalMarcas(): void {
    this.mostrarModalMarcas = false;
    this.marcaMensaje = '';
    this.reiniciarEditorMarca();
  }

  cargarDatos(): void {
    this.estadoListado = 'cargando';
    this.errorListado = '';
    forkJoin({
      productos: this.productosService.listar({
        page: this.paginaActual,
        size: this.pageSize,
        busqueda: this.filtrosProducto.busqueda,
        estado: this.filtrosProducto.estado,
        categoriaId: this.filtrosProducto.categoriaId,
        marcaId: this.filtrosProducto.marcaId,
        proveedorId: this.filtrosProducto.proveedorId,
      }),
      categorias: listarTodasLasPaginas((page, size) => this.categoriasService.listar({ page, size })),
      marcas: listarTodasLasPaginas((page, size) => this.marcasService.listar({ page, size })),
      proveedores: listarTodasLasPaginas((page, size) => this.proveedoresService.listar({ page, size })),
    }).subscribe({
      next: ({ productos, categorias, marcas, proveedores }) => {
        this.productos = productos.content;
        this.paginaActual = productos.page;
        this.totalPaginas = productos.totalPages;
        this.totalRegistros = productos.totalElements;
        this.categorias = categorias;
        this.marcas = marcas;
        this.proveedores = proveedores;
        if (!this.mostrarModalCategorias) {
          this.categoriasModal = categorias.slice(0, this.pageSize);
          this.categoriaPaginaActual = 0;
          this.categoriaTotalRegistros = categorias.length;
          this.categoriaTotalPaginas = Math.ceil(categorias.length / this.pageSize);
        }
        if (!this.mostrarModalMarcas) {
          this.marcasModal = marcas.slice(0, this.pageSize);
          this.marcaPaginaActual = 0;
          this.marcaTotalRegistros = marcas.length;
          this.marcaTotalPaginas = Math.ceil(marcas.length / this.pageSize);
        }
        this.estadoListado = 'exito';
        this.asegurarCatalogosSeleccionados();
      },
      error: (error: unknown) => {
        this.estadoListado = 'error';
        this.errorListado = getApiErrorMessage(error);
      },
    });
  }

  onFiltrosChange(): void {
    this.irAPagina(0);
  }

  onBusquedaChange(): void {
    this.busquedaDebounced.schedule();
  }

  ngOnDestroy(): void {
    this.busquedaDebounced.destroy();
    this.categoriaBusquedaDebounced.destroy();
    this.marcaBusquedaDebounced.destroy();
    this.limpiarImagenSeleccionada();
  }

  irAPagina(page: number): void {
    if (page < 0 || (this.totalPaginas > 0 && page >= this.totalPaginas)) return;
    this.paginaActual = page;
    this.cargarDatos();
  }

  exportarProductosExcel(): void {
    this.exportarProductos('excel');
  }

  exportarProductosPdf(): void {
    this.exportarProductos('pdf');
  }

  guardarProducto(): void {
    if (this.productoForm.invalid) {
      this.productoForm.markAllAsTouched();
      this.notificacion.error('Completa correctamente los campos obligatorios.');
      return;
    }

    this.imagenProductoError = '';
    const value = this.productoForm.getRawValue();
    const requestBase = {
      nombre: this.normalizarTexto(value.nombre),
      sku: this.normalizarSku(value.sku),
      descripcion: this.normalizarTexto(value.descripcion),
      imagenUrl: this.normalizarOpcional(value.imagenUrl),
      categoriaId: value.categoriaId,
      marcaId: value.marcaId,
      proveedorId: value.proveedorId,
      paisOrigen: this.normalizarTexto(value.paisOrigen),
      precioCompra: value.precioCompra,
      precioVenta: value.precioVenta,
    };
    const estadoActual = this.productos.find((producto) => producto.id === this.editandoId)?.estado ?? 'ACTIVO';

    if (this.editandoId && !this.imagenProductoSeleccionada) {
      const actual = normalizarSnapshot({ ...requestBase, estado: estadoActual });
      if (this.productoSnapshotOriginal && !hayCambios(this.productoSnapshotOriginal, actual)) {
        this.notificacion.info('No hay cambios para actualizar.');
        return;
      }
    }

    this.enviando = true;
    const imagen$: Observable<ArchivoResponse | null> = this.imagenProductoSeleccionada
      ? this.productosService.subirImagenProducto(this.imagenProductoSeleccionada)
      : of(null);

    imagen$
      .pipe(
        switchMap((imagen) => {
          const request = {
            ...requestBase,
            imagenUrl: imagen?.url ?? requestBase.imagenUrl,
          };
          return this.editandoId
            ? this.productosService.actualizar(this.editandoId, {
                ...request,
                estado: estadoActual,
              })
            : this.productosService.crear(request);
        }),
        finalize(() => {
          this.enviando = false;
        })
      )
      .subscribe({
      next: () => {
        this.notificacion.success(this.editandoId
          ? 'Producto actualizado correctamente.'
          : 'Producto registrado correctamente.');
        this.cancelarEdicion();
        this.cargarDatos();
      },
      error: (error: unknown) => {
        this.notificacion.error(getApiErrorMessage(error));
      },
      });
  }

  editarProducto(producto: ProductoResponse): void {
    this.editandoId = producto.id;
    this.mostrarModal = true;
    this.productoForm.setValue({
      nombre: producto.nombre,
      sku: producto.sku,
      descripcion: producto.descripcion,
      imagenUrl: producto.imagenUrl ?? '',
      categoriaId: producto.categoriaId,
      marcaId: producto.marcaId,
      proveedorId: producto.proveedorId,
      paisOrigen: producto.paisOrigen,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
    });
    this.productoSnapshotOriginal = normalizarSnapshot({
      nombre: producto.nombre,
      sku: producto.sku,
      descripcion: producto.descripcion,
      imagenUrl: producto.imagenUrl ?? null,
      categoriaId: producto.categoriaId,
      marcaId: producto.marcaId,
      proveedorId: producto.proveedorId,
      paisOrigen: producto.paisOrigen,
      precioCompra: producto.precioCompra,
      precioVenta: producto.precioVenta,
      estado: producto.estado,
    });
    this.limpiarImagenSeleccionada();
    this.notificacion.info(`Editando producto ${producto.nombre}.`);
  }

  cancelarEdicion(): void {
    this.mostrarModal = false;
    this.editandoId = null;
    this.productoSnapshotOriginal = null;
    this.productoForm.reset({
      nombre: '',
      sku: '',
      descripcion: '',
      imagenUrl: '',
      categoriaId: this.categoriasActivas[0]?.id ?? '',
      marcaId: this.marcasActivas[0]?.id ?? '',
      proveedorId: this.proveedoresActivos[0]?.id ?? '',
      paisOrigen: '',
      precioCompra: 0,
      precioVenta: 0,
    });
    this.limpiarImagenSeleccionada();
  }

  seleccionarImagenProducto(event: Event): void {
    const input = event.target as HTMLInputElement;
    const archivo = input.files?.[0] ?? null;
    this.limpiarImagenSeleccionada();
    if (!archivo) return;

    const tiposPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!tiposPermitidos.includes(archivo.type)) {
      this.imagenProductoError = 'Selecciona una imagen JPG, PNG, WEBP o GIF.';
      input.value = '';
      return;
    }

    const maxBytes = 5 * 1024 * 1024;
    if (archivo.size > maxBytes) {
      this.imagenProductoError = 'La imagen no debe superar 5 MB.';
      input.value = '';
      return;
    }

    this.imagenProductoSeleccionada = archivo;
    this.imagenProductoNombre = archivo.name;
    this.imagenProductoPreview = URL.createObjectURL(archivo);
  }

  limpiarImagenSeleccionada(): void {
    if (this.imagenProductoPreview) {
      URL.revokeObjectURL(this.imagenProductoPreview);
    }
    this.imagenProductoSeleccionada = null;
    this.imagenProductoNombre = '';
    this.imagenProductoPreview = '';
    this.imagenProductoError = '';
  }

  async cambiarEstadoProducto(producto: ProductoResponse): Promise<void> {
    const accion = producto.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} producto del catálogo`,
      mensaje: accion === 'desactivar'
        ? `Se desactivará ${producto.nombre} solo en el catálogo. Su inventario no se desactiva automáticamente y seguirá visible para controlar el stock existente.`
        : `Se activará ${producto.nombre} en el catálogo. El estado de su inventario no se modifica automáticamente.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    this.productosService
      .actualizarEstado(producto.id, producto.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO')
      .subscribe({
        next: () => {
          this.notificacion.success(
            producto.estado === 'ACTIVO'
              ? 'Producto desactivado correctamente.'
              : 'Producto activado correctamente.'
          );
          this.cargarDatos();
        },
        error: (error: unknown) => {
          this.notificacion.error(getApiErrorMessage(error));
        },
      });
  }

  iniciarEdicionCategoria(categoria: CategoriaResponse): void {
    this.categoriaEditandoId = categoria.id;
    this.categoriaTexto = categoria.nombre;
    this.categoriaNombreOriginal = this.normalizarNombreCatalogo(categoria.nombre);
    this.categoriaError = '';
    this.categoriaMensaje = '';
  }

  onBusquedaCategoriasModalChange(): void {
    this.categoriaBusquedaDebounced.schedule();
  }

  guardarCategoria(): void {
    this.categoriaError = '';
    const nombre = this.normalizarNombreCatalogo(this.categoriaTexto);

    if (!nombre) {
      this.categoriaError = 'Ingrese una categoría válida.';
      return;
    }

    const duplicada = this.categorias.some(
      (categoria) =>
        categoria.nombre.toLowerCase() === nombre.toLowerCase() &&
        categoria.id !== this.categoriaEditandoId
    );
    if (duplicada) {
      this.categoriaError = 'La categoría ya existe.';
      return;
    }

    const categoria = this.categorias.find((item) => item.id === this.categoriaEditandoId) ?? null;
    if (categoria && nombre === this.categoriaNombreOriginal) {
      this.categoriaError = 'No hay cambios para actualizar.';
      this.notificacion.info(this.categoriaError);
      return;
    }
    const request$ = categoria
      ? this.categoriasService.actualizar(categoria.id, { nombre, estado: categoria.estado })
      : this.categoriasService.crear({ nombre });

    request$.subscribe({
      next: () => {
        this.notificacion.success(categoria
          ? 'Categoría actualizada correctamente.'
          : 'Categoría creada correctamente.');
        this.reiniciarEditorCategoria();
        this.cargarDatos();
        this.cargarCategoriasModal();
      },
      error: (error: unknown) => {
        this.categoriaError = getApiErrorMessage(error);
        this.notificacion.error(this.categoriaError);
      },
    });
  }

  async cambiarEstadoCategoria(categoria: CategoriaResponse): Promise<void> {
    if (categoria.estado === 'ACTIVO' && this.categoriasActivas.length === 1) {
      this.categoriaError = 'Debe existir al menos una categoría activa.';
      this.notificacion.error(this.categoriaError);
      return;
    }

    const accion = categoria.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} categoría`,
      mensaje: `Se va a ${accion} la categoría ${categoria.nombre}.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    const request$: Observable<unknown> = this.categoriasService.actualizarEstado(
      categoria.id,
      categoria.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    );

    request$.subscribe({
      next: () => {
        this.notificacion.success(
          categoria.estado === 'ACTIVO'
            ? 'Categoría desactivada correctamente.'
            : 'Categoría activada correctamente.');
        this.reiniciarEditorCategoria();
        this.cargarDatos();
        this.cargarCategoriasModal();
      },
      error: (error: unknown) => {
        this.categoriaError = getApiErrorMessage(error);
        this.notificacion.error(this.categoriaError);
      },
    });
  }

  categoriaEnUso(categoria: CategoriaResponse): boolean {
    return this.productos.some((producto) => producto.categoriaId === categoria.id);
  }

  actualizarTextoCategoria(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ ]/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) input.value = sanitized;
    this.categoriaTexto = sanitized;
    this.categoriaError = '';
    this.categoriaMensaje = '';
  }

  reiniciarEditorCategoria(): void {
    this.categoriaTexto = '';
    this.categoriaEditandoId = null;
    this.categoriaNombreOriginal = '';
    this.categoriaError = '';
  }

  iniciarEdicionMarca(marca: MarcaResponse): void {
    this.marcaEditandoId = marca.id;
    this.marcaTexto = marca.nombre;
    this.marcaNombreOriginal = this.normalizarNombreCatalogo(marca.nombre);
    this.marcaError = '';
    this.marcaMensaje = '';
  }

  onBusquedaMarcasModalChange(): void {
    this.marcaBusquedaDebounced.schedule();
  }

  guardarMarca(): void {
    this.marcaError = '';
    const nombre = this.normalizarNombreCatalogo(this.marcaTexto);

    if (!nombre) {
      this.marcaError = 'Ingrese una marca válida.';
      return;
    }

    const duplicada = this.marcas.some(
      (marca) =>
        marca.nombre.toLowerCase() === nombre.toLowerCase() &&
        marca.id !== this.marcaEditandoId
    );
    if (duplicada) {
      this.marcaError = 'La marca ya existe.';
      return;
    }

    const marca = this.marcas.find((item) => item.id === this.marcaEditandoId) ?? null;
    if (marca && nombre === this.marcaNombreOriginal) {
      this.marcaError = 'No hay cambios para actualizar.';
      this.notificacion.info(this.marcaError);
      return;
    }
    const request$ = marca
      ? this.marcasService.actualizar(marca.id, { nombre, estado: marca.estado })
      : this.marcasService.crear({ nombre });

    request$.subscribe({
      next: () => {
        this.notificacion.success(marca
          ? 'Marca actualizada correctamente.'
          : 'Marca creada correctamente.');
        this.reiniciarEditorMarca();
        this.cargarDatos();
        this.cargarMarcasModal();
      },
      error: (error: unknown) => {
        this.marcaError = getApiErrorMessage(error);
        this.notificacion.error(this.marcaError);
      },
    });
  }

  async cambiarEstadoMarca(marca: MarcaResponse): Promise<void> {
    if (marca.estado === 'ACTIVO' && this.marcasActivas.length === 1) {
      this.marcaError = 'Debe existir al menos una marca activa.';
      this.notificacion.error(this.marcaError);
      return;
    }

    const accion = marca.estado === 'ACTIVO' ? 'desactivar' : 'activar';
    const confirmado = await this.confirmacion.confirmar({
      titulo: `${accion === 'desactivar' ? 'Desactivar' : 'Activar'} marca`,
      mensaje: `Se va a ${accion} la marca ${marca.nombre}.`,
      textoConfirmar: accion === 'desactivar' ? 'Desactivar' : 'Activar',
      tono: accion === 'desactivar' ? 'danger' : 'normal',
    });
    if (!confirmado) return;

    const request$: Observable<unknown> = this.marcasService.actualizarEstado(
      marca.id,
      marca.estado === 'ACTIVO' ? 'INACTIVO' : 'ACTIVO'
    );

    request$.subscribe({
      next: () => {
        this.notificacion.success(
          marca.estado === 'ACTIVO'
            ? 'Marca desactivada correctamente.'
            : 'Marca activada correctamente.');
        this.reiniciarEditorMarca();
        this.cargarDatos();
        this.cargarMarcasModal();
      },
      error: (error: unknown) => {
        this.marcaError = getApiErrorMessage(error);
        this.notificacion.error(this.marcaError);
      },
    });
  }

  marcaEnUso(marca: MarcaResponse): boolean {
    return this.productos.some((producto) => producto.marcaId === marca.id);
  }

  actualizarTextoMarca(event: Event): void {
    const input = event.target as HTMLInputElement;
    const sanitized = input.value.replace(/[^A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,'-]/g, '').replace(/\s{2,}/g, ' ');
    if (sanitized !== input.value) input.value = sanitized;
    this.marcaTexto = sanitized;
    this.marcaError = '';
    this.marcaMensaje = '';
  }

  reiniciarEditorMarca(): void {
    this.marcaTexto = '';
    this.marcaEditandoId = null;
    this.marcaNombreOriginal = '';
    this.marcaError = '';
  }

  irAPaginaCategorias(page: number): void {
    if (page < 0 || (this.categoriaTotalPaginas > 0 && page >= this.categoriaTotalPaginas)) return;
    this.categoriaPaginaActual = page;
    this.cargarCategoriasModal();
  }

  irAPaginaMarcas(page: number): void {
    if (page < 0 || (this.marcaTotalPaginas > 0 && page >= this.marcaTotalPaginas)) return;
    this.marcaPaginaActual = page;
    this.cargarMarcasModal();
  }

  estadoClase(estado: EstadoCatalogo | EstadoProducto): string {
    return estado === 'ACTIVO' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500';
  }

  descripcionProducto(producto: ProductoResponse): string {
    return producto.descripcion?.trim() || 'Sin descripción registrada.';
  }

  imagenProducto(producto: ProductoResponse): string | null {
    return producto.imagenUrl?.trim() || null;
  }

  onImagenProductoError(producto: ProductoResponse): void {
    producto.imagenUrl = '';
  }

  verHistorialProducto(producto: ProductoResponse): void {
    void this.router.navigate(['/movimientos'], {
      queryParams: {
        productoId: producto.id,
        producto: producto.nombre,
      },
    });
  }

  private asegurarCatalogosSeleccionados(): void {
    if (!this.productoForm.controls.categoriaId.value && this.categoriasActivas[0]) {
      this.productoForm.patchValue({ categoriaId: this.categoriasActivas[0].id });
    }
    if (!this.productoForm.controls.marcaId.value && this.marcasActivas[0]) {
      this.productoForm.patchValue({ marcaId: this.marcasActivas[0].id });
    }
    if (!this.productoForm.controls.proveedorId.value && this.proveedoresActivos[0]) {
      this.productoForm.patchValue({ proveedorId: this.proveedoresActivos[0].id });
    }
  }

  private cargarCategoriasModal(): void {
    if (!this.mostrarModalCategorias) return;
    this.categoriasService.listar({
      page: this.categoriaPaginaActual,
      size: this.pageSize,
      busqueda: this.categoriaBusqueda,
    }).subscribe({
      next: (pagina) => {
        this.categoriasModal = pagina.content;
        this.categoriaPaginaActual = pagina.page;
        this.categoriaTotalPaginas = pagina.totalPages;
        this.categoriaTotalRegistros = pagina.totalElements;
      },
      error: (error: unknown) => {
        this.categoriaError = getApiErrorMessage(error);
        this.notificacion.error(this.categoriaError);
      },
    });
  }

  private cargarMarcasModal(): void {
    if (!this.mostrarModalMarcas) return;
    this.marcasService.listar({
      page: this.marcaPaginaActual,
      size: this.pageSize,
      busqueda: this.marcaBusqueda,
    }).subscribe({
      next: (pagina) => {
        this.marcasModal = pagina.content;
        this.marcaPaginaActual = pagina.page;
        this.marcaTotalPaginas = pagina.totalPages;
        this.marcaTotalRegistros = pagina.totalElements;
      },
      error: (error: unknown) => {
        this.marcaError = getApiErrorMessage(error);
        this.notificacion.error(this.marcaError);
      },
    });
  }

  private normalizarTexto(value: string): string {
    return value.trim().replace(/\s+/g, ' ');
  }

  private normalizarSku(value: string): string {
    return value.trim().replace(/\s+/g, '-').toUpperCase();
  }

  private normalizarOpcional(value: string): string | null {
    const normalized = value.trim();
    return normalized ? normalized : null;
  }

  private normalizarNombreCatalogo(value: string): string {
    const normalized = value.trim().replace(/\s+/g, ' ');
    if (!normalized) return '';
    if (normalized.length < 2 || normalized.length > 80) return '';
    if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9 .,'-]+$/.test(normalized)) return '';
    return normalized;
  }

  private exportarProductos(tipo: 'excel' | 'pdf'): void {
    this.productosService.exportar(tipo, this.filtrosProducto).subscribe({
      next: (blob) => {
        descargarBlob(blob, nombreArchivoExportacion('productos', tipo));
        this.notificacion.success(`Productos exportados a ${tipo === 'excel' ? 'Excel' : 'PDF'}.`);
      },
      error: (error: unknown) => this.notificacion.error(getApiErrorMessage(error)),
    });
  }
}
