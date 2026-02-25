// @ts-check
import cloudflare from '@astrojs/cloudflare'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare(),
	vite: {
		plugins: [tailwindcss()],
		define: {
			'import.meta.env.PUBLIC_GOOGLE_CLIENT_ID': JSON.stringify(process.env.GOOGLE_CLIENT_ID),
		},
	},
})
