/**
 * Tooltip texts, copied verbatim from Paper "Mottor AI – Quotes UI" › Design System › Glosario de tooltips.
 * Change them there first; this file mirrors the design (WEB-11).
 */
export const GLOSSARY = {
  client: {
    term: 'Cliente',
    text: 'Empresa o agencia a la que se le arma el presupuesto. El filtro busca por parte del nombre, sin distinguir mayúsculas.',
  },
  event: {
    term: 'Evento',
    text: 'Descripción del evento partida en renglones de 28 caracteres, como sale en el ticket impreso (máx. 4).',
  },
  budgetId: {
    term: 'ID de presupuesto',
    text: 'Código del presupuesto en el sistema de Comercial (budget_id).',
  },
  currency: {
    term: 'Moneda',
    text: 'Moneda en la que se muestran los totales. Se convierte con las tasas guardadas en cada presupuesto.',
  },
  total: {
    term: 'Total',
    text: 'Total final después de aplicar todas las reglas, convertido a la moneda elegida.',
  },
  noRate: {
    term: 'Sin tasa',
    text: 'El presupuesto no guardó una tasa para convertir a esta moneda; se muestra el total original.',
  },
  subtotal: {
    term: 'Subtotal',
    text: 'Suma de los ítems a precio de lista, en la moneda del presupuesto, antes de cualquier regla.',
  },
  step: {
    term: 'Paso / Orden',
    text: 'Las reglas se aplican en el orden que definió quien armó el presupuesto, no el sistema.',
  },
  rule: {
    term: 'Regla',
    text: 'Condición comercial aplicada (promo por cantidad, descuento, tope, impuesto). Pueden sumarse reglas nuevas.',
  },
  base: { term: 'Base', text: 'Monto sobre el que se calculó esta regla.' },
  adjustment: {
    term: 'Ajuste',
    text: 'Lo que la regla resta (descuento) o suma (impuesto o devolución del tope).',
  },
  runningTotal: { term: 'Acumulado', text: 'Total vigente después de este paso.' },
  quantity_promo: {
    term: 'quantity_promo',
    text: 'Promoción por cantidad: cada cierto número de unidades de una categoría, algunas salen gratis.',
  },
  category_discount: {
    term: 'category_discount',
    text: 'Descuento porcentual sobre los ítems de una categoría, a precio de lista.',
  },
  percentage_discount: {
    term: 'percentage_discount',
    text: 'Descuento porcentual sobre el subtotal vigente al momento de aplicarse.',
  },
  fixed_discount: {
    term: 'fixed_discount',
    text: 'Descuento de un monto fijo, en la moneda indicada.',
  },
  discount_cap: {
    term: 'discount_cap',
    text: 'El total de descuentos no puede superar este % del subtotal; si lo supera, se devuelve la diferencia. Los impuestos no cuentan.',
  },
  tax: {
    term: 'tax',
    text: 'Recargo porcentual (impuesto) sobre el subtotal vigente al momento de aplicarse.',
  },
  exchangeRate: {
    term: 'Tipo de cambio',
    text: 'Tasas guardadas con el presupuesto. Se usan para convertir los ítems y los descuentos en otra moneda; no son la cotización de hoy.',
  },
  foreignAmount: {
    term: 'Importe en otra moneda',
    text: 'Valor subrayado en la tabla de ítems. Tooltip: “USD 1.200,00 × 1.450,00 = ARS 1.740.000,00”.',
  },
  foreignFixedDiscount: {
    term: 'Descuento fijo en otra moneda',
    text: 'Si fixed_discount está en otra moneda, el label secundario muestra la conversión en vez de “fixed_discount”, ej. “USD 50,00 × 1.450,00 = ARS 72.500,00”.',
  },
  batch: { term: 'Lote', text: 'El archivo se envía en lotes de hasta 500 presupuestos.' },
  progress: {
    term: 'Progreso',
    text: 'Porcentaje de presupuestos ya procesados sobre el total del archivo.',
  },
  batchErrors: {
    term: 'Errores del lote',
    text: 'Si un presupuesto del lote es inválido, el lote entero no se guarda.',
  },
  perPage: {
    term: 'Por página',
    text: 'Cantidad de presupuestos que se muestran por página en el listado.',
  },
  pagination: {
    term: 'Paginación',
    text: 'Navegación entre páginas del listado completo del histórico.',
  },
  ticketLines: {
    term: 'Renglones/ticket',
    text: 'Cantidad de líneas de 28 caracteres que ocupa un texto en el ticket impreso (máx. 4).',
  },
  description: {
    term: 'Descripción',
    text: 'Texto del ítem tal como se incluyó en el presupuesto. En el ticket se parte en renglones de hasta 28 caracteres.',
  },
  amount: {
    term: 'Importe',
    text: 'Importe del ítem en la moneda del presupuesto, según el cálculo guardado.',
  },
  importMode: {
    term: 'Modo de importación',
    text: 'Elegí enviar los lotes en serie o procesar el archivo con la cola de Horizon y Reverb.',
  },
} as const satisfies Record<string, { term: string; text: string }>;

export type GlossaryKey = keyof typeof GLOSSARY;

/** Rule types the front explains; anything else is shown as "Regla no reconocida". */
export const RULE_TYPES = [
  'quantity_promo',
  'category_discount',
  'percentage_discount',
  'fixed_discount',
  'discount_cap',
  'tax',
] as const satisfies readonly GlossaryKey[];

export const isKnownRuleType = (type: string): type is (typeof RULE_TYPES)[number] =>
  (RULE_TYPES as readonly string[]).includes(type);
