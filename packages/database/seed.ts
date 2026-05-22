/**
 * Demo database seed — run: pnpm db:seed (from repo root)
 *
 * Always resets first: reserved slugs, integration-test users, then demo user.
 */
import { hashPassword } from "@better-auth/utils/password";
import { randomUUID } from "node:crypto";

import { db } from "./index";
import type { FieldValidationConfig } from "./models/form-fields";
import { formFieldsTable } from "./models/form-fields";
import { formsTable } from "./models/forms";
import type { ResponseAnswers } from "./models/responses";
import { responsesTable } from "./models/responses";
import { account, user } from "./models/user";
import { DEMO_EMAIL, resetBeforeDemoSeed } from "./seed-reset";

const DEMO_PASSWORD = "Demo1234!";
const DEMO_NAME = "Demo Operative";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

function seedLog(message: string): void {
  process.stdout.write(`${message}\n`);
}

type SeedFieldDef = {
  label: string;
  type: (typeof formFieldsTable.$inferInsert)["type"];
  sortOrder: number;
  required?: boolean;
  placeholder?: string | null;
  helpText?: string | null;
  validationConfig?: FieldValidationConfig | null;
};

type SeedFormDef = {
  title: string;
  slug: string;
  description: string;
  status: "published_public" | "published_unlisted";
  theme?: Record<string, unknown>;
  submitButtonText?: string;
  successMessage?: string;
  collectRespondentEmail?: boolean;
  fields: SeedFieldDef[];
  responseCount: number;
  buildAnswers: (ctx: AnswerContext) => ResponseAnswers;
  answerKeys: readonly string[];
};

type AnswerContext = {
  pick: <T>(items: T[]) => T;
  pickMany: <T>(items: T[], min: number, max: number) => T[];
  int: (min: number, max: number) => number;
  maybe: (probability: number) => boolean;
};

function createRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function makeContext(seed: number): AnswerContext {
  const next = createRng(seed);
  return {
    pick: (items) => items[Math.floor(next() * items.length)]!,
    pickMany: (items, min, max) => {
      const count = Math.min(items.length, min + Math.floor(next() * (max - min + 1)));
      const copy = [...items];
      const out: typeof items = [];
      for (let i = 0; i < count; i++) {
        const idx = Math.floor(next() * copy.length);
        out.push(copy.splice(idx, 1)[0]!);
      }
      return out;
    },
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    maybe: (p) => next() < p,
  };
}

function randomCreatedAt(rng: () => number): Date {
  const offset = Math.floor(rng() * THIRTY_DAYS_MS);
  return new Date(Date.now() - offset);
}

const ANIME_OPTIONS = [
  "Naruto",
  "One Piece",
  "Attack on Titan",
  "Fullmetal Alchemist",
  "Demon Slayer",
  "Spy x Family",
];

const PERSONALITY_TYPES = [
  "The Strategist",
  "The Hothead",
  "The Mentor",
  "The Comic Relief",
  "The Mysterious Rival",
];

const STARTUP_STAGES = ["Idea", "MVP", "Growth"];

const HIRING_ROLES = [
  "Full-stack engineer",
  "Product designer",
  "DevOps / SRE",
  "Founding PM",
  "Sales lead",
];

const GAMES = ["Valorant", "League of Legends", "CS2", "Rocket League", "Street Fighter 6"];

const EXPERIENCE_TIERS = ["Casual", "Ranked grinder", "Semi-pro", "LAN veteran"];

const QUOTES = [
  "Believe it!",
  "I am here!",
  "People die when they are killed.",
  "Plus ultra!",
  "Dattebayo!",
];

const CHALLENGES = [
  "Finding product-market fit",
  "Hiring engineers",
  "Managing burn rate",
  "Enterprise sales cycle",
  "Scaling infrastructure",
];

const COMPANIES = [
  "Acme Labs",
  "Northwind Analytics",
  "Orbital Systems",
  "Redwood AI",
  "Summit Health",
];

