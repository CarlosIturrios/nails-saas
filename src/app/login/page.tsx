// src/app/login/page.tsx
"use client"

import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState<"email" | "code">("email");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"error" | "info">("info");
  const [loading, setLoading] = useState(false);

  const sendCode = async () => {
    if (!email) {
      setMessageType("error");
      return setMessage("Ingresa tu correo");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMessageType("error");
      return setMessage("Ingresa un correo válido");
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await res.json();

      if (res.status === 200) {
        setStep("code");
        setMessageType("info");
        setMessage("Código enviado a tu correo ✉️");
      } else {
        setMessageType("error");
        setMessage(data.error || "Error enviando código");
      }
    } catch (err: any) {
      setMessageType("error");
      setMessage(err.message || "Error enviando código");
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (code.length !== 6) {
      setMessageType("error");
      return setMessage("El código debe tener 6 dígitos");
    }

    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        body: JSON.stringify({ email, code }),
        headers: { "Content-Type": "application/json" }
      });
      const data = await res.json();
      if (res.status === 200) {
        window.location.href = "/cotizaciones";
      } else {
        setMessageType("error");
        setMessage(data.error || "Código inválido");
      }
    } catch (err) {
      setMessageType("error");
      setMessage("Código inválido");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 bg-amber-soft">
      <div className="w-full max-w-md card-glam p-8 rounded-xl shadow">
        <h1 className="text-2xl font-bold mb-6 text-center shimmer-text">Login</h1>

        {message && (
          <p
            className={`text-center mb-4 ${messageType === "error" ? "text-red-500" : "text-black"
              }`}
          >
            {message}
          </p>
        )}

        {step === "email" ? (
          <>
            <input
              type="email"
              placeholder="Tu correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded border mb-4 focus:outline-none focus:ring-2 focus:ring-amber-400"
              disabled={loading}
            />
            <button
              onClick={sendCode}
              className={`w-full btn-glam py-3 rounded font-semibold ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Enviando..." : "Enviar código"}
            </button>
          </>
        ) : (
          <>
            <div className="flex justify-center mb-4 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <input
                  key={i}
                  type="text"
                  maxLength={1}
                  value={code[i] || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^\d+$/.test(val)) {
                      // Si es un solo dígito, solo actualizar ese input
                      if (val.length === 1) {
                        const newCode = code.split("");
                        newCode[i] = val;
                        setCode(newCode.join(""));
                        if (i < 5) {
                          const next = document.getElementById(`code-${i + 1}`);
                          next?.focus();
                        }
                      } else if (val.length > 1) {
                        // Si pega varios dígitos, repartirlos
                        const newCodeArr = code.split("");
                        val.split("").forEach((digit, index) => {
                          if (i + index < 6) newCodeArr[i + index] = digit;
                        });
                        setCode(newCodeArr.join(""));
                        const next = document.getElementById(`code-${Math.min(i + val.length, 5)}`);
                        next?.focus();
                      }
                    }
                  }}
                  onPaste={(e) => {
                    e.preventDefault();
                    const paste = e.clipboardData.getData("text").replace(/\D/g, "");
                    if (!paste) return;
                    const newCodeArr = code.split("");
                    paste.split("").forEach((digit, index) => {
                      if (i + index < 6) newCodeArr[i + index] = digit;
                    });
                    setCode(newCodeArr.join(""));
                    const next = document.getElementById(`code-${Math.min(i + paste.length, 5)}`);
                    next?.focus();
                  }}
                  id={`code-${i}`}
                  className="flex-1 min-w-[2rem] max-w-[3.5rem] h-12 text-center text-xl rounded border focus:outline-none focus:ring-2 focus:ring-amber-400"
                  disabled={loading}
                />
              ))}
            </div>
            <button
              onClick={verifyCode}
              className={`w-full btn-glam py-3 rounded font-semibold ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
              disabled={loading}
            >
              {loading ? "Verificando..." : "Verificar código"}
            </button>
          </>
        )}
      </div>
    </main>
  );
}