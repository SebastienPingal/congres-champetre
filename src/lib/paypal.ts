const SANDBOX_BASE = "https://api-m.sandbox.paypal.com"
const LIVE_BASE = "https://api-m.paypal.com"

function getBaseUrl(): string {
  return process.env.PAYPAL_ENV === "live" ? LIVE_BASE : SANDBOX_BASE
}

function getCredentials(): { clientId: string; secret: string } {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const secret = process.env.PAYPAL_CLIENT_SECRET
  if (!clientId || !secret) {
    throw new Error("PAYPAL_CLIENT_ID / PAYPAL_CLIENT_SECRET not configured")
  }
  return { clientId, secret }
}

let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 30_000) {
    return cachedToken.value
  }
  const { clientId, secret } = getCredentials()
  const basic = Buffer.from(`${clientId}:${secret}`).toString("base64")
  const res = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!res.ok) {
    throw new Error(`PayPal token error ${res.status}: ${await res.text()}`)
  }
  const data = (await res.json()) as { access_token: string; expires_in: number }
  cachedToken = {
    value: data.access_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }
  return data.access_token
}

async function paypalFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken()
  const res = await fetch(`${getBaseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  })
  const text = await res.text()
  if (!res.ok) {
    throw new Error(`PayPal ${path} ${res.status}: ${text}`)
  }
  return (text ? JSON.parse(text) : {}) as T
}

export interface PaypalOrder {
  id: string
  status: string
  purchase_units?: Array<{ amount: { value: string; currency_code: string } }>
}

export async function createOrder(amountEuros: number, metadata: Record<string, string>): Promise<PaypalOrder> {
  return paypalFetch<PaypalOrder>("/v2/checkout/orders", {
    method: "POST",
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "EUR", value: amountEuros.toFixed(2) },
          custom_id: `${metadata.userId}:${metadata.editionId}`,
          description: "Inscription Congrès Champêtre",
        },
      ],
    }),
  })
}

export async function captureOrder(orderId: string): Promise<PaypalOrder & {
  purchase_units?: Array<{
    payments?: { captures?: Array<{ id: string; status: string; amount: { value: string; currency_code: string } }> }
    amount: { value: string; currency_code: string }
  }>
}> {
  return paypalFetch(`/v2/checkout/orders/${orderId}/capture`, { method: "POST" })
}

export async function getOrder(orderId: string): Promise<PaypalOrder> {
  return paypalFetch<PaypalOrder>(`/v2/checkout/orders/${orderId}`)
}

export interface WebhookVerification {
  verification_status: "SUCCESS" | "FAILURE"
}

export async function verifyWebhook(headers: Headers, rawBody: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID not configured")
  const result = await paypalFetch<WebhookVerification>("/v1/notifications/verify-webhook-signature", {
    method: "POST",
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: JSON.parse(rawBody),
    }),
  })
  return result.verification_status === "SUCCESS"
}
