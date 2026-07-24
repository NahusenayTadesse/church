import { getTeamMembers } from '$lib/server/getTeams'
import { getTestimonials } from '$lib/server/testimonials'
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	/* Two calls, but the second is the cheap one — reuse it or drop it if the
	   About page only shows the executive team. */
	const [executives, team, stories] = await Promise.all([
		getTeamMembers({ executiveOnly: true }),
		getTeamMembers(),
		getTestimonials()

	]);

	return {
		executives,
		/* Everyone who is not already in the executive block. */
		team: team.filter((member) => !member.isExecutive),
		stories
	};
};