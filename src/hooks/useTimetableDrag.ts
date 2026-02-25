import { useCallback, useEffect, useState } from 'react'

interface DragState {
	day: number
	period: string
}

interface UseTimetableDragProps {
	readOnly: boolean
	periodOrder: string[]
	onDragComplete: (day: number, startPeriod: string, endPeriod: string) => void
}

export function useTimetableDrag({ readOnly, periodOrder, onDragComplete }: UseTimetableDragProps) {
	const [isDragging, setIsDragging] = useState(false)
	const [dragStart, setDragStart] = useState<DragState | null>(null)
	const [dragEnd, setDragEnd] = useState<DragState | null>(null)

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
		(_: number, period: string) => {
			if (!isDragging || readOnly || !dragStart) return
			// Constrain drag to the same day as start
			setDragEnd({ day: dragStart.day, period })
		},
		[isDragging, readOnly, dragStart],
	)

	const handleMouseUp = useCallback(() => {
		if (readOnly || !isDragging || !dragStart || !dragEnd) return

		if (dragStart.day === dragEnd.day) {
			const startIdx = Math.min(periodOrder.indexOf(dragStart.period), periodOrder.indexOf(dragEnd.period))
			const endIdx = Math.max(periodOrder.indexOf(dragStart.period), periodOrder.indexOf(dragEnd.period))

			onDragComplete(dragStart.day, periodOrder[startIdx], periodOrder[endIdx])
		}

		// Don't reset drag here if we want to keep selection visible while modal is open?
		// In original code:
		// if (!checkCollision(...)) { openModal } else { setDragStart(null); setDragEnd(null) }
		// setIsDragging(false)

		// We'll let the component reset dragStart/End when modal closes or action completes.
		// But isDragging should be false.
		setIsDragging(false)
	}, [isDragging, dragStart, dragEnd, readOnly, periodOrder, onDragComplete])

	useEffect(() => {
		const handleGlobalMouseUp = () => {
			if (isDragging) {
				setIsDragging(false)
			}
		}
		window.addEventListener('mouseup', handleGlobalMouseUp)
		return () => window.removeEventListener('mouseup', handleGlobalMouseUp)
	}, [isDragging])

	const getSelection = () => {
		if (!dragStart || !dragEnd) return new Set<string>()

		const startDay = Math.min(dragStart.day, dragEnd.day)
		const endDay = Math.max(dragStart.day, dragEnd.day)
		const startIdx = Math.min(periodOrder.indexOf(dragStart.period), periodOrder.indexOf(dragEnd.period))
		const endIdx = Math.max(periodOrder.indexOf(dragStart.period), periodOrder.indexOf(dragEnd.period))

		const selected = new Set<string>()
		for (let day = startDay; day <= endDay; day++) {
			for (let i = startIdx; i <= endIdx; i++) {
				selected.add(`${day}-${periodOrder[i]}`)
			}
		}
		return selected
	}

	return {
		isDragging,
		dragStart,
		dragEnd,
		setDragStart,
		setDragEnd,
		handleMouseDown,
		handleMouseOver,
		handleMouseUp,
		selection: getSelection(),
	}
}
