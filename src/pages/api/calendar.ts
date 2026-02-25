import type { APIRoute } from 'astro'
import { type Auth, google } from 'googleapis'
import { DEFAULT_SCHOOL_ID, getPeriodTable, getSchoolConfig } from '../../utils/config'

export const prerender = false

const TIMEZONE = 'Asia/Taipei'
const TIMEZONE_OFFSET = '+08:00'

function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

function formatDateTime(date: Date, hours: number, minutes: number): string {
	const dateStr = formatDate(date)
	const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
	return `${dateStr}T${timeStr}${TIMEZONE_OFFSET}`
}

function getLessonTime(
	day: Date,
	start: string,
	end: string,
	periodTable: Record<string, [number, number]>,
): [string, string] {
	const startTable = periodTable[start] || [0, 0]
	const startTime = formatDateTime(day, startTable[0], startTable[1])

	const endTable = periodTable[end] || [0, 0]
	let endHours = endTable[0]
	let endMinutes = endTable[1] + 50
	if (endMinutes >= 60) {
		endHours += Math.floor(endMinutes / 60)
		endMinutes %= 60
	}

	const endTime = formatDateTime(day, endHours, endMinutes)

	return [startTime, endTime]
}

function setDayOfWeek(day: Date, dow: number): Date {
	const d = new Date(day)
	const currentDay = d.getDay()
	// JS getDay(): 0=Sun, 1=Mon
	// dow input: 1=Mon ... 5=Fri ...
	// If dow=1 (Mon) and current=0 (Sun), diff = 1 - 0 = 1. Sun -> Mon (next day).
	// If dow=1 (Mon) and current=1 (Mon), diff = 0.
	// If dow=1 (Mon) and current=2 (Tue), diff = -1. Tue -> Mon (prev day).

	// BUT, usually "setDayOfWeek" implies "set to the Monday of THIS week".
	// If today is Sun (0), is that "end of previous week" or "start of new week"?
	// Standard ISO week starts on Monday.
	// If today is Sun (0), and we want Mon (1).
	// If we treat Sun as 7: 1 - 7 = -6. Sun -> Mon (6 days ago).

	// Let's assume input 'day' is always the Monday of the week (since semester start is usually Monday).
	// But let's be robust.
	// If we assume Sunday is 7:
	const currentDayAdjusted = currentDay === 0 ? 7 : currentDay
	const diff = dow - currentDayAdjusted
	d.setDate(d.getDate() + diff)
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
	periodTable: Record<string, [number, number]>,
) {
	// Calculate the first occurrence date based on semester start (which is usually Mon)
	const startDateBase = setDayOfWeek(new Date(semester.start), dow)
	const [startDateTime, endDateTime] = getLessonTime(startDateBase, start, end, periodTable)

	const calendar = google.calendar({ version: 'v3', auth })

	// UNTIL must be UTC.
	// We convert semester.end (local Date) to UTC string roughly covering the end of that day.
	const untilDate = new Date(semester.end)
	// Add 1 day to be safe and cover the full end day in any timezone
	untilDate.setDate(untilDate.getDate() + 1)
	const untilStr = untilDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'

	const recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`]

	await calendar.events.insert({
		calendarId,
		requestBody: {
			summary: name,
			location,
			start: { dateTime: startDateTime, timeZone: TIMEZONE },
			end: { dateTime: endDateTime, timeZone: TIMEZONE },
			recurrence,
		},
	})
}

async function createWeekNumbers(auth: Auth.OAuth2Client, calendarId: string, start: Date, end: Date) {
	const d = new Date(start)
	const calendar = google.calendar({ version: 'v3', auth })

	let i = 1
	while (true) {
		const sDate = setDayOfWeek(new Date(d), 1) // Mon
		const eDate = setDayOfWeek(new Date(d), 5) // Fri

		// If the start of the week is after the semester end, stop
		if (sDate > end) break

		// Set end time to end of Friday
		const startStr = formatDateTime(sDate, 0, 0)
		const endStr = formatDateTime(eDate, 23, 59)

		await calendar.events.insert({
			calendarId,
			requestBody: {
				summary: `第 ${i} 周`,
				start: { dateTime: startStr, timeZone: TIMEZONE },
				end: { dateTime: endStr, timeZone: TIMEZONE },
			},
		})

		d.setDate(d.getDate() + 7)
		i++
	}
}

async function findCalendarByName(auth: Auth.OAuth2Client, name: string): Promise<string> {
	const calendar = google.calendar({ version: 'v3', auth })
	const res = await calendar.calendarList.list()
	const calendars = res.data.items || []
	return calendars.find(c => c.summary === name)?.id || 'primary'
}

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
