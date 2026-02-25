import { useEffect, useRef } from 'react'
import { COLORS } from '../utils/constants'

interface NewLessonState {
	name: string
	location: string
	color: string
}

interface LessonModalProps {
	isOpen: boolean
	onClose: () => void
	readOnly: boolean
	editingLessonId: string | null
	newLesson: NewLessonState
	onNewLessonChange: (lesson: NewLessonState) => void
	collisionError: boolean
	setCollisionError: (error: boolean) => void
	onDelete: (id: string) => void
	onConfirm: () => void
}

export default function LessonModal({
	isOpen,
	onClose,
	readOnly,
	editingLessonId,
	newLesson,
	onNewLessonChange,
	collisionError,
	setCollisionError,
	onDelete,
	onConfirm,
}: LessonModalProps) {
	const modalRef = useRef<HTMLDialogElement>(null)

	useEffect(() => {
		if (isOpen) {
			modalRef.current?.showModal()
		} else {
			modalRef.current?.close()
		}
	}, [isOpen])

	return (
		<dialog
			ref={modalRef}
			className="m-auto backdrop:bg-black/50 p-0 bg-transparent rounded-2xl"
			onClick={e => {
				if (e.target === modalRef.current) onClose()
			}}
			onClose={onClose}
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
								onNewLessonChange({ ...newLesson, name: e.target.value })
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
							onChange={e => onNewLessonChange({ ...newLesson, location: e.target.value })}
							disabled={readOnly}
						/>
					</div>
					<div>
						<label className="mb-1.5 block text-sm font-medium text-zinc-600">顏色</label>
						<div className="flex flex-wrap gap-2 items-center">
							{COLORS.map(colorClass => {
								return (
									<button
										key={colorClass}
										type="button"
										className={`h-8 w-8 rounded-full border-2 transition-all ${colorClass} ${
											newLesson.color === colorClass
												? 'border-zinc-600 scale-110'
												: 'border-transparent hover:scale-105'
										}`}
										onClick={() => onNewLessonChange({ ...newLesson, color: colorClass })}
									/>
								)
							})}
						</div>
					</div>
				</div>
				<div className="mt-6 flex gap-3">
					{!readOnly && editingLessonId ? (
						<button
							type="button"
							className="flex-1 rounded-xl border border-red-200 px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
							onClick={() => onDelete(editingLessonId)}
						>
							刪除
						</button>
					) : (
						<button
							type="button"
							className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
							onClick={onClose}
						>
							取消
						</button>
					)}
					{!readOnly && (
						<button
							type="button"
							className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
							onClick={onConfirm}
							disabled={!newLesson.name}
						>
							{editingLessonId ? '儲存' : '確認'}
						</button>
					)}
				</div>
			</div>
		</dialog>
	)
}
