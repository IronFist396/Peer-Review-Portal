import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import { useState } from "react";

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

export default function AdminUserDetail({ user }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [currentWrittenIndex, setCurrentWrittenIndex] = useState(0);
  
  // Helper function to calculate average of 6 ratings
  const calculateAvg = (review) => {
    return ((review.approachability + review.academicInclination + review.workEthics + 
             review.maturity + review.openMindedness + review.academicEthics) / 6).toFixed(1);
  };
  
  // Extract ratings by field
  const getRatingsByField = (fieldName) => {
    return user.reviewsReceived.map(review => review[fieldName]);
  };
  
  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % user.reviewsReceived.length);
  };
  
  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + user.reviewsReceived.length) % user.reviewsReceived.length);
  };

  const nextWritten = () => {
    setCurrentWrittenIndex((prev) => (prev + 1) % user.reviewsWritten.length);
  };
  
  const prevWritten = () => {
    setCurrentWrittenIndex((prev) => (prev - 1 + user.reviewsWritten.length) % user.reviewsWritten.length);
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
              </div>
            )}

            {/* Detailed Reviews Tab with Carousel */}
            {activeTab === 'detailed' && (
              <div className="mb-12">
                <div className="relative">
                  {/* Carousel Navigation */}
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={prevReview}
                      disabled={user.reviewsReceived.length <= 1}
                      className="bg-[#142749] text-white px-4 py-2 rounded hover:bg-[#1a3461] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Previous
                    </button>
                    
                    <div className="text-center">
                      <p className="text-sm text-gray-600">
                        Review {currentReviewIndex + 1} of {user.reviewsReceived.length}
                      </p>
                    </div>
                    
                    <button
                      onClick={nextReview}
                      disabled={user.reviewsReceived.length <= 1}
                      className="bg-[#142749] text-white px-4 py-2 rounded hover:bg-[#1a3461] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      Next
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  {/* Current Review Card */}
                  {user.reviewsReceived[currentReviewIndex] && (
                    <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
                      <div className="mb-4">
                        <p className="text-lg font-bold text-gray-800">
                          Written by: {user.reviewsReceived[currentReviewIndex].reviewer.name}
                        </p>
                      </div>
                      
                      {/* Star Ratings Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                        <div className="bg-blue-50 p-3 rounded border border-blue-200">
                          <p className="text-xs text-gray-600 mb-1">Approachability</p>
                          <p className="text-xl font-bold text-blue-700">
                            {user.reviewsReceived[currentReviewIndex].approachability}/5
                          </p>
                        </div>
                        <div className="bg-purple-50 p-3 rounded border border-purple-200">
                          <p className="text-xs text-gray-600 mb-1">Academic Inclination</p>
                          <p className="text-xl font-bold text-purple-700">
                            {user.reviewsReceived[currentReviewIndex].academicInclination}/5
                          </p>
                        </div>
                        <div className="bg-green-50 p-3 rounded border border-green-200">
                          <p className="text-xs text-gray-600 mb-1">Work Ethics</p>
                          <p className="text-xl font-bold text-green-700">
                            {user.reviewsReceived[currentReviewIndex].workEthics}/5
                          </p>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                          <p className="text-xs text-gray-600 mb-1">Maturity</p>
                          <p className="text-xl font-bold text-yellow-700">
                            {user.reviewsReceived[currentReviewIndex].maturity}/5
                          </p>
                        </div>
                        <div className="bg-pink-50 p-3 rounded border border-pink-200">
                          <p className="text-xs text-gray-600 mb-1">Open Mindedness</p>
                          <p className="text-xl font-bold text-pink-700">
                            {user.reviewsReceived[currentReviewIndex].openMindedness}/5
                          </p>
                        </div>
                        <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                          <p className="text-xs text-gray-600 mb-1">Academic Ethics</p>
                          <p className="text-xl font-bold text-indigo-700">
                            {user.reviewsReceived[currentReviewIndex].academicEthics}/5
                          </p>
                        </div>
                      </div>

                      {/* Text Responses */}
                      <div className="space-y-3 mb-4">
                        {user.reviewsReceived[currentReviewIndex].substanceAbuse && (
                          <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Substance Abuse:</p>
                            <p className="text-sm text-gray-600">
                              {user.reviewsReceived[currentReviewIndex].substanceAbuse}
                            </p>
                          </div>
                        )}
                        {user.reviewsReceived[currentReviewIndex].ismpMentor && (
                          <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">ISMP Mentor:</p>
                            <p className="text-sm text-gray-600">
                              {user.reviewsReceived[currentReviewIndex].ismpMentor}
                            </p>
                          </div>
                        )}
                        {user.reviewsReceived[currentReviewIndex].otherComments && (
                          <div className="bg-gray-50 p-4 rounded border border-gray-200">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Other Comments:</p>
                            <p className="text-sm text-gray-600">
                              {user.reviewsReceived[currentReviewIndex].otherComments}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Average Score */}
                      <div className="border-t pt-3">
                        <p className="text-right">
                          <span className="text-sm text-gray-600">Average: </span>
                          <span className="text-2xl font-bold text-[#142749]">
                            {calculateAvg(user.reviewsReceived[currentReviewIndex])}/5
                          </span>
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Dots Indicator */}
                  {user.reviewsReceived.length > 1 && (
                    <div className="flex justify-center gap-2 mt-4">
                      {user.reviewsReceived.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setCurrentReviewIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all ${
                            idx === currentReviewIndex 
                              ? 'bg-[#ffc10b] w-6' 
                              : 'bg-gray-300 hover:bg-gray-400'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
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
            <div className="relative">
              {/* Carousel Navigation */}
              <div className="flex justify-between items-center mb-4">
                <button
                  onClick={prevWritten}
                  disabled={user.reviewsWritten.length <= 1}
                  className="bg-[#142749] text-white px-4 py-2 rounded hover:bg-[#1a3461] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    Review {currentWrittenIndex + 1} of {user.reviewsWritten.length}
                  </p>
                </div>
                
                <button
                  onClick={nextWritten}
                  disabled={user.reviewsWritten.length <= 1}
                  className="bg-[#142749] text-white px-4 py-2 rounded hover:bg-[#1a3461] disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Next
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Current Written Review Card */}
              {user.reviewsWritten[currentWrittenIndex] && (
                <div className="bg-white border-2 border-gray-200 rounded-lg p-6 shadow-lg">
                  <div className="mb-4">
                    <p className="text-lg font-bold text-gray-800">
                      Reviewing: {user.reviewsWritten[currentWrittenIndex].reviewee.name}
                    </p>
                  </div>
                  
                  {/* Star Ratings Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className="bg-blue-50 p-3 rounded border border-blue-200">
                      <p className="text-xs text-gray-600 mb-1">Approachability</p>
                      <p className="text-xl font-bold text-blue-700">
                        {user.reviewsWritten[currentWrittenIndex].approachability}/5
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded border border-purple-200">
                      <p className="text-xs text-gray-600 mb-1">Academic Inclination</p>
                      <p className="text-xl font-bold text-purple-700">
                        {user.reviewsWritten[currentWrittenIndex].academicInclination}/5
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded border border-green-200">
                      <p className="text-xs text-gray-600 mb-1">Work Ethics</p>
                      <p className="text-xl font-bold text-green-700">
                        {user.reviewsWritten[currentWrittenIndex].workEthics}/5
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <p className="text-xs text-gray-600 mb-1">Maturity</p>
                      <p className="text-xl font-bold text-yellow-700">
                        {user.reviewsWritten[currentWrittenIndex].maturity}/5
                      </p>
                    </div>
                    <div className="bg-pink-50 p-3 rounded border border-pink-200">
                      <p className="text-xs text-gray-600 mb-1">Open Mindedness</p>
                      <p className="text-xl font-bold text-pink-700">
                        {user.reviewsWritten[currentWrittenIndex].openMindedness}/5
                      </p>
                    </div>
                    <div className="bg-indigo-50 p-3 rounded border border-indigo-200">
                      <p className="text-xs text-gray-600 mb-1">Academic Ethics</p>
                      <p className="text-xl font-bold text-indigo-700">
                        {user.reviewsWritten[currentWrittenIndex].academicEthics}/5
                      </p>
                    </div>
                  </div>

                  {/* Text Responses */}
                  <div className="space-y-3 mb-4">
                    {user.reviewsWritten[currentWrittenIndex].substanceAbuse && (
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Substance Abuse:</p>
                        <p className="text-sm text-gray-600">
                          {user.reviewsWritten[currentWrittenIndex].substanceAbuse}
                        </p>
                      </div>
                    )}
                    {user.reviewsWritten[currentWrittenIndex].ismpMentor && (
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">ISMP Mentor:</p>
                        <p className="text-sm text-gray-600">
                          {user.reviewsWritten[currentWrittenIndex].ismpMentor}
                        </p>
                      </div>
                    )}
                    {user.reviewsWritten[currentWrittenIndex].otherComments && (
                      <div className="bg-gray-50 p-4 rounded border border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Other Comments:</p>
                        <p className="text-sm text-gray-600">
                          {user.reviewsWritten[currentWrittenIndex].otherComments}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Average Score */}
                  <div className="border-t pt-3">
                    <p className="text-right">
                      <span className="text-sm text-gray-600">Average: </span>
                      <span className="text-2xl font-bold text-[#ffc10b]">
                        {calculateAvg(user.reviewsWritten[currentWrittenIndex])}/5
                      </span>
                    </p>
                  </div>
                </div>
              )}

              {/* Dots Indicator */}
              {user.reviewsWritten.length > 1 && (
                <div className="flex justify-center gap-2 mt-4">
                  {user.reviewsWritten.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentWrittenIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
                        idx === currentWrittenIndex 
                          ? 'bg-[#ffc10b] w-6' 
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        </div>
      </div>
      <Footer />
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