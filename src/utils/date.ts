const TIMEZONE_OFFSET = '+08:00'

export function formatDate(date: Date): string {
	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${year}-${month}-${day}`
}

export function formatDateTime(date: Date, hours: number, minutes: number): string {
	const dateStr = formatDate(date)
	const timeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`
	return `${dateStr}T${timeStr}${TIMEZONE_OFFSET}`
}

export function setDayOfWeek(day: Date, dow: number): Date {
	const d = new Date(day)
	const currentDay = d.getDay()
	// JS getDay(): 0=Sun, 1=Mon
	// dow input: 1=Mon ... 5=Fri ...
	const currentDayAdjusted = currentDay === 0 ? 7 : currentDay
	const diff = dow - currentDayAdjusted
	d.setDate(d.getDate() + diff)
	return d
}

export function getLessonTime(
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
