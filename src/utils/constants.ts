export const PERIOD_ORDER = ['y', 'z', '1', '2', '3', '4', 'n', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd']

export const PERIOD_LABELS: Record<string, string> = {
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

export const DAY_LABELS = ['週一', '週二', '週三', '週四', '週五', '週六', '週日']

export const COLORS = [
	'bg-blue-500',
	'bg-emerald-500',
	'bg-amber-500',
	'bg-rose-500',
	'bg-violet-500',
	'bg-cyan-500',
	'bg-orange-500',
]

export const PERIOD_TABLE: Record<string, [number, number]> = {
	y: [6, 0],
	z: [7, 0],
	1: [8, 0],
	2: [9, 0],
	3: [10, 10],
	4: [11, 10],
	n: [12, 20],
	5: [13, 20],
	6: [14, 20],
	7: [15, 30],
	8: [16, 30],
	9: [17, 30],
	a: [18, 30],
	b: [19, 30],
	c: [20, 30],
	d: [21, 30],
}
