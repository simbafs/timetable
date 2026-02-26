import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'

export const prerender = false

export const GET: APIRoute = async ({ request, redirect, locals }) => {
	const url = new URL(request.url)
	const code = url.searchParams.get('code')

	if (!code) {
		return new Response('Missing code', { status: 400 })
	}

	if (url.hostname === 'timetable.simbafs.cc') {
		url.protocol = 'https:'
	}
	const origin = url.origin
	// Construct the same redirect_uri used in the initial request
	const redirect_uri = `${origin}/api/auth/callback`

	// Get env vars from import.meta.env (build-time) or locals.runtime.env (Cloudflare runtime)
	const runtime = (locals as any)?.runtime
	const env = (runtime?.env as any) || {}

	const clientId =
		import.meta.env.PUBLIC_GOOGLE_CLIENT_ID ||
		env.PUBLIC_GOOGLE_CLIENT_ID ||
		(typeof process !== 'undefined' ? process.env.PUBLIC_GOOGLE_CLIENT_ID : undefined)
	const clientSecret =
		import.meta.env.GOOGLE_CLIENT_SECRET ||
		env.GOOGLE_CLIENT_SECRET ||
		(typeof process !== 'undefined' ? process.env.GOOGLE_CLIENT_SECRET : undefined)

	if (!clientId || !clientSecret) {
		console.error('Missing env vars:', { clientId: !!clientId, clientSecret: !!clientSecret })
		return new Response('Missing PUBLIC_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET', { status: 500 })
	}

	const oauth2Client = new OAuth2Client(clientId, clientSecret, redirect_uri)

	try {
		const { tokens } = await oauth2Client.getToken({
			code,
			redirect_uri,
		})
		oauth2Client.setCredentials(tokens)

		// Redirect to home with the access token in the hash
		// This matches what the frontend expects
		const params = new URLSearchParams()
		if (tokens.access_token) params.set('access_token', tokens.access_token)
		if (tokens.id_token) params.set('id_token', tokens.id_token)

		const redirectUrl = `${origin}/#${params.toString()}`
		console.log('Login successful, redirecting to:', redirectUrl)
		return redirect(redirectUrl)
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		return new Response('Authentication failed', { status: 500 })
	}
}
