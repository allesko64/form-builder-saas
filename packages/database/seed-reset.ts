import { db, eq, inArray, like, or } from "./index";
import { formsTable, user } from "./schema";

export const DEMO_EMAIL = "demo@formbuilder.dev";

/** Reserved public slugs — removed before each seed so reruns never collide. */
export const SEED_FORM_SLUGS = [
  "anime-character-poll",
  "startup-feedback",
  "gaming-tournament-signup",
  // Legacy slug from older seeds
  "dev-tools-survey",
] as const;

const INTEGRATION_EMAIL_PATTERN = "%@integration.local";

export type SeedResetSummary = {
  formsBySlug: number;
  integrationUsers: number;
  demoUserRemoved: boolean;
};

function seedLog(message: string): void {
  process.stdout.write(`${message}\n`);
}

/**
 * Wipes demo + integration-test clutter so `pnpm db:seed` always starts fresh.
 * Order: reserved slugs → integration users → demo user (all cascade children).
 */
export async function resetBeforeDemoSeed(): Promise<SeedResetSummary> {
  const summary: SeedResetSummary = {
    formsBySlug: 0,
    integrationUsers: 0,
    demoUserRemoved: false,
  };

  const removedForms = await db
    .delete(formsTable)
    .where(inArray(formsTable.slug, [...SEED_FORM_SLUGS]))
    .returning({ id: formsTable.id });

  summary.formsBySlug = removedForms.length;
  if (summary.formsBySlug > 0) {
    seedLog(
      `Removed ${summary.formsBySlug} dossier(s) with reserved seed slug(s) (responses/fields cascaded).`,
    );
  }

  const integrationUsers = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(
      or(
        like(user.email, INTEGRATION_EMAIL_PATTERN),
        like(user.email, "test-%"),
        like(user.email, "auth-%"),
      ),
    );

  if (integrationUsers.length > 0) {
    for (const row of integrationUsers) {
      await db.delete(user).where(eq(user.id, row.id));
    }
    summary.integrationUsers = integrationUsers.length;
    seedLog(
      `Removed ${summary.integrationUsers} integration-test user(s) (@integration.local / test-* / auth-*).`,
    );
  }

  const [demo] = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.email, DEMO_EMAIL))
    .limit(1);

  if (demo) {
    await db.delete(user).where(eq(user.id, demo.id));
    summary.demoUserRemoved = true;
    seedLog(`Removed demo user ${DEMO_EMAIL} and cascaded dossiers.`);
  }

  return summary;
}
