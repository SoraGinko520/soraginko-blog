/// <reference types="astro/client" />
/// <reference path="../.astro/types.d.ts" />

declare global {
	interface ImportMetaEnv {
		readonly MEILI_MASTER_KEY: string;
		readonly GITHUB_TOKEN?: string;
		readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
		readonly PUBLIC_UMAMI_SHARE_ID?: string;
		readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
	}

	interface ITOCManager {
		init: () => void;
		cleanup: () => void;
	}

	interface Window {
		SidebarTOC: {
			manager: ITOCManager | null;
		};
		tocInternalNavigation: boolean;
		// swup is defined in global.d.ts
		// biome-ignore lint/suspicious/noExplicitAny: External library without types
		spine: any;
		closeAnnouncement: () => void;
		// __fireflyMusic type is defined in global.d.ts
	}
}

export {};
