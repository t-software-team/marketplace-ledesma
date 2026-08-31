export interface PlanScope {
  applies_to: string
  category_id?: string | null
}

/**
 * Whether a subscription plan should be offered to a given shop.
 *
 * Category-scoped plans (`category_id` set) are offered only to shops of that
 * exact category — e.g. a "Plan Gimnasio" scoped to the Gimnasio rubro never
 * shows to a peluquería. Plans without a category fall back to the coarse
 * `applies_to` (all / product / service).
 */
export function planMatchesShop(
  plan: PlanScope,
  shop: { categoryId: string | null; isService: boolean }
): boolean {
  if (plan.category_id) return plan.category_id === shop.categoryId
  return plan.applies_to === 'all' || plan.applies_to === (shop.isService ? 'service' : 'product')
}
