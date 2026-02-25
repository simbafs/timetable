import { useCallback, useEffect, useState } from 'react'
import { useLessonManager } from '../hooks/useLessonManager'
import { useTimetableDrag } from '../hooks/useTimetableDrag'
import type { Lesson } from '../types'
import { getPeriodLabels, getPeriodOrder, type SchoolConfig } from '../utils/config'
import { COLORS, DAY_LABELS } from '../utils/constants'
import LessonModal from './LessonModal'

interface TimetableGridProps {
	lessons?: Lesson[]
	onLessonsChange?: (lessons: Lesson[]) => void
	readOnly?: boolean
	schoolConfig: SchoolConfig
}

export default function TimetableGrid({
	lessons: initialLessons,
	onLessonsChange,
	readOnly = false,
	schoolConfig,
}: TimetableGridProps) {
	const PERIOD_ORDER = getPeriodOrder(schoolConfig)
	const PERIOD_LABELS = getPeriodLabels(schoolConfig)

	const { lessons, checkCollision, addLesson, updateLesson, deleteLesson, getStableColorIndex } = useLessonManager({
		initialLessons,
		onLessonsChange,
		periodOrder: PERIOD_ORDER,
	})

	const [isModalOpen, setIsModalOpen] = useState(false)
	const [newLesson, setNewLesson] = useState({ name: '', location: '', color: '' })
	const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
	const [collisionError, setCollisionError] = useState(false)
	const [dragSelection, setDragSelection] = useState<{ day: number; start: string; end: string } | null>(null)

	const handleDragComplete = useCallback(
		(day: number, startPeriod: string, endPeriod: string) => {
			if (!checkCollision(day, startPeriod, endPeriod)) {
				setNewLesson({
					name: '',
					location: '',
					color: COLORS[Math.floor(Math.random() * COLORS.length)],
				})
				setDragSelection({ day, start: startPeriod, end: endPeriod })
				setEditingLessonId(null)
				setIsModalOpen(true)
			} else {
				// Reset drag selection if collision
				setDragSelection(null)
			}
		},
		[checkCollision],
	)

	const {
		isDragging,
		dragStart,
		dragEnd,
		setDragStart,
		setDragEnd,
		handleMouseDown,
		handleMouseOver,
		handleMouseUp,
		selection,
	} = useTimetableDrag({
		readOnly,
		periodOrder: PERIOD_ORDER,
		onDragComplete: handleDragComplete,
	})

	// When modal closes, clear drag selection
	const handleCloseModal = () => {
		setIsModalOpen(false)
		setNewLesson({ name: '', location: '', color: '' })
		setDragStart(null)
		setDragEnd(null)
		setDragSelection(null)
		setEditingLessonId(null)
		setCollisionError(false)
	}

	const handleAddLessonConfirm = () => {
		if (readOnly || !newLesson.name) return

		if (editingLessonId) {
			const success = updateLesson(editingLessonId, newLesson.name, newLesson.location, newLesson.color)
			if (!success) {
				setCollisionError(true)
				return
			}
		} else {
			if (!dragSelection) return

			const success = addLesson(
				newLesson.name,
				newLesson.location,
				newLesson.color,
				dragSelection.day,
				dragSelection.start,
				dragSelection.end,
			)

			if (!success) {
				setCollisionError(true)
				return
			}
		}

		handleCloseModal()
	}

	const handleDeleteLessonConfirm = (id: string) => {
		if (readOnly) return
		deleteLesson(id)
		handleCloseModal()
	}

	const getLessonStyle = (lesson: Lesson) => {
		const startIdx = PERIOD_ORDER.indexOf(lesson.startPeriod)
		const endIdx = PERIOD_ORDER.indexOf(lesson.endPeriod)
		const height = (endIdx - startIdx + 1) * 41 - 1
		const top = startIdx * 41

		// Grid has 8 columns (85px sidebar + 7 days) and 7 gaps of 1px
		// Total available width for 7 days = 100% - 85px (sidebar) - 7px (gaps)
		// Single day width = (100% - 92px) / 7
		//
		// Left position calculation:
		// Base offset = 85px (sidebar) + 1px (first gap) = 86px
		// Stride per day = day width + 1px gap = (100% - 92px)/7 + 1px = (100% - 85px)/7

		return {
			top: `${top}px`,
			height: `${height}px`,
			left: `calc(86px + ((100% - 85px) / 7) * ${lesson.day})`,
			width: `calc((100% - 92px) / 7)`,
		}
	}

	useEffect(() => {
		// Clear drag selection if modal is closed externally (shouldn't happen but good for safety)
		if (!isModalOpen) {
			setDragStart(null)
			setDragEnd(null)
		}
	}, [isModalOpen, setDragStart, setDragEnd])

	return (
		<div className="overflow-x-auto">
			<div className="min-w-[800px]">
				<div className="grid grid-cols-[85px_repeat(7,1fr)] gap-px bg-zinc-200 border-b border-zinc-200">
					<div className="bg-zinc-50/50 p-2 text-center text-xs font-medium text-zinc-400 border border-zinc-200"></div>
					{DAY_LABELS.map(day => (
						<div
							key={day}
							className="bg-zinc-50/50 p-2 text-center text-xs font-medium text-zinc-500 border border-zinc-200"
						>
							{day}
						</div>
					))}
				</div>

				<div className="relative" onMouseUp={handleMouseUp}>
					{PERIOD_ORDER.map(period => (
						<div key={period} className="grid grid-cols-[85px_repeat(7,1fr)] gap-px bg-zinc-200">
							<div className="flex flex-col h-10 min-w-[85px] items-center justify-center bg-zinc-50/50 font-medium text-zinc-400 border border-zinc-200 leading-none">
								<span className="font-bold text-zinc-600 mb-0.5">{period}</span>
								<span className="text-xs opacity-80">{PERIOD_LABELS[period]}</span>
							</div>
							{Array.from({ length: 7 }).map((_, day) => {
								const cellKey = `${day}-${period}`
								const isSelected = selection.has(cellKey)

								return (
									<div
										key={cellKey}
										className={`timetable-cell relative h-10 min-w-[60px] cursor-pointer border border-zinc-200 transition-colors ${isSelected ? 'bg-emerald-300' : 'bg-white hover:bg-emerald-50'}`}
										onMouseDown={() => handleMouseDown(day, period)}
										onMouseOver={() => handleMouseOver(day, period)}
									/>
								)
							})}
						</div>
					))}

					{lessons.map(lesson => {
						const isCustomColor = lesson.color && !lesson.color.startsWith('bg-')
						const lessonColorClass = !isCustomColor
							? lesson.color || COLORS[getStableColorIndex(lesson.id)]
							: ''

						return (
							<div
								key={lesson.id}
								className={`absolute z-10 flex flex-col items-center justify-center overflow-hidden rounded px-1 py-0.5 font-bold text-white shadow-sm ${lessonColorClass}`}
								style={{
									...getLessonStyle(lesson),
									backgroundColor: isCustomColor ? lesson.color : undefined,
								}}
								onClick={e => {
									if (readOnly) return
									e.stopPropagation()
									setEditingLessonId(lesson.id)
									setNewLesson({
										name: lesson.name,
										location: lesson.location,
										color: lesson.color || COLORS[getStableColorIndex(lesson.id)],
									})
									setCollisionError(false)
									setIsModalOpen(true)
								}}
							>
								<span className="text-xl text-center text-balance">{lesson.name}</span>
								{lesson.location && <span className="text-white/70 text-xl">{lesson.location}</span>}
								{!readOnly && (
									<button
										type="button"
										className="absolute end-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded text-white/70 hover:bg-white/20 hover:text-white"
										onClick={e => {
											e.stopPropagation()
											handleDeleteLessonConfirm(lesson.id)
										}}
									>
										×
									</button>
								)}
							</div>
						)
					})}
				</div>
			</div>

			<LessonModal
				isOpen={isModalOpen}
				onClose={handleCloseModal}
				readOnly={readOnly}
				editingLessonId={editingLessonId}
				newLesson={newLesson}
				onNewLessonChange={setNewLesson}
				collisionError={collisionError}
				setCollisionError={setCollisionError}
				onDelete={handleDeleteLessonConfirm}
				onConfirm={handleAddLessonConfirm}
			/>
		</div>
	)
}
