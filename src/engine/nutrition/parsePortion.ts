export type GroceryUnit = 'g' | 'ml' | 'cas' | 'cac' | 'tranche' | 'piece'

function toNumber(raw: string): number {
  return parseFloat(raw.replace(',', '.'))
}

/**
 * Extracts a numeric amount + unit from a catalog portion string when
 * possible — e.g. "150 g" -> {amount:150, unit:'g'}, "1 cuillère à soupe"
 * -> {amount:1, unit:'cas'}. Returns undefined for a qualitative portion
 * ("une pincée", "au goût") rather than inventing a number: a shopping
 * list should never claim a precision the source data doesn't have (same
 * "no false precision" rule the rest of the nutrition engine follows —
 * see `docs/nutrition-engine.md`). The caller (`buildShoppingList.ts`)
 * carries those through verbatim instead of summing them.
 */
export function parsePortion(portion: string): { amount: number; unit: GroceryUnit } | undefined {
  const trimmed = portion.trim()

  if (trimmed === '1/2') return { amount: 0.5, unit: 'piece' }

  // "1 boîte (140 g)", "2 (250 g)" — bought as a whole unit (can, fillet),
  // so the count of units is what belongs on a shopping list, not the
  // parenthetical weight.
  let m = trimmed.match(/^(\d+(?:[.,]\d+)?)\b.*\(.*\)$/)
  if (m) return { amount: toNumber(m[1]!), unit: 'piece' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*g$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'g' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*ml$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'ml' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*cuillères?\s*à\s*soupe$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'cas' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*cuillères?\s*à\s*café$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'cac' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*tranches?$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'tranche' }

  m = trimmed.match(/^(\d+(?:[.,]\d+)?)\s*portions?$/i)
  if (m) return { amount: toNumber(m[1]!), unit: 'piece' }

  m = trimmed.match(/^\d+(?:[.,]\d+)?$/)
  if (m) return { amount: toNumber(trimmed), unit: 'piece' }

  return undefined
}

function formatAmount(amount: number): string {
  return Number.isInteger(amount) ? String(amount) : amount.toFixed(1).replace('.', ',')
}

const UNIT_FORMATTERS: Record<GroceryUnit, (amount: number) => string> = {
  g: (n) => `${formatAmount(n)} g`,
  ml: (n) => `${formatAmount(n)} ml`,
  cas: (n) => `${formatAmount(n)} cuillère${n > 1 ? 's' : ''} à soupe`,
  cac: (n) => `${formatAmount(n)} cuillère${n > 1 ? 's' : ''} à café`,
  tranche: (n) => `${formatAmount(n)} tranche${n > 1 ? 's' : ''}`,
  piece: (n) => formatAmount(n),
}

/** Renders a summed {amount, unit} back into the same style as the
 * catalog's own portion strings, so a shopping-list quantity reads the
 * same way a single meal's portion always has. */
export function formatQuantity(amount: number, unit: GroceryUnit): string {
  return UNIT_FORMATTERS[unit](amount)
}
