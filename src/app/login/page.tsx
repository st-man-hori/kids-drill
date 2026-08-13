"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { NumericKeypad } from "@/components/numeric-keypad";
import { DigitBoxes } from "@/components/digit-boxes";

const CODE_LENGTH = 6;

const LoginPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<"id" | "pin">("id");
  const [loginId, setLoginId] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (finishedPin: string) => {
    setSubmitting(true);
    setError(null);
    const result = await signIn("credentials", {
      loginId,
      pin: finishedPin,
      redirect: false,
    });
    setSubmitting(false);

    if (!result || result.error) {
      // ID・PINどちらが違うかは区別しないメッセージ（docs/architecture.md参照）。
      // どちらが原因か分からない以上、ID入力からやり直させる
      setError("ID（あいでぃー）か ひみつのばんごうが ちがうみたい。もういちどためしてね");
      setStep("id");
      setLoginId("");
      setPin("");
      return;
    }

    router.push("/mypage");
  };

  const handleDigit = (digit: string) => {
    if (submitting) return;
    if (step === "id") {
      const next = loginId + digit;
      setLoginId(next);
      if (next.length === CODE_LENGTH) {
        setStep("pin");
      }
      return;
    }
    const next = pin + digit;
    setPin(next);
    if (next.length === CODE_LENGTH) {
      submit(next);
    }
  };

  const handleBackspace = () => {
    if (submitting) return;
    if (step === "id") {
      setLoginId((v) => v.slice(0, -1));
    } else {
      setPin((v) => v.slice(0, -1));
    }
  };

  return (
    <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-y-auto px-6 py-[clamp(0.5rem,2vh,2.5rem)]">
      <h1 className="text-[clamp(1.125rem,2vh+0.75rem,1.5rem)] font-bold text-foreground">
        {step === "id" ? "ID（あいでぃー）を おしてね" : "ひみつのばんごうを おしてね"}
      </h1>

      <DigitBoxes length={CODE_LENGTH} value={step === "id" ? loginId : pin} />

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
    </div>
  );
};

export default LoginPage;
