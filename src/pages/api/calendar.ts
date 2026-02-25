import type { APIRoute } from 'astro'
import { type Auth, google } from 'googleapis'
import { PERIOD_TABLE } from '../../utils/constants'

export const prerender = false

function getLessonTime(day: Date, start: string, end: string): [Date, Date] {
	const baseDate = new Date(day)
	baseDate.setMinutes(0)
	baseDate.setSeconds(0)
	baseDate.setMilliseconds(0)

	const startDate = new Date(baseDate)
	const startTable = PERIOD_TABLE[start] || [0, 0]
	startDate.setHours(startTable[0])
	startDate.setMinutes(startTable[1])

	const endDate = new Date(baseDate)
	const endTable = PERIOD_TABLE[end] || [0, 0]
	endDate.setHours(endTable[0])
	endDate.setMinutes(endTable[1] + 50)

	return [startDate, endDate]
}

function setDayOfWeek(day: Date, dow: number): Date {
	const d = new Date(day)
	d.setDate(d.getDate() - d.getDay() + dow)
	return d
}

interface Semester {
	start: Date
	end: Date
}

async function addLessonEvent(
	auth: Auth.OAuth2Client,
	calendarId: string,
	semester: Semester,
	name: string,
	location: string,
	dow: number,
	start: string,
	end: string,
) {
	const startDateBase = setDayOfWeek(new Date(semester.start), dow)
	const [startDate, endDate] = getLessonTime(startDateBase, start, end)

	const calendar = google.calendar({ version: 'v3', auth })

	const recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${semester.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`]

	await calendar.events.insert({
		calendarId,
		requestBody: {
			summary: name,
			location,
			start: { dateTime: startDate.toISOString() },
			end: { dateTime: endDate.toISOString() },
			recurrence,
		},
	})
}

async function createWeekNumbers(auth: Auth.OAuth2Client, calendarId: string, start: Date) {
	const d = new Date(start)
	const calendar = google.calendar({ version: 'v3', auth })

	for (let i = 1; i <= 18; i++) {
		const s = setDayOfWeek(new Date(d), 1)
		const e = setDayOfWeek(new Date(d), 5)
		e.setHours(23)
		e.setMinutes(59)
		e.setSeconds(59)

		await calendar.events.insert({
			calendarId,
			requestBody: {
				summary: `第 ${i} 周`,
				start: { dateTime: s.toISOString() },
				end: { dateTime: e.toISOString() },
			},
		})

		d.setDate(d.getDate() + 7)
	}
}

async function findCalendarByName(auth: Auth.OAuth2Client, name: string): Promise<string> {
	const calendar = google.calendar({ version: 'v3', auth })
	const res = await calendar.calendarList.list()
	const calendars = res.data.items || []
	return calendars.find(c => c.summary === name)?.id || 'primary'
}

interface RequestBody {
	semester: [number, number, number, number, number, number] // startYear, startMonth, startDay, endYear, endMonth, endDay
	calendar: string
	lessons: [string, string, number | string, string, string][] // [name, location, dow, start, end]
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
			const semester: Semester = {
				start: new Date(data.semester[0], data.semester[1], data.semester[2]),
				end: new Date(data.semester[3], data.semester[4], data.semester[5]),
			}

			const calendarId = await findCalendarByName(oauth2Client, data.calendar)

			for (const item of data.lessons) {
				const [name, location, dow, start, end] = item
				// Ensure dow is parsed as integer if it comes as string
				const dayOfWeek = typeof dow === 'string' ? parseInt(dow, 10) : dow
				// Ensure start and end are strings
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
				)
			}

			await createWeekNumbers(oauth2Client, calendarId, semester.start)

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