const SEED_FORMS: SeedFormDef[] = [
  {
    title: "Anime Personality Test",
    slug: "anime-character-poll",
    description: "Classified operative profiling — which archetype are you?",
    status: "published_public",
    theme: { preset: "classic" },
    submitButtonText: "SUBMIT DOSSIER",
    successMessage: "Transmission received. Your personality file has been logged.",
    collectRespondentEmail: false,
    answerKeys: ["anime", "archetype", "rating", "quote"],
    fields: [
      {
        label: "Favourite anime",
        type: "single_select",
        sortOrder: 0,
        required: true,
        validationConfig: { options: ANIME_OPTIONS },
      },
      {
        label: "Your anime archetype",
        type: "single_select",
        sortOrder: 1,
        required: true,
        validationConfig: { options: PERSONALITY_TYPES },
      },
      {
        label: "How iconic is your pick?",
        type: "rating",
        sortOrder: 2,
        required: true,
        validationConfig: { max: 5 },
      },
      {
        label: "Signature quote",
        type: "short_text",
        sortOrder: 3,
        required: false,
        placeholder: "Optional quote",
      },
    ],
    responseCount: 50,
    buildAnswers: ({ pick, int }) => ({
      anime: pick(ANIME_OPTIONS),
      archetype: pick(PERSONALITY_TYPES),
      rating: int(1, 5),
      quote: pick(QUOTES),
    }),
  },
  {
    title: "Startup Hiring Form",
    slug: "startup-feedback",
    description: "Field report for founders — role, stage, and hiring signal.",
    status: "published_public",
    theme: { preset: "classic" },
    submitButtonText: "FILE REPORT",
    successMessage: "Thank you — your briefing has been archived.",
    collectRespondentEmail: true,
    answerKeys: ["company", "role", "stage", "challenge", "pmf"],
    fields: [
      {
        label: "Company name",
        type: "short_text",
        sortOrder: 0,
        required: true,
      },
      {
        label: "Role you are hiring for",
        type: "single_select",
        sortOrder: 1,
        required: true,
        validationConfig: { options: HIRING_ROLES },
      },
      {
        label: "Company stage",
        type: "single_select",
        sortOrder: 2,
        required: true,
        validationConfig: { options: STARTUP_STAGES },
      },
      {
        label: "Biggest hiring challenge",
        type: "long_text",
        sortOrder: 3,
        required: true,
      },
      {
        label: "Team readiness (1–5)",
        type: "rating",
        sortOrder: 4,
        required: true,
        validationConfig: { max: 5 },
      },
    ],
    responseCount: 30,
    buildAnswers: ({ pick, int }) => ({
      company: pick(COMPANIES),
      role: pick(HIRING_ROLES),
      stage: pick(STARTUP_STAGES),
      challenge: pick(CHALLENGES),
      pmf: int(1, 5),
    }),
  },
  {
    title: "Gaming Tournament Signup",
    slug: "gaming-tournament-signup",
    description: "Unlisted bracket intake — gamertag, title, and experience tier.",
    status: "published_unlisted",
    theme: { preset: "classic" },
    submitButtonText: "ENTER BRACKET",
    successMessage: "Signup logged. Clearance: unlisted — check your comms channel.",
    collectRespondentEmail: true,
    answerKeys: ["gamertag", "game", "experience", "teamSize", "rules"],
    fields: [
      {
        label: "Gamertag",
        type: "short_text",
        sortOrder: 0,
        required: true,
        placeholder: "OperativeTag#1337",
      },
      {
        label: "Primary game",
        type: "single_select",
        sortOrder: 1,
        required: true,
        validationConfig: { options: GAMES },
      },
      {
        label: "Experience tier",
        type: "single_select",
        sortOrder: 2,
        required: true,
        validationConfig: { options: EXPERIENCE_TIERS },
      },
      {
        label: "Team size",
        type: "number",
        sortOrder: 3,
        required: true,
        validationConfig: { min: 1, max: 5 },
      },
      {
        label: "I accept tournament rules",
        type: "checkbox",
        sortOrder: 4,
        required: true,
      },
    ],
    responseCount: 20,
    buildAnswers: ({ pick, int, maybe }) => ({
      gamertag: `Op${int(100, 9999)}`,
      game: pick(GAMES),
      experience: pick(EXPERIENCE_TIERS),
      teamSize: int(1, 5),
      rules: maybe(0.92),
    }),
  },
];

