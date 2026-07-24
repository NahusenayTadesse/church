import {
	mysqlTable,
	int,
	varchar,
	boolean,
	mysqlEnum,
	decimal,
	text,
	timestamp,
	datetime,
	date
} from 'drizzle-orm/mysql-core';
import { secureFields, user } from './auth.schema';

export * from './auth.schema';

/**
 * Conventions used below:
 * - Staff-authored content uses `...secureFields`.
 * - Tables anonymous visitors write to (registrations, donations, prayer requests,
 *   book reviews, contact messages) use `...publicTimestamps`, because
 *   `secureFields.createdBy` has no user to point at for a public submission.
 *   If your `createdBy` is nullable, swap them over for consistency.
 * - Every money column carries an explicit `currency`.
 * - Join tables use a surrogate `id`. Add composite unique constraints when you're
 *   ready — the syntax differs between Drizzle versions, so check yours first.
 */
const publicTimestamps = {
	createdAt: timestamp('created_at').defaultNow().notNull(),
	updatedAt: timestamp('updated_at').defaultNow().onUpdateNow().notNull()
};

/* ========================================================================== */
/* SHARED TAXONOMY                                                            */
/* ========================================================================== */

/**
 * "Ministry Area" appears on events, projects, resources, books, testimonials and
 * galleries. One shared table beats six copies of the same enum.
 */
export const ministryAreas = mysqlTable('ministry_areas', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	...secureFields
});

export const tags = mysqlTable('tags', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 50 }).notNull().unique(),
});

/* ========================================================================== */
/* PEOPLE                                                                     */
/* ========================================================================== */

export const teamMembers = mysqlTable('team_members', {
	id: int('id').primaryKey().autoincrement(),
	// Optional: link a public profile to a login account (authors, organizers).
	userId: varchar('user_id', { length: 255 }).references(() => user.id),
	name: varchar('name', { length: 150 }).notNull(),
	photo: varchar('photo', { length: 255 }),
	position: varchar('position', { length: 150 }),
	biography: text('biography'),
	email: varchar('email', { length: 100 }),
	phone: varchar('phone', { length: 20 }),
	isExecutive: boolean('is_executive').default(false),
	isSpeaker: boolean('is_speaker').default(false),
	isPublished: boolean('is_published').default(true),
	sortOrder: int('sort_order').default(0),
	...secureFields
});

/** Areas of expertise — reuses the shared ministry areas list. */
export const teamMemberAreas = mysqlTable('team_member_areas', {
	id: int('id').primaryKey().autoincrement(),
	teamMemberId: int('team_member_id')
		.notNull()
		.references(() => teamMembers.id, { onDelete: 'cascade' }),
	ministryAreaId: int('ministry_area_id')
		.notNull()
		.references(() => ministryAreas.id, { onDelete: 'cascade' })
});

export const teamMemberSocials = mysqlTable('team_member_socials', {
	id: int('id').primaryKey().autoincrement(),
	teamMemberId: int('team_member_id')
		.notNull()
		.references(() => teamMembers.id, { onDelete: 'cascade' }),
	platform: mysqlEnum('platform', [
		'facebook',
		'x',
		'instagram',
		'linkedin',
		'youtube',
		'telegram',
		'tiktok',
		'website'
	]).notNull(),
	url: varchar('url', { length: 500 }).notNull(),
	sortOrder: int('sort_order').default(0)
});

export const partners = mysqlTable('partners', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 200 }).notNull().unique(),
	logo: varchar('logo', { length: 255 }),
	description: varchar('description', { length: 255 }),
	about: text('about'),
	website: varchar('website', { length: 500 }),
	partnershipType: mysqlEnum('partnership_type', [
		'sponsor',
		'ministry_partner',
		'implementing_partner',
		'media_partner',
		'donor',
		'other'
	]).notNull(),
	showOnHome: boolean('show_on_home').default(false),
	sortOrder: int('sort_order').default(0),
	...secureFields
});

export const customers = mysqlTable('customers', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull(),
	email: varchar('email', { length: 100 }).notNull().unique(),
	phone: varchar('phone', { length: 20 }),
	userId: varchar('user_id', { length: 255 })
		.notNull()
		.references(() => user.id),
	address: varchar('address', { length: 255 }),
	...secureFields
});

