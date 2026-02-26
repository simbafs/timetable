import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'
import { listCalendars } from '../../services/googleCalendar'

export const prerender = false

export const GET: APIRoute = async ({ request }) => {
	try {
		const disableAuth = import.meta.env.DISABLE_AUTH === 'true' || process.env.DISABLE_AUTH === 'true'

		if (!disableAuth) {
			const authHeader = request.headers.get('Authorization')
			if (!authHeader?.startsWith('Bearer ')) {
				return new Response(JSON.stringify({ error: 'Unauthorized' }), {
					status: 401,
					headers: { 'Content-Type': 'application/json' },
				})
			}

			const accessToken = authHeader.substring(7)
			const oauth2Client = new OAuth2Client()
			oauth2Client.setCredentials({ access_token: accessToken })

			const calendars = await listCalendars(oauth2Client)

			return new Response(JSON.stringify({ calendars }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		// Mock data for test mode
		return new Response(
			JSON.stringify({
				calendars: [
					{ id: 'primary', summary: 'Primary', primary: true },
					{ id: 'cal1', summary: 'School' },
				],
			}),
			{
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			},
		)
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
