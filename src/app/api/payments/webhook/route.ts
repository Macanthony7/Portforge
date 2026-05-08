import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const PLANS = {
  pro: { variantId: process.env.LEMONSQUEEZY_PRO_VARIANT_ID!, tier: 'pro' as const },
  audit: { variantId: process.env.LEMONSQUEEZY_AUDIT_VARIANT_ID!, tier: 'audit' as const },
}

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('x-signature')
  if (!signature || !process.env.LEMONSQUEEZY_WEBHOOK_SECRET)
    return NextResponse.json({ error: 'Missing signature' }, { status: 401 })

  const encoder = new TextEncoder()
  const key = await crypto.subtle.importKey('raw', encoder.encode(process.env.LEMONSQUEEZY_WEBHOOK_SECRET),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
  const isValid = await crypto.subtle.verify('HMAC', key, Buffer.from(signature, 'hex'), encoder.encode(body))
  if (!isValid) return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })

  const event = JSON.parse(body)
  const eventName = event.meta?.event_name
  const supabase = await createClient()

  if (eventName === 'order_created' || eventName === 'subscription_created') {
    const userId = event.meta?.custom_data?.user_id
    const variantId = String(event.data?.attributes?.variant_id || event.data?.attributes?.first_order_item?.variant_id)
    if (!userId) return NextResponse.json({ ok: true })
    const tier = variantId === process.env.LEMONSQUEEZY_AUDIT_VARIANT_ID ? 'audit' : 'pro'
    await supabase.from('profiles').update({ subscription_tier: tier }).eq('id', userId)
  }

  if (eventName === 'subscription_expired' || eventName === 'subscription_cancelled') {
    const userId = event.meta?.custom_data?.user_id
    if (userId) await supabase.from('profiles').update({ subscription_tier: 'free' }).eq('id', userId)
  }

  return NextResponse.json({ ok: true })
}
