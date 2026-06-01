// PayPal France rates — update here if PayPal changes their pricing
export const PAYPAL_FEE_RATE = 0.0349  // 3.49%
export const PAYPAL_FEE_FIXED = 0.49   // €0.49 per transaction

export function applyPaypalFees(baseAmount: number): number {
  return Math.round(((baseAmount + PAYPAL_FEE_FIXED) / (1 - PAYPAL_FEE_RATE)) * 100) / 100
}
