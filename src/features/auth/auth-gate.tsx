"use client";

import { motion } from "framer-motion";
import { Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { firebaseEnvKeys } from "@/lib/firebase/client";
import { AuthProvider, useAuth } from "./auth-context";

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <AuthGateInner>{children}</AuthGateInner>
    </AuthProvider>
  );
}

function AuthGateInner({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();

  if (!configured) {
    return <MissingFirebaseConfig />;
  }

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-synapse-radial">
        <div className="glass-panel flex items-center gap-3 rounded-lg px-5 py-4 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin text-primary" />
          Loading SYNAPSE NOTES
        </div>
      </main>
    );
  }

  if (!user) {
    return <AuthForm />;
  }

  return children;
}

function MissingFirebaseConfig() {
  return (
    <main className="grid min-h-screen place-items-center px-6">
      <section className="glass-panel w-full max-w-2xl rounded-lg p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-md bg-primary/20 text-primary shadow-glow">
            <Sparkles className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              SYNAPSE NOTES
            </h1>
            <p className="text-sm text-muted-foreground">
              Firebase environment variables are required before sign in.
            </p>
          </div>
        </div>
        <div className="rounded-md border border-white/10 bg-black/20 p-4">
          <p className="mb-3 text-sm text-muted-foreground">
            Create `.env.local` and add these public Firebase web app keys:
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {firebaseEnvKeys.map((key) => (
              <code
                className="rounded-md bg-white/5 px-3 py-2 text-xs text-fuchsia-100"
                key={key}
              >
                {key}
              </code>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

function AuthForm() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setBusy(true);

    try {
      if (mode === "signin") {
        await signIn(email, password);
      } else {
        await signUp(email, password);
      }
    } catch (authError) {
      setError(
        authError instanceof Error
          ? authError.message
          : "Authentication failed."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center px-6">
      <motion.section
        animate={{ opacity: 1, y: 0 }}
        className="glass-panel w-full max-w-md rounded-lg p-8"
        initial={{ opacity: 0, y: 18 }}
        transition={{ duration: 0.45, ease: "easeOut" }}
      >
        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-12 place-items-center rounded-md bg-primary/20 text-primary shadow-glow">
            <LockKeyhole className="size-5" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-normal">
              SYNAPSE NOTES
            </h1>
            <p className="text-sm text-muted-foreground">
              A focused study workspace for modern notes.
            </p>
          </div>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <Input
            autoComplete="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Email"
            required
            type="email"
            value={email}
          />
          <Input
            autoComplete={
              mode === "signin" ? "current-password" : "new-password"
            }
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Password"
            required
            type="password"
            value={password}
          />
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-red-100">
              {error}
            </p>
          ) : null}
          <Button className="w-full" disabled={busy} type="submit">
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            {mode === "signin" ? "Sign In" : "Create Account"}
          </Button>
        </form>

        <div className="mt-5 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {mode === "signin" ? "New to SYNAPSE?" : "Already have an account?"}
          </span>
          <button
            className="font-medium text-fuchsia-200 transition hover:text-white"
            onClick={() =>
              setMode((current) => (current === "signin" ? "signup" : "signin"))
            }
            type="button"
          >
            {mode === "signin" ? "Create account" : "Sign in"}
          </button>
        </div>
      </motion.section>
    </main>
  );
}
