import { getSession } from "next-auth/react";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { useState } from "react";
import Head from "next/head";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function AdminDashboard({ user, users, reviewsEnabled: initialEnabled }) {
  const [reviewsEnabled, setReviewsEnabled] = useState(initialEnabled);
  const [isToggling, setIsToggling] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("");

  // Get unique departments
  const departments = [...new Set(users.map(u => u.department))].sort();

  // Filter users based on search, department, and program
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = !selectedDepartment || u.department === selectedDepartment;
    const matchesProgram = !selectedProgram || u.applyingFor === selectedProgram;
    return matchesSearch && matchesDepartment && matchesProgram;
  });

  const toggleUserReviews = async (userId, currentStatus) => {
    try {
      const res = await fetch('/api/toggle-user-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId, 
          acceptingReviews: !currentStatus 
        })
      });

      if (res.ok) {
        // Refresh the page to show updated data
        window.location.reload();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to update user");
      }
    } catch (error) {
      alert("Something went wrong");
    }
  };

  const handleToggle = async () => {
    setIsToggling(true);
    try {
      const res = await fetch('/api/toggle-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !reviewsEnabled })
      });

      if (res.ok) {
        const data = await res.json();
        setReviewsEnabled(data.reviewsEnabled);
      } else {
        alert("Failed to update settings");
      }
    } catch (error) {
      alert("Something went wrong");
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      <Head>
        <title>Admin Panel</title>
        <link rel="icon" href="/logo_dark.svg" />
      </Head>
      <div className="min-h-screen flex flex-col bg-white text-black">
      <Navbar />
      <div className="flex-1 p-4 sm:p-6 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {user.isDeptHead ? `${user.department} Department Admin` : 'Admin Panel'}
              </h1>
              {user.isDeptHead && !user.isAdmin && (
                <p className="text-sm text-gray-600 mt-1">
                  Managing DAMP reviews for {user.department}
                </p>
              )}
            </div>
            <Link 
              href="/dashboard" 
              className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm sm:text-base font-semibold"
            >
              ← Back to Dashboard
            </Link>
          </div>

        {/* Kill Switch - Only for Super Admin */}
        {user.isAdmin && (
        <div className={`mb-6 p-4 sm:p-4 rounded-lg border-2 ${reviewsEnabled ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'}`}>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex-1">
              <h3 className="font-bold text-base sm:text-lg">Review Submission Status</h3>
              <p className="text-xs sm:text-sm text-gray-600">
                {reviewsEnabled 
                  ? "Students can currently submit and edit reviews" 
                  : "Review submissions are disabled - students will see a message"}
              </p>
            </div>
            <button
              onClick={handleToggle}
              disabled={isToggling}
              className={`w-full sm:w-auto px-6 py-3 rounded font-bold text-white transition-colors text-sm sm:text-base ${
                reviewsEnabled 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-[#142749] hover:bg-[#1a3461]'
              } disabled:opacity-50`}
            >
              {isToggling ? "Updating..." : (reviewsEnabled ? "Disable Reviews" : "Enable Reviews")}
            </button>
          </div>
        </div>
        )}

        {/* Search and Filter */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          >
            <option value="">All Departments</option>
            {departments.map((dept) => (
              <option key={dept} value={dept}>
                {dept}
              </option>
            ))}
          </select>
          {user.isAdmin && (
            <select
              value={selectedProgram}
              onChange={(e) => setSelectedProgram(e.target.value)}
              className="border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500 min-w-[200px]"
            >
              <option value="">All Programs</option>
              <option value="ismp">ISMP</option>
              <option value="damp">DAMP</option>
            </select>
          )}
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredUsers.length} of {users.length} users
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block bg-white shadow border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
              <tr>
                <th className="p-4 border-b">Name</th>
                <th className="p-4 border-b">Department</th>
                <th className="p-4 border-b text-center">Reviews Received</th>
                <th className="p-4 border-b text-center">Reviews Written</th>
                <th className="p-4 border-b text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className={`hover:bg-gray-50 ${user.hasSubmitted ? 'border-l-4 border-l-green-500 bg-green-50' : ''}`}>
                  <td className="p-4 font-medium">
                    {user.name}
                    {user.hasSubmitted && (
                      <span className="ml-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded font-normal">✓ Submitted</span>
                    )}
                  </td>
                  <td className="p-4 text-gray-600">{user.department}</td>
                  <td className="p-4 text-center text-gray-600">
                    {user._count.reviewsReceived}
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-2 py-1 rounded text-xs font-bold ${user._count.reviewsWritten >= 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user._count.reviewsWritten} / 5
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <Link 
                      href={`/admin/user/${user.id}`}
                      className="text-white bg-[#142749] hover:bg-[#1a3461] font-bold text-sm border border-[#142749] px-3 py-1 rounded"
                    >
                      Inspect
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Hidden on Desktop */}
        <div className="md:hidden space-y-4">
          {filteredUsers.map((user) => (
            <div 
              key={user.id} 
              className={`bg-white border rounded-lg p-4 shadow-sm ${
                user.hasSubmitted ? 'border-l-4 border-l-green-500 bg-green-50' : 'border-gray-200'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-base text-black">{user.name}</h3>
                  <p className="text-xs text-gray-600">{user.email}</p>
                  <div className="flex gap-2 mt-2">
                    <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded font-medium">
                      {user.department}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      user.applyingFor === 'ismp' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {user.applyingFor.toUpperCase()}
                    </span>
                  </div>
                  {user.hasSubmitted && (
                    <span className="inline-block mt-2 text-xs bg-green-600 text-white px-2 py-0.5 rounded">✓ Submitted</span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Reviews Received</p>
                  <p className="text-lg font-bold text-gray-800">{user._count.reviewsReceived}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-500 mb-1">Reviews Written</p>
                  <p className="text-lg font-bold">
                    <span className={`px-2 py-1 rounded text-xs ${user._count.reviewsWritten >= 5 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {user._count.reviewsWritten} / 5
                    </span>
                  </p>
                </div>
              </div>

              <div className="mb-3">
                <button
                  onClick={() => toggleUserReviews(user.id, user.acceptingReviews)}
                  className={`w-full px-3 py-2 rounded text-xs font-semibold ${
                    user.acceptingReviews
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {user.acceptingReviews ? '✓ Accepting Reviews' : '✕ Paused'}
                </button>
              </div>
              
              <Link 
                href={`/admin/user/${user.id}`}
                className="block w-full text-center px-4 py-2 text-white bg-[#142749] hover:bg-[#1a3461] font-bold text-sm border border-[#142749] rounded"
              >
                Inspect User
              </Link>
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

export async function getServerSideProps(context) {
  const session = await getSession(context);

  if (!session) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // 1. Check if the user is an admin or dept head
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { 
      isAdmin: true, 
      isDeptHead: true, 
      department: true 
    }
  });

  // 2. Security Check: Redirect if not admin or dept head
  if (!user || (!user.isAdmin && !user.isDeptHead)) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  // 3. Get users based on permissions
  let users;
  
  if (user.isAdmin) {
    // Super admin sees everyone (except admins and dept heads)
    users = await prisma.user.findMany({
      where: { 
        isAdmin: false,
        isDeptHead: false
      },
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
        applyingFor: true,
        acceptingReviews: true,
        hasSubmitted: true,
        _count: {
          select: { reviewsWritten: true, reviewsReceived: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  } else if (user.isDeptHead) {
    // Dept head sees only DAMP users from their department
    users = await prisma.user.findMany({
      where: { 
        applyingFor: 'damp',
        department: user.department,
        isDeptHead: false,
        isAdmin: false
      },
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
        applyingFor: true,
        acceptingReviews: true,
        hasSubmitted: true,
        _count: {
          select: { reviewsWritten: true, reviewsReceived: true }
        }
      },
      orderBy: { name: 'asc' }
    });
  }

  // 4. Get system settings
  const settings = await prisma.systemSettings.findFirst();

  return { 
    props: { 
      user,
      users,
      reviewsEnabled: settings?.reviewsEnabled ?? true 
    } 
  };
}