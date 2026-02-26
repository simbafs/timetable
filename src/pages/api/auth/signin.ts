import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'

export const prerender = false

export const GET: APIRoute = async ({ request, redirect }) => {
	const url = new URL(request.url)
	if (url.hostname === 'timetable.simbafs.cc') {
		url.protocol = 'https:'
	}
	const origin = url.origin
	const redirect_uri = `${origin}/api/auth/callback`

	const clientId = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID || process.env.PUBLIC_GOOGLE_CLIENT_ID
	const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET

	if (!clientId || !clientSecret) {
		console.error('Missing env vars:', { clientId: !!clientId, clientSecret: !!clientSecret })
		return new Response('Missing PUBLIC_GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET', { status: 500 })
	}

	const oauth2Client = new OAuth2Client(clientId, clientSecret, redirect_uri)

	const scopes = [
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/userinfo.profile',
		'https://www.googleapis.com/auth/userinfo.email',
		'openid',
	]

	const authUrl = oauth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: scopes,
		include_granted_scopes: true,
		redirect_uri,
	})

	return redirect(authUrl)
}
