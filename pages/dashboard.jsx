// pages/dashboard.jsx
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import LogoutButton from "./logout-button"; // Assuming this is in the same folder

export default function Dashboard({ user, reviewCount }) {
  const isCompleted = reviewCount >= 5;
  const progressPercentage = Math.min((reviewCount / 5) * 100, 100);

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
          <LogoutButton />
        </div>

        {/* Progress Bar */}
        <div className="bg-white p-6 rounded shadow mb-6">
          <h2 className="text-xl font-semibold mb-2">Review Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
            <div 
              className={`h-4 rounded-full ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p>{reviewCount} / 5 reviews completed.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/candidates" className="px-6 py-3 bg-blue-600 text-white rounded font-bold hover:bg-blue-700">
            Review Someone
          </Link>
          
          <button 
            disabled={!isCompleted}
            className={`px-6 py-3 rounded font-bold text-white ${isCompleted ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
          >
            Submit Application
          </button>
        </div>
      </div>
    </div>
  );
}

// Backend Logic
export async function getServerSideProps(context) {
  const session = await getSession(context);

  // Secure the page server-side
  if (!session) {
    return {
      redirect: { destination: "/", permanent: false },
    };
  }

  // Count reviews
  const reviewCount = await prisma.review.count({
    where: { reviewerId: session.user.id },
  });

  return {
    props: {
      user: session.user,
      reviewCount,
    },
  };
}