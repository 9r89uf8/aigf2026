"use client";
//app/admin/girls/page.js
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function GirlsListPage() {
  const girls = useQuery(api.girls.listGirls);

  if (!girls) {
    return <div className="p-6">Loading girls...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Girls Management</h1>
        <Link
          href="/admin/girls/new"
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Create Girl
        </Link>
      </div>

      {girls.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No girls created yet.</p>
          <Link
            href="/admin/girls/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Create Your First Girl
          </Link>
        </div>
      ) : (
        <div className="bg-white border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Premium
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Assets
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {girls.map((girl) => (
                <tr key={girl._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {girl.name}
                    </div>
                    {girl.bio && (
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {girl.bio}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        girl.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {girl.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {girl.priority ?? 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                     {girl.premiumOnly ? (
                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                           Premium-only
                         </span>
                       ) : (
                         <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                           Standard
                         </span>
                       )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {girl.counts.assets}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <Link
                      href={`/admin/girls/${girl._id}`}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      Edit
                    </Link>
                    <Link
                      href={`/admin/girls/${girl._id}/stories`}
                      className="text-pink-600 hover:text-pink-900"
                    >
                      Stories
                    </Link>
                    <Link
                      href={`/admin/girls/${girl._id}/gallery`}
                      className="text-green-600 hover:text-green-900"
                    >
                      Gallery
                    </Link>
                    <Link
                      href={`/admin/girls/${girl._id}/posts`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      Posts
                    </Link>
                    <Link
                      href={`/admin/girls/${girl._id}/assets`}
                      className="text-purple-600 hover:text-purple-900"
                    >
                      Assets
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}