/* ========================================================================== */
/* RESOURCES / BLOG                                                           */
/* ========================================================================== */

export const blogCategories = mysqlTable('blog_categories', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar({ length: 255 }).notNull(),
	description: varchar({ length: 255 }).notNull()
});

/**
 * Doubles as the Resources module: articles, sermons, teachings, video and audio.
 * Alias it if the ministry-facing code reads better that way:
 *   export const resources = blog;
 */
export const blog = mysqlTable('blog', {
	id: int('id').primaryKey().autoincrement(),
	title: varchar({ length: 255 }).notNull(),
	categoryId: int('category_id')
		.notNull()
		.references(() => blogCategories.id),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	slug: varchar({ length: 255 }).notNull().unique(),
	excerpt: text(),
	content: text(),

	resourceType: mysqlEnum('resource_type', [
		'article',
		'sermon',
		'teaching',
		'video',
		'audio',
		'bible_study'
	]).default('article'),
	authorId: int('author_id').references(() => teamMembers.id),
	speakerId: int('speaker_id').references(() => teamMembers.id),

	videoLink: varchar('video_link', { length: 500 }),
	audioUrl: varchar('audio_url', { length: 500 }),
	downloadUrl: varchar('download_url', { length: 500 }),
	bibleReferences: varchar('bible_references', { length: 255 }),

	status: mysqlEnum('status', ['draft', 'published', 'archived']).default('draft'),
	publishedAt: timestamp('published_at'),
	viewCount: int('view_count').default(0),
	allowComments: boolean('allow_comments').default(false),

	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	featuredImage: varchar('featured_image', { length: 255 }),
	...secureFields
});

export const blogGallery = mysqlTable('blog_gallery', {
	id: int('id').primaryKey().autoincrement(),
	blogId: int('blog_id')
		.notNull()
		.references(() => blog.id, { onDelete: 'cascade' }),
	imageUrl: varchar('image_url', { length: 255 }),
	caption: varchar('caption', { length: 255 }),
	sortOrder: int('sort_order').default(0)
});

export const resourceTags = mysqlTable('resource_tags', {
	id: int('id').primaryKey().autoincrement(),
	resourceId: int('resource_id')
		.notNull()
		.references(() => blog.id, { onDelete: 'cascade' }),
	tagId: int('tag_id')
		.notNull()
		.references(() => tags.id, { onDelete: 'cascade' })
});

/** Manual "related resources" links. Insert both directions if you want symmetry. */
export const relatedResources = mysqlTable('related_resources', {
	id: int('id').primaryKey().autoincrement(),
	resourceId: int('resource_id')
		.notNull()
		.references(() => blog.id, { onDelete: 'cascade' }),
	relatedResourceId: int('related_resource_id')
		.notNull()
		.references(() => blog.id, { onDelete: 'cascade' }),
	sortOrder: int('sort_order').default(0)
});

/* ========================================================================== */
/* EVENTS                                                                     */
/* ========================================================================== */

export const events = mysqlTable('events', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 200 }).notNull(),
	slug: varchar('slug', { length: 220 }).notNull().unique(),
	shortDescription: varchar('short_description', { length: 255 }),
	fullDescription: text('full_description'),
	eventType: mysqlEnum('event_type', [
		'conference',
		'workshop',
		'retreat',
		'training',
		'seminar',
		'other'
	]).notNull(),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	featuredImage: varchar('featured_image', { length: 255 }),

	// Schedule
	startsAt: datetime('starts_at').notNull(),
	endsAt: datetime('ends_at'),
	timezone: varchar('timezone', { length: 64 }).default('Africa/Addis_Ababa'),

	// Where
	isOnline: boolean('is_online').default(false),
	location: varchar('location', { length: 255 }),
	locationMapUrl: varchar('location_map_url', { length: 500 }),
	onlineMeetingLink: varchar('online_meeting_link', { length: 500 }),

	organizerId: int('organizer_id').references(() => teamMembers.id),

	// Registration
	registrationRequired: boolean('registration_required').default(false),
	registrationDeadline: datetime('registration_deadline'),
	maxAttendees: int('max_attendees'),

	// Cost
	isFree: boolean('is_free').default(true),
	cost: decimal('cost', { precision: 10, scale: 2 }),
	currency: varchar('currency', { length: 3 }).default('ETB'),

	status: mysqlEnum('status', [
		'draft',
		'upcoming',
		'ongoing',
		'completed',
		'cancelled'
	]).default('draft'),
	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	...secureFields
});

