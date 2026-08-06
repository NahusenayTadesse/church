import type { HelpEntry } from './types/types';

import dashboardOverview from './help/dashboard-overview.json';

import dashboardBlogList from './help/dashboard-blog-list.json';
import dashboardBlogAdd from './help/dashboard-blog-add.json';
import dashboardBlogCategory from './help/dashboard-blog-category.json';
import dashboardBlogAreas from './help/dashboard-blog-areas.json';
import dashboardBlogSingle from './help/dashboard-blog-single.json';

import dashboardOrdersPending from './help/dashboard-orders-pending.json';
import dashboardOrdersAll from './help/dashboard-orders-all.json';
import dashboardOrdersCancelled from './help/dashboard-orders-cancelled.json';
import dashboardOrdersDelivered from './help/dashboard-orders-delivered.json';

import dashboardCustomersList from './help/dashboard-customers-list.json';
import dashboardCustomersHistory from './help/dashboard-customers-history.json';
import dashboardCustomersDetail from './help/dashboard-customers-detail.json';

import dashboardDonations from './help/dashboard-donations.json';
import dashboardDonationsCauses from './help/dashboard-donations-causes.json';

import dashboardAdminPanel from './help/dashboard-admin-panel.json';
import dashboardAdminRolesList from './help/dashboard-admin-roles-list.json';
import dashboardAdminRolesAdd from './help/dashboard-admin-roles-add.json';
import dashboardAdminRolesDetail from './help/dashboard-admin-roles-detail.json';
import dashboardAdminUsersList from './help/dashboard-admin-users-list.json';
import dashboardAdminUsersAdd from './help/dashboard-admin-users-add.json';
import dashboardAdminUsersDetail from './help/dashboard-admin-users-detail.json';

import dashboardReports from './help/dashboard-reports.json';

import dashboardEventsList from './help/dashboard-events-list.json';
import dashboardEventsAdd from './help/dashboard-events-add.json';
import dashboardEventsDetail from './help/dashboard-events-detail.json';

import dashboardBooksList from './help/dashboard-books-list.json';
import dashboardBooksAdd from './help/dashboard-books-add.json';
import dashboardBooksDetail from './help/dashboard-books-detail.json';

import dashboardProjectsList from './help/dashboard-projects-list.json';
import dashboardProjectsAdd from './help/dashboard-projects-add.json';
import dashboardProjectsDetail from './help/dashboard-projects-detail.json';

import dashboardGalleriesList from './help/dashboard-galleries-list.json';
import dashboardGalleriesAdd from './help/dashboard-galleries-add.json';
import dashboardGalleriesDetail from './help/dashboard-galleries-detail.json';

import dashboardPartnersList from './help/dashboard-partners-list.json';
import dashboardPartnersAdd from './help/dashboard-partners-add.json';
import dashboardPartnersDetail from './help/dashboard-partners-detail.json';

import dashboardTeamList from './help/dashboard-team-list.json';
import dashboardTeamAdd from './help/dashboard-team-add.json';
import dashboardTeamDetail from './help/dashboard-team-detail.json';

import dashboardTestimonialsList from './help/dashboard-testimonials-list.json';
import dashboardTestimonialsAdd from './help/dashboard-testimonials-add.json';
import dashboardTestimonialsDetail from './help/dashboard-testimonials-detail.json';

import dashboardPaymentMethods from './help/dashboard-payment-methods.json';
import dashboardMessages from './help/dashboard-messages.json';
import dashboardAccounts from './help/dashboard-accounts.json';

/**
 * Routing lives here, not in the JSON files, so dynamic-id routes (e.g.
 * /dashboard/customers/123 vs /dashboard/customers/123/history) can be
 * matched unambiguously with regex instead of fragile substring checks.
 * Order matters: more specific rules must come before broader ones that
 * would otherwise also match the same pathname.
 */
