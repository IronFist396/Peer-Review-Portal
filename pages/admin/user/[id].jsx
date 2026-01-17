import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default function AdminUserDetail({ user }) {
  return (
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">{user.name}</h1>
            <p className="text-gray-500">{user.email} • {user.department}</p>
          </div>
          <Link href="/admin" className="bg-gray-200 px-4 py-2 rounded text-black hover:bg-gray-300">
            Back to Admin List
          </Link>
        </div>

        {/* SECTION 1: What others wrote about them */}
        <h2 className="text-xl font-bold text-black mb-4 border-b pb-2">
          Reviews Received by {user.name} ({user.reviewsReceived.length})
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mb-12">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="p-3">Written By</th>
                <th className="p-3 text-center">Behavior</th>
                <th className="p-3 text-center">Social</th>
                <th className="p-3 text-center">Academic</th>
                <th className="p-3 text-right">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {user.reviewsReceived.map((review) => {
                 const avg = ((review.behavior + review.social + review.academic) / 3).toFixed(1);
                 return (
                  <tr key={review.id}>
                    <td className="p-3 font-medium text-gray-600">{review.reviewer.name}</td>
                    <td className="p-3 text-center">{review.behavior}</td>
                    <td className="p-3 text-center">{review.social}</td>
                    <td className="p-3 text-center">{review.academic}</td>
                    <td className="p-3 text-right font-bold text-gray-800">{avg}</td>
                  </tr>
                );
              })}
               {user.reviewsReceived.length === 0 && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500 italic">No reviews received yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* SECTION 2: What they wrote */}
        <h2 className="text-xl font-bold text-black mb-4 border-b pb-2">
          Reviews Written by {user.name} ({user.reviewsWritten.length})
        </h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-700 border-b">
              <tr>
                <th className="p-3">Reviewing (Candidate)</th>
                <th className="p-3 text-center">Behavior</th>
                <th className="p-3 text-center">Social</th>
                <th className="p-3 text-center">Academic</th>
                <th className="p-3 text-right">Average</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {user.reviewsWritten.map((review) => {
                const avg = ((review.behavior + review.social + review.academic) / 3).toFixed(1);
                return (
                  <tr key={review.id}>
                    <td className="p-3 font-medium">{review.reviewee.name}</td>
                    <td className="p-3 text-center">{review.behavior}</td>
                    <td className="p-3 text-center">{review.social}</td>
                    <td className="p-3 text-center">{review.academic}</td>
                    <td className="p-3 text-right font-bold text-blue-600">{avg}</td>
                  </tr>
                );
              })}
              {user.reviewsWritten.length === 0 && (
                <tr><td colSpan="5" className="p-4 text-center text-gray-500 italic">No reviews written yet.</td></tr>
              )}
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
  const adminUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  });

  // 2. Security Check: Redirect if not admin
  if (!adminUser || !adminUser.isAdmin) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  const userId = context.params.id;

  const rawUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      reviewsWritten: {
        include: { reviewee: { select: { name: true } } }
      },
      reviewsReceived: {
        include: { reviewer: { select: { name: true } } }
      }
    }
  });

  // THE FIX:
  // 1. JSON.stringify turns everything (including Date objects) into strings.
  // 2. JSON.parse turns it back into a plain JavaScript object.
  const user = JSON.parse(JSON.stringify(rawUser));

  return { props: { user } };
}