/**
 * Speakers are usually team members, but guests happen — so either point at a
 * team member OR fill in the guest columns.
 */
export const eventSpeakers = mysqlTable('event_speakers', {
	id: int('id').primaryKey().autoincrement(),
	eventId: int('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	teamMemberId: int('team_member_id').references(() => teamMembers.id),
	guestName: varchar('guest_name', { length: 150 }),
	guestTitle: varchar('guest_title', { length: 150 }),
	guestPhoto: varchar('guest_photo', { length: 255 }),
	guestBio: varchar('guest_bio', { length: 500 }),
	role: mysqlEnum('role', ['speaker', 'host', 'panelist', 'facilitator']).default('speaker'),
	sortOrder: int('sort_order').default(0)
});

export const eventGallery = mysqlTable('event_gallery', {
	id: int('id').primaryKey().autoincrement(),
	eventId: int('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	imageUrl: varchar('image_url', { length: 255 }).notNull(),
	caption: varchar('caption', { length: 255 }),
	sortOrder: int('sort_order').default(0)
});

/** Schedules, brochures, handouts. */
export const eventDownloads = mysqlTable('event_downloads', {
	id: int('id').primaryKey().autoincrement(),
	eventId: int('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 200 }).notNull(),
	fileUrl: varchar('file_url', { length: 500 }).notNull(),
	fileType: mysqlEnum('file_type', ['pdf', 'doc', 'image', 'audio', 'video', 'other']).default(
		'pdf'
	),
	fileSize: int('file_size'),
	downloadCount: int('download_count').default(0),
	sortOrder: int('sort_order').default(0)
});

/**
 * Registration + attendance tracking. Paid events hang off `transactions`,
 * so receipts and payment status behave like everything else in the app.
 */
export const eventRegistrations = mysqlTable('event_registrations', {
	id: int('id').primaryKey().autoincrement(),
	eventId: int('event_id')
		.notNull()
		.references(() => events.id, { onDelete: 'cascade' }),
	userId: varchar('user_id', { length: 255 }).references(() => user.id),
	name: varchar('name', { length: 150 }).notNull(),
	email: varchar('email', { length: 100 }).notNull(),
	phone: varchar('phone', { length: 20 }),
	organization: varchar('organization', { length: 150 }),
	seats: int('seats').notNull().default(1),
	status: mysqlEnum('status', [
		'pending',
		'confirmed',
		'waitlisted',
		'cancelled',
		'attended',
		'no_show'
	]).default('pending'),
	transactionId: int('transaction_id').references(() => transactions.id),
	notes: varchar('notes', { length: 255 }),
	checkedInAt: timestamp('checked_in_at'),
	...publicTimestamps
});

/* ========================================================================== */
/* PROJECTS                                                                   */
/* ========================================================================== */

export const projects = mysqlTable('projects', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 200 }).notNull(),
	slug: varchar('slug', { length: 220 }).notNull().unique(),
	shortDescription: varchar('short_description', { length: 255 }),
	fullDescription: text('full_description'),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	featuredImage: varchar('featured_image', { length: 255 }),

	goal: text('goal'),
	activities: text('activities'),
	impactResults: text('impact_results'),

	location: varchar('location', { length: 255 }),
	startDate: date('start_date'),
	endDate: date('end_date'),
	status: mysqlEnum('status', ['planned', 'active', 'paused', 'completed']).default('planned'),
	leaderId: int('leader_id').references(() => teamMembers.id),

	beneficiaries: varchar('beneficiaries', { length: 255 }),
	targetBeneficiaries: int('target_beneficiaries'),
	reachedBeneficiaries: int('reached_beneficiaries').default(0),

	// Progress tracking for a fundraising bar
	fundingGoal: decimal('funding_goal', { precision: 12, scale: 2 }),
	fundingRaised: decimal('funding_raised', { precision: 12, scale: 2 }).default('0.00'),
	currency: varchar('currency', { length: 3 }).default('ETB'),

	// "Ways to Support"
	acceptsDonations: boolean('accepts_donations').default(false),
	acceptsVolunteers: boolean('accepts_volunteers').default(false),
	acceptsPrayer: boolean('accepts_prayer').default(true),

	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	...secureFields
});

