import type { Lesson } from '../types'
import { PERIOD_TABLE } from './constants'

function formatICSDate(date: Date): string {
	const pad = (n: number) => n.toString().padStart(2, '0')
	return (
		date.getFullYear().toString() +
		pad(date.getMonth() + 1) +
		pad(date.getDate()) +
		'T' +
		pad(date.getHours()) +
		pad(date.getMinutes()) +
		pad(date.getSeconds())
	)
}

function getLessonTime(baseDate: Date, startPeriod: string, endPeriod: string): [Date, Date] {
	const start = new Date(baseDate)
	const startConf = PERIOD_TABLE[startPeriod] || [8, 0]
	const [startHour, startMinute] = startConf
	start.setHours(startHour, startMinute, 0, 0)

	const end = new Date(baseDate)
	const endConf = PERIOD_TABLE[endPeriod] || [17, 0]
	const [endHour, endMinute] = endConf
	// Each period is 50 minutes long. The end period defines the start of the last slot.
	// So we add 50 minutes to the start time of the end period.
	end.setHours(endHour, endMinute + 50, 0, 0)

	return [start, end]
}

export function generateICS(lessons: Lesson[], semesterStart: string, semesterEnd: string): string {
	const now = new Date()
	const stamp = formatICSDate(now) + 'Z'

	// Parse semester start/end
	const [startY, startM, startD] = semesterStart.split('-').map(Number)
	const startDate = new Date(startY, startM - 1, startD)

	const [endY, endM, endD] = semesterEnd.split('-').map(Number)
	const endDate = new Date(endY, endM - 1, endD)
	// Set end date to end of day
	endDate.setHours(23, 59, 59)

	// RRULE UNTIL date must be in UTC
	// We use the end of the semester day in local time, converted to UTC string for ICS
	const untilStr =
		endDate.getUTCFullYear().toString() +
		String(endDate.getUTCMonth() + 1).padStart(2, '0') +
		String(endDate.getUTCDate()).padStart(2, '0') +
		'T' +
		String(endDate.getUTCHours()).padStart(2, '0') +
		String(endDate.getUTCMinutes()).padStart(2, '0') +
		String(endDate.getUTCSeconds()).padStart(2, '0') +
		'Z'

	const events: string[] = []

	lessons.forEach(lesson => {
		// Calculate the first occurrence of this lesson
		// Lesson.day: 0 = Mon, 1 = Tue, ..., 6 = Sun
		// JS Date.getDay(): 0 = Sun, 1 = Mon, ..., 6 = Sat

		// Map Lesson.day to JS day
		const targetDay = lesson.day === 6 ? 0 : lesson.day + 1

		// Clone startDate to find first occurrence
		const firstOccurrence = new Date(startDate)
		const currentDay = firstOccurrence.getDay()

		let diff = targetDay - currentDay
		if (diff < 0) {
			diff += 7
		}
		firstOccurrence.setDate(firstOccurrence.getDate() + diff)

		// Check if first occurrence is after semester end
		if (firstOccurrence > endDate) return

		const [start, end] = getLessonTime(firstOccurrence, lesson.startPeriod, lesson.endPeriod)

		// Create unique UID for event
		const uid = `${lesson.id}-${stamp}@timetable.app`

		const eventLines = [
			'BEGIN:VEVENT',
			`UID:${uid}`,
			`DTSTAMP:${stamp}`,
			`DTSTART:${formatICSDate(start)}`,
			`DTEND:${formatICSDate(end)}`,
			`SUMMARY:${lesson.name}`,
			`LOCATION:${lesson.location}`,
			`RRULE:FREQ=WEEKLY;UNTIL=${untilStr}`,
			'END:VEVENT',
		]

		events.push(eventLines.join('\r\n'))
	})

	return [
		'BEGIN:VCALENDAR',
		'VERSION:2.0',
		'PRODID:-//Timetable//EN',
		'CALSCALE:GREGORIAN',
		...events,
		'END:VCALENDAR',
	].join('\r\n')
}
