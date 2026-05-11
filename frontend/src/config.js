const API_BASE = import.meta.env.VITE_API_URL || ''
export const API_URL = `${API_BASE}/api`

export const COLOR_PALETTE = [
  '#4CAF50','#2196F3','#FF9800','#E91E63','#9C27B0',
  '#00BCD4','#8BC34A','#FFC107','#795548','#607D8B',
]

export const ESPECIES = ['bovino','bufalino','porcino','aviar','ovino','caprino','equino']

export const ESTADOS_ANIMAL = [
  { value: 'propio', label: 'Propio' },
  { value: 'prestamo', label: 'En Préstamo' },
  { value: 'adopcion', label: 'En Adopción' },
  { value: 'consignacion', label: 'En Consignación' },
]

export const CATEGORIAS_ANIMAL_ESTADO = {
  propio: { inventario: 'activo', contable: 'activo' },
  prestamo: { inventario: 'tercero', contable: 'pasivo' },
  adopcion: { inventario: 'tercero', contable: 'no_amortizable' },
  consignacion: { inventario: 'tercero', contable: 'consignacion' },
}
export const TIPOS_CULTIVO = ['maiz','arroz','frijol','cafe','cacao','platano','yuca','papa','sorgo','pastura']
export const TIPOS_PRODUCTO = ['leche','carne','queso','huevos','miel','grano','fruta','verdura','elaborado']

export const formatCOP = (value) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

export const formatNumber = (value) =>
  new Intl.NumberFormat('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(value)
