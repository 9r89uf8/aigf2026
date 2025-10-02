"use client";

import { useEffect, useRef, useState } from "react";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const COUNTRY_OPTIONS = [
  { code: "", label: "Select country" },
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "DE", label: "Germany" },
  { code: "FR", label: "France" },
  { code: "IT", label: "Italy" },
  { code: "ES", label: "Spain" },
  { code: "NL", label: "Netherlands" },
  { code: "BE", label: "Belgium" },
  { code: "SE", label: "Sweden" },
  { code: "NO", label: "Norway" },
  { code: "DK", label: "Denmark" },
  { code: "FI", label: "Finland" },
  { code: "CH", label: "Switzerland" },
  { code: "AT", label: "Austria" },
  { code: "IE", label: "Ireland" },
  { code: "PT", label: "Portugal" },
  { code: "PL", label: "Poland" },
  { code: "CZ", label: "Czech Republic" },
  { code: "HU", label: "Hungary" },
  { code: "GR", label: "Greece" },
  { code: "JP", label: "Japan" },
  { code: "KR", label: "South Korea" },
  { code: "CN", label: "China" },
  { code: "IN", label: "India" },
  { code: "BR", label: "Brazil" },
  { code: "MX", label: "Mexico" },
  { code: "AR", label: "Argentina" },
];

const USERNAME_RE = /^[a-z0-9._]{3,24}$/;

