// @ts-check
import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import yaml from '@rollup/plugin-yaml'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

// https://astro.build/config
export default defineConfig({
	adapter: cloudflare({
		imageService: 'compile',
	}),
	integrations: [react()],
	vite: {
		plugins: [tailwindcss(), yaml()],
		server: {
			allowedHosts: ['timetable.simbafs.cc'],
		},
		ssr: {
			external: [
				'fs',
				'url',
				'util',
				'events',
				'querystring',
				'stream',
				'crypto',
				'child_process',
				'os',
				'path',
				'http',
				'https',
				'http2',
				'zlib',
				'process',
				'buffer',
				'net',
				'tls',
				'assert',
				'node:fs',
				'node:url',
				'node:util',
				'node:events',
				'node:querystring',
				'node:stream',
				'node:stream/web',
				'node:crypto',
				'node:child_process',
				'node:os',
				'node:path',
				'node:http',
				'node:https',
				'node:http2',
				'node:zlib',
				'node:process',
				'node:buffer',
				'node:net',
				'node:tls',
				'node:assert',
				'worker_threads',
			],
		},
	},
})
