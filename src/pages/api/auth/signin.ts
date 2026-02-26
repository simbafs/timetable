import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'

export const prerender = false

export const GET: APIRoute = async ({ request, redirect, locals }) => {
	const url = new URL(request.url)
	if (url.hostname === 'timetable.simbafs.cc') {
		url.protocol = 'https:'
	}
	const origin = url.origin
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

	console.log('Redirecting to auth URL:', authUrl)

	return redirect(authUrl)
}
