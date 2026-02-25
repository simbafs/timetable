import { useEffect, useState } from 'react'
import type { Lesson } from '../types'
import { exportToCalendar } from '../utils/calendar'
import TimetableGrid from './TimetableGrid'

const CLIENT_ID = import.meta.env.PUBLIC_GOOGLE_CLIENT_ID
const SCOPES = 'https://www.googleapis.com/auth/calendar'
const DISABLE_AUTH = import.meta.env.PUBLIC_DISABLE_AUTH === 'true'

export default function TimetableApp() {
	const [accessToken, setAccessToken] = useState<string | null>(null)
	const [userInfo, setUserInfo] = useState<string>('')
	const [lessons, setLessons] = useState<Lesson[]>([])
	const [loading, setLoading] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [showExportModal, setShowExportModal] = useState(false)
	const [semesterStart, setSemesterStart] = useState('2025-02-17')
	const [semesterEnd, setSemesterEnd] = useState('2025-06-20')
	const [calendarName, setCalendarName] = useState('課表')

	useEffect(() => {
		const storedToken = localStorage.getItem('google_access_token')
		if (storedToken) {
			setAccessToken(storedToken)
			updateUserInfo(storedToken)
		}

		if (window.location.hash) {
			const params = new URLSearchParams(window.location.hash.substring(1))
			const token = params.get('access_token')
			if (token) {
				localStorage.setItem('google_access_token', token)
				setAccessToken(token)
				updateUserInfo(token)
				window.location.hash = ''
				// Optional: clear URL without reload
				window.history.replaceState(null, '', window.location.pathname)
			}
		}

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

	const updateUserInfo = (token: string) => {
		try {
			const payload = JSON.parse(atob(token.split('.')[1]))
			setUserInfo(payload.email || payload.sub)
		} catch (e) {
			console.error('Failed to parse token', e)
		}
	}

	const handleLogin = () => {
		const params = new URLSearchParams({
			client_id: CLIENT_ID,
			redirect_uri: `${window.location.origin}/api/auth/callback`,
			response_type: 'token',
			scope: SCOPES,
			prompt: 'consent',
		})
		window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
	}

	const handleLogout = () => {
		localStorage.removeItem('google_access_token')
		setAccessToken(null)
		setUserInfo('')
	}

	const handleLessonsChange = (newLessons: Lesson[]) => {
		setLessons(newLessons)
		localStorage.setItem('timetable_lessons', JSON.stringify(newLessons))
	}

	const handleExport = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!accessToken && !DISABLE_AUTH) {
			alert('請先登入')
			return
		}

		setLoading(true)

		const parseDate = (dateStr: string) => {
			const parts = dateStr.split('-')
			return [parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])]
		}

		const semester = [...parseDate(semesterStart), ...parseDate(semesterEnd)]

		try {
			const result = await exportToCalendar(accessToken, semester, calendarName, lessons)
			if (result?.error) {
				alert(result.error)
			} else if (result?.success) {
				alert('成功！')
				setShowExportModal(false)
			} else {
				alert('未知錯誤')
			}
		} catch (err) {
			alert(String(err))
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-zinc-800">我的課表</h1>
				<div className="flex gap-2">
					{!isEditing ? (
						<button
							onClick={() => setIsEditing(true)}
							className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
						>
							編輯
						</button>
					) : (
						<>
							<button
								onClick={() => setShowExportModal(true)}
								className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
							>
								匯出
							</button>
							<button
								onClick={() => setIsEditing(false)}
								className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
							>
								完成
							</button>
						</>
					)}
				</div>
			</div>

			<div className="glass-panel overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl">
				<TimetableGrid lessons={lessons} onLessonsChange={handleLessonsChange} readOnly={!isEditing} />
			</div>

			{showExportModal && (
				<div
					className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
					onClick={() => setShowExportModal(false)}
				>
					<div
						className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
						onClick={e => e.stopPropagation()}
					>
						<div className="flex justify-between items-center mb-6">
							<h3 className="text-lg font-semibold text-zinc-800">匯出設定</h3>
							<button
								onClick={() => setShowExportModal(false)}
								className="text-zinc-400 hover:text-zinc-600"
							>
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

						{!accessToken && !DISABLE_AUTH ? (
							<div className="text-center py-6">
								<p className="mb-4 text-zinc-600">請先登入 Google 帳號以使用匯出功能</p>
								<button
									onClick={handleLogin}
									className="rounded-xl bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
								>
									登入 Google
								</button>
							</div>
						) : (
							<form onSubmit={handleExport} className="space-y-4">
								{!DISABLE_AUTH && (
									<div className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl mb-4">
										<div className="flex items-center gap-3">
											<div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
												<svg
													className="w-4 h-4"
													fill="none"
													stroke="currentColor"
													viewBox="0 0 24 24"
												>
													<path
														strokeLinecap="round"
														strokeLinejoin="round"
														strokeWidth="2"
														d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
													/>
												</svg>
											</div>
											<div className="text-sm">
												<p className="font-medium text-zinc-700">{userInfo}</p>
												<p className="text-xs text-zinc-400">已連結帳號</p>
											</div>
										</div>
										<button
											type="button"
											onClick={handleLogout}
											className="text-xs text-red-500 hover:text-red-700 font-medium"
										>
											登出
										</button>
									</div>
								)}

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
								<div>
									<label className="block text-sm font-medium text-zinc-600 mb-1.5">日曆名稱</label>
									<input
										type="text"
										value={calendarName}
										onChange={e => setCalendarName(e.target.value)}
										className="w-full rounded-xl border border-zinc-200 px-4 py-2.5 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
									/>
								</div>

								<div className="pt-4 flex gap-3">
									<button
										type="button"
										onClick={() => setShowExportModal(false)}
										className="flex-1 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
									>
										取消
									</button>
									<button
										type="submit"
										disabled={loading}
										className="flex-1 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
									>
										{loading && (
											<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
										)}
										匯入 Google 日曆
									</button>
								</div>
							</form>
						)}
					</div>
				</div>
			)}
		</div>
	)
}