export const projectGallery = mysqlTable('project_gallery', {
	id: int('id').primaryKey().autoincrement(),
	projectId: int('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	imageUrl: varchar('image_url', { length: 255 }).notNull(),
	caption: varchar('caption', { length: 255 }),
	sortOrder: int('sort_order').default(0)
});

export const projectDocuments = mysqlTable('project_documents', {
	id: int('id').primaryKey().autoincrement(),
	projectId: int('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 200 }).notNull(),
	fileUrl: varchar('file_url', { length: 500 }).notNull(),
	fileType: mysqlEnum('file_type', ['pdf', 'doc', 'image', 'other']).default('pdf'),
	fileSize: int('file_size'),
	sortOrder: int('sort_order').default(0)
});

export const projectPartners = mysqlTable('project_partners', {
	id: int('id').primaryKey().autoincrement(),
	projectId: int('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	partnerId: int('partner_id')
		.notNull()
		.references(() => partners.id, { onDelete: 'cascade' }),
	role: varchar('role', { length: 150 })
});

/** Progress updates / impact stories posted over the life of a project. */
export const projectUpdates = mysqlTable('project_updates', {
	id: int('id').primaryKey().autoincrement(),
	projectId: int('project_id')
		.notNull()
		.references(() => projects.id, { onDelete: 'cascade' }),
	title: varchar('title', { length: 200 }).notNull(),
	content: text('content'),
	image: varchar('image', { length: 255 }),
	publishedAt: date('published_at'),
	...secureFields
});

/* ========================================================================== */
/* BOOKS                                                                      */
/* ========================================================================== */

export const books = mysqlTable('books', {
	id: int('id').primaryKey().autoincrement(),
	title: varchar('title', { length: 255 }).notNull(),
	subtitle: varchar('subtitle', { length: 255 }),
	slug: varchar('slug', { length: 280 }).notNull().unique(),
	description: text('description'),
	coverImage: varchar('cover_image', { length: 255 }),

	authorId: int('author_id').references(() => teamMembers.id),
	authorName: varchar('author_name', { length: 150 }), // for external authors
	language: mysqlEnum('language', ['english', 'amharic', 'other']).default('english'),
	publicationDate: date('publication_date'),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	pages: int('pages'),
	isbn: varchar('isbn', { length: 20 }),

	// External store link (Amazon etc.) — leave null if selling on-site
	purchaseLink: varchar('purchase_link', { length: 500 }),
	price: decimal('price', { precision: 10, scale: 2 }),
	currency: varchar('currency', { length: 3 }).default('ETB'),

	/**
	 * Link to `products` only when the book is sold on-site. That reuses the
	 * existing stock, orders, prices and adjustment machinery instead of building
	 * a second inventory system for books.
	 */
	productId: int('product_id').references(() => products.id),

	previewFileUrl: varchar('preview_file_url', { length: 500 }),
	status: mysqlEnum('status', ['draft', 'published']).default('draft'),
	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	...secureFields
});

/** One row per available format; a `fileUrl` means it's downloadable. */
export const bookFormats = mysqlTable('book_formats', {
	id: int('id').primaryKey().autoincrement(),
	bookId: int('book_id')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' }),
	format: mysqlEnum('format', ['physical', 'pdf', 'ebook', 'audiobook']).notNull(),
	fileUrl: varchar('file_url', { length: 500 }),
	price: decimal('price', { precision: 10, scale: 2 }),
	isFreeDownload: boolean('is_free_download').default(false),
	downloadCount: int('download_count').default(0)
});

export const bookReviews = mysqlTable('book_reviews', {
	id: int('id').primaryKey().autoincrement(),
	bookId: int('book_id')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' }),
	userId: varchar('user_id', { length: 255 }).references(() => user.id),
	reviewerName: varchar('reviewer_name', { length: 150 }).notNull(),
	reviewerEmail: varchar('reviewer_email', { length: 100 }),
	rating: int('rating'), // 1–5, validate in the app layer
	title: varchar('title', { length: 200 }),
	content: text('content').notNull(),
	isApproved: boolean('is_approved').default(false),
	...publicTimestamps
});

/** "Related Resources" on a book page. */
export const bookResources = mysqlTable('book_resources', {
	id: int('id').primaryKey().autoincrement(),
	bookId: int('book_id')
		.notNull()
		.references(() => books.id, { onDelete: 'cascade' }),
	resourceId: int('resource_id')
		.notNull()
		.references(() => blog.id, { onDelete: 'cascade' })
});

/* ========================================================================== */
/* TESTIMONIALS / STORIES                                                     */
/* ========================================================================== */

export const testimonials = mysqlTable('testimonials', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 255 }).notNull(),
	position: varchar('position', { length: 255 }),
	title: varchar('title', { length: 255 }), // story headline
	message: text('message').notNull(),
	avatar: varchar('avatar', { length: 255 }),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	projectId: int('project_id').references(() => projects.id),
	eventId: int('event_id').references(() => events.id),
	storyDate: date('story_date'),
	/** Never publish a story where this is false — enforce it in the query layer. */
	permissionGiven: boolean('permission_given').default(false).notNull(),
	isPublished: boolean('is_published').default(false),
	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	...secureFields
});

