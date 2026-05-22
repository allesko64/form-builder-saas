"use client";

import { Suspense } from "react";
import { signIn, useSession } from "@repo/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { DossierAuthLayout } from "~/components/auth/dossier-auth-layout";
import {
  DossierButton,
  DossierDivider,
  DossierFooterText,
  DossierFormMessage,
  DossierFormPanelTitle,
  DossierInput,
  DossierLabel,
  DossierLink,
} from "~/components/auth/dossier-fields";
import { GoogleSignInButton } from "~/components/auth/google-sign-in-button";
import { Form, FormControl, FormField, FormItem } from "~/components/ui/form";

const signInSchema = z.object({
  email: z.email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

type SignInValues = z.infer<typeof signInSchema>;

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";
  const { data: session, isPending: sessionPending } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace(callbackUrl);
    }
  }, [session, sessionPending, router, callbackUrl]);

  if (sessionPending || session?.user) {
    return (
      <main className="dossier-theme dossier-meta flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        VERIFYING CLEARANCE...
      </main>
    );
  }

  async function onSubmit(values: SignInValues) {
    setIsSubmitting(true);

    const { error } = await signIn.email({
      email: values.email,
      password: values.password,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Invalid email or password");
      return;
    }

    toast.success("Signed in");
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <DossierAuthLayout
      headline="IDENTITY VERIFICATION"
      description="Confirm your identity to gain access to classified intelligence archives. Unauthorized access attempts are logged and reported."
      footer={
        <>
          NEW OPERATIVE? <DossierLink href="/sign-up">REQUEST ACCESS</DossierLink>
        </>
      }
    >
      <DossierFormPanelTitle>ACCESS VERIFICATION FORM</DossierFormPanelTitle>

      <GoogleSignInButton callbackURL={callbackUrl} />
      <DossierDivider />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <DossierLabel>SECURE CHANNEL</DossierLabel>
                <FormControl>
                  <DossierInput
                    type="email"
                    placeholder="you@example.com"
                    autoComplete="email"
                    {...field}
                  />
                </FormControl>
                <DossierFormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <DossierLabel>ACCESS CODE</DossierLabel>
                <FormControl>
                  <DossierInput type="password" autoComplete="current-password" {...field} />
                </FormControl>
                <DossierFormMessage />
              </FormItem>
            )}
          />
          <DossierButton
            type="submit"
            isSubmitting={isSubmitting}
            submittingText="VERIFYING CREDENTIALS..."
            className="mt-2"
          >
            CONFIRM IDENTITY
          </DossierButton>
        </form>
      </Form>

      <DossierFooterText>
        <Link href="/" className="dossier-nav no-underline hover:underline">
          RETURN TO PUBLIC TERMINAL
        </Link>
      </DossierFooterText>
    </DossierAuthLayout>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="dossier-theme dossier-meta flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
          LOADING DOSSIER...
        </main>
      }
    >
      <SignInForm />
    </Suspense>
  );
}
