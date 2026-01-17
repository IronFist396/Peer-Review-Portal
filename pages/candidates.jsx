// pages/candidates.jsx
import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function CandidatesPage() {
  const { data: session } = useSession();
  
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
    <div className="min-h-screen bg-white text-black p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-black">Find Candidates</h1>
          <Link href="/dashboard" className="text-blue-600 hover:underline">
            Back to Dashboard
          </Link>
        </div>

        {/* Search Input (Only needed for 'All' or 'Reviewed') */}
        <div className="mb-6">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search all candidates..."
            className="w-full border border-gray-300 p-3 rounded-lg bg-white text-black focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* 3 Tabs */}
        <div className="flex border-b border-gray-200 mb-6 gap-4">
           <button
            onClick={() => setActiveTab("suggested")}
            className={`pb-2 font-medium px-2 ${
              activeTab === "suggested" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
          >
            You May Know
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`pb-2 font-medium px-2 ${
              activeTab === "all" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
          >
            All Candidates
          </button>
          <button
            onClick={() => setActiveTab("reviewed")}
            className={`pb-2 font-medium px-2 ${
              activeTab === "reviewed" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-500"
            }`}
          >
            Reviewed
          </button>
        </div>

        {/* The List */}
        <div className="space-y-4">
          {displayedList.length === 0 && !loading && (
             <p className="text-gray-500 text-center py-8">
               {activeTab === "suggested" && "No direct matches found. Try searching in 'All Candidates'."}
               {activeTab === "all" && "No candidates found."}
               {activeTab === "reviewed" && "You haven't reviewed anyone yet."}
             </p>
          )}

          {displayedList.map((user) => (
            <div key={user.id} className="border border-gray-200 p-4 rounded-lg bg-white shadow-sm flex justify-between items-center">
              <div>
                <h3 className="font-bold text-lg text-black">
                  {user.name} 
                  {/* Show Match Reason Badge for Suggested Tab */}
                  {activeTab === "suggested" && user.matchTag && (
                    <span className="ml-2 text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-normal">
                      Matches: {user.matchTag}
                    </span>
                  )}
                </h3>
                <p className="text-sm text-gray-600">
                  {user.department} • {user.hostel || "No Hostel"} • Year {user.year}
                </p>
              </div>

              {user.hasReviewed ? (
                <Link
                  href={`/review/${user.id}`}
                  className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 font-medium border border-yellow-600"
                >
                  Edit
                </Link>
              ) : (
                <Link
                  href={`/review/${user.id}`}
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
                >
                  Review
                </Link>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}