/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module '*.yaml' {
	const value: any
	export default value
}
