"use client";

import { useRouter } from "next/navigation";
import { KeyRound, Mail, RefreshCcw, ShieldCheck } from "lucide-react";
import { useMemo, useRef, useState } from "react";

type LoginStep = "email" | "code";
type MessageType = "error" | "info" | "success";

function getMessageClassName(type: MessageType) {
  if (type === "error") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (type === "success") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  return "border-[#ddd1bf] bg-[#fffaf2] text-slate-700";
}

function getDetectedTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<LoginStep>("email");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>("info");
  const [loading, setLoading] = useState(false);

  const normalizedEmail = email.trim().toLowerCase();
  const hasCompleteCode = useMemo(() => code.length === 6, [code]);

  function focusCodeInput(index: number) {
    inputRefs.current[index]?.focus();
    inputRefs.current[index]?.select();
  }

  function resetMessage() {
    setMessage("");
    setMessageType("info");
  }

  async function sendCode() {
    if (!normalizedEmail) {
      setMessageType("error");
      setMessage("Escribe el correo con el que entras al sistema.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setMessageType("error");
      setMessage("Revisa el correo. Debe tener un formato válido.");
      return;
    }

    setLoading(true);
    resetMessage();

    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "No se pudo enviar el código.");
      }

      setStep("code");
      setCode("");
      setMessageType("success");
      setMessage(`Te enviamos un código de 6 dígitos a ${normalizedEmail}.`);
      window.setTimeout(() => focusCodeInput(0), 50);
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "No se pudo enviar el código.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyCode() {
    if (!hasCompleteCode) {
      setMessageType("error");
      setMessage("Escribe los 6 dígitos completos para continuar.");
      return;
    }

    setLoading(true);
    resetMessage();

    try {
      const response = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: normalizedEmail,
          code,
          detectedTimezone: getDetectedTimezone(),
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error || "El código ya no es válido.");
      }

      setMessageType("success");
      setMessage("Acceso confirmado. Entrando a tu espacio de trabajo...");
      router.replace("/");
      router.refresh();
    } catch (error) {
      setMessageType("error");
      setMessage(error instanceof Error ? error.message : "El código ya no es válido.");
    } finally {
      setLoading(false);
    }
  }

  function updateCodeDigit(index: number, rawValue: string) {
    const digits = rawValue.replace(/\D/g, "");

    if (!digits) {
      const nextCode = code.padEnd(6, " ").split("");
      nextCode[index] = "";
      setCode(nextCode.join("").replace(/\s+/g, ""));
      return;
    }

    const currentDigits = code.padEnd(6, " ").split("");
    digits.split("").forEach((digit, digitIndex) => {
      const targetIndex = index + digitIndex;
      if (targetIndex < 6) {
        currentDigits[targetIndex] = digit;
      }
    });

    const nextCode = currentDigits.join("").replace(/\s+/g, "");
    setCode(nextCode);
    focusCodeInput(Math.min(index + digits.length, 5));
  }

  function handleCodePaste(index: number, pastedValue: string) {
    updateCodeDigit(index, pastedValue);
  }

  function goBackToEmailStep() {
    setStep("email");
    setCode("");
    resetMessage();
  }

  return (
    <main className="min-h-screen bg-[#f7f5ef] px-4 py-6 text-slate-950 sm:px-6 lg:px-8 xl:px-10 lg:py-10">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center lg:grid lg:grid-cols-[minmax(0,1fr)_440px] lg:gap-6 lg:items-center lg:justify-normal">
        <section className="hidden rounded-[30px] border border-[#e8dece] bg-white/92 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] backdrop-blur lg:block lg:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
            Acceso seguro
          </p>
          <h1 className="mt-4 font-poppins text-3xl font-semibold text-slate-950 sm:text-4xl">
            Entra a tu espacio de trabajo
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Usa tu correo para recibir un código temporal. No necesitas recordar contraseña y el
            acceso queda listo en pocos segundos.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-[24px] border border-[#efe6d8] bg-[#fffdf9] p-4">
              <Mail size={18} className="text-slate-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">1. Escribe tu correo</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Usa el mismo correo que ya está ligado a tu cuenta.
              </p>
            </article>
            <article className="rounded-[24px] border border-[#efe6d8] bg-[#fffdf9] p-4">
              <KeyRound size={18} className="text-slate-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">2. Recibe tu código</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Te mandamos un código corto para confirmar que eres tú.
              </p>
            </article>
            <article className="rounded-[24px] border border-[#efe6d8] bg-[#fffdf9] p-4">
              <ShieldCheck size={18} className="text-slate-700" />
              <p className="mt-3 text-sm font-semibold text-slate-900">3. Entra y trabaja</p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Al verificarlo, entrarás directo a la app principal.
              </p>
            </article>
          </div>
        </section>

        <section className="w-full max-w-xl rounded-[30px] border border-[#e8dece] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.07)] sm:p-8 lg:max-w-none">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                {step === "email" ? "Paso 1" : "Paso 2"}
              </p>
              <h2 className="mt-3 font-poppins text-2xl font-semibold text-slate-950">
                {step === "email" ? "Recibir código" : "Confirmar acceso"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {step === "email"
                  ? "Primero confirma tu correo para enviarte el código de acceso."
                  : `Escribe el código enviado a ${normalizedEmail || "tu correo"}.`}
              </p>
            </div>
            {step === "code" ? (
              <button
                type="button"
                onClick={goBackToEmailStep}
                className="inline-flex h-11 items-center justify-center rounded-2xl border border-[#e8dece] px-4 text-sm font-semibold text-slate-700 transition hover:border-[#d6c8b3]"
              >
                Cambiar correo
              </button>
            ) : null}
          </div>

          {message ? (
            <div className={`mt-5 rounded-2xl border px-4 py-3 text-sm leading-6 ${getMessageClassName(messageType)}`}>
              {message}
            </div>
          ) : null}

          <form
            className="mt-6 space-y-5"
            onSubmit={(event) => {
              event.preventDefault();
              if (step === "email") {
                void sendCode();
                return;
              }

              void verifyCode();
            }}
          >
            {step === "email" ? (
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-900">
                  Correo electrónico
                </label>
                <input
                  id="login-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="tu@correo.com"
                  className="w-full rounded-2xl border border-[#e8dece] bg-[#fffdf9] px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900"
                  disabled={loading}
                />
                <p className="text-xs leading-5 text-slate-500">
                  Lo usamos solo para enviarte el código de acceso.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-900">
                    Código de acceso
                  </label>
                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Escribe los 6 dígitos tal como llegaron a tu correo.
                  </p>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <input
                      key={index}
                      ref={(element) => {
                        inputRefs.current[index] = element;
                      }}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code[index] || ""}
                      onChange={(event) => updateCodeDigit(index, event.target.value)}
                      onPaste={(event) => {
                        event.preventDefault();
                        handleCodePaste(index, event.clipboardData.getData("text"));
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Backspace" && !code[index] && index > 0) {
                          focusCodeInput(index - 1);
                        }
                      }}
                      className="h-14 rounded-2xl border border-[#e8dece] bg-[#fffdf9] text-center text-xl font-semibold text-slate-950 outline-none transition focus:border-slate-900"
                      disabled={loading}
                      aria-label={`Dígito ${index + 1} del código`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => void sendCode()}
                  disabled={loading}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-slate-700 transition hover:text-slate-950 disabled:opacity-60"
                >
                  <RefreshCcw size={16} />
                  Reenviar código
                </button>
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-center sm:justify-between">
              
              <button
                type="submit"
                disabled={loading}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? step === "email"
                    ? "Enviando código..."
                    : "Verificando acceso..."
                  : step === "email"
                    ? "Enviar código"
                    : "Entrar al sistema"}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
}
