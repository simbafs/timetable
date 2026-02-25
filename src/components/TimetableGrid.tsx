import { useCallback, useEffect, useState } from 'react'

const PERIOD_ORDER = ['y', 'z', '1', '2', '3', '4', 'n', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd']

const PERIOD_LABELS: Record<string, string> = {
	y: 'Y',
	z: 'Z',
	1: '1',
	2: '2',
	3: '3',
	4: '4',
	n: 'N',
	5: '5',
	6: '6',
	7: '7',
	8: '8',
	9: '9',
	a: 'A',
	b: 'B',
	c: 'C',
	d: 'D',
}

const DAY_LABELS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

const COLORS = [
	'bg-blue-500',
	'bg-emerald-500',
	'bg-amber-500',
	'bg-rose-500',
	'bg-violet-500',
	'bg-cyan-500',
	'bg-orange-500',
]

interface Lesson {
	id: string
	name: string
	location: string
	day: number
	startPeriod: string
	endPeriod: string
}

interface TimetableGridProps {
	lessons?: Lesson[]
	onLessonsChange?: (lessons: Lesson[]) => void
}

export default function TimetableGrid({ lessons: initialLessons = [], onLessonsChange }: TimetableGridProps) {
	const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState<{ day: number; period: string } | null>(null)
	const [dragEnd, setDragEnd] = useState<{ day: number; period: string } | null>(null)
	const [showModal, setShowModal] = useState(false)
	const [newLesson, setNewLesson] = useState({ name: '', location: '' })
	const [editingLessonId, setEditingLessonId] = useState<string | null>(null)

	const handleMouseDown = useCallback((day: number, period: string) => {
		setIsDragging(true)
		setDragStart({ day, period })
		setDragEnd({ day, period })
	}, [])

	const handleMouseOver = useCallback(
		(day: number, period: string) => {
			if (!isDragging) return
			setDragEnd({ day, period })
		},
		[isDragging],
	)

	const handleMouseUp = useCallback(() => {
		if (!isDragging || !dragStart || !dragEnd) return

		if (dragStart.day === dragEnd.day) {
			setShowModal(true)
		}

		setIsDragging(false)
	}, [isDragging, dragStart, dragEnd])

	const handleAddLesson = () => {
		if (!newLesson.name) return

		if (editingLessonId) {
			const newLessons = lessons.map(l =>
				l.id === editingLessonId ? { ...l, name: newLesson.name, location: newLesson.location } : l,
			)
			setLessons(newLessons)
			onLessonsChange?.(newLessons)
			;(window as any).setLessons?.(newLessons)
		} else {
			if (!dragStart || !dragEnd) return

			const startIdx = Math.min(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))
			const endIdx = Math.max(PERIOD_ORDER.indexOf(dragStart.period), PERIOD_ORDER.indexOf(dragEnd.period))

			const lesson: Lesson = {
				id: crypto.randomUUID(),
				name: newLesson.name,
				location: newLesson.location,
				day: dragStart.day,
				startPeriod: PERIOD_ORDER[startIdx],
				endPeriod: PERIOD_ORDER[endIdx],
			}

			const newLessons = [...lessons, lesson]
			setLessons(newLessons)
			onLessonsChange?.(newLessons)
			;(window as any).setLessons?.(newLessons)
		}

		setShowModal(false)
		setNewLesson({ name: '', location: '' })
		setDragStart(null)
		setDragEnd(null)
		setEditingLessonId(null)
	}

	const handleCloseModal = () => {
		setShowModal(false)
		setNewLesson({ name: '', location: '' })
		setDragStart(null)
		setDragEnd(null)
		setEditingLessonId(null)
	}

	const handleDeleteLesson = (id: string) => {
		const newLessons = lessons.filter(l => l.id !== id)
		setLessons(newLessons)
		onLessonsChange?.(newLessons)
		;(window as any).setLessons?.(newLessons)
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
		const left = lesson.day * 61 + 60

		return {
			top: `${top}px`,
			height: `${height}px`,
			left: `${left}px`,
			width: '60px',
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

					{lessons.map((lesson, idx) => (
						<div
							key={lesson.id}
							className={`absolute z-10 flex flex-col justify-center overflow-hidden rounded px-1 py-0.5 text-xs font-medium text-white shadow-sm ${COLORS[idx % COLORS.length]}`}
							style={getLessonStyle(lesson)}
							onClick={e => {
								e.stopPropagation()
								setEditingLessonId(lesson.id)
								setNewLesson({ name: lesson.name, location: lesson.location })
								setShowModal(true)
							}}
						>
							<span className="truncate">{lesson.name}</span>
							{lesson.location && <span className="text-white/70 truncate">{lesson.location}</span>}
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
						</div>
					))}
				</div>
			</div>

			{showModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={handleCloseModal}
				>
					<div className="w-80 rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
						<h3 className="mb-4 text-lg font-semibold text-zinc-800">
							{editingLessonId ? '編輯課程' : '新增課程'}
						</h3>
						<div className="space-y-4">
							<div>
								<label className="mb-1.5 block text-sm font-medium text-zinc-600">課程名稱</label>
								<input
									type="text"
									placeholder="例如：微積分"
									className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm transition-all focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
									value={newLesson.name}
									onChange={e => setNewLesson({ ...newLesson, name: e.target.value })}
									autoFocus
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
								/>
							</div>
						</div>
						<div className="mt-6 flex gap-3">
							{editingLessonId ? (
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
							<button
								type="button"
								className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
								onClick={handleAddLesson}
								disabled={!newLesson.name}
							>
								{editingLessonId ? '儲存' : '確認'}
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	)
}
