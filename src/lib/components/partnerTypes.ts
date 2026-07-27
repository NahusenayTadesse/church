import * as m from '$lib/paraglide/messages.js';

/** Mirrors the `partnership_type` enum on the partners table. */
export const partnerTypes = [
	'sponsor',
	'ministry_partner',
	'implementing_partner',
	'media_partner',
	'donor',
	'other'
] as const;

export type PartnerType = (typeof partnerTypes)[number];

export type Partner = {
	id: number;
	name: string;
	logo: string | null;
	description: string | null;
	about: string | null;
	website: string | null;
	partnershipType: PartnerType;
	showOnHome?: boolean | null;
	sortOrder?: number | null;
};

/**
 * Paraglide compiles one function per message, so a dynamic key isn't possible —
 * the lookup has to be explicit.
 */
const labels: Record<PartnerType, () => string> = {
	sponsor: m.partner_type_sponsor,
	ministry_partner: m.partner_type_ministry_partner,
	implementing_partner: m.partner_type_implementing_partner,
	media_partner: m.partner_type_media_partner,
	donor: m.partner_type_donor,
	other: m.partner_type_other
};

export const partnerTypeLabel = (type: PartnerType) => (labels[type] ?? m.partner_type_other)();

/** Fallback tile content when a partner has no uploaded logo. */
export const initials = (name: string) =>
	name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((word) => word[0])
		.join('')
		.toUpperCase();