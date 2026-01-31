// pages/candidates.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession, getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import { useRouter } from "next/router";
import Head from "next/head";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function CandidatesPage({ hasSubmitted }) {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Redirect if user has submitted (client-side backup)
  useEffect(() => {
    if (hasSubmitted) {
      router.push('/dashboard');
    }
  }, [hasSubmitted, router]);

  // We now have two data sources: Search Results and Recommendations
  const [candidates, setCandidates] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Tabs: 'suggested', 'all', 'reviewed'
  const [activeTab, setActiveTab] = useState("suggested");

  // 1. Fetch Recommendations on Load
  useEffect(() => {
    if (session) {
      fetch('/api/recommendations')
        .then(res => res.json())
        .then(data => {
          // Ensure data is an array
          if (Array.isArray(data)) {
            setRecommendations(data);
          } else {
            console.error('Recommendations API error:', data);
            setRecommendations([]);
          }
        })
        .catch(err => {
          console.error('Failed to fetch recommendations:', err);
          setRecommendations([]);
        });
    }
  }, [session]);

  // 2. Fetch Search Results (Debounced)
  useEffect(() => {
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${query}`);
        const data = await res.json();
        // Ensure data is an array
        if (Array.isArray(data)) {
          setCandidates(data);
        } else {
          console.error('Search API error:', data);
          setCandidates([]);
        }
      } catch (e) { 
        console.error(e); 
        setCandidates([]);
      } 
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 3. Decide what list to show based on Tab
  let displayedList = [];
  
  if (activeTab === "suggested") {
    // Show recommendations that are NOT reviewed yet
    displayedList = recommendations.filter(u => !u.hasReviewed);
  } else if (activeTab === "all") {
    // Show search results that are NOT reviewed yet
    displayedList = candidates.filter(u => !u.hasReviewed);
  } else if (activeTab === "reviewed") {
    // Show only reviewed (from the search pool, or we could fetch all reviewed separately)
    // For simplicity, we use the search pool which contains everyone matching the query
    displayedList = candidates.filter(u => u.hasReviewed);
  }

  return (
    <>
      <Head>
        <title>Peer Review Portal</title>
        <link rel="icon" href="/logo_dark.svg" />
      </Head>
      <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <div className="flex-1 p-6 sm:p-6 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
            <h1 className="text-2xl sm:text-3xl font-bold text-black">Find Candidates</h1>
            <Link href="/dashboard" className="text-sm sm:text-base text-[#142749] hover:underline font-medium">
              ← Back to Dashboard
            </Link>
          </div>

        {/* Search Input (Only needed for 'All' or 'Reviewed') */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all candidates..."
            className="w-full border border-gray-300 p-3 sm:p-3 rounded-lg bg-white text-base sm:text-sm text-black focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 3 Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-2 sm:gap-4 overflow-x-auto">
           <button
            onClick={() => setActiveTab("suggested")}
            className={`pb-2 font-medium px-3 sm:px-2 text-sm sm:text-base whitespace-nowrap ${
              activeTab === "suggested" ? "border-b-2 border-[#142749] text-[#142749]" : "text-gray-500"
            }`}
          >
            You May Know
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 font-medium px-3 sm:px-2 text-sm sm:text-base whitespace-nowrap ${
              activeTab === "all" ? "border-b-2 border-[#142749] text-[#142749]" : "text-gray-500"
            }`}
          >
            All Candidates
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`pb-2 font-medium px-3 sm:px-2 text-sm sm:text-base whitespace-nowrap ${
              activeTab === "reviewed" ? "border-b-2 border-[#142749] text-[#142749]" : "text-gray-500"
            }`}
          >
            Reviewed
          </button>
        </div>

        {/* The List */}
        <div className="space-y-3 sm:space-y-4">
          {displayedList.length === 0 && !loading && (
             <p className="text-sm sm:text-base text-gray-500 text-center py-8">
               {activeTab === "suggested" && "No direct matches found. Try searching in 'All Candidates'."}
               {activeTab === "all" && "No candidates found."}
               {activeTab === "reviewed" && "You haven't reviewed anyone yet."}
             </p>
          )}

          {displayedList.map((user) => (
            <div key={user.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div className="flex-1">
                <h3 className="font-bold text-base sm:text-lg text-black">
                  {user.name} 
                  {/* Show Program Badge */}
                  <span className={`ml-2 text-xs px-2 py-1 rounded font-normal ${
                    user.applyingFor === 'ismp' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.applyingFor?.toUpperCase() || 'ISMP'}
                  </span>
                  {/* Show Match Reason Badge for Suggested Tab */}
                  {activeTab === "suggested" && user.matchTag && (
                    <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-normal">
                      {user.matchTag}
                    </span>
                  )}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  {user.department} • {user.hostel || "No Hostel"} • Year {user.year}
                </p>
              </div>

              {user.hasReviewed ? (
                <Link
                  href={`/review/${user.id}`}
                  className="w-full sm:w-auto px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium border border-yellow-600 text-center text-sm sm:text-base"
                >
                  Edit
                </Link>
              ) : (
                <Link
                  href={`/review/${user.id}`}
                  className="w-full sm:w-auto px-4 py-2 bg-[#142749] text-white rounded hover:bg-[#1a3461] font-medium text-center text-sm sm:text-base"
                >
                  Review
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
    <Footer />
    </div>
  </>
  );
}
// Server-side check to prevent access after submission
export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  // Check if user has submitted
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { hasSubmitted: true }
  });

  // Redirect to dashboard if already submitted
  if (user?.hasSubmitted) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // Check if reviews are enabled
  const settings = await prisma.systemSettings.findFirst();
  if (settings && !settings.reviewsEnabled) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  return {
    props: { hasSubmitted: false }
  };
}
