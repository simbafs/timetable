import type { APIRoute } from 'astro'
import { google } from 'googleapis'
import { addLessonEvent, createWeekNumbers, findCalendarByName, type Semester } from '../../services/googleCalendar'
import { DEFAULT_SCHOOL_ID, getPeriodTable, getSchoolConfig } from '../../utils/config'

export const prerender = false

interface RequestBody {
	semester: [number, number, number, number, number, number]
	calendar: string
	lessons: [string, string, number | string, string, string][]
	includeWeekNumbers?: boolean
	school?: string
}

export const POST: APIRoute = async ({ request }) => {
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
			const oauth2Client = new google.auth.OAuth2()
			oauth2Client.setCredentials({ access_token: accessToken })

			const data = (await request.json()) as RequestBody

			// Construct dates using 12:00 to avoid timezone rollovers when getting Y/M/D
			const semester: Semester = {
				start: new Date(data.semester[0], data.semester[1], data.semester[2], 12, 0, 0),
				end: new Date(data.semester[3], data.semester[4], data.semester[5], 12, 0, 0),
			}

			const calendarId = await findCalendarByName(oauth2Client, data.calendar)

			const schoolId = data.school || DEFAULT_SCHOOL_ID
			const config = getSchoolConfig(schoolId)
			if (!config) {
				return new Response(JSON.stringify({ error: 'Invalid school ID' }), {
					status: 400,
					headers: { 'Content-Type': 'application/json' },
				})
			}
			const periodTable = getPeriodTable(config)

			for (const item of data.lessons) {
				const [name, location, dow, start, end] = item
				const dayOfWeek = typeof dow === 'string' ? parseInt(dow, 10) : dow
				const startPeriod = String(start)
				const endPeriod = String(end)

				await addLessonEvent(
					oauth2Client,
					calendarId,
					semester,
					name,
					location,
					dayOfWeek,
					startPeriod,
					endPeriod,
					periodTable,
				)
			}

			if (data.includeWeekNumbers !== false) {
				await createWeekNumbers(oauth2Client, calendarId, semester.start, semester.end)
			}

			return new Response(JSON.stringify({ success: true }), {
				status: 200,
				headers: { 'Content-Type': 'application/json' },
			})
		}

		return new Response(JSON.stringify({ error: 'API disabled in test mode' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		})
	} catch (error) {
		console.error(error)
		return new Response(JSON.stringify({ error: String(error) }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		})
	}
}
