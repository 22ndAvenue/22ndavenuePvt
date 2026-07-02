import { revalidatePath } from 'next/cache'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createHmac } from 'crypto'

async function parseWebhookBody(request: NextRequest, secret: string): Promise<{ isValidSignature: boolean; body: { _type?: string } | null }> {
  const rawBody = await request.text()
  const signature = request.headers.get('sanity-webhook-signature') || ''
  
  // Sanity signs: "v1=" + timestamp + "." + HMAC-SHA256(secret, ts + "." + body)
  const match = signature.match(/^v1,t=(\d+),v1=([a-f0-9]+)/)
  if (!match) {
    // Fallback: try simple body HMAC (used by some Sanity versions)
    const hmac = createHmac('sha256', secret).update(rawBody).digest('hex')
    const simpleMatch = signature === hmac || signature === `sha256=${hmac}`
    const body = rawBody ? JSON.parse(rawBody) : null
    return { isValidSignature: simpleMatch, body }
  }

  const [, timestamp, receivedHmac] = match
  const expectedHmac = createHmac('sha256', secret)
    .update(`${timestamp}.${rawBody}`)
    .digest('hex')

  const isValidSignature = receivedHmac === expectedHmac
  const body = rawBody ? JSON.parse(rawBody) : null
  return { isValidSignature, body }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const urlSecret = searchParams.get('secret')
    const secret = process.env.SANITY_REVALIDATE_SECRET

    // 1. Allow bypass via query parameter token
    if (urlSecret && secret && urlSecret === secret) {
      revalidatePath('/')
      console.log('[Revalidate] Successfully revalidated homepage via query parameter secret verification.')
      return NextResponse.json({ revalidated: true, method: 'token', now: Date.now() })
    }

    // 2. Otherwise use the standard, secure webhook signature verification
    if (!secret) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Revalidate] SANITY_REVALIDATE_SECRET environment variable is missing. Bypassing validation in development.')
        revalidatePath('/')
        return NextResponse.json({ revalidated: true, devMode: true })
      }
      
      console.error('[Revalidate] SANITY_REVALIDATE_SECRET environment variable is missing.')
      return new Response('Configuration Error: SANITY_REVALIDATE_SECRET is missing', { status: 500 })
    }

    const { isValidSignature, body } = await parseWebhookBody(request, secret)

    if (!isValidSignature) {
      const message = 'Invalid signature'
      console.warn(`[Revalidate] ${message}`)
      return new Response(JSON.stringify({ message, isValidSignature }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!body?._type) {
      return new Response('Bad Request: Missing body or _type', { status: 400 })
    }

    revalidatePath('/')
    
    console.log(`[Revalidate] Successfully revalidated page for type: ${body._type}`)
    return NextResponse.json({ revalidated: true, method: 'signature', now: Date.now(), type: body._type })
  } catch (err: any) {
    console.error('[Revalidate] Error processing webhook:', err)
    return new Response(`Error: ${err.message}`, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const urlSecret = searchParams.get('secret')
  const secret = process.env.SANITY_REVALIDATE_SECRET

  if (process.env.NODE_ENV === 'development' || (secret && urlSecret === secret)) {
    revalidatePath('/')
    console.log('[Revalidate] Successfully revalidated homepage via GET request.')
    return NextResponse.json({ revalidated: true, method: 'GET', now: Date.now() })
  }

  return new Response('Unauthorized', { status: 401 })
}
