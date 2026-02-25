import { type Auth, google } from 'googleapis'
import { formatDateTime, getLessonTime, setDayOfWeek } from '../utils/date'

const TIMEZONE = 'Asia/Taipei'

export interface Semester {
	start: Date
	end: Date
}

export async function addLessonEvent(
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

export async function createWeekNumbers(auth: Auth.OAuth2Client, calendarId: string, start: Date, end: Date) {
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

export async function findCalendarByName(auth: Auth.OAuth2Client, name: string): Promise<string> {
	const calendar = google.calendar({ version: 'v3', auth })
	const res = await calendar.calendarList.list()
	const calendars = res.data.items || []
	return calendars.find(c => c.summary === name)?.id || 'primary'
}
