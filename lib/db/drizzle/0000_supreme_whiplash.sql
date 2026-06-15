CREATE TABLE "patients" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" text NOT NULL,
	"name" text NOT NULL,
	"name_hindi" text,
	"age" integer,
	"gender" text,
	"phone" text,
	"blood_group" text,
	"abha_id" text,
	"village" text,
	"district" text,
	"referred_by" text,
	"department" text NOT NULL,
	"priority" text DEFAULT 'normal' NOT NULL,
	"status" text DEFAULT 'waiting' NOT NULL,
	"doctor_id" integer,
	"doctor_name" text,
	"reason" text,
	"journey_step" text DEFAULT 'registered' NOT NULL,
	"ai_summary" text,
	"estimated_wait_minutes" integer,
	"queue_position" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"called_at" timestamp,
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "doctors" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"specialty" text NOT NULL,
	"department" text NOT NULL,
	"qualification" text,
	"registration_no" text,
	"status" text DEFAULT 'available' NOT NULL,
	"current_patient_id" integer,
	"current_patient_name" text,
	"patients_seen_today" integer DEFAULT 0 NOT NULL,
	"avg_consult_minutes" numeric DEFAULT '15' NOT NULL
);
--> statement-breakpoint
CREATE TABLE "activity" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"patient_name" text,
	"patient_token" text,
	"department" text,
	"priority" text,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"type" text DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"department" text,
	"confidence" numeric,
	"created_at" timestamp DEFAULT now() NOT NULL
);
