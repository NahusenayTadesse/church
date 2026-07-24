/**
 * Shared shape for published testimonials. Lives outside `$lib/server` so the
 * component can import the type without tripping SvelteKit's server-import check.
 */
export interface Testimonial {
	id: number;
	name: string;
	position: string | null;
	/** Story headline, when there is one. */
	title: string | null;
	message: string;
	avatar: string | null;
	storyDate: Date | string | null;
	isFeaturedOnHome: boolean | null;
	ministryAreaId: number | null;
	ministryAreaName: string | null;
	projectId: number | null;
	projectName: string | null;
	projectSlug: string | null;
	eventId: number | null;
	eventName: string | null;
	eventSlug: string | null;
}