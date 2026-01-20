// pages/review/[id].jsx
import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { useRouter } from "next/router";
import { useState } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

// Star Rating Component
function StarRating({ value, onChange, label }) {
  const [hoverValue, setHoverValue] = useState(0);
  
  return (
    <div className="mb-6">
      <div className="bg-[#142749] text-white text-center py-3 rounded-t-lg font-semibold text-sm sm:text-base">
        {label}
      </div>
      <div className="bg-gray-100 p-4 rounded-b-lg">
        <div className="flex justify-center gap-3 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => onChange(star)}
              onMouseEnter={() => setHoverValue(star)}
              onMouseLeave={() => setHoverValue(0)}
              className="text-5xl sm:text-6xl transition-all focus:outline-none hover:scale-110"
            >
              <span className={star <= (hoverValue || value) ? "text-[#ffc10b]" : "text-gray-300"}>
                ★
              </span>
            </button>
          ))}
        </div>
        <p className="text-center text-sm text-gray-600">
          Your Rating is <span className="font-bold">{value}</span>
        </p>
      </div>
    </div>
  );
}

// Text Area Component
function TextSection({ value, onChange, label, placeholder, helperText }) {
  return (
    <div className="mb-6">
      <div className="bg-[#142749] text-white text-center py-3 rounded-t-lg font-semibold text-sm sm:text-base">
        {label}
      </div>
      <div className="bg-gray-100 p-6 rounded-b-lg">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full p-4 border border-gray-300 rounded bg-white text-black min-h-[120px] text-base focus:ring-2 focus:ring-[#142749] focus:outline-none"
        />
        {helperText && (
          <p className="mt-2 text-center text-sm bg-[#ffc10b] text-black py-1 px-2 rounded font-medium">
            {helperText}
          </p>
        )}
      </div>
    </div>
  );
}

export default function ReviewPage({ candidate, existingReview }) {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    approachability: existingReview?.approachability || 0,
    academicInclination: existingReview?.academicInclination || 0,
    workEthics: existingReview?.workEthics || 0,
    maturity: existingReview?.maturity || 0,
    openMindedness: existingReview?.openMindedness || 0,
    academicEthics: existingReview?.academicEthics || 0,
    substanceAbuse: existingReview?.substanceAbuse || "",
    ismpMentor: existingReview?.ismpMentor || "",
    otherComments: existingReview?.otherComments || "",
  });
  
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (
      formData.approachability === 0 ||
      formData.academicInclination === 0 ||
      formData.workEthics === 0 ||
      formData.maturity === 0 ||
      formData.openMindedness === 0 ||
      formData.academicEthics === 0
    ) {
      alert('Please rate all star rating fields (they cannot be 0)');
      return;
    }

    if (!formData.substanceAbuse.trim()) {
      alert('Please fill in the Substance Abuse field');
      return;
    }

    if (!formData.ismpMentor.trim()) {
      alert('Please fill in the ISMP Mentor field');
      return;
    }

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
      router.push('/candidates');
    } else {
      alert("Something went wrong");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 md:p-8 text-black">
        <div className="max-w-7xl mx-auto bg-white p-6 sm:p-8 rounded-lg shadow-lg border border-gray-200">
        
        <div className="flex flex-col sm:flex-row justify-between items-start mb-8 gap-2">
          <div className="flex-1">
            <Link 
              href="/candidates" 
              className="inline-flex items-center gap-2 text-gray-600 hover:text-[#142749] mb-3 text-sm font-medium"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Candidates
            </Link>
            <h1 className="text-2xl sm:text-2xl font-bold text-[#142749]">Reviewing: {candidate.name}</h1>
            <p className="text-xl sm:text-xl text-gray-500">{candidate.department}</p>
          </div>
          {existingReview && (
            <span className="bg-yellow-100 text-yellow-800 text-xs px-3 py-1 rounded border border-yellow-200 whitespace-nowrap font-medium">
              Editing Review
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-0">
          {/* First Row - 3 Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <StarRating 
              label="Approachability" 
              value={formData.approachability}
              onChange={(val) => setFormData({ ...formData, approachability: val })}
            />
            <StarRating 
              label="Academic Inclination" 
              value={formData.academicInclination}
              onChange={(val) => setFormData({ ...formData, academicInclination: val })}
            />
            <StarRating 
              label="Work Ethics/Dedication" 
              value={formData.workEthics}
              onChange={(val) => setFormData({ ...formData, workEthics: val })}
            />
          </div>

          {/* Substance Abuse Text Area */}
          <TextSection
            label="Substance Abuse"
            value={formData.substanceAbuse}
            onChange={(val) => setFormData({ ...formData, substanceAbuse: val })}
            placeholder="Write a short answer"
            helperText="Explain your answer briefly"
          />

          {/* Second Row - 3 Ratings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <StarRating 
              label="Maturity" 
              value={formData.maturity}
              onChange={(val) => setFormData({ ...formData, maturity: val })}
            />
            <StarRating 
              label="Open-Mindedness" 
              value={formData.openMindedness}
              onChange={(val) => setFormData({ ...formData, openMindedness: val })}
            />
            <StarRating 
              label="Academic Ethics" 
              value={formData.academicEthics}
              onChange={(val) => setFormData({ ...formData, academicEthics: val })}
            />
          </div>

          {/* ISMP Mentor Question */}
          <TextSection
            label="Do you think he/she will be a good ISMP mentor?"
            value={formData.ismpMentor}
            onChange={(val) => setFormData({ ...formData, ismpMentor: val })}
            placeholder="Write Yes or No or Maybe"
            helperText="Explain your answer briefly"
          />

          {/* Other Comments */}
          <TextSection
            label="Any other comments"
            value={formData.otherComments}
            onChange={(val) => setFormData({ ...formData, otherComments: val })}
            placeholder="Write here"
            helperText="If you have no comments please write NA"
          />
          
          {/* Submit Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t-2 border-gray-200 mt-6">
            <Link 
              href="/candidates"
              className="w-full sm:w-1/3 bg-gray-200 text-gray-800 py-3 rounded-lg font-bold text-center hover:bg-gray-300 text-sm sm:text-base"
            >
              Cancel
            </Link>
            <button 
              disabled={loading} 
              type="submit"
              className="w-full sm:w-2/3 bg-[#ffc10b] text-black py-3 rounded-lg font-bold hover:bg-[#e6ad09] text-sm sm:text-base disabled:opacity-50"
            >
              {loading ? "Saving..." : (existingReview ? "Update Review" : "Submit Review")}
            </button>
          </div>
        </form>
      </div>
    </div>
    <Footer />
  </div>
  );
}

// Backend Logic
export async function getServerSideProps(context) {
  const session = await getSession(context);
  if (!session) return { redirect: { destination: "/", permanent: false } };

  // Check if user has already submitted their reviews
  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSubmitted: true }
  });

  // If they've submitted, block access to review pages
  if (currentUser?.hasSubmitted) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // Check if reviews are enabled
  const settings = await prisma.systemSettings.findFirst();
  if (settings && !settings.reviewsEnabled) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

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
    approachability: existingReview.approachability,
    academicInclination: existingReview.academicInclination,
    workEthics: existingReview.workEthics,
    maturity: existingReview.maturity,
    openMindedness: existingReview.openMindedness,
    academicEthics: existingReview.academicEthics,
    substanceAbuse: existingReview.substanceAbuse,
    ismpMentor: existingReview.ismpMentor,
    otherComments: existingReview.otherComments,
  } : null;

  return { 
    props: { 
      candidate,
      existingReview: cleanReview 
    } 
  };
}