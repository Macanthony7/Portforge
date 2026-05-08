import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const VARIANT_IDS = {
  pro: process.env.LEMONSQUEEZY_PRO_VARIANT_ID!,
  audit: process.env.LEMONSQUEEZY_AUDIT_VARIANT_ID!,
}

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json() as { plan: 'pro' | 'audit' }
  const variantId = VARIANT_IDS[plan]
  if (!variantId) return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })

  const { data: profile } = await supabase
    .from('profiles').select('email, full_name').eq('id', user.id).single()

  const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
    method: 'POST',
    headers: {
      'Accept': 'application/vnd.api+json',
      'Content-Type': 'application/vnd.api+json',
      'Authorization': `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify({
      data: {
        type: 'checkouts',
        attributes: {
          checkout_data: {
            email: profile?.email || user.email,
            name: profile?.full_name || '',
            custom: { user_id: user.id },
          },
          product_options: {
            redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?upgraded=true`,
          },
        },
        relationships: {
          store: { data: { type: 'stores', id: process.env.LEMONSQUEEZY_STORE_ID } },
          variant: { data: { type: 'variants', id: variantId } },
        },
      },
    }),
  })

  if (!response.ok) {
    console.error('LemonSqueezy error:', await response.text())
    return NextResponse.json({ error: 'Failed to create checkout' }, { status: 500 })
  }

  const data = await response.json()
  return NextResponse.json({ url: data.data?.attributes?.url })
}
