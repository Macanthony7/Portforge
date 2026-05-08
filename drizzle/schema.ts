import { pgTable, uuid, text, timestamp, jsonb, pgEnum, boolean } from 'drizzle-orm/pg-core'

export const careerTrackEnum = pgEnum('career_track', ['cybersecurity', 'software_dev', 'devops_cloud'])
export const documentationModeEnum = pgEnum('documentation_mode', ['static', 'integrative'])
export const projectStatusEnum = pgEnum('project_status', ['draft', 'complete', 'exported'])
export const subscriptionTierEnum = pgEnum('subscription_tier', ['free', 'pro', 'audit'])

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey(),
  email: text('email').notNull(),
  full_name: text('full_name'),
  username: text('username').unique(),
  career_track: careerTrackEnum('career_track'),
  documentation_mode: documentationModeEnum('documentation_mode').notNull().default('static'),
  subscription_tier: subscriptionTierEnum('subscription_tier').notNull().default('free'),
  portfolio_public: boolean('portfolio_public').notNull().default(true),
  bio: text('bio'),
  created_at: timestamp('created_at').defaultNow().notNull(),
})

export const projects = pgTable('projects', {
  id: uuid('id').primaryKey().defaultRandom(),
  user_id: uuid('user_id').notNull().references(() => profiles.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  career_track: careerTrackEnum('career_track').notNull(),
  template_id: text('template_id').notNull(),
  design_theme: text('design_theme').notNull().default('default'),
  status: projectStatusEnum('status').notNull().default('draft'),
  public: boolean('public').notNull().default(false),
  content: jsonb('content').notNull().default({}),
  created_at: timestamp('created_at').defaultNow().notNull(),
  updated_at: timestamp('updated_at').defaultNow().notNull(),
})

export const ai_sessions = pgTable('ai_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  project_id: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
  answers: jsonb('answers').notNull().default({}),
  generated_content: text('generated_content'),
  completed: boolean('completed').notNull().default(false),
  created_at: timestamp('created_at').defaultNow().notNull(),
})
