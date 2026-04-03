import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { useCallback, useEffect, useRef, useState } from "react";

// Donut Chart Component
function DonutChart({ label, ratings, fieldName }) {
  const [hoveredSegment, setHoveredSegment] = useState(null);
  
  // Count occurrences of each rating (1-5)
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  ratings.forEach(rating => {
    if (rating >= 1 && rating <= 5) counts[rating]++;
  });
  
  const total = ratings.length || 1;
  const average = ratings.length > 0 
    ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length).toFixed(1)
    : '0.0';
  
  // Calculate percentages and cumulative angles
  const colors = {
    5: '#10b981', // green
    4: '#3b82f6', // blue
    3: '#f59e0b', // amber
    2: '#f97316', // orange
    1: '#ef4444'  // red
  };
  
  let cumulativeAngle = 0;
  const segments = [];
  
  [5, 4, 3, 2, 1].forEach(rating => {
    const count = counts[rating];
    const percentage = (count / total) * 100;
    const angle = (percentage / 100) * 360;
    
    if (count > 0) {
      segments.push({
        rating,
        count,
        percentage: percentage.toFixed(1),
        startAngle: cumulativeAngle,
        angle,
        color: colors[rating]
      });
      cumulativeAngle += angle;
    }
  });
  
  // Create SVG path for donut segment
  const createArc = (startAngle, angle) => {
    const centerX = 100;
    const centerY = 100;
    const outerRadius = 90;
    const innerRadius = 60;
    
    // Special case: if angle is 360 (full circle), make it slightly less to avoid rendering issues
    const adjustedAngle = angle >= 360 ? 359.99 : angle;
    
    const startRad = (startAngle - 90) * Math.PI / 180;
    const endRad = (startAngle + adjustedAngle - 90) * Math.PI / 180;
    
    const x1 = centerX + outerRadius * Math.cos(startRad);
    const y1 = centerY + outerRadius * Math.sin(startRad);
    const x2 = centerX + outerRadius * Math.cos(endRad);
    const y2 = centerY + outerRadius * Math.sin(endRad);
    const x3 = centerX + innerRadius * Math.cos(endRad);
    const y3 = centerY + innerRadius * Math.sin(endRad);
    const x4 = centerX + innerRadius * Math.cos(startRad);
    const y4 = centerY + innerRadius * Math.sin(startRad);
    
    const largeArc = adjustedAngle > 180 ? 1 : 0;
    
    return `M ${x1} ${y1} A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${x4} ${y4} Z`;
  };
  
  return (
    <div className="flex flex-col items-center">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
      <div className="relative">
        <svg width="200" height="200" viewBox="0 0 200 200">
          {segments.map((segment, idx) => (
            <g key={idx}>
              <path
                d={createArc(segment.startAngle, segment.angle)}
                fill={segment.color}
                className="transition-opacity cursor-pointer"
                opacity={hoveredSegment === null || hoveredSegment === segment.rating ? 1 : 0.3}
                onMouseEnter={() => setHoveredSegment(segment.rating)}
                onMouseLeave={() => setHoveredSegment(null)}
              />
            </g>
          ))}
        </svg>
        
        {/* Center text showing average or hovered info */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            {hoveredSegment === null ? (
              <>
                <div className="text-3xl font-bold text-[#142749]">{average}</div>
                <div className="text-xs text-gray-500">avg</div>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-[#142749]">
                  {segments.find(s => s.rating === hoveredSegment)?.count || 0}
                </div>
                <div className="text-xs text-gray-600">{hoveredSegment} stars</div>
              </>
            )}
          </div>
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-3 space-y-1">
        {segments.map((segment, idx) => (
          <div 
            key={idx}
            className="flex items-center gap-2 text-xs cursor-pointer transition-all"
            onMouseEnter={() => setHoveredSegment(segment.rating)}
            onMouseLeave={() => setHoveredSegment(null)}
          >
            <div 
              className="w-3 h-3 rounded-full transition-transform" 
              style={{ 
                backgroundColor: segment.color,
                transform: hoveredSegment === segment.rating ? 'scale(1.3)' : 'scale(1)'
              }}
            />
            <span className={`transition-all ${hoveredSegment === segment.rating ? 'font-bold text-gray-900' : 'text-gray-600'}`}>
              {segment.rating} stars
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DistributionBarChart({ label, data, valueSuffix = "" }) {
  const maxCount = Math.max(...data.map((item) => item.count), 1);

  return (
    <div className="bg-white p-4 rounded-lg border-2 border-gray-200">
      <h3 className="text-sm font-semibold text-gray-700 mb-4 text-center">{label}</h3>
      <div className="h-52 flex items-end justify-between gap-3 border-b border-l border-gray-200 px-2 pb-2">
        {data.map((item) => {
          const heightPercent = (item.count / maxCount) * 100;

          return (
            <div key={item.key} className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
              <div className="text-xs text-gray-600 mb-1">{item.count}{valueSuffix}</div>
              <div className="w-full max-w-[56px] h-full flex items-end">
                <div
                  className="w-full rounded-t-md transition-all"
                  style={{
                    height: item.count > 0 ? `${Math.max(heightPercent, 8)}%` : "0%",
                    background: item.color,
                  }}
                  title={`${item.name}: ${item.count}${valueSuffix}`}
                />
              </div>
              <div className="text-[11px] text-center text-gray-700 mt-2 leading-tight">{item.name}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Carousel Component
function ReviewCarousel({ reviews, type, onLoadDetail, renderDetails, calculateAvg }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (reviews[currentIndex]) {
      onLoadDetail(reviews[currentIndex].id);
    }
  }, [currentIndex, reviews, onLoadDetail]);

  const nextSlide = () => {
    if (currentIndex < reviews.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const prevSlide = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  if (!reviews || reviews.length === 0) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500 italic">No reviews found.</p>
      </div>
    );
  }

  const review = reviews[currentIndex];

  return (
    <div className="relative">
      <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg min-h-[400px] flex flex-col">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-lg font-bold text-gray-800">
            {type === "received" ? "Written by: " : "Reviewing: "}
            {type === "received" ? review.reviewer.name : review.reviewee.name}
          </p>
          <p className="text-sm text-gray-500">
            {currentIndex + 1} of {reviews.length}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-xs text-gray-600 mb-1">Approachability</p>
            <p className="text-xl font-bold text-blue-700">
              {review.approachability}/5
            </p>
          </div>
          <div className="bg-purple-50 p-3 rounded border border-purple-200">
            <p className="text-xs text-gray-600 mb-1">Academic Inclination</p>
            <p className="text-xl font-bold text-purple-700">
              {review.academicInclination}/5
            </p>
          </div>
          <div className="bg-green-50 p-3 rounded border border-green-200">
            <p className="text-xs text-gray-600 mb-1">Work Ethics</p>
            <p className="text-xl font-bold text-green-700">
              {review.workEthics}/5
            </p>
          </div>
          <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
            <p className="text-xs text-gray-600 mb-1">Maturity</p>
            <p className="text-xl font-bold text-yellow-700">
              {review.maturity}/5
            </p>
          </div>
          <div className="bg-pink-50 p-3 rounded border border-pink-200">
            <p className="text-xs text-gray-600 mb-1">Open Mindedness</p>
            <p className="text-xl font-bold text-pink-700">
              {review.openMindedness}/5
            </p>
          </div>
          <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
            <p className="text-xs text-gray-600 mb-1">Academic Ethics</p>
            <p className="text-xl font-bold text-indigo-700">
              {review.academicEthics}/5
            </p>
          </div>
        </div>

        <div className="space-y-3 mb-4 flex-grow">
          {renderDetails(review.id)}
        </div>

        <div className="border-t pt-3 mt-auto">
          <p className="text-right">
            <span className="text-sm text-gray-600">Average: </span>
            <span className="text-2xl font-bold text-[#142749]">
              {calculateAvg(review)}/5
            </span>
          </p>
        </div>
      </div>

      {reviews.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            disabled={currentIndex === 0}
            className={`absolute left-[-2rem] top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-all focus:outline-none ${
              currentIndex === 0
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-[#142749] text-white hover:bg-[#1a3461] hover:scale-110"
            }`}
            aria-label="Previous review"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          
          <button
            onClick={nextSlide}
            disabled={currentIndex === reviews.length - 1}
            className={`absolute right-[-2rem] top-1/2 -translate-y-1/2 p-2 rounded-full shadow-lg transition-all focus:outline-none ${
              currentIndex === reviews.length - 1
                ? "bg-gray-300 text-gray-500 cursor-not-allowed opacity-50"
                : "bg-[#142749] text-white hover:bg-[#1a3461] hover:scale-110"
            }`}
            aria-label="Next review"
          >
           <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
          
          <div className="flex justify-center gap-2 mt-4">
            {reviews.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  idx === currentIndex ? "bg-[#142749] w-4" : "bg-gray-300"
                }`}
                aria-label={`Go to review ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminUserDetail({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [detailsById, setDetailsById] = useState({});
  const [loadingById, setLoadingById] = useState({});
  
  // Helper function to calculate average of 6 ratings
  const calculateAvg = (review) => {
    return ((review.approachability + review.academicInclination + review.workEthics + 
             review.maturity + review.openMindedness + review.academicEthics) / 6).toFixed(1);
  };
  
  // Extract ratings by field
  const getRatingsByField = (fieldName) => {
    return user.reviewsReceived.map(review => review[fieldName]);
  };

  const getSubstanceUseStanceDistribution = () => {
    const counts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    user.reviewsReceived.forEach((review) => {
      const score = review.substanceUseStance;
      if (score >= 1 && score <= 5) {
        counts[score] += 1;
      }
    });

    return [
      { key: "1", name: "1 (Against)", count: counts[1], color: "#16a34a" },
      { key: "2", name: "2", count: counts[2], color: "#65a30d" },
      { key: "3", name: "3 (Neutral)", count: counts[3], color: "#ca8a04" },
      { key: "4", name: "4", count: counts[4], color: "#ea580c" },
      { key: "5", name: "5 (In Favour)", count: counts[5], color: "#dc2626" },
    ];
  };

  const getObservedUsageDistribution = () => {
    let yesCount = 0;
    let noCount = 0;

    user.reviewsReceived.forEach((review) => {
      if (review.substanceUseObserved === true) yesCount += 1;
      if (review.substanceUseObserved === false) noCount += 1;
    });

    return [
      { key: "yes", name: "Yes", count: yesCount, color: "#16a34a" },
      { key: "no", name: "No", count: noCount, color: "#dc2626" },
    ];
  };
  
  const loadReviewDetail = useCallback(async (reviewId) => {
    if (!reviewId || detailsById[reviewId] || loadingById[reviewId]) return;

    setLoadingById(prev => ({ ...prev, [reviewId]: true }));

    try {
      const response = await fetch(`/portal/api/admin/review-detail?id=${reviewId}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data?.review) {
        setDetailsById(prev => ({ ...prev, [reviewId]: data.review }));
      }
    } catch (error) {
      console.error("Failed to load review details", error);
    } finally {
      setLoadingById(prev => ({ ...prev, [reviewId]: false }));
    }
  }, [detailsById, loadingById]);

  // Initial load is now handled by the ReviewCarousel component (when it mounts)
  
  const renderTextResponses = (reviewId) => {
    const detail = detailsById[reviewId];
    const isLoading = loadingById[reviewId];

    if (isLoading && !detail) {
      return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600">Loading detailed responses...</p>
        </div>
      );
    }

    if (!detail) {
      return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600">Scroll to load detailed responses.</p>
        </div>
      );
    }

    const hasAnyText = detail.substanceAbuse || detail.ismpMentor || detail.otherComments;

    if (!hasAnyText) {
      return (
        <div className="bg-gray-50 p-4 rounded border border-gray-200">
          <p className="text-sm text-gray-600">No additional comments provided.</p>
        </div>
      );
    }

    return (
      <>
        {detail.substanceAbuse && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Additional Notes Regarding Substance Abuse:</p>
            <p className="text-sm text-gray-600">{detail.substanceAbuse}</p>
          </div>
        )}
        {detail.ismpMentor && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Do you think he/she will be a good ISMP mentor?</p>
            <p className="text-sm text-gray-600">{detail.ismpMentor}</p>
          </div>
        )}
        {detail.otherComments && (
          <div className="bg-gray-50 p-4 rounded border border-gray-200">
            <p className="text-sm font-semibold text-gray-700 mb-2">Other Comments:</p>
            <p className="text-sm text-gray-600">{detail.otherComments}</p>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">{user.name}</h1>
              <p className="text-sm sm:text-base text-gray-500">{user.email} • {user.department}</p>
            </div>
            <Link href="/admin" className="bg-[#142749] text-white px-4 py-2 rounded hover:bg-[#1a3461] text-sm sm:text-base">
              Back to Admin List
            </Link>
          </div>

        {/* Reviews Received Section */}
        <h2 className="text-xl font-bold text-[#142749] mb-4 border-b-2 border-[#ffc10b] pb-2">
          Reviews Received by {user.name} ({user.reviewsReceived.length})
        </h2>
        
        {user.reviewsReceived.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 mb-12 text-center">
            <p className="text-gray-500 italic">No reviews received yet.</p>
          </div>
        ) : (
          <>
            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'overview'
                    ? 'text-[#142749] border-b-2 border-[#ffc10b]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('detailed')}
                className={`px-6 py-3 font-semibold transition-colors ${
                  activeTab === 'detailed'
                    ? 'text-[#142749] border-b-2 border-[#ffc10b]'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Detailed Reviews
              </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="mb-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12 bg-white p-6 rounded-lg border-2 border-gray-200">
                  <DonutChart 
                    label="Approachability" 
                    ratings={getRatingsByField('approachability')}
                    fieldName="approachability"
                  />
                  <DonutChart 
                    label="Academic Inclination" 
                    ratings={getRatingsByField('academicInclination')}
                    fieldName="academicInclination"
                  />
                  <DonutChart 
                    label="Work Ethics" 
                    ratings={getRatingsByField('workEthics')}
                    fieldName="workEthics"
                  />
                  <DonutChart 
                    label="Maturity" 
                    ratings={getRatingsByField('maturity')}
                    fieldName="maturity"
                  />
                  <DonutChart 
                    label="Open Mindedness" 
                    ratings={getRatingsByField('openMindedness')}
                    fieldName="openMindedness"
                  />
                  <DonutChart 
                    label="Academic Ethics" 
                    ratings={getRatingsByField('academicEthics')}
                    fieldName="academicEthics"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <DistributionBarChart
                    label="Substance Use Stance Distribution"
                    data={getSubstanceUseStanceDistribution()}
                  />
                  <DistributionBarChart
                    label="Observed Substance Use on Campus"
                    data={getObservedUsageDistribution()}
                  />
                </div>
              </div>
            )}

            {/* Detailed Reviews Tab with Carousel */}
            {activeTab === 'detailed' && (
              <div className="mb-12">
                <ReviewCarousel 
                  reviews={user.reviewsReceived} 
                  type="received"
                  onLoadDetail={loadReviewDetail}
                  renderDetails={renderTextResponses}
                  calculateAvg={calculateAvg}
                />
              </div>
            )}
          </>
        )}

        {/* SECTION 2: Reviews Written */}
        <h2 className="text-xl font-bold text-[#142749] mb-4 border-b-2 border-[#ffc10b] pb-2">
          Reviews Written by {user.name} ({user.reviewsWritten.length})
        </h2>
        
        {user.reviewsWritten.length === 0 ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
            <p className="text-gray-500 italic">No reviews written yet.</p>
          </div>
        ) : (
          <div className="mb-12">
            <ReviewCarousel 
              reviews={user.reviewsWritten} 
              type="written"
              onLoadDetail={loadReviewDetail}
              renderDetails={renderTextResponses}
              calculateAvg={calculateAvg}
            />
          </div>
        )}

        </div>
      </div>
      <Footer />
    </div>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

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
    select: {
      id: true,
      name: true,
      email: true,
      department: true,
      reviewsWritten: {
        select: {
          id: true,
          approachability: true,
          academicInclination: true,
          workEthics: true,
          maturity: true,
          openMindedness: true,
          academicEthics: true,
          reviewee: { select: { name: true } }
        }
      },
      reviewsReceived: {
        select: {
          id: true,
          approachability: true,
          academicInclination: true,
          workEthics: true,
          maturity: true,
          openMindedness: true,
          academicEthics: true,
          substanceUseStance: true,
          substanceUseObserved: true,
          reviewer: { select: { name: true } }
        }
      }
    }
  });

  if (!rawUser) {
    return { notFound: true };
  }

  // THE FIX:
  // 1. JSON.stringify turns everything (including Date objects) into strings.
  // 2. JSON.parse turns it back into a plain JavaScript object.
  const user = JSON.parse(JSON.stringify(rawUser));

  return { props: { user } };
}
