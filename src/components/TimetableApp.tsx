import { useEffect, useRef, useState } from 'react'
import type { Lesson } from '../types'
import { exportToCalendar } from '../utils/calendar'
import { generateICS } from '../utils/ics'
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
	const exportModalRef = useRef<HTMLDialogElement>(null)
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

	const handleExport = async (e: React.SyntheticEvent) => {
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
				exportModalRef.current?.close()
			} else {
				alert('未知錯誤')
			}
		} catch (err) {
			alert(String(err))
		} finally {
			setLoading(false)
		}
	}

	const handleDownloadICS = () => {
		const icsContent = generateICS(lessons, semesterStart, semesterEnd)
		const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
		const url = window.URL.createObjectURL(blob)
		const link = document.createElement('a')
		link.href = url
		link.setAttribute('download', 'timetable.ics')
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	return (
		<div className="w-full max-w-6xl mx-auto px-4 py-8">
			<div className="flex justify-between items-center mb-6">
				<h1 className="text-2xl font-bold text-zinc-800">我的課表</h1>
				<div className="flex gap-2">
					<button
						onClick={() => exportModalRef.current?.showModal()}
						className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
					>
						匯出
					</button>
					{!isEditing ? (
						<button
							onClick={() => setIsEditing(true)}
							className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
						>
							編輯
						</button>
					) : (
						<button
							onClick={() => setIsEditing(false)}
							className="rounded-xl border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-50"
						>
							完成
						</button>
					)}
				</div>
			</div>

			<div className="glass-panel overflow-hidden rounded-3xl border border-white/40 bg-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] backdrop-blur-xl">
				<TimetableGrid lessons={lessons} onLessonsChange={handleLessonsChange} readOnly={!isEditing} />
			</div>

			<dialog
				ref={exportModalRef}
				className="m-auto backdrop:bg-black/50 p-0 bg-transparent rounded-2xl"
				onClick={e => {
					if (e.target === exportModalRef.current) exportModalRef.current.close()
				}}
			>
				<div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
					<div className="flex justify-between items-center mb-6">
						<h3 className="text-lg font-semibold text-zinc-800">匯出設定</h3>
						<button
							onClick={() => exportModalRef.current?.close()}
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

						<div className="border-t border-zinc-100 pt-4 mt-4">
							<h4 className="text-sm font-semibold text-zinc-800 mb-3">匯出選項</h4>

							<div className="space-y-3">
								<button
									onClick={handleDownloadICS}
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

								{!accessToken && !DISABLE_AUTH ? (
									<button
										onClick={handleLogin}
										className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700"
									>
										<svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
											<path d="M12.545,10.239v3.821h5.445c-0.712,2.315-2.647,3.972-5.445,3.972c-3.332,0-6.033-2.701-6.033-6.032s2.701-6.032,6.033-6.032c1.498,0,2.866,0.549,3.921,1.453l2.814-2.814C17.503,2.988,15.139,2,12.545,2C7.021,2,2.543,6.477,2.543,12s4.478,10,10.002,10c8.396,0,10.249-7.85,9.426-11.748L12.545,10.239z" />
										</svg>
										登入 Google 以匯入日曆
									</button>
								) : (
									<div className="bg-zinc-50 rounded-xl p-4 border border-zinc-100">
										{!DISABLE_AUTH && (
											<div className="flex items-center justify-between mb-3">
												<div className="flex items-center gap-2">
													<div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-xs">
														{userInfo.charAt(0).toUpperCase()}
													</div>
													<span className="text-sm font-medium text-zinc-700 truncate max-w-[150px]">
														{userInfo}
													</span>
												</div>
												<button
													onClick={handleLogout}
													className="text-xs text-red-500 hover:text-red-700 font-medium"
												>
													登出
												</button>
											</div>
										)}

										<div className="mb-3">
											<label className="block text-xs font-medium text-zinc-500 mb-1">
												日曆名稱
											</label>
											<input
												type="text"
												value={calendarName}
												onChange={e => setCalendarName(e.target.value)}
												className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none"
											/>
										</div>

										<button
											onClick={handleExport}
											disabled={loading}
											className="w-full rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
										>
											{loading && (
												<div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
											)}
											匯入 Google 日曆
										</button>
									</div>
								)}
							</div>
						</div>
					</div>
				</div>
			</dialog>
		</div>
	)
}
