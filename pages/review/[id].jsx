// pages/review/[id].jsx
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";

export default function ReviewPage({ candidate, existingReview }) {
  const router = useRouter();
  
  // If we have an existing review, use those numbers. Otherwise default to 5.
  const [formData, setFormData] = useState({
    behavior: existingReview?.behavior || 5,
    social: existingReview?.social || 5,
    academic: existingReview?.academic || 5,
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const res = await fetch('/api/submit-review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        revieweeId: candidate.id,
        ...formData
      }),
    });

    if (res.ok) {
      router.push('/candidates'); // Send them back to the list
    } else {
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4 text-black">
      <div className="max-w-md w-full bg-white p-8 rounded shadow border border-gray-200">
        
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-xl font-bold">Reviewing: {candidate.name}</h1>
            <p className="text-sm text-gray-500">{candidate.department}</p>
          </div>
          {existingReview && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded border border-yellow-200">
              Editing Review
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {['behavior', 'social', 'academic'].map((field) => (
            <div key={field}>
              <div className="flex justify-between">
                <label className="block text-sm font-bold mb-1 capitalize">{field}</label>
                <span className="text-sm font-mono text-blue-600">{formData[field]}/10</span>
              </div>
              <input
                type="range" // Changed to slider for better UI
                min="1" max="10"
                value={formData[field]}
                onChange={(e) => setFormData({ ...formData, [field]: parseInt(e.target.value) })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Poor (1)</span>
                <span>Excellent (10)</span>
              </div>
            </div>
          ))}
          
          <div className="flex gap-2 pt-4">
            <Link 
              href="/candidates"
              className="w-1/3 bg-gray-200 text-gray-800 py-2 rounded font-bold text-center hover:bg-gray-300"
            >
              Cancel
            </Link>
            <button 
              disabled={loading} 
              className="w-2/3 bg-blue-600 text-white py-2 rounded font-bold hover:bg-blue-700"
            >
              {loading ? "Saving..." : (existingReview ? "Update Review" : "Submit Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Backend Logic
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/", permanent: false } };

  const candidateId = context.params.id;

  // 1. Get Candidate Info
  const candidate = await prisma.user.findUnique({
    where: { id: candidateId },
    select: { id: true, name: true, department: true }
  });

  // 2. Check if I already reviewed them
  const existingReview = await prisma.review.findUnique({
    where: {
      reviewerId_revieweeId: {
        reviewerId: session.user.id,
        revieweeId: candidateId,
      }
    }
  });

  // Prisma returns Dates as objects, which breaks Next.js props. 
  // We clean it up by passing null if no review exists.
  const cleanReview = existingReview ? {
    behavior: existingReview.behavior,
    social: existingReview.social,
    academic: existingReview.academic
  } : null;

  return { 
    props: { 
      candidate,
      existingReview: cleanReview 
    } 
  };
}