export default function AccountForm() {
  const data = useQuery(api.profile.getMine);
  const upsert = useMutation(api.profile.upsertMine);
  const setAvatar = useMutation(api.profile.setAvatar);
  const removeAvatar = useMutation(api.profile.removeAvatar);
  const signUpload = useAction(api.s3.signAvatarUpload);
  const cfSignView = useAction(api.cdn.cfSignView);

  // Payment-related queries
  const premiumStatus = useQuery(api.payments.getPremiumStatus);
  const paymentHistory = useQuery(api.payments.getMyPayments);

  const [username, setUsername] = useState("");
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [country, setCountry] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Initialize from query
  useEffect(() => {
    if (!data) return;
    setUsername(data.profile.username ?? "");
    setName(data.profile.name ?? "");
    setAge(data.profile.age !== undefined ? data.profile.age : "");
    setCountry(data.profile.country ?? "");
  }, [data]);

  // Fetch CloudFront signed URL when avatarKey changes
  useEffect(() => {
    const run = async () => {
      if (!data?.profile.avatarKey) {
        setAvatarUrl(null);
        return;
      }
      try {
        const r = await cfSignView({ key: data.profile.avatarKey });
        setAvatarUrl(r.url);
      } catch (error) {
        console.error("Failed to get CloudFront signed URL:", error);
        setAvatarUrl(null);
      }
    };
    run();
  }, [data?.profile.avatarKey, cfSignView]);

  const email = data?.email ?? "";

  async function onSave(e) {
    e.preventDefault();
    if (!USERNAME_RE.test(username)) {
      alert("Username must be 3–24 chars, a–z, 0–9, dot or underscore.");
      return;
    }
    const payload = {
      username,
      name: name || undefined,
      age: typeof age === "number" ? age : (age === "" ? undefined : Number(age)),
      country: country || undefined,
    };
    setSaving(true);
    try {
      await upsert(payload);
      alert("Profile saved");
    } catch (err) {
      alert(err?.message ?? "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  async function onPickAvatar(file) {
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
      alert("Please upload PNG, JPG, or WEBP");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Max 5MB");
      return;
    }

    setUploading(true);
    try {
      // 1) Ask Convex for presigned PUT
      const { uploadUrl, objectKey } = await signUpload({
        contentType: file.type,
        size: file.size,
      });

      // 2) Upload directly to S3
      const res = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });
      if (!res.ok) {
        alert("Upload failed");
        return;
      }

      // 3) Finalize in DB
      await setAvatar({ objectKey });

      // 4) Refresh preview URL with CloudFront signed URL
      const { url } = await cfSignView({ key: objectKey });
      setAvatarUrl(url);
    } catch (error) {
      console.error("Avatar upload failed:", error);
      alert("Avatar upload failed");
    } finally {
      setUploading(false);
    }
  }

  if (!data) return <div className="min-h-screen flex items-center justify-center">
    <div className="text-lg text-gray-400">Loading...</div>
  </div>;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Cover Header - Social Media Style */}
      <div className="relative pt-6 px-6">
        <div className="h-48 bg-gradient-to-br from-indigo-600 via-amber-500 to-cyan-400 rounded-2xl"></div>

        {/* Avatar Overlapping Cover */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="relative -mt-20 flex flex-col items-center pb-6">
            <div className="relative">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-white border-4 border-white shadow-xl flex items-center justify-center">
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-sm text-gray-400">No photo</span>
                )}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onPickAvatar(f);
                }}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 hover:bg-blue-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors disabled:opacity-50"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
            </div>

            <div className="mt-4 text-center">
              <h1 className="text-3xl font-bold text-gray-900">{name || username || "User"}</h1>
              <p className="text-gray-600 mt-1">@{username || "username"}</p>
              {avatarUrl && (
                <button
                  type="button"
                  onClick={async () => {
                    await removeAvatar({});
                    setAvatarUrl(null);
                  }}
                  className="mt-2 text-sm text-red-600 hover:text-red-700 transition-colors"
                >
                  Remove photo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Profile Information - Card Based */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={onSave}>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                <input
                  value={email}
                  disabled
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1.5">Email cannot be changed</p>
              </div>

              {/* Username */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  pattern="[a-z0-9._]{3,24}"
                  title="3–24 chars; a–z, 0–9, dot, underscore"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                />
              </div>

              {/* Age */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Age</label>
                <input
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  type="number"
                  min={13}
                  max={120}
                  value={age}
                  onChange={(e) => {
                    const v = e.target.value;
                    setAge(v === "" ? "" : Number(v));
                  }}
                />
              </div>

              {/* Country */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                >
                  {COUNTRY_OPTIONS.map((c) => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-center">
              <button
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                type="submit"
                disabled={saving || uploading}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </form>

        {/* Membership Status - Bank UI Style */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Membership Status
          </h2>

          {premiumStatus ? (
            <div className={`p-6 rounded-lg border-2 ${premiumStatus.active ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                {premiumStatus.active ? (
                  <>
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-lg font-semibold text-green-700">Premium Account</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    <span className="text-lg font-semibold text-gray-700">Free Plan</span>
                  </>
                )}
              </div>
              {premiumStatus.active && premiumStatus.premiumUntil > 0 && (
                <div className="text-sm text-gray-600">
                  Valid until{" "}
                  <span className="font-semibold text-gray-900">
                    {new Date(premiumStatus.premiumUntil).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric"
                    })}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              Loading status...
            </div>
          )}
        </div>

        {/* Transaction History - Bank Statement Style */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Transaction History
          </h2>

          {paymentHistory ? (
            paymentHistory.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 mb-2">No transactions yet</p>
                <a href="/plans" className="text-blue-500 hover:text-blue-600 font-medium text-sm">
                  Browse premium plans →
                </a>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {paymentHistory.map(payment => (
                  <div key={payment.id} className="py-4 hover:bg-gray-50 transition-colors px-4 -mx-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            Premium Subscription
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(payment.paidAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                          <div className="text-xs text-gray-400 mt-0.5">
                            {payment.durationDays} day{payment.durationDays !== 1 ? 's' : ''} • Expires {new Date(payment.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="font-semibold text-lg text-gray-900">
                          ${(payment.amountTotal / 100).toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500 uppercase">
                          {payment.currency}
                        </div>
                        <div className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {payment.status === "paid" ? "Paid" : payment.status}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="p-6 bg-gray-50 rounded-lg text-center text-gray-500">
              Loading transactions...
            </div>
          )}
        </div>
      </div>
    </main>
  );
}