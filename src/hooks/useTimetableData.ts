import { useEffect, useState } from 'react'
import type { Lesson } from '../types'

export function useTimetableData() {
	const [lessons, setLessons] = useState<Lesson[]>([])

	useEffect(() => {
		// Load lessons from localStorage on mount
		const storedLessons = localStorage.getItem('timetable_lessons')
		if (storedLessons) {
			try {
				setLessons(JSON.parse(storedLessons))
			} catch (e) {
				console.error('Failed to parse lessons from localStorage', e)
			}
		}
	}, [])

	const updateLessons = (newLessons: Lesson[]) => {
		setLessons(newLessons)
		localStorage.setItem('timetable_lessons', JSON.stringify(newLessons))
	}

	return {
		lessons,
		setLessons: updateLessons,
	}
}
