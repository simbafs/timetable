import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useTimetableData } from '../hooks/useTimetableData'
import { exportToCalendar } from '../utils/calendar'
import { getPeriodTable, getSchoolConfig, SCHOOLS } from '../utils/config'
import { generateICS } from '../utils/ics'
import ExportModal from './ExportModal'
import TimetableGrid from './TimetableGrid'

const DISABLE_AUTH = import.meta.env.PUBLIC_DISABLE_AUTH === 'true'

export default function TimetableApp() {
	const { accessToken, userInfo, handleLogin, handleLogout } = useAuth()
	const { lessons, setLessons } = useTimetableData()

	const [loading, setLoading] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [isExportModalOpen, setIsExportModalOpen] = useState(false)

	const [selectedSchoolId, setSelectedSchoolId] = useState(() => {
		if (typeof localStorage !== 'undefined') {
			return localStorage.getItem('selected_school') || SCHOOLS[0].id
		}
		return SCHOOLS[0].id
	})

	const schoolConfig = getSchoolConfig(selectedSchoolId) || SCHOOLS[0]

	const [semesterStart, setSemesterStart] = useState(schoolConfig.dates.start)
	const [semesterEnd, setSemesterEnd] = useState(schoolConfig.dates.end)
	const [calendarName, setCalendarName] = useState(() => {
		if (typeof localStorage !== 'undefined') {
			return localStorage.getItem('calendar_name') || '課表'
		}
		return '課表'
	})
	const [includeWeekNumbers, setIncludeWeekNumbers] = useState(true)

	useEffect(() => {
		localStorage.setItem('selected_school', selectedSchoolId)
		// Update dates when school changes
		setSemesterStart(schoolConfig.dates.start)
		setSemesterEnd(schoolConfig.dates.end)
	}, [selectedSchoolId])

	useEffect(() => {
		localStorage.setItem('calendar_name', calendarName)
	}, [calendarName])

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
			const result = await exportToCalendar(
				accessToken,
				semester,
				calendarName,
				lessons,
				includeWeekNumbers,
				selectedSchoolId,
			)
			if (result?.error) {
				alert(result.error)
			} else if (result?.success) {
				alert('成功！')
				setIsExportModalOpen(false)
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
		const icsContent = generateICS(lessons, semesterStart, semesterEnd, getPeriodTable(schoolConfig))
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
				<div className="flex items-center gap-4">
					<h1 className="text-2xl font-bold text-zinc-800">我的課表</h1>
					<select
						value={selectedSchoolId}
						onChange={e => setSelectedSchoolId(e.target.value)}
						className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
					>
						{SCHOOLS.map(s => (
							<option key={s.id} value={s.id}>
								{s.name}
							</option>
						))}
					</select>
				</div>
				<div className="flex gap-2">
					<button
						onClick={() => setIsExportModalOpen(true)}
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
				<TimetableGrid
					lessons={lessons}
					onLessonsChange={setLessons}
					readOnly={!isEditing}
					schoolConfig={schoolConfig}
				/>
			</div>

			<ExportModal
				isOpen={isExportModalOpen}
				onClose={() => setIsExportModalOpen(false)}
				semesterStart={semesterStart}
				setSemesterStart={setSemesterStart}
				semesterEnd={semesterEnd}
				setSemesterEnd={setSemesterEnd}
				includeWeekNumbers={includeWeekNumbers}
				setIncludeWeekNumbers={setIncludeWeekNumbers}
				calendarName={calendarName}
				setCalendarName={setCalendarName}
				loading={loading}
				accessToken={accessToken}
				userInfo={userInfo}
				disableAuth={DISABLE_AUTH}
				onDownloadICS={handleDownloadICS}
				onLogin={handleLogin}
				onLogout={handleLogout}
				onExport={handleExport}
			/>
		</div>
	)
}
