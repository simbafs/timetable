export interface SchoolConfig {
	id: string
	name: string
	semester: string
	dates: {
		start: string
		end: string
	}
	periods: {
		id: string
		label: string
		start: [number, number]
	}[]
}

interface RawSchoolConfig {
	name: string
	time: Record<string, string>
	semester: Record<string, string>
}

// Load all yaml files from ../data/
const rawConfigs = import.meta.glob('../data/*.yaml', { eager: true }) as Record<string, { default: RawSchoolConfig }>

export const SCHOOLS: SchoolConfig[] = Object.entries(rawConfigs).map(([path, mod]) => {
	const raw = mod.default
	const id = path.split('/').pop()?.replace('.yaml', '') || ''

	// Parse semester: find the latest one (lexicographically last key)
	const semesterKeys = Object.keys(raw.semester).sort()
	const latestSemester = semesterKeys[semesterKeys.length - 1]
	const dateRange = raw.semester[latestSemester]
	const [startDateRaw, endDateRaw] = dateRange.split('-')
	const dates = {
		start: startDateRaw.replace(/\//g, '-'),
		end: endDateRaw.replace(/\//g, '-'),
	}

	// Parse periods
	const periods = Object.entries(raw.time)
		.map(([periodId, timeStr]) => {
			// timeStr format: "0800-0850"
			const [startStr, endStr] = timeStr.split('-')
			const startHour = parseInt(startStr.slice(0, 2), 10)
			const startMinute = parseInt(startStr.slice(2), 10)

			const endHour = parseInt(endStr.slice(0, 2), 10)
			const endMinute = parseInt(endStr.slice(2), 10)

			const formatTime = (h: number, m: number) =>
				`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`

			return {
				id: periodId,
				label: `${formatTime(startHour, startMinute)}-${formatTime(endHour, endMinute)}`,
				start: [startHour, startMinute] as [number, number],
			}
		})
		.sort((a, b) => {
			if (a.start[0] !== b.start[0]) return a.start[0] - b.start[0]
			return a.start[1] - b.start[1]
		})

	return {
		id,
		name: raw.name,
		semester: latestSemester,
		dates,
		periods,
	}
})

export const DEFAULT_SCHOOL_ID = 'nycu'

export function getSchoolConfig(id: string): SchoolConfig | undefined {
	return SCHOOLS.find(s => s.id === id)
}

export function getPeriodTable(config: SchoolConfig): Record<string, [number, number]> {
	const table: Record<string, [number, number]> = {}
	config.periods.forEach(p => {
		table[p.id] = p.start
	})
	return table
}

export function getPeriodLabels(config: SchoolConfig): Record<string, string> {
	const labels: Record<string, string> = {}
	config.periods.forEach(p => {
		labels[p.id] = p.label
	})
	return labels
}

export function getPeriodOrder(config: SchoolConfig): string[] {
	return config.periods.map(p => p.id)
}
