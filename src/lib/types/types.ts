export type HelpLink = {
	label: string;
	href: string;
};

export type HelpSection = {
	heading: string;
	/** Plain text. Blank lines are preserved. */
	body: string;
};

export type HelpEntryContent = {
	title: string;
	summary?: string;
	sections?: HelpSection[];
	links?: HelpLink[];
};

export type HelpEntry = HelpEntryContent & {
	/** Exact match: page.url.pathname === path. Informational only — actual routing lives in Registry.ts. */
	path?: string;
	/** Substring match: page.url.pathname.includes(match). Informational only — actual routing lives in Registry.ts. */
	match?: string;
	/** Per-language override. HelpButton swaps to these when the user picks a language. */
	languages?: {
		en: HelpEntryContent;
		am: HelpEntryContent;
	};
};