import { and, asc, eq, inArray } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { teamMembers, teamMemberAreas, teamMemberSocials, ministryAreas } from '$lib/server/db/schema';
/**
 * Shared shapes for team members. Lives outside `$lib/server` so components can
 * import the types without SvelteKit complaining about a server-only import.
 */

export type SocialPlatform =
	| 'facebook'
	| 'x'
	| 'instagram'
	| 'linkedin'
	| 'youtube'
	| 'telegram'
	| 'tiktok'
	| 'website';

export interface TeamMemberSocial {
	id: number;
	platform: SocialPlatform;
	url: string;
}

export interface TeamMemberArea {
	id: number;
	name: string;
}

export interface TeamMember {
	id: number;
	name: string;
	photo: string | null;
	position: string | null;
	biography: string | null;
	email: string | null;
	phone: string | null;
	isExecutive: boolean | null;
	isSpeaker: boolean | null;
	sortOrder: number | null;
	areas: TeamMemberArea[];
	socials: TeamMemberSocial[];
}
interface TeamQuery {
	/** Only the executive team — for the About page's leadership block. */
	executiveOnly?: boolean;
	/** Only people marked as speakers. */
	speakersOnly?: boolean;
	/** Cap the number returned — handy for a home page strip. */
	limit?: number;
}

/**
 * One query used by both the About page and the home page. Areas and socials are
 * fetched in two follow-up queries and grouped in memory rather than joined, so a
 * member with four areas and three socials does not multiply into twelve rows.
 */
export async function getTeamMembers(options: TeamQuery = {}): Promise<TeamMember[]> {
	const conditions = [eq(teamMembers.isPublished, true)];
	if (options.executiveOnly) conditions.push(eq(teamMembers.isExecutive, true));
	if (options.speakersOnly) conditions.push(eq(teamMembers.isSpeaker, true));

	const members = await db
		.select({
			id: teamMembers.id,
			name: teamMembers.name,
			photo: teamMembers.photo,
			position: teamMembers.position,
			biography: teamMembers.biography,
			email: teamMembers.email,
			phone: teamMembers.phone,
			isExecutive: teamMembers.isExecutive,
			isSpeaker: teamMembers.isSpeaker,
			sortOrder: teamMembers.sortOrder
		})
		.from(teamMembers)
		.where(and(...conditions))
		.orderBy(asc(teamMembers.sortOrder), asc(teamMembers.name))
		.limit(options.limit ?? 200);

	if (!members.length) return [];

	const ids = members.map((member) => member.id);

	const [areaRows, socialRows] = await Promise.all([
		db
			.select({
				teamMemberId: teamMemberAreas.teamMemberId,
				id: ministryAreas.id,
				name: ministryAreas.name
			})
			.from(teamMemberAreas)
			.innerJoin(ministryAreas, eq(ministryAreas.id, teamMemberAreas.ministryAreaId))
			.where(inArray(teamMemberAreas.teamMemberId, ids))
			.orderBy(asc(ministryAreas.name)),

		db
			.select({
				teamMemberId: teamMemberSocials.teamMemberId,
				id: teamMemberSocials.id,
				platform: teamMemberSocials.platform,
				url: teamMemberSocials.url
			})
			.from(teamMemberSocials)
			.where(inArray(teamMemberSocials.teamMemberId, ids))
			.orderBy(asc(teamMemberSocials.sortOrder))
	]);

	return members.map((member) => ({
		...member,
		areas: areaRows
			.filter((area) => area.teamMemberId === member.id)
			.map(({ id, name }) => ({ id, name })),
		socials: socialRows
			.filter((social) => social.teamMemberId === member.id)
			.map(({ id, platform, url }) => ({ id, platform, url }))
	}));
}