// convex/auth.js
import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";

// Resend OTP for password reset
import Resend from "@auth/core/providers/resend";
import { Resend as ResendAPI } from "resend";
import { RandomReader, generateRandomString } from "@oslojs/crypto/random";

// --- Password reset email provider (OTP) ---
export const ResendOTPPasswordReset = Resend({
  id: "resend-otp",
  apiKey: process.env.AUTH_RESEND_KEY,
  async generateVerificationToken() {
    const random = { read: (bytes) => crypto.getRandomValues(bytes) };
    // 8-digit numeric OTP keeps UX simple
    return generateRandomString(random, "0123456789", 8);
  },
  async sendVerificationRequest({ identifier: email, provider, token }) {
    const resend = new ResendAPI(provider.apiKey);
    const { error } = await resend.emails.send({
      from: "NoviaChat <no-reply@noviachat.com>",
      to: [email],
      subject: `Reset your password`,
      text: `Your password reset code is ${token}`,
    });
    if (error) throw new Error("Could not send reset code email");
  },
});

// --- Cloudflare Turnstile verify helper ---
async function verifyTurnstile(token) {
  if (!token) throw new Error("Turnstile token missing");
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: process.env.TURNSTILE_SECRET_KEY,
      response: token,
    }),
  });
  if (!res.ok) throw new Error("Turnstile verification failed");
  const data = await res.json();
  if (!data.success) throw new Error("Turnstile verification failed");
}

export const {
  auth,        // internal: used by Convex Auth
  signIn,      // action to handle flows from the client forms
  signOut,     // action to sign out
  store,
  isAuthenticated
} = convexAuth({
  providers: [
    Password({
      reset: ResendOTPPasswordReset, // enables reset flow via OTP email
      // Optional: enforce stronger passwords
      // validatePasswordRequirements(password) { ... },

      // Called for all flows; must return a plain object synchronously
      profile(params, _ctx) {
        // Normalize and store minimal user profile
        const emailRaw = params["email"] ?? "";
        const email = emailRaw.trim().toLowerCase();

        // Return fields for the `users` doc
        return { email };
      },
    }),
  ],
});