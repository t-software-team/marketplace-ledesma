export function hasVerifiedBadge(shop: {
  verification_status: string
  subscription_status: string
}) {
  return shop.verification_status === 'verified' && shop.subscription_status === 'active'
}
