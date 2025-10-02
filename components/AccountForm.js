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

  if (!data) return <div className="p-6">Loading...</div>;

  return (
    <main className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Account</h1>

      <form onSubmit={onSave} className="space-y-6">
        {/* Email (read-only) */}
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input
            value={email}
            disabled
            className="input w-full bg-gray-50 px-3 py-2 border border-gray-300 rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed.</p>
        </div>

        {/* Username */}
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input
            className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            pattern="[a-z0-9._]{3,24}"
            title="3–24 chars; a–z, 0–9, dot, underscore"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <input
            className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
          />
        </div>

        {/* Age + Country */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Age</label>
            <input
              className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          <div>
            <label className="block text-sm font-medium mb-1">Country</label>
            <select
              className="input w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              {COUNTRY_OPTIONS.map((c) => (
                <option key={c.code} value={c.code}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex items-start gap-4">
          <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs text-gray-400">No photo</span>
            )}
          </div>
          <div className="space-x-2">
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
              className="btn-gradient-blue disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Change photo"}
            </button>
            {avatarUrl && (
              <button
                type="button"
                className="btn-gradient-black"
                onClick={async () => {
                  await removeAvatar({});
                  setAvatarUrl(null);
                }}
              >
                Remove photo
              </button>
            )}
          </div>
        </div>

        <div className="pt-2">
          <button
            className="btn-gradient-blue disabled:opacity-50 disabled:cursor-not-allowed"
            type="submit"
            disabled={saving}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      {/* Premium Status Section */}
      <div className="space-y-6 mt-8">
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">Premium Status</h2>
          <div className="rounded border p-4 bg-gray-50">
            {premiumStatus ? (
              <div>
                <div className="font-medium text-lg mb-2">
                  {premiumStatus.active ? (
                    <span className="text-green-600">✓ Premium Active</span>
                  ) : (
                    <span className="text-gray-600">Free Plan</span>
                  )}
                </div>
                {premiumStatus.active && premiumStatus.premiumUntil > 0 && (
                  <div className="text-sm text-gray-600 mb-3">
                    Premium until{" "}
                    <strong>
                      {new Date(premiumStatus.premiumUntil).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </strong>
                  </div>
                )}
                <a
                  href="/plans"
                  className="inline-block btn-gradient-blue text-sm"
                >
                  {premiumStatus.active ? "Extend Premium" : "Upgrade to Premium"}
                </a>
              </div>
            ) : (
              <div className="text-gray-500">Loading premium status...</div>
            )}
          </div>
        </div>

        {/* Payment History Section */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Payment History</h2>
          <div className="rounded border">
            {paymentHistory ? (
              paymentHistory.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No purchases yet.{" "}
                  <a href="/plans" className="text-blue-500 hover:underline">
                    Browse premium plans
                  </a>
                </div>
              ) : (
                <div className="divide-y">
                  {paymentHistory.map(payment => (
                    <div key={payment.id} className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">
                            {(payment.amountTotal / 100).toFixed(2)} {payment.currency.toUpperCase()}
                          </div>
                          <div className="text-sm text-gray-600">
                            {new Date(payment.paidAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit"
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {payment.durationDays} day{payment.durationDays !== 1 ? 's' : ''} •
                            Expires {new Date(payment.expiresAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">
                            {payment.status === "paid" ? "Paid" : payment.status}
                          </div>
                          {payment.features && payment.features.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {payment.features.slice(0, 2).join(", ")}
                              {payment.features.length > 2 && "..."}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              <div className="p-4 text-center text-gray-500">Loading payment history...</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}