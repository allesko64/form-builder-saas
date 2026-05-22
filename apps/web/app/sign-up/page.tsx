"use client";

import { signUp, useSession } from "@repo/auth/client";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
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

const signUpSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    email: z.email("Enter a valid email"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type SignUpValues = z.infer<typeof signUpSchema>;

export default function SignUpPage() {
  const router = useRouter();
  const { data: session, isPending: sessionPending } = useSession();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!sessionPending && session?.user) {
      router.replace("/dashboard");
    }
  }, [session, sessionPending, router]);

  if (sessionPending || session?.user) {
    return (
      <main className="dossier-theme dossier-meta flex min-h-screen items-center justify-center bg-[var(--color-paper)]">
        VERIFYING CLEARANCE...
      </main>
    );
  }

  async function onSubmit(values: SignUpValues) {
    setIsSubmitting(true);

    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
    });

    setIsSubmitting(false);

    if (error) {
      toast.error(error.message ?? "Could not create account");
      return;
    }

    toast.success("Account created");
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <DossierAuthLayout
      headline="OPERATIVE REGISTRATION"
      description="New operatives must register their credentials before accessing classified intelligence archives. All information is subject to verification."
      footer={
        <>
          EXISTING OPERATIVE? <DossierLink href="/sign-in">VERIFY IDENTITY</DossierLink>
        </>
      }
    >
      <DossierFormPanelTitle>REGISTRATION DOSSIER</DossierFormPanelTitle>

      <GoogleSignInButton callbackURL="/dashboard" />
      <DossierDivider />

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <DossierLabel>Name</DossierLabel>
                <FormControl>
                  <DossierInput placeholder="Jane Doe" autoComplete="name" {...field} />
                </FormControl>
                <DossierFormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <DossierLabel>Email</DossierLabel>
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
                <DossierLabel>Password</DossierLabel>
                <FormControl>
                  <DossierInput type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <DossierFormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <DossierLabel>Confirm password</DossierLabel>
                <FormControl>
                  <DossierInput type="password" autoComplete="new-password" {...field} />
                </FormControl>
                <DossierFormMessage />
              </FormItem>
            )}
          />
          <DossierButton
            type="submit"
            isSubmitting={isSubmitting}
            submittingText="PROCESSING REQUEST..."
            className="mt-2"
          >
            SUBMIT REGISTRATION
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