/* ========================================================================== */
/* GALLERIES                                                                  */
/* ========================================================================== */

export const galleries = mysqlTable('galleries', {
	id: int('id').primaryKey().autoincrement(),
	title: varchar('title', { length: 200 }).notNull(),
	description: varchar('description', { length: 255 }),
	coverImage: varchar('cover_image', { length: 255 }),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	eventId: int('event_id').references(() => events.id),
	projectId: int('project_id').references(() => projects.id),
	capturedOn: date('captured_on'),
	isPublished: boolean('is_published').default(true),
	isFeaturedOnHome: boolean('is_featured_on_home').default(false),
	...secureFields
});

export const galleryItems = mysqlTable('gallery_items', {
	id: int('id').primaryKey().autoincrement(),
	galleryId: int('gallery_id')
		.notNull()
		.references(() => galleries.id, { onDelete: 'cascade' }),
	mediaType: mysqlEnum('media_type', ['image', 'video']).default('image'),
	url: varchar('url', { length: 500 }).notNull(),
	thumbnailUrl: varchar('thumbnail_url', { length: 500 }),
	caption: varchar('caption', { length: 255 }),
	sortOrder: int('sort_order').default(0)
});

/* ========================================================================== */
/* PAYMENTS & TRANSACTIONS                                                    */
/* ========================================================================== */

export const paymentMethods = mysqlTable('payment_methods', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 100 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	logo: varchar('logo', { length: 255 }),
	...secureFields
});

/** Bank account / wallet details displayed for manual transfers. */
export const paymentAccounts = mysqlTable('payment_accounts', {
	id: int('id').primaryKey().autoincrement(),
	paymentMethodId: int('payment_method_id')
		.notNull()
		.references(() => paymentMethods.id, { onDelete: 'cascade' }),
	accountName: varchar('account_name', { length: 150 }).notNull(),
	accountNumber: varchar('account_number', { length: 100 }).notNull(),
	bankName: varchar('bank_name', { length: 150 }),
	branch: varchar('branch', { length: 150 }),
	swiftCode: varchar('swift_code', { length: 20 }),
	currency: varchar('currency', { length: 3 }).default('ETB'),
	instructions: varchar('instructions', { length: 500 }),
	sortOrder: int('sort_order').default(0),
	...secureFields
});

/**
 * One transactions table serves orders, event registrations, book sales and
 * donations — hence `purpose`, without which you can't separate them in reporting.
 */
export const transactions = mysqlTable('transactions', {
	id: int('id').primaryKey().autoincrement(),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	currency: varchar('currency', { length: 3 }).default('ETB'),
	txnRef: varchar('txn_ref', { length: 255 }),
	purpose: mysqlEnum('purpose', [
		'order',
		'event_registration',
		'donation',
		'book_purchase',
		'other'
	]).default('order'),
	paymentStatus: mysqlEnum('payment_status', [
		'pending',
		'paid',
		'unpaid',
		'refunded',
		'partially_paid',
		'partially_refunded',
		'overpaid',
		'disputed'
	]).default('pending'),
	paymentMethodId: int('payment_method_id').references(() => paymentMethods.id, {
		onDelete: 'set null'
	}),
	recieptLink: varchar('reciept_link', { length: 255 }),
	...secureFields
});

/* ========================================================================== */
/* DONATIONS                                                                  */
/* ========================================================================== */

