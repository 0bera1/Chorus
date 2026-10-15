import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

export const presentations = pgTable('presentations', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  title: text('title').notNull(),
  /** HMAC-SHA256 hash of the host key; the raw key is never stored */
  hostKeyHash: text('host_key_hash').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const slides = pgTable(
  'slides',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    type: text('type').notNull(),
    question: text('question').notNull(),
    options: jsonb('options').$type<{ id: string; text: string }[]>().notNull().default([]),
    settings: jsonb('settings')
      .$type<{ allowVoteChange: boolean; showResults: boolean; votingOpen: boolean; hideOpenText: boolean }>()
      .notNull(),
  },
  (t) => [uniqueIndex('slides_presentation_position_uq').on(t.presentationId, t.position)],
);

export const rooms = pgTable(
  'rooms',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    presentationId: uuid('presentation_id')
      .notNull()
      .references(() => presentations.id, { onDelete: 'cascade' }),
    code: text('code').notNull(),
    status: text('status', { enum: ['lobby', 'live', 'ended'] })
      .notNull()
      .default('lobby'),
    currentSlideId: uuid('current_slide_id').references(() => slides.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
  },
  (t) => [uniqueIndex('rooms_code_uq').on(t.code)],
);

export const participants = pgTable(
  'participants',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    /** HMAC-SHA256 hash of the anonymous session token */
    tokenHash: text('token_hash').notNull(),
    nickname: text('nickname'),
    joinedAt: timestamp('joined_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('participants_room_token_uq').on(t.roomId, t.tokenHash)],
);

/** One answer per participant per slide (unique constraint guarantees it) */
export const responses = pgTable(
  'responses',
  {
    id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
    roomId: uuid('room_id')
      .notNull()
      .references(() => rooms.id, { onDelete: 'cascade' }),
    slideId: uuid('slide_id')
      .notNull()
      .references(() => slides.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
    payload: jsonb('payload').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex('responses_slide_participant_uq').on(t.slideId, t.participantId)],
);

export const qaQuestions = pgTable('qa_questions', {
  id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
  roomId: uuid('room_id')
    .notNull()
    .references(() => rooms.id, { onDelete: 'cascade' }),
  participantId: uuid('participant_id')
    .notNull()
    .references(() => participants.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  hidden: boolean('hidden').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const qaUpvotes = pgTable(
  'qa_upvotes',
  {
    questionId: uuid('question_id')
      .notNull()
      .references(() => qaQuestions.id, { onDelete: 'cascade' }),
    participantId: uuid('participant_id')
      .notNull()
      .references(() => participants.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.questionId, t.participantId] })],
);
