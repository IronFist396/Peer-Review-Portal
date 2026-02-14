// pages/dashboard.jsx
import { getServerSession } from "next-auth/next"; // <--- CHANGED: Server-side session
import { authOptions } from "@/lib/auth";          // <--- ADDED: Your auth config
import { prisma } from "@/lib/prisma";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useState } from "react";

export default function Dashboard({ user, reviewCount, reviewsWritten, reviewsEnabled }) {
  // =========================================================================
  //  UI CODE (EXACTLY AS YOU PROVIDED)
  // =========================================================================
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isCompleted = reviewCount >= 5;
  const progressPercentage = Math.min((reviewCount / 5) * 100, 100);

  const handleFinalSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/submit-final', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (res.ok) {
        window.location.reload(); // Reload to show submitted state
      } else {
        const data = await res.json();
        alert(data.error || "Failed to submit");
        setIsSubmitting(false);
      }
    } catch (error) {
      alert("Something went wrong");
      setIsSubmitting(false);
    }
  };

  // If user has already submitted, show different UI
  if (user.hasSubmitted) {
    return (
      <>
        <Head>
          <title>Dashboard</title>
          <link rel="icon" href="/logo_dark.svg" />
        </Head>
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-50 to-blue-50">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Welcome, {user.name}</h1>
            </div>

          {/* Success Message */}
          <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg mb-6 border-t-4 border-green-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-xl sm:text-2xl">✓</span>
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-green-700">Reviews Submitted!</h2>
                <p className="text-gray-600 text-xs sm:text-sm">
                  {user.submittedAt ? `Submitted on ${user.submittedAt}` : 'Submitted'}
                </p>
              </div>
            </div>
            <p className="text-gray-700">
              Thank you for completing your peer reviews. Your responses have been recorded and you can no longer make changes.
            </p>
          </div>

          {/* Review Summary */}
          <div className="bg-white p-4 sm:p-6 rounded-lg shadow mb-6">
            <h3 className="text-lg sm:text-xl font-bold mb-4 text-gray-800">Your Review Summary</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
              <div className="bg-blue-50 p-4 sm:p-4 rounded border border-blue-200">
                <p className="text-2xl sm:text-3xl font-bold text-blue-700">{reviewCount}</p>
                <p className="text-xs sm:text-sm text-gray-600">Reviews Written</p>
              </div>
              <div className="bg-purple-50 p-4 sm:p-4 rounded border border-purple-200">
                <p className="text-2xl sm:text-3xl font-bold text-purple-700">
                  {reviewCount > 0 
                    ? (reviewsWritten.reduce((sum, r) => sum + r.approachability + r.academicInclination + r.workEthics + r.maturity + r.openMindedness + r.academicEthics, 0) / (reviewCount * 6)).toFixed(1)
                    : '0'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Average Rating Given</p>
              </div>
              <div className="bg-green-50 p-4 sm:p-4 rounded border border-green-200">
                <p className="text-2xl sm:text-3xl font-bold text-green-700">100%</p>
                <p className="text-xs sm:text-sm text-gray-600">Completion</p>
              </div>
            </div>

            {/* List of reviewed candidates */}
            <div>
              <h4 className="text-sm sm:text-base font-semibold mb-3 text-gray-700">People You Reviewed:</h4>
              <div className="space-y-2">
                {reviewsWritten.map((review) => (
                  <div key={review.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-3 bg-gray-50 rounded border border-gray-200 gap-2">
                    <div>
                      <p className="text-sm sm:text-base font-medium text-gray-800">{review.reviewee.name}</p>
                      <p className="text-xs text-gray-500">{review.reviewee.department}</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xs sm:text-sm font-mono text-gray-600">
                        Avg: {((review.approachability + review.academicInclination + review.workEthics + review.maturity + review.openMindedness + review.academicEthics) / 6).toFixed(1)}/5
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
      </div>
      </>
    );
  }

  // Normal dashboard for users who haven't submitted yet
  return (
    <>
      <Head>
        <title>Dashboard</title>
        <link rel="icon" href="/" />
      </Head>
      <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold">Welcome, {user.name}</h1>
          </div>

        {/* Progress Bar */}
        <div className="bg-white p-4 sm:p-6 rounded shadow mb-6">
          <h2 className="text-lg sm:text-xl font-semibold mb-2">Review Progress</h2>
          <div className="w-full bg-gray-200 rounded-full h-3 sm:h-4 mb-4">
            <div 
              className={`h-3 sm:h-4 rounded-full transition-all ${isCompleted ? 'bg-green-500' : 'bg-blue-500'}`} 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
          <p className="text-sm sm:text-base text-gray-700">
            {reviewCount} / 5 reviews completed.
            {!isCompleted && <span className="text-red-600 ml-2">You need atleast {5 - reviewCount} more to submit.</span>}
          </p>
        </div>

        {/* Reviews Disabled Warning */}
        {!reviewsEnabled && (
          <div className="bg-red-50 border-2 border-red-300 p-4 sm:p-6 rounded-lg mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl"></span>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-red-800 mb-2">Review Submissions Currently Disabled</h3>
                <p className="text-sm sm:text-base text-red-700">
                  The review system has been disabled by administrators. You cannot write, edit, or submit reviews at this time. Please check back later. If you think this is an error, contact SMP OCs.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          <Link 
            href="/candidates" 
            className={`px-6 py-3 rounded font-bold text-center ${
              reviewsEnabled 
                ? 'bg-[#142749] text-white hover:bg-[#1a3461]' 
                : 'bg-gray-400 text-gray-200 cursor-not-allowed pointer-events-none'
            }`}
          >
            Review Someone
          </Link>
          
          <button 
            disabled={!isCompleted || !reviewsEnabled}
            onClick={() => setShowConfirmModal(true)}
            className={`px-6 py-3 rounded font-bold text-center transition-all ${
              (isCompleted && reviewsEnabled) 
                ? 'bg-[#ffc10b] hover:bg-[#e6ad09] text-black' 
                : 'bg-[#ddd5b8] text-[#9a916d] cursor-not-allowed border-2 border-[#c4bd9f]'
            }`}
          >
            Submit Reviews
          </button>
        </div>

        {user.isAdmin && (
          <div className="mt-6">
            <Link href="/admin" className="text-sm sm:text-base text-[#142749] hover:underline font-medium">
              → Go to Admin Panel
            </Link>
          </div>
        )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Final Submission</h3>
            <p className="text-gray-700 mb-6">
              Are you sure you want to submit your reviews? Once submitted, you will <strong>not be able to edit or add more reviews</strong>.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-6">
              <p className="text-sm text-yellow-800">
                ⚠️ This action is permanent and cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmModal(false)}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleFinalSubmit}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-[#ffc10b] text-black rounded font-medium hover:bg-[#e6ad09] disabled:opacity-50"
              >
                {isSubmitting ? "Submitting..." : "Yes, Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
      <Footer />
      </div>
    </>
  );
}

// =========================================================================
//  SERVER SIDE LOGIC (FIXED FOR 500 ERROR)
// =========================================================================
export async function getServerSideProps(context) {
  // FIX 1: Use getServerSession (Server-side) instead of getSession (Client/API side)
  // This prevents the redirect loop and connection errors.
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: { destination: "/home", permanent: false },
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      isAdmin: true,
      hasSubmitted: true,
      submittedAt: true,
    }
  });

  if (!user) {
    return { redirect: { destination: "/home", permanent: false } };
  }

  const reviewCount = await prisma.review.count({
    where: { reviewerId: session.user.id },
  });

  const reviewsWritten = await prisma.review.findMany({
    where: { reviewerId: session.user.id },
    include: {
      reviewee: {
        select: { name: true, department: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const settings = await prisma.systemSettings.findFirst();

  // FIX 2: Data Serialization
  // We use JSON.parse(JSON.stringify(...)) to strip out any complex Date objects
  // coming from Prisma. This is the safest way to prevent 500 errors regarding serialization.
  // We apply this to the cleaned reviews and user data.

  const safeUser = JSON.parse(JSON.stringify({
    ...user,
    submittedAt: user.submittedAt 
      ? new Date(user.submittedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
      : null
  }));

  const safeReviews = JSON.parse(JSON.stringify(reviewsWritten.map(r => ({
    id: r.id,
    approachability: r.approachability,
    academicInclination: r.academicInclination,
    workEthics: r.workEthics,
    maturity: r.maturity,
    openMindedness: r.openMindedness,
    academicEthics: r.academicEthics,
    reviewee: r.reviewee
  }))));

  return {
    props: {
      user: safeUser,
      reviewCount,
      reviewsWritten: safeReviews,
      reviewsEnabled: settings?.reviewsEnabled ?? true,
    },
  };
}
