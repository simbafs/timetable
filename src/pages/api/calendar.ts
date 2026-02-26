import type { APIRoute } from 'astro'
import { OAuth2Client } from 'google-auth-library'
import {
	addLessonEvent,
	createWeekNumbers,
	getOrCreateCalendarByName,
	type Semester,
} from '../../services/googleCalendar'
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
	const disableAuth = import.meta.env.DISABLE_AUTH === 'true' || process.env.DISABLE_AUTH === 'true'

	if (disableAuth) {
		return new Response(JSON.stringify({ error: 'API disabled in test mode' }), {
			status: 403,
			headers: { 'Content-Type': 'application/json' },
		})
	}

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

	let data: RequestBody
	try {
		data = (await request.json()) as RequestBody
	} catch (e) {
		return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
			status: 400,
			headers: { 'Content-Type': 'application/json' },
		})
	}

	const stream = new ReadableStream({
		async start(controller) {
			const encoder = new TextEncoder()
			const send = (data: any) => controller.enqueue(encoder.encode(JSON.stringify(data) + '\n'))

			try {
				send({ type: 'progress', percent: 5, message: '初始化日曆...' })

				const totalSteps = data.lessons.length + (data.includeWeekNumbers !== false ? 1 : 0)
				let completedSteps = 0

				const semester: Semester = {
					start: new Date(data.semester[0], data.semester[1], data.semester[2], 12, 0, 0),
					end: new Date(data.semester[3], data.semester[4], data.semester[5], 12, 0, 0),
				}

				send({ type: 'progress', percent: 10, message: '正在建立日曆...' })
				const calendarId = await getOrCreateCalendarByName(oauth2Client, data.calendar)

				const schoolId = data.school || DEFAULT_SCHOOL_ID
				const config = getSchoolConfig(schoolId)
				if (!config) {
					send({ type: 'error', message: 'Invalid school ID' })
					controller.close()
					return
				}
				const periodTable = getPeriodTable(config)

				for (const item of data.lessons) {
					const [name, location, dow, start, end] = item
					const dayOfWeek = typeof dow === 'string' ? parseInt(dow, 10) : dow
					const startPeriod = String(start)
					const endPeriod = String(end)

					completedSteps++
					// Scale 10-90%
					const percent = 10 + Math.round((completedSteps / totalSteps) * 80)
					send({ type: 'progress', percent, message: `正在加入課程：${name}` })

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
					send({ type: 'progress', percent: 95, message: '正在加入週次...' })
					await createWeekNumbers(oauth2Client, calendarId, semester.start, semester.end)
				}

				send({ type: 'progress', percent: 100, message: '完成！' })
				send({ type: 'complete' })
				controller.close()
			} catch (error) {
				console.error(error)
				send({ type: 'error', message: String(error) })
				controller.close()
			}
		},
	})

	return new Response(stream, {
		headers: {
			'Content-Type': 'application/x-ndjson',
			'Cache-Control': 'no-cache',
			Connection: 'keep-alive',
		},
	})
}
