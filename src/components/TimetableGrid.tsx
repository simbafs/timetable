import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lesson } from '../types'
import { COLORS, DAY_LABELS, PERIOD_LABELS, PERIOD_ORDER } from '../utils/constants'

interface TimetableGridProps {
	lessons?: Lesson[]
	onLessonsChange?: (lessons: Lesson[]) => void
	readOnly?: boolean
}

export default function TimetableGrid({ lessons, onLessonsChange, readOnly = false }: TimetableGridProps) {
	const [internalLessons, setInternalLessons] = useState<Lesson[]>([])
	const modalRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		if (lessons) {
			setInternalLessons(lessons)
		}
	}, [lessons])

	const currentLessons = lessons || internalLessons

	const updateLessons = (newLessons: Lesson[]) => {
		setInternalLessons(newLessons)
		onLessonsChange?.(newLessons)
	}

	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState<{ day: number; period: string } | null>(null)
	const [dragEnd, setDragEnd] = useState<{ day: number; period: string } | null>(null)
	const [newLesson, setNewLesson] = useState({ name: '', location: '' })
	const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
	const [collisionError, setCollisionError] = useState(false)

	useEffect(() => {
		console.log('Timetable changed:', currentLessons)
	}, [currentLessons])

	const handleMouseDown = useCallback(
		(day: number, period: string) => {
			if (readOnly) return
			setIsDragging(true)
			setDragStart({ day, period })
			setDragEnd({ day, period })
		},
		[readOnly],
	)

	const handleMouseOver = useCallback(
		(day: number, period: string) => {
			if (!isDragging || readOnly || !dragStart) return
			// Constrain drag to the same day as start
			setDragEnd({ day: dragStart.day, period })
		},
		[isDragging, readOnly, dragStart],
	)

	const handleMouseUp = useCallback(() => {
		if (readOnly || !isDragging || !dragStart || !dragEnd) return

		if (dragStart.day === dragEnd.day) {
			const startIdx = Math.min(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))
			const endIdx = Math.max(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))

			if (!checkCollision(dragStart.day, PERIOD_ORDER[startIdx], PERIOD_ORDER[endIdx])) {
				modalRef.current?.showModal()
			} else {
				setDragStart(null)
				setDragEnd(null)
			}
		}

		setIsDragging(false)
	}, [isDragging, dragStart, dragEnd])

	const handleAddLesson = () => {
		if (readOnly || !newLesson.name) return

		if (editingLessonId) {
			const editingLesson = currentLessons.find(l => l.id === editingLessonId)
			if (!editingLesson) return

			if (
				checkCollision(editingLesson.day, editingLesson.startPeriod, editingLesson.endPeriod, editingLessonId)
			) {
				setCollisionError(true)
				return
			}

			const newLessons = currentLessons.map(l =>
				l.id === editingLessonId ? { ...l, name: newLesson.name, location: newLesson.location } : l,
			)
			updateLessons(newLessons)
		} else {
			if (!dragStart || !dragEnd) return

			const startIdx = Math.min(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))
			const endIdx = Math.max(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))

			if (checkCollision(dragStart.day, PERIOD_ORDER[startIdx], PERIOD_ORDER[endIdx])) {
				setCollisionError(true)
				return
			}

			const lesson: Lesson = {
				id: crypto.randomUUID(),
				name: newLesson.name,
				location: newLesson.location,
				day: dragStart.day,
				startPeriod: PERIOD_ORDER[startIdx],
				endPeriod: PERIOD_ORDER[endIdx],
			}

			const newLessons = [...currentLessons, lesson]
			updateLessons(newLessons)
		}

		modalRef.current?.close()
		setNewLesson({ name: '', location: '' })
		setDragStart(null)
		setDragEnd(null)
		setEditingLessonId(null)
		setCollisionError(false)
	}

	const handleCloseModal = () => {
		modalRef.current?.close()
		setNewLesson({ name: '', location: '' })
		setDragStart(null)
		setDragEnd(null)
		setEditingLessonId(null)
		setCollisionError(false)
	}

	const handleDeleteLesson = (id: string) => {
		if (readOnly) return
		const newLessons = currentLessons.filter(l => l.id !== id)
		updateLessons(newLessons)
		handleCloseModal()
	}

	const getSelection = () => {
		if (!dragStart || !dragEnd) return new Set<string>()

		const startDay = Math.min(dragStart.day, dragEnd.day)
		const endDay = Math.max(dragStart.day, dragEnd.day)
		const startIdx = Math.min(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))
		const endIdx = Math.max(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))

		const selected = new Set<string>()
		for (let day = startDay; day <= endDay; day++) {
			for (let i = startIdx; i <= endIdx; i++) {
				selected.add(`${day}-${PERIOD_ORDER[i]}`)
			}
		}
		return selected
	}

	const checkCollision = (day: number, startPeriod: string, endPeriod: string, excludeId?: string) => {
		const startIdx = PERIOD_ORDER.indexOf(startPeriod)
		const endIdx = PERIOD_ORDER.indexOf(endPeriod)

		return currentLessons.some(l => {
			if (excludeId && l.id === excludeId) return false
			if (l.day !== day) return false
			const lStartIdx = PERIOD_ORDER.indexOf(l.startPeriod)
			const lEndIdx = PERIOD_ORDER.indexOf(l.endPeriod)
			return startIdx <= lEndIdx && endIdx >= lStartIdx
		})
	}

	const selection = getSelection()

	useEffect(() => {
		const handleGlobalMouseUp = () => {
			if (isDragging) {
				setIsDragging(false)
			}
		}
		window.addEventListener('mouseup', handleGlobalMouseUp)
		return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
	}, [isDragging])

	const getLessonStyle = (lesson: Lesson) => {
		const startIdx = PERIOD_ORDER.indexOf(lesson.startPeriod)
		const endIdx = PERIOD_ORDER.indexOf(lesson.endPeriod)
		const height = (endIdx - startIdx + 1) * 41 - 1
		const top = startIdx * 41

		return {
			top: `${top}px`,
			height: `${height}px`,
			left: `calc(61px + (100% - 67px) / 7 * ${lesson.day})`,
			width: `calc((100% - 67px) / 7)`,
		}
	}

	return (
		<div className="overflow-x-auto">
			<div className="min-w-[800px]">
				<div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-zinc-200 border-b border-zinc-200">
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
						<div key={period} className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-zinc-200">
							<div className="flex h-10 min-w-[60px] items-center justify-center bg-zinc-50/50 text-xs font-medium text-zinc-400 border border-zinc-200">
								{PERIOD_LABELS[period]}
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

					{currentLessons.map((lesson, idx) => (
						<div
							key={lesson.id}
							className={`absolute z-10 flex flex-col items-center justify-center overflow-hidden rounded px-1 py-0.5 font-bold text-white shadow-sm ${COLORS[idx % COLORS.length]}`}
							style={getLessonStyle(lesson)}
							onClick={e => {
								if (readOnly) return
								e.stopPropagation()
								setEditingLessonId(lesson.id)
								setNewLesson({ name: lesson.name, location: lesson.location })
								modalRef.current?.showModal()
							}}
						>
							<span className="text-3xl">{lesson.name}</span>
							{lesson.location && <span className="text-white/70 text-xl">{lesson.location}</span>}
							{!readOnly && (
								<button
									type="button"
									className="absolute end-0.5 top-0.5 hidden h-4 w-4 items-center justify-center rounded text-white/70 hover:bg-white/20 hover:text-white"
									onClick={e => {
										e.stopPropagation()
										handleDeleteLesson(lesson.id)
									}}
								>
									×
								</button>
							)}
						</div>
					))}
				</div>
			</div>

			<dialog
				ref={modalRef}
				className="m-auto backdrop:bg-black/50 p-0 bg-transparent rounded-2xl"
				onClick={e => {
					if (e.target === modalRef.current) handleCloseModal()
				}}
				onClose={handleCloseModal}
			>
				<div className="w-80 rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
					<h3 className="mb-4 text-lg font-semibold text-zinc-800">
						{editingLessonId ? '編輯課程' : '新增課程'}
					</h3>
					<div className="space-y-4">
						{collisionError && (
							<div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
								該時段已有課程，無法重疊
							</div>
						)}
						<div>
							<label className="mb-1.5 block text-sm font-medium text-zinc-600">課程名稱</label>
							<input
								type="text"
								placeholder="例如：微積分"
								className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
								value={newLesson.name}
								onChange={e => {
									setNewLesson({ ...newLesson, name: e.target.value })
									setCollisionError(false)
								}}
								autoFocus
								disabled={readOnly}
							/>
						</div>
						<div>
							<label className="mb-1.5 block text-sm font-medium text-zinc-600">地點（可選）</label>
							<input
								type="text"
								placeholder="例如：綜院 201"
								className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
								value={newLesson.location}
								onChange={e => setNewLesson({ ...newLesson, location: e.target.value })}
								disabled={readOnly}
							/>
						</div>
					</div>
					<div className="mt-6 flex gap-3">
						{!readOnly && editingLessonId ? (
							<button
								type="button"
								className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
								onClick={() => handleDeleteLesson(editingLessonId)}
							>
								刪除
							</button>
						) : (
							<button
								type="button"
								className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
								onClick={handleCloseModal}
							>
								取消
							</button>
						)}
						{!readOnly && (
							<button
								type="button"
								className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
								onClick={handleAddLesson}
								disabled={!newLesson.name}
							>
								{editingLessonId ? '儲存' : '確認'}
							</button>
						)}
					</div>
				</div>
			</dialog>
		</div>
	)
}
