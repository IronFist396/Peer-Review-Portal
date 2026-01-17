import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { useState } from "react";

export default function AdminDashboard({ users, reviewsEnabled: initialEnabled }) {
  const [reviewsEnabled, setReviewsEnabled] = useState(initialEnabled);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await fetch('/api/toggle-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !reviewsEnabled })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewsEnabled(data.reviewsEnabled);
      } else {
        alert("Failed to update settings");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to User Dashboard
          </Link>
        </div>

        {/* Kill Switch */}
        <div className={`mb-6 p-4 rounded-lg border-2 ${reviewsEnabled ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">Review Submission Status</h3>
              <p className="text-sm text-gray-600">
                {reviewsEnabled 
                  ? "Students can currently submit and edit reviews" 
                  : "Review submissions are disabled - students will see a message"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`px-6 py-3 rounded font-bold text-white transition-colors ${
                reviewsEnabled 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-green-600 hover:bg-green-700'
              } disabled:opacity-50`}
            >
              {isToggling ? "Updating..." : (reviewsEnabled ? "🔴 Disable Reviews" : "🟢 Enable Reviews")}
            </button>
          </div>
        </div>

        <div className="bg-white shadow border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Department</th>
                <th className="p-4 border-b text-center">Reviews Received</th>
                <th className="p-4 border-b text-center">Reviews Written</th>
                <th className="p-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.hasSubmitted ? 'border-l-4 border-l-green-500 bg-green-50' : ''}`}>
                  <td className="p-4 font-medium">
                    {user.name}
                    {user.hasSubmitted && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded font-normal">✓ Submitted</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{user.department}</td>
                  <td className="p-4 text-center text-gray-600">
                    {user._count.reviewsReceived}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user._count.reviewsWritten >= 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user._count.reviewsWritten} / 5
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link 
                      href={`/admin/user/${user.id}`}
                      className="text-blue-600 hover:text-blue-800 font-bold text-sm border border-blue-200 bg-blue-50 px-3 py-1 rounded hover:bg-blue-100"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // 1. Check if the user is an admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  });

  // 2. Security Check: Redirect if not admin
  if (!user || !user.isAdmin) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // 3. Get all non-admin users with counts
  const users = await prisma.user.findMany({
    where: { isAdmin: false }, // Only show regular users in admin panel
    select: {
      id: true,
      name: true,
      department: true,
      email: true,
      hasSubmitted: true,
      _count: {
        select: { reviewsWritten: true, reviewsReceived: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  // 4. Get system settings
  const settings = await prisma.systemSettings.findFirst();

  return { 
    props: { 
      users,
      reviewsEnabled: settings?.reviewsEnabled ?? true 
    } 
  };
}