/** "Purpose" — Youth, Marriage, Facility, or a specific project. */
export const donationCauses = mysqlTable('donation_causes', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 150 }).notNull().unique(),
	slug: varchar('slug', { length: 170 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	details: text('details'),
	image: varchar('image', { length: 255 }),
	ministryAreaId: int('ministry_area_id').references(() => ministryAreas.id),
	projectId: int('project_id').references(() => projects.id),
	goalAmount: decimal('goal_amount', { precision: 12, scale: 2 }),
	raisedAmount: decimal('raised_amount', { precision: 12, scale: 2 }).default('0.00'),
	currency: varchar('currency', { length: 3 }).default('ETB'),
	sortOrder: int('sort_order').default(0),
	...secureFields
});

/** The $10 / $15 / $29 quick-pick buttons. */
export const donationPresets = mysqlTable('donation_presets', {
	id: int('id').primaryKey().autoincrement(),
	causeId: int('cause_id').references(() => donationCauses.id, { onDelete: 'cascade' }),
	amount: decimal('amount', { precision: 10, scale: 2 }).notNull(),
	currency: varchar('currency', { length: 3 }).default('ETB'),
	label: varchar('label', { length: 100 }),
	sortOrder: int('sort_order').default(0)
});

export const donations = mysqlTable('donations', {
	id: int('id').primaryKey().autoincrement(),
	donorName: varchar('donor_name', { length: 150 }),
	donorEmail: varchar('donor_email', { length: 100 }),
	donorPhone: varchar('donor_phone', { length: 20 }),
	userId: varchar('user_id', { length: 255 }).references(() => user.id),

	causeId: int('cause_id').references(() => donationCauses.id),
	projectId: int('project_id').references(() => projects.id),

	amount: decimal('amount', { precision: 12, scale: 2 }).notNull(),
	currency: varchar('currency', { length: 3 }).default('ETB'),

	isRecurring: boolean('is_recurring').default(false),
	recurrenceInterval: mysqlEnum('recurrence_interval', ['monthly', 'quarterly', 'yearly']),
	nextChargeAt: date('next_charge_at'),

	isAnonymous: boolean('is_anonymous').default(false),
	message: varchar('message', { length: 500 }),

	transactionId: int('transaction_id').references(() => transactions.id),
	paymentAccountId: int('payment_account_id').references(() => paymentAccounts.id),

	status: mysqlEnum('status', ['pending', 'completed', 'failed', 'refunded', 'cancelled']).default(
		'pending'
	),
	receiptSentAt: timestamp('receipt_sent_at'),
	...publicTimestamps
});

/* ========================================================================== */
/* PRODUCTS & INVENTORY                                                       */
/* ========================================================================== */

export const productSuppliers = mysqlTable('product_suppliers', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 50 }).notNull(),
	phone: varchar('phone', { length: 20 }).notNull(),
	email: varchar('email', { length: 100 }),
	description: varchar('description', { length: 255 }),
	...secureFields
});

export const products = mysqlTable('products', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 50 }).notNull(),
	brand: varchar('brand', { length: 100 }),
	featuredImage: varchar('featured_image', { length: 255 }),
	description: varchar('description', { length: 255 }),
	quantity: int('quantity').notNull().default(0),
	commissionAmount: decimal('commission_amount', { precision: 10, scale: 2 }).notNull(),
	supplierId: int('supplier_id').references(() => productSuppliers.id),
	reorderLevel: int('reorder_level'),
	...secureFields
});

