"use client";

export default function ReplyToBadge({ rt }) {
  if (!rt) return null;
  const label =
    rt.text ||
    (rt.kind === "image"
      ? "[Imagen]"
      : rt.kind === "video"
      ? "[Video]"
      : rt.kind === "audio"
      ? "[Nota de voz]"
      : "");
  return (
    <div className="mb-1 ml-1 px-2 py-1 rounded-md bg-gray-100 text-gray-600 text-[15px] flex items-center gap-1">
      <span className="text-base">↩︎</span>
      <span className="truncate max-w-[220px]">respondiendo a: {label}</span>
    </div>
  );
}
