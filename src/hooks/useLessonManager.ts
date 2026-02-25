import { useCallback, useEffect, useState } from 'react'
import type { Lesson } from '../types'
import { COLORS } from '../utils/constants'

interface UseLessonManagerProps {
	initialLessons?: Lesson[]
	onLessonsChange?: (lessons: Lesson[]) => void
	periodOrder: string[]
}

export function useLessonManager({ initialLessons, onLessonsChange, periodOrder }: UseLessonManagerProps) {
	const [lessons, setLessons] = useState<Lesson[]>([])

	useEffect(() => {
		if (initialLessons) {
			setLessons(initialLessons)
		}
	}, [initialLessons])

	const updateLessons = (newLessons: Lesson[]) => {
		setLessons(newLessons)
		onLessonsChange?.(newLessons)
	}

	const checkCollision = useCallback(
		(day: number, startPeriod: string, endPeriod: string, excludeId?: string) => {
			const startIdx = periodOrder.indexOf(startPeriod)
			const endIdx = periodOrder.indexOf(endPeriod)

			return lessons.some(l => {
				if (excludeId && l.id === excludeId) return false
				if (l.day !== day) return false
				const lStartIdx = periodOrder.indexOf(l.startPeriod)
				const lEndIdx = periodOrder.indexOf(l.endPeriod)
				return startIdx <= lEndIdx && endIdx >= lStartIdx
			})
		},
		[lessons, periodOrder],
	)

	const addLesson = (
		name: string,
		location: string,
		color: string,
		day: number,
		startPeriod: string,
		endPeriod: string,
	) => {
		const startIdx = periodOrder.indexOf(startPeriod)
		const endIdx = periodOrder.indexOf(endPeriod)
		// Ensure correct order
		const realStartPeriod = periodOrder[Math.min(startIdx, endIdx)]
		const realEndPeriod = periodOrder[Math.max(startIdx, endIdx)]

		if (checkCollision(day, realStartPeriod, realEndPeriod)) {
			return false
		}

		const lesson: Lesson = {
			id: crypto.randomUUID(),
			name,
			location,
			day,
			startPeriod: realStartPeriod,
			endPeriod: realEndPeriod,
			color: color || COLORS[Math.floor(Math.random() * COLORS.length)],
		}

		const newLessons = [...lessons, lesson]
		updateLessons(newLessons)
		return true
	}

	const updateLesson = (id: string, name: string, location: string, color: string) => {
		const editingLesson = lessons.find(l => l.id === id)
		if (!editingLesson) return false

		if (checkCollision(editingLesson.day, editingLesson.startPeriod, editingLesson.endPeriod, id)) {
			return false
		}

		const newLessons = lessons.map(l => (l.id === id ? { ...l, name, location, color } : l))
		updateLessons(newLessons)
		return true
	}

	const deleteLesson = (id: string) => {
		const newLessons = lessons.filter(l => l.id !== id)
		updateLessons(newLessons)
	}

	const getStableColorIndex = (id: string) => {
		let hash = 0
		for (let i = 0; i < id.length; i++) {
			hash = id.charCodeAt(i) + ((hash << 5) - hash)
		}
		return Math.abs(hash) % COLORS.length
	}

	return {
		lessons,
		checkCollision,
		addLesson,
		updateLesson,
		deleteLesson,
		getStableColorIndex,
	}
}
