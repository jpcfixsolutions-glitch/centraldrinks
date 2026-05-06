import { useCallback, useEffect, useState } from 'react';
import {
  cajasApi,
  categoriasApi,
  mesasApi,
  metodosPagoApi,
  productosApi,
  ventasApi,
} from '../lib/api.js';

export function useDataStore({ enabled }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [categorias, setCategorias] = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [productos, setProductos] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [cierres, setCierres] = useState([]);

  const recargarTodo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [c, m, p, ms, v, cj] = await Promise.all([
        categoriasApi.listar(),
        metodosPagoApi.listar(),
        productosApi.listar(),
        mesasApi.listar(),
        ventasApi.listar(),
        cajasApi.listar().catch(() => []),
      ]);
      setCategorias(c);
      setMetodosPago(m);
      setProductos(p);
      setMesas(ms);
      setVentas(v);
      setCierres(cj);
    } catch (err) {
      setError(err.message || 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (enabled) {
      recargarTodo();
    } else {
      setLoading(false);
    }
  }, [enabled, recargarTodo]);

  const recargarVentas = useCallback(async () => {
    const v = await ventasApi.listar();
    setVentas(v);
  }, []);

  const recargarProductos = useCallback(async () => {
    const p = await productosApi.listar();
    setProductos(p);
  }, []);

  const recargarMesas = useCallback(async () => {
    const m = await mesasApi.listar();
    setMesas(m);
  }, []);

  const recargarCierres = useCallback(async () => {
    const c = await cajasApi.listar();
    setCierres(c);
  }, []);

  const crearCategoria = useCallback(async (nombre) => {
    const creada = await categoriasApi.crear(nombre);
    setCategorias((prev) => [...prev, creada]);
    return creada;
  }, []);

  const actualizarCategoria = useCallback(async (id, nombre) => {
    const actualizada = await categoriasApi.actualizar(id, nombre);
    setCategorias((prev) => prev.map((c) => (c.id === id ? actualizada : c)));
    return actualizada;
  }, []);

  const eliminarCategoria = useCallback(async (id) => {
    await categoriasApi.eliminar(id);
    setCategorias((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const crearMetodoPago = useCallback(async (data) => {
    const creado = await metodosPagoApi.crear(data);
    setMetodosPago((prev) => [...prev, creado]);
    return creado;
  }, []);

  const actualizarMetodoPago = useCallback(async (id, data) => {
    const actualizado = await metodosPagoApi.actualizar(id, data);
    setMetodosPago((prev) => prev.map((m) => (m.id === id ? actualizado : m)));
    return actualizado;
  }, []);

  const eliminarMetodoPago = useCallback(async (id) => {
    await metodosPagoApi.eliminar(id);
    setMetodosPago((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const crearProducto = useCallback(
    async (data) => {
      await productosApi.crear(data);
      await recargarProductos();
    },
    [recargarProductos]
  );

  const actualizarProducto = useCallback(
    async (id, data) => {
      await productosApi.actualizar(id, data);
      await recargarProductos();
    },
    [recargarProductos]
  );

  const eliminarProducto = useCallback(
    async (id) => {
      await productosApi.eliminar(id);
      await recargarProductos();
    },
    [recargarProductos]
  );

  const crearMesa = useCallback(async () => {
    const creada = await mesasApi.crear();
    setMesas((prev) => [...prev, creada].sort((a, b) => a.numero - b.numero));
    return creada;
  }, []);

  const eliminarMesa = useCallback(async (id) => {
    await mesasApi.eliminar(id);
    setMesas((prev) => prev.filter((m) => m.id !== id));
  }, []);

  const registrarVenta = useCallback(
    async (data) => {
      const venta = await ventasApi.crear(data);
      await Promise.all([recargarVentas(), recargarProductos()]);
      return venta;
    },
    [recargarProductos, recargarVentas]
  );

  const cerrarCajaActual = useCallback(async () => {
    const cierre = await cajasApi.cerrar();
    await Promise.all([recargarCierres(), recargarVentas()]);
    return cierre;
  }, [recargarCierres, recargarVentas]);

  return {
    loading,
    error,
    categorias,
    metodosPago,
    productos,
    mesas,
    ventas,
    cierres,
    recargarTodo,
    recargarVentas,
    recargarCierres,
    crearCategoria,
    actualizarCategoria,
    eliminarCategoria,
    crearMetodoPago,
    actualizarMetodoPago,
    eliminarMetodoPago,
    crearProducto,
    actualizarProducto,
    eliminarProducto,
    crearMesa,
    eliminarMesa,
    registrarVenta,
    cerrarCajaActual,
  };
}
