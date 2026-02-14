// pages/candidates.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession} from "next-auth/react";

import { getServerSession } from "next-auth/next"; 
import { authOptions } from "@/lib/auth";

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
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [skip, setSkip] = useState(0);
  const [recSkip, setRecSkip] = useState(0); // Separate skip for recommendations
  const [recHasMore, setRecHasMore] = useState(true);
  const ITEMS_PER_PAGE = 20;
  
  // Tabs: 'suggested', 'all', 'reviewed'
  const [activeTab, setActiveTab] = useState("suggested");

  // 1. Fetch Recommendations on Load
  useEffect(() => {
    if (session) {
      fetch(`/portal/api/recommendations?skip=0&take=${ITEMS_PER_PAGE}`)
        .then(res => res.json())
        .then(data => {
          if (data.users && Array.isArray(data.users)) {
            setRecommendations(data.users);
            setRecHasMore(data.hasMore);
          } else {
            console.error('Recommendations API error:', data);
            setRecommendations([]);
            setRecHasMore(false);
          }
        })
        .catch(err => {
          console.error('Failed to fetch recommendations:', err);
          setRecommendations([]);
          setRecHasMore(false);
        });
    }
  }, [session]);

  // 2. Fetch Search Results (Debounced) - Reset on query change
  useEffect(() => {
    setSkip(0);
    setCandidates([]);
    setHasMore(true);
    
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/portal/api/search?q=${query}&skip=0&take=${ITEMS_PER_PAGE}`);
        const data = await res.json();
        
        if (data.users && Array.isArray(data.users)) {
          setCandidates(data.users);
          setHasMore(data.hasMore);
        } else {
          console.error('Search API error:', data);
          setCandidates([]);
          setHasMore(false);
        }
      } catch (e) { 
        console.error(e); 
        setCandidates([]);
        setHasMore(false);
      } 
      finally { setLoading(false); }
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  // 3. Load More Function for Search/All tab
  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const newSkip = skip + ITEMS_PER_PAGE;
    
    try {
      const res = await fetch(`/portal/api/search?q=${query}&skip=${newSkip}&take=${ITEMS_PER_PAGE}`);
      const data = await res.json();
      
      if (data.users && Array.isArray(data.users)) {
        setCandidates(prev => [...prev, ...data.users]);
        setSkip(newSkip);
        setHasMore(data.hasMore);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // Load More for Recommendations
  const loadMoreRecommendations = async () => {
    if (loadingMore || !recHasMore) return;
    
    setLoadingMore(true);
    const newSkip = recSkip + ITEMS_PER_PAGE;
    
    try {
      const res = await fetch(`/portal/api/recommendations?skip=${newSkip}&take=${ITEMS_PER_PAGE}`);
      const data = await res.json();
      
      if (data.users && Array.isArray(data.users)) {
        setRecommendations(prev => [...prev, ...data.users]);
        setRecSkip(newSkip);
        setRecHasMore(data.hasMore);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  // 4. Decide what list to show based on Tab
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
                  {/* Show Match Reason Badge for Suggested Tab */}
                  {activeTab === "suggested" && user.matchTag && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">
                      Matches: {user.matchTag}
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

          {/* Load More Button - Different logic for each tab */}
          {activeTab === "suggested" && recHasMore && displayedList.length > 0 && (
            <div className="text-center py-4">
              <button
                onClick={loadMoreRecommendations}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#142749] text-white rounded-lg hover:bg-[#1a3461] font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
          
          {(activeTab === "all" || activeTab === "reviewed") && hasMore && displayedList.length > 0 && (
            <div className="text-center py-4">
              <button
                onClick={loadMore}
                disabled={loadingMore}
                className="px-6 py-3 bg-[#142749] text-white rounded-lg hover:bg-[#1a3461] font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingMore ? 'Loading...' : 'Load More'}
              </button>
            </div>
          )}
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
  // 1. Validate Session
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/home", permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  
  // 2. Fetch Candidates (Example logic)
  const candidates = await prisma.user.findMany({
    where: {
      NOT: { id: session.user.id }, // Don't show self
      // Add your department logic here if needed
    },
    select: { id: true, name: true, department: true }
  });

  return {
    props: {
      user: JSON.parse(JSON.stringify(user)),
      candidates: JSON.parse(JSON.stringify(candidates)),
    },
  };
}