const rules: { test: (path: string) => boolean; entry: HelpEntry }[] = [
	{ test: (p) => p === '/dashboard', entry: dashboardOverview as HelpEntry },

	{ test: (p) => p === '/dashboard/blog', entry: dashboardBlogList as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/blog/add-blog'), entry: dashboardBlogAdd as HelpEntry },
	{ test: (p) => p === '/dashboard/blog/category', entry: dashboardBlogCategory as HelpEntry },
	{ test: (p) => p === '/dashboard/blog/areas', entry: dashboardBlogAreas as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/blog/single'), entry: dashboardBlogSingle as HelpEntry },

	{ test: (p) => p === '/dashboard/orders', entry: dashboardOrdersPending as HelpEntry },
	{ test: (p) => p === '/dashboard/orders/all-orders', entry: dashboardOrdersAll as HelpEntry },
	{ test: (p) => p === '/dashboard/orders/cancelled', entry: dashboardOrdersCancelled as HelpEntry },
	{ test: (p) => p === '/dashboard/orders/delivered', entry: dashboardOrdersDelivered as HelpEntry },

	{ test: (p) => p === '/dashboard/customers', entry: dashboardCustomersList as HelpEntry },
	{
		test: (p) => /^\/dashboard\/customers\/[^/]+\/history/.test(p),
		entry: dashboardCustomersHistory as HelpEntry
	},
	{
		test: (p) => /^\/dashboard\/customers\/[^/]+\/?$/.test(p),
		entry: dashboardCustomersDetail as HelpEntry
	},

	{ test: (p) => p === '/dashboard/donations', entry: dashboardDonations as HelpEntry },
	{ test: (p) => p === '/dashboard/donations/causes', entry: dashboardDonationsCauses as HelpEntry },

	{ test: (p) => p === '/dashboard/admin-panel', entry: dashboardAdminPanel as HelpEntry },
	{ test: (p) => p === '/dashboard/admin-panel/roles', entry: dashboardAdminRolesList as HelpEntry },
	{
		test: (p) => p === '/dashboard/admin-panel/roles/add-roles',
		entry: dashboardAdminRolesAdd as HelpEntry
	},
	{
		test: (p) => /^\/dashboard\/admin-panel\/roles\/[^/]+\/?$/.test(p),
		entry: dashboardAdminRolesDetail as HelpEntry
	},
	{ test: (p) => p === '/dashboard/admin-panel/users', entry: dashboardAdminUsersList as HelpEntry },
	{
		test: (p) => p === '/dashboard/admin-panel/users/add-users',
		entry: dashboardAdminUsersAdd as HelpEntry
	},
	{
		test: (p) => /^\/dashboard\/admin-panel\/users\/[^/]+\/?$/.test(p),
		entry: dashboardAdminUsersDetail as HelpEntry
	},

	{ test: (p) => p.startsWith('/dashboard/reports'), entry: dashboardReports as HelpEntry },

	{ test: (p) => p === '/dashboard/events', entry: dashboardEventsList as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/events/add-event'), entry: dashboardEventsAdd as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/events/single'), entry: dashboardEventsDetail as HelpEntry },

	{ test: (p) => p === '/dashboard/books', entry: dashboardBooksList as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/books/add-book'), entry: dashboardBooksAdd as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/books/single'), entry: dashboardBooksDetail as HelpEntry },

	{ test: (p) => p === '/dashboard/projects', entry: dashboardProjectsList as HelpEntry },
	{
		test: (p) => p.startsWith('/dashboard/projects/add-project'),
		entry: dashboardProjectsAdd as HelpEntry
	},
	{
		test: (p) => p.startsWith('/dashboard/projects/single'),
		entry: dashboardProjectsDetail as HelpEntry
	},

	{ test: (p) => p === '/dashboard/galleries', entry: dashboardGalleriesList as HelpEntry },
	{
		test: (p) => p.startsWith('/dashboard/galleries/add-gallery'),
		entry: dashboardGalleriesAdd as HelpEntry
	},
	{
		test: (p) => p.startsWith('/dashboard/galleries/single'),
		entry: dashboardGalleriesDetail as HelpEntry
	},

	{ test: (p) => p === '/dashboard/partners', entry: dashboardPartnersList as HelpEntry },
	{
		test: (p) => p.startsWith('/dashboard/partners/add-partner'),
		entry: dashboardPartnersAdd as HelpEntry
	},
	{
		test: (p) => p.startsWith('/dashboard/partners/single'),
		entry: dashboardPartnersDetail as HelpEntry
	},

	{ test: (p) => p === '/dashboard/team', entry: dashboardTeamList as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/team/add-team'), entry: dashboardTeamAdd as HelpEntry },
	{ test: (p) => p.startsWith('/dashboard/team/single'), entry: dashboardTeamDetail as HelpEntry },

	{ test: (p) => p === '/dashboard/testimonials', entry: dashboardTestimonialsList as HelpEntry },
	{
		test: (p) => p.startsWith('/dashboard/testimonials/add-testimonial'),
		entry: dashboardTestimonialsAdd as HelpEntry
	},
	{
		test: (p) => p.startsWith('/dashboard/testimonials/single'),
		entry: dashboardTestimonialsDetail as HelpEntry
	},

	{ test: (p) => p === '/dashboard/payment-methods', entry: dashboardPaymentMethods as HelpEntry },
	{ test: (p) => p === '/dashboard/messages', entry: dashboardMessages as HelpEntry },
	{ test: (p) => p === '/dashboard/accounts', entry: dashboardAccounts as HelpEntry }
];

/** Finds the help entry for the given pathname, or undefined if this page has no help yet. */
export function resolveHelp(pathname: string): HelpEntry | undefined {
	return rules.find((rule) => rule.test(pathname))?.entry;
}

/** Every help entry in the system, for the searchable help library page (/dashboard/help). */
export const allHelp: HelpEntry[] = rules.map((rule) => rule.entry);
