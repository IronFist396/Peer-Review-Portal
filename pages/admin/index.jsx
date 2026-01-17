import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default function AdminDashboard({ users }) {
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-black">Admin Panel</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to User Dashboard
          </Link>
        </div>

        <div className="bg-white shadow border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Department</th>
                <th className="p-4 border-b text-center">Reviews Written</th>
                <th className="p-4 border-b text-center">Reviews Received</th>
                <th className="p-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium">{user.name}</td>
                  <td className="p-4 text-gray-600">{user.department}</td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user._count.reviewsWritten >= 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user._count.reviewsWritten} / 5
                    </span>
                  </td>
                  <td className="p-4 text-center text-gray-600">
                    {user._count.reviewsReceived}
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
      _count: {
        select: { reviewsWritten: true, reviewsReceived: true }
      }
    },
    orderBy: { name: 'asc' }
  });

  return { props: { users } };
}