import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { afterEach, describe, it } from "node:test";

import { db, eq } from "@repo/database";
import { account, session, user } from "@repo/database/schema";

describe("auth flow (integration)", () => {
  const createdUserIds: string[] = [];

  afterEach(async () => {
    for (const userId of createdUserIds.splice(0)) {
      await db.delete(session).where(eq(session.userId, userId));
      await db.delete(account).where(eq(account.userId, userId));
      await db.delete(user).where(eq(user.id, userId));
    }
  });

  it("signs up with email/password and persists the user", async () => {
    const { auth } = await import("@repo/auth");

    const email = `auth-${randomUUID().slice(0, 8)}@integration.local`;
    const password = "IntegrationTest1!";

    const signUp = await auth.api.signUpEmail({
      body: {
        email,
        password,
        name: "Auth Integration",
      },
    });

    assert.equal(signUp.user.email, email);
    createdUserIds.push(signUp.user.id);

    const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email));
    assert.ok(row);
    assert.equal(row.id, signUp.user.id);
  });

  it("rejects sign-in with wrong password", async () => {
    const { auth } = await import("@repo/auth");

    const email = `auth-${randomUUID().slice(0, 8)}@integration.local`;
    const password = "IntegrationTest1!";

    const signUp = await auth.api.signUpEmail({
      body: { email, password, name: "Auth Integration" },
    });
    createdUserIds.push(signUp.user.id);

    await assert.rejects(() =>
      auth.api.signInEmail({
        body: { email, password: "WrongPassword1!" },
      }),
    );
  });
});
