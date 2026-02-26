import { useEffect, useState } from 'react'

interface UserInfo {
	name: string
	email: string
	picture: string
}

export function useAuth() {
	const [accessToken, setAccessToken] = useState<string | null>(null)
	const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

	const [justLoggedIn, setJustLoggedIn] = useState(false)

	useEffect(() => {
		const storedToken = localStorage.getItem('google_access_token')
		const storedIdToken = localStorage.getItem('google_id_token')

		if (storedToken) {
			setAccessToken(storedToken)
		}

		if (storedIdToken) {
			updateUserInfo(storedIdToken)
		}

		if (window.location.hash) {
			const params = new URLSearchParams(window.location.hash.substring(1))
			const token = params.get('access_token')
			const idToken = params.get('id_token')

			if (token) {
				localStorage.setItem('google_access_token', token)
				setAccessToken(token)
			}

			if (idToken) {
				localStorage.setItem('google_id_token', idToken)
				updateUserInfo(idToken)
			}

			if (token || idToken) {
				setJustLoggedIn(true)
				window.location.hash = ''
				// Optional: clear URL without reload
				window.history.replaceState(null, '', window.location.pathname)
			}
		}
	}, [])

	const updateUserInfo = (token: string) => {
		try {
			// Decode JWT ID token
			const base64Url = token.split('.')[1]
			const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
			const jsonPayload = decodeURIComponent(
				window
					.atob(base64)
					.split('')
					.map(function (c) {
						return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
					})
					.join(''),
			)

			const payload = JSON.parse(jsonPayload)
			setUserInfo({
				name: payload.name || payload.email?.split('@')[0] || 'User',
				email: payload.email || '',
				picture: payload.picture || '',
			})
		} catch (e) {
			console.error('Failed to parse token', e)
		}
	}

	const handleLogin = () => {
		window.location.href = '/api/auth/signin'
	}

	const handleLogout = () => {
		localStorage.removeItem('google_access_token')
		localStorage.removeItem('google_id_token')
		setAccessToken(null)
		setUserInfo(null)
	}

	return {
		accessToken,
		userInfo,
		justLoggedIn,
		handleLogin,
		handleLogout,
	}
}
