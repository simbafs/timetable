import type { Lesson } from '../types'

export async function exportToCalendar(
	accessToken: string | null,
	semester: number[],
	calendarName: string,
	lessons: Lesson[],
	includeWeekNumbers: boolean = true,
	school: string = 'nycu',
	onProgress?: (percent: number, message: string) => void,
) {
	const lessonsData = lessons.map(l => [l.name, l.location, String(l.day + 1), l.startPeriod, l.endPeriod])

	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`
	}

	try {
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

		if (!response.ok) {
			const errorData = await response.json()
			return { error: errorData.error || 'Unknown error' }
		}

		if (!response.body) {
			return { error: 'No response body' }
		}

		const reader = response.body.getReader()
		const decoder = new TextDecoder()
		let buffer = ''

		while (true) {
			const { done, value } = await reader.read()
			if (done) break

			buffer += decoder.decode(value, { stream: true })
			const lines = buffer.split('\n')
			buffer = lines.pop() || ''

			for (const line of lines) {
				if (!line.trim()) continue
				try {
					const data = JSON.parse(line)
					if (data.type === 'progress') {
						onProgress?.(data.percent, data.message)
					} else if (data.type === 'complete') {
						return { success: true }
					} else if (data.type === 'error') {
						return { error: data.message }
					}
				} catch (e) {
					console.error('Failed to parse line:', line, e)
				}
			}
		}

		// Process remaining buffer
		if (buffer.trim()) {
			try {
				const data = JSON.parse(buffer)
				if (data.type === 'complete') return { success: true }
				if (data.type === 'error') return { error: data.message }
			} catch (e) {
				// ignore
			}
		}

		return { success: true }
	} catch (e) {
		return { error: String(e) }
	}
}

export async function getCalendars(accessToken: string | null) {
	const headers: Record<string, string> = { 'Content-Type': 'application/json' }
	if (accessToken) {
		headers['Authorization'] = `Bearer ${accessToken}`
	}

	const response = await fetch('/api/calendars', {
		method: 'GET',
		headers,
	})

	return await response.json()
}
