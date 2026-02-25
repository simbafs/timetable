import type { Lesson } from '../types'

export async function exportToCalendar(
	accessToken: string | null,
	semester: number[],
	calendarName: string,
	lessons: Lesson[],
	includeWeekNumbers: boolean = true,
	school: string = 'nycu',
) {
	const lessonsData = lessons.map(l => [l.name, l.location, String(l.day + 1), l.startPeriod, l.endPeriod])

	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`
	}

	const response = await fetch('/api/calendar', {
		method: 'POST',
		headers,
		body: JSON.stringify({
			semester,
			calendar: calendarName,
			lessons: lessonsData,
			includeWeekNumbers,
			school,
		}),
	})

	return await response.json()
}
