import { useEffect, useRef, useState } from 'react'
import { getCalendars } from '../utils/calendar'

interface UserInfo {
	name: string
	email: string
	picture: string
}

interface Calendar {
	id: string
	summary: string
	primary?: boolean
}

interface ExportModalProps {
	isOpen: boolean
	onClose: () => void
	semesterStart: string
	setSemesterStart: (date: string) => void
	semesterEnd: string
	setSemesterEnd: (date: string) => void
	includeWeekNumbers: boolean
	setIncludeWeekNumbers: (include: boolean) => void
	calendarName: string
	setCalendarName: (name: string) => void
	loading: boolean
	progress: number
	statusText: string
	accessToken: string | null
	userInfo: UserInfo | null
	disableAuth: boolean
	onDownloadICS: () => void
	onLogin: () => void
	onLogout: () => void
	onExport: (e: React.SyntheticEvent) => void
}

export default function ExportModal({
	isOpen,
	onClose,
	semesterStart,
	setSemesterStart,
	semesterEnd,
	setSemesterEnd,
	includeWeekNumbers,
	setIncludeWeekNumbers,
	calendarName,
	setCalendarName,
	loading,
	progress,
	statusText,
	accessToken,
	userInfo,
	disableAuth,
	onDownloadICS,
	onLogin,
	onLogout,
	onExport,
}: ExportModalProps) {
	const modalRef = useRef<HTMLDialogElement>(null)
	const [calendars, setCalendars] = useState<Calendar[]>([])
	const [isNewCalendar, setIsNewCalendar] = useState(false)

	useEffect(() => {
		if (isOpen && accessToken) {
			getCalendars(accessToken)
				.then(data => {
					if (data.calendars) {
						setCalendars(data.calendars)
						// Check if current calendarName matches an existing calendar
						const exists = data.calendars.some((c: Calendar) => c.summary === calendarName)
						setIsNewCalendar(!exists)
					}
				})
				.catch(console.error)
		}
	}, [isOpen, accessToken])

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
			<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
				<div className="flex justify-between items-center mb-6">
					<h3 className="text-lg font-semibold text-zinc-800">匯出設定</h3>
					<button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
						<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth="2"
								d="M6 18L18 6M6 6l12 12"
							/>
						</svg>
					</button>
				</div>

				<div className="space-y-4">
					<div>
						<label className="block text-sm font-medium text-zinc-600 mb-1.5">學期開始</label>
						<input
							type="date"
							value={semesterStart}
							onChange={e => setSemesterStart(e.target.value)}
							className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
						/>
					</div>
					<div>
						<label className="block text-sm font-medium text-zinc-600 mb-1.5">學期結束</label>
						<input
							type="date"
							value={semesterEnd}
							onChange={e => setSemesterEnd(e.target.value)}
							className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
						/>
					</div>

					<div className="flex items-center gap-2">
						<input
							type="checkbox"
							id="includeWeekNumbers"
							checked={includeWeekNumbers}
							onChange={e => setIncludeWeekNumbers(e.target.checked)}
							className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
						/>
						<label htmlFor="includeWeekNumbers" className="text-sm font-medium text-zinc-600">
							新增週次事件（如：第 1 周）
						</label>
					</div>

					<div className="border-t border-zinc-100 pt-4 mt-4">
						<h4 className="text-sm font-semibold text-zinc-800 mb-3">匯出選項</h4>

						<div className="space-y-3">
							<button
								onClick={onDownloadICS}
								className="w-full flex items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50 transition-colors"
							>
								<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth="2"
										d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
									/>
								</svg>
								下載 .ics 檔案
							</button>

							{!accessToken && !disableAuth ? (
								<button
									onClick={onLogin}
									className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
								>
									<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
										<path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
									</svg>
									登入 Google 以匯入日曆
								</button>
							) : (
								<div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
									{!disableAuth && userInfo && (
										<div className="flex items-center justify-between mb-3">
											<div className="flex items-center gap-2">
												{userInfo.picture ? (
													<img
														src={userInfo.picture}
														alt={userInfo.name}
														className="w-6 h-6 rounded-full object-cover"
													/>
												) : (
													<div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
														{userInfo.name.charAt(0).toUpperCase()}
													</div>
												)}
												<span className="text-sm font-medium text-zinc-700 truncate max-w-[150px]">
													{userInfo.name}
												</span>
											</div>
											<button
												onClick={onLogout}
												className="text-xs text-red-500 hover:text-red-700 font-medium"
											>
												登出
											</button>
										</div>
									)}

									<div className="mb-3">
										<label className="block text-xs font-medium text-zinc-500 mb-1">日曆名稱</label>
										{!isNewCalendar && calendars.length > 0 ? (
											<select
												value={
													calendars.some(c => c.summary === calendarName)
														? calendarName
														: '__new__'
												}
												onChange={e => {
													if (e.target.value === '__new__') {
														setIsNewCalendar(true)
														setCalendarName('')
													} else {
														setCalendarName(e.target.value)
													}
												}}
												className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none bg-white"
											>
												{calendars.map(c => (
													<option key={c.id} value={c.summary}>
														{c.summary} {c.primary ? '(主日曆)' : ''}
													</option>
												))}
												<option value="__new__">+ 建立新日曆...</option>
											</select>
										) : (
											<div className="flex gap-2">
												<input
													type="text"
													value={calendarName}
													onChange={e => setCalendarName(e.target.value)}
													placeholder="輸入日曆名稱"
													className="flex-1 rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
													autoFocus
												/>
												{calendars.length > 0 && (
													<button
														onClick={() => {
															setIsNewCalendar(false)
															if (calendars.length > 0) {
																setCalendarName(calendars[0].summary)
															}
														}}
														className="px-3 py-2 text-sm text-zinc-500 hover:text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
													>
														取消
													</button>
												)}
											</div>
										)}
									</div>

									<div className="space-y-3">
										{loading && (
											<div className="space-y-2">
												<div className="flex justify-between text-xs text-zinc-500">
													<span>{statusText}</span>
													<span>{Math.round(progress)}%</span>
												</div>
												<div className="h-2 w-full bg-zinc-100 rounded-full overflow-hidden">
													<div
														className="h-full bg-emerald-500 transition-all duration-300 ease-out"
														style={{ width: `${progress}%` }}
													/>
												</div>
											</div>
										)}
										<button
											onClick={onExport}
											disabled={loading}
											className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
										>
											{loading ? '匯入中...' : '匯入 Google 日曆'}
										</button>
									</div>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</dialog>
	)
}
