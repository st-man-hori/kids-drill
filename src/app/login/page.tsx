"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { NumericKeypad } from "@/components/numeric-keypad";

const PIN_LENGTH = 6;

function DigitBoxes({ length, value }: { length: number; value: string }) {
  return (
    <div className="flex gap-2 justify-center" aria-hidden>
      {Array.from({ length }).map((_, i) => (
        <div
          key={i}
          className="flex h-12 w-9 items-center justify-center rounded-sm bg-black/5 text-2xl font-bold text-foreground"
        >
          {value[i] ?? ""}
        </div>
      ))}
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<"id" | "pin">("id");
  const [loginId, setLoginId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function submit(finishedPin: string) {
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      loginId,
      pin: finishedPin,
      redirect: false,
    });
    setSubmitting(false);

    if (!result || result.error) {
      // ID・PINどちらが違うかは区別しないメッセージ（docs/architecture.md参照）
      setError("ID（あいでぃー）か ひみつのばんごうが ちがうみたい。もういちどためしてね");
      setPin("");
      return;
    }

    router.push("/");
  }

  function handleDigit(digit: string) {
    if (submitting) return;
    if (step === "id") {
      setLoginId((v) => v + digit);
      return;
    }
    const next = pin + digit;
    setPin(next);
    if (next.length === PIN_LENGTH) {
      submit(next);
    }
  }

  function handleBackspace() {
    if (submitting) return;
    if (step === "id") {
      setLoginId((v) => v.slice(0, -1));
    } else {
      setPin((v) => v.slice(0, -1));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)]">
      <h1 className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
        {step === "id" ? "ID（あいでぃー）を おしてね" : "ひみつのばんごうを おしてね"}
      </h1>

      {step === "id" ? (
        <div className="min-h-12 text-3xl font-bold tracking-widest text-foreground">
          {loginId || " "}
        </div>
      ) : (
        <DigitBoxes length={PIN_LENGTH} value={pin} />
      )}

      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ x: 0 }}
            animate={{ x: [0, -8, 8, -8, 8, 0] }}
            transition={{ duration: 0.4 }}
            className="rounded-md bg-warning/20 px-4 py-2 text-center font-bold text-foreground"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <NumericKeypad onDigit={handleDigit} onBackspace={handleBackspace} disabled={submitting} />

      {step === "id" && (
        <motion.button
          type="button"
          whileTap={{ scale: 0.95 }}
          disabled={loginId.length === 0}
          onClick={() => setStep("pin")}
          className="rounded-full bg-brand px-10 py-3 text-xl font-bold text-brand-foreground disabled:opacity-40"
        >
          つぎへ
        </motion.button>
      )}
    </div>
  );
}
