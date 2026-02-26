import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'

export const prerender = false

export const GET: APIRoute = async ({ request, redirect }) => {
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

	const clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || process.env.PUBLIC_GOOGLE_CLIENT_ID
	const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

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

		return redirect(`${origin}/#${params.toString()}`)
	} catch (error) {
		console.error('Error exchanging code for token:', error)
		return new Response('Authentication failed', { status: 500 })
	}
}