export const productCategories = mysqlTable('product_categories', {
	id: int('id').autoincrement().primaryKey(),
	name: varchar('name', { length: 50 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	...secureFields
});

export const categoriesProducts = mysqlTable('categories_products', {
	id: int('id').autoincrement().primaryKey(),
	categoryId: int('category_id').references(() => productCategories.id, { onDelete: 'cascade' }),
	productId: int('product_id').references(() => products.id, { onDelete: 'cascade' }),
	...secureFields
});

export const productTags = mysqlTable('product_tags', {
	id: int('id').autoincrement().primaryKey(),
	productId: int('product_id').references(() => products.id, { onDelete: 'cascade' }),
	tagId: int('tag_id').references(() => tags.id, { onDelete: 'cascade' })
});

export const prices = mysqlTable('prices', {
	id: int('id').primaryKey().autoincrement(),
	productId: int('product_id').references(() => products.id, { onDelete: 'cascade' }),
	price: decimal('price', { precision: 10, scale: 2 }).notNull(),
	// Renamed from `amount` — the column was already called `variant`.
	variant: varchar('variant', { length: 255 }).notNull()
});

export const productImages = mysqlTable('product_images', {
	id: int('id').primaryKey().autoincrement(),
	productId: int('product_id').references(() => products.id, { onDelete: 'cascade' }),
	imageUrl: varchar('image_url', { length: 255 }).notNull()
});

export const discounts = mysqlTable('discounts', {
	id: int('id').primaryKey().autoincrement(),
	amount: decimal('amount', { precision: 10, scale: 2 }),
	productId: int('product_id').references(() => products.id, { onDelete: 'cascade' }),
	name: varchar('name', { length: 50 }).notNull().unique(),
	description: varchar('description', { length: 255 }),
	...secureFields
});

export const productAdjustments = mysqlTable('product_adjustments', {
	id: int('id').autoincrement().primaryKey(),
	productsId: int('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	supplierId: int('supplier_id').references(() => productSuppliers.id),
	adjustment: int('adjustment').notNull(), // +50 for new stock, -1 for a sale or internal use
	reason: varchar('reason', { length: 255 }),
	transactionId: int('transaction_id').references(() => transactions.id),
	...secureFields
});

export const damagedProducts = mysqlTable('damaged_products', {
	id: int('id').primaryKey().autoincrement(),
	productId: int('product_id')
		.notNull()
		.references(() => products.id, { onDelete: 'cascade' }),
	quantity: int('quantity').notNull(),
	// Was varchar(36) with no FK — user.id is varchar(255), so ids were being truncated.
	damagedBy: varchar('damaged_by', { length: 255 })
		.notNull()
		.references(() => user.id),
	reason: varchar('reason', { length: 255 }).notNull(),
	...secureFields
});

/* ========================================================================== */
/* ORDERS                                                                     */
/* ========================================================================== */

export const orders = mysqlTable('orders', {
	id: int('id').autoincrement().primaryKey(),
	customerId: int('customer_id').references(() => customers.id),
	status: mysqlEnum('status', ['pending', 'delivered', 'cancelled']),
	transactionId: int('transaction_id').references(() => transactions.id),
	...secureFields
});

export const orderItems = mysqlTable('order_items', {
	id: int('id').autoincrement().primaryKey(),
	orderId: int('order_id').references(() => orders.id),
	productId: int('product_id').references(() => products.id),
	quantity: int('quantity').notNull(),
	price: decimal('price', { precision: 10, scale: 2 }).notNull(),
	// Renamed from `amount` for consistency with `prices.variant`.
	variant: varchar('variant', { length: 255 }).notNull(),
	...secureFields
});

/* ========================================================================== */
/* INBOUND MESSAGES                                                           */
/* ========================================================================== */

export const contactMessages = mysqlTable('contact_messages', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 255 }).notNull(),
	email: varchar('email', { length: 100 }).notNull(),
	phone: varchar('phone', { length: 20 }),
	subject: varchar('subject', { length: 255 }).notNull(),
	address: varchar('address', { length: 255 }),
	message: text('message').notNull(),
	seen: boolean('seen').default(false),
	...publicTimestamps
});

export const prayerRequests = mysqlTable('prayer_requests', {
	id: int('id').primaryKey().autoincrement(),
	name: varchar('name', { length: 150 }).notNull(),
	email: varchar('email', { length: 100 }),
	phone: varchar('phone', { length: 20 }),
	userId: varchar('user_id', { length: 255 }).references(() => user.id),
	request: text('request').notNull(),
	category: mysqlEnum('category', [
		'healing',
		'family',
		'marriage',
		'financial',
		'spiritual',
		'other'
	]).default('other'),
	isPublic: boolean('is_public').default(false),
	isAnonymous: boolean('is_anonymous').default(false),
	status: mysqlEnum('status', ['new', 'reviewed', 'prayed_for', 'archived']).default('new'),
	assignedToId: int('assigned_to_id').references(() => teamMembers.id),
	staffNotes: varchar('staff_notes', { length: 500 }),
	prayerCount: int('prayer_count').default(0),
	...publicTimestamps
});