async function createDemoUser() {
  const userId = randomUUID();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  await db.insert(user).values({
    id: userId,
    name: DEMO_NAME,
    email: DEMO_EMAIL,
    emailVerified: true,
  });

  await db.insert(account).values({
    id: randomUUID(),
    accountId: userId,
    providerId: "credential",
    userId,
    password: passwordHash,
  });

  return userId;
}

function mapAnswersToFieldIds(
  logical: ResponseAnswers,
  fieldIds: string[],
  keys: readonly string[],
): ResponseAnswers {
  const out: ResponseAnswers = {};
  keys.forEach((key, i) => {
    const fieldId = fieldIds[i];
    if (!fieldId) return;
    const value = logical[key];
    if (value !== undefined && value !== null && value !== "") {
      out[fieldId] = value;
    }
  });
  return out;
}

async function seedForm(userId: string, def: SeedFormDef, formIndex: number) {
  const [insertedForm] = await db
    .insert(formsTable)
    .values({
      userId,
      title: def.title,
      description: def.description,
      slug: def.slug,
      status: def.status,
      theme: def.theme ?? null,
      submitButtonText: def.submitButtonText ?? "Submit",
      successMessage: def.successMessage ?? null,
      collectRespondentEmail: def.collectRespondentEmail ?? false,
    })
    .returning();

  if (!insertedForm) {
    throw new Error(`Failed to insert form: ${def.title}`);
  }

  const insertedFields = await db
    .insert(formFieldsTable)
    .values(
      def.fields.map((f) => ({
        formId: insertedForm.id,
        label: f.label,
        type: f.type,
        sortOrder: f.sortOrder,
        required: f.required ?? false,
        placeholder: f.placeholder ?? null,
        helpText: f.helpText ?? null,
        validationConfig: f.validationConfig ?? null,
      })),
    )
    .returning();

  const fieldIds = insertedFields.sort((a, b) => a.sortOrder - b.sortOrder).map((f) => f.id);

  const rng = createRng(42_000 + formIndex * 1000);
  const rows: (typeof responsesTable.$inferInsert)[] = [];

  for (let i = 0; i < def.responseCount; i++) {
    const ctx = makeContext(1000 * formIndex + i);
    const logical = def.buildAnswers(ctx);
    const answers = mapAnswersToFieldIds(logical, fieldIds, def.answerKeys);

    rows.push({
      formId: insertedForm.id,
      submissionId: randomUUID(),
      answers,
      respondentEmail:
        def.collectRespondentEmail && typeof logical.email === "string"
          ? logical.email
          : def.collectRespondentEmail
            ? `player${ctx.int(1, 999)}@example.com`
            : null,
      ipHash: null,
      userAgent: "DossierSeed/1.0",
      completionTimeMs: 5_000 + Math.floor(rng() * 175_000),
      createdAt: randomCreatedAt(rng),
    });
  }

  const BATCH = 25;
  for (let i = 0; i < rows.length; i += BATCH) {
    await db.insert(responsesTable).values(rows.slice(i, i + BATCH));
  }

  seedLog(
    `  • ${def.title} (${def.status}) — ${def.fields.length} fields, ${def.responseCount} responses → /f/${def.slug}`,
  );

  return insertedForm;
}

async function main() {
  seedLog("Resetting database for fresh demo seed…\n");
  await resetBeforeDemoSeed();

  seedLog("\nSeeding demo dossier data…\n");
  const userId = await createDemoUser();
  seedLog(`Demo user: ${DEMO_EMAIL} / ${DEMO_PASSWORD}\n`);

  for (let i = 0; i < SEED_FORMS.length; i++) {
    await seedForm(userId, SEED_FORMS[i]!, i);
  }

  const totalResponses = SEED_FORMS.reduce((n, f) => n + f.responseCount, 0);
  seedLog(
    `\nDone. ${SEED_FORMS.length} dossiers, ${totalResponses} responses. Sign in → /dashboard or /explore.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
