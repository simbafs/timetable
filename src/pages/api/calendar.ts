import { google } from 'googleapis'

export const prerender = false

const PERIOD_TABLE: Record<string, [number, number]> = {
	y: [6, 0],
	z: [7, 0],
	1: [8, 0],
	2: [9, 0],
	3: [10, 10],
	4: [11, 10],
	n: [12, 20],
	5: [13, 20],
	6: [14, 20],
	7: [15, 30],
	8: [16, 30],
	9: [17, 30],
	a: [18, 30],
	b: [19, 30],
	c: [20, 30],
	d: [21, 30],
}

const PERIOD_ORDER = ['y', 'z', '1', '2', '3', '4', 'n', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd']

function getLessonTime(day: Date, start: string, end: string) {
	day.setMinutes(0)
	day.setSeconds(0)
	day.setMilliseconds(0)

	const startDate = new Date(day)
	startDate.setHours(PERIOD_TABLE[start][0])
	startDate.setMinutes(PERIOD_TABLE[start][1])

	const endDate = new Date(day)
	endDate.setHours(PERIOD_TABLE[end][0])
	endDate.setMinutes(PERIOD_TABLE[end][1] + 50)

	return [startDate, endDate]
}

function setDayOfWeek(day, dow) {
	const d = new Date(day)
	d.setDate(parseInt(String(d.getDate())) - parseInt(String(d.getDay())) + parseInt(String(dow)))
	return d
}

async function addLessonEvent(
	auth: any,
	calendarId: string,
	semester: { start: Date; end: Date },
	name: string,
	location: string,
	dow: number,
	start: string,
	end: string,
) {
	const [startDate, endDate] = getLessonTime(setDayOfWeek(new Date(semester.start), dow), start, end)

	const calendar = google.calendar({ version: 'v3', auth })

	const recurrence = [`RRULE:FREQ=WEEKLY;UNTIL=${semester.end.toISOString().replace(/[-:]/g, '').split('.')[0]}Z`]

	await calendar.events.insert({
		calendarId,
		recurringEvent: true,
		requestBody: {
			summary: name,
			location,
			start: { dateTime: startDate.toISOString() },
			end: { dateTime: endDate.toISOString() },
			recurrence,
		},
	})
}

async function createWeekNumbers(auth, calendarId, start) {
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

async function findCalendarByName(auth, name) {
	const calendar = google.calendar({ version: 'v3', auth })
	const res = await calendar.calendarList.list()
	const calendars = res.data.items || []
	return calendars.find(c => c.summary === name)?.id || 'primary'
}

export async function POST({ request }) {
	try {
		const disableAuth = process.env.DISABLE_AUTH === 'true'

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

			const data = await request.json()
			const semester = {
				start: new Date(data.semester[0], data.semester[1], data.semester[2]),
				end: new Date(data.semester[3], data.semester[4], data.semester[5]),
			}

			const calendarId = await findCalendarByName(oauth2Client, data.calendar)

			for (const item of data.lessons) {
				const [name, location, dow, start, end] = item
				await addLessonEvent(oauth2Client, calendarId, semester, name, location, parseInt(dow), start, end)
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
