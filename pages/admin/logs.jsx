// pages/admin/logs.jsx
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";

export default function LogsPage() {
  const [logs, setLogs] = useState([]);
  const [logType, setLogType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('system'); // 'system' or 'user'
  
  // Pagination State
  const [skip, setSkip] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const LIMIT = 50;
  
  // User Tab State
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Fetch System Logs
  const fetchLogs = async (shouldReset = false) => {
    try {
      if (shouldReset) {
        setSkip(0);
        setLogs([]);
        setHasMore(true); // Assume more on reset
      }
      
      setLoading(true);
      setError(null);
      
      const currentSkip = shouldReset ? 0 : skip;
      const type = activeTab === 'user' ? 'user-actions' : logType;
      // If a user is selected, filter by their email
      const searchTerm = activeTab === 'user' && selectedUser 
        ? selectedUser.email 
        : activeTab === 'user' ? userSearchQuery : '';

      const res = await fetch(`/portal/api/admin/logs?type=${type}&limit=${LIMIT}&search=${encodeURIComponent(searchTerm)}&skip=${currentSkip}`);
      
      if (!res.ok) throw new Error(`Failed to fetch logs: ${res.status}`);
      
      const data = await res.json();
      const newLogs = data.logs || [];
      
      setLogs(prev => shouldReset ? newLogs : [...prev, ...newLogs]);
      setHasMore(newLogs.length === LIMIT);
      if (!shouldReset) {
        setSkip(prev => prev + LIMIT);
      } else {
        setSkip(LIMIT);
      }

    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError(error.message);
      if (shouldReset) setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Users List
  const fetchUsers = async () => {
    try {
      if (!userSearchQuery && users.length > 0) return; // Don't refetch empty search if we have users
      
      setLoadingUsers(true);
      const res = await fetch(`/portal/api/admin/users?take=50&search=${encodeURIComponent(userSearchQuery)}`);
      if (!res.ok) throw new Error("Failed to fetch users");
      const data = await res.json();
      setUsers(data.users || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingUsers(false);
    }
  };

  // Effects
  useEffect(() => {
    if (activeTab === 'system') {
      fetchLogs(true);
    } else if (activeTab === 'user' && !selectedUser) {
      fetchUsers();
    } else if (activeTab === 'user' && selectedUser) {
      fetchLogs(true);
    }
  }, [logType, activeTab, selectedUser]);
  
  // Debounced User Search
  useEffect(() => {
    if (activeTab === 'user' && !selectedUser) {
      const timeoutId = setTimeout(() => fetchUsers(), 500);
      return () => clearTimeout(timeoutId);
    }
  }, [userSearchQuery]);

  // Auto Refresh (Only refresh first page/reset to keep it simple, or perhaps just poll for new ones? 
  // For simplicity with pagination, auto-refresh might be tricky. Let's make it reset view to newest.)
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        if (activeTab === 'system' || (activeTab === 'user' && selectedUser)) {
          fetchLogs(true);
        }
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, activeTab, selectedUser, logType]);

  const getLevelColor = (level) => {
    switch(level) {
      case 'ERROR': return 'text-red-600 bg-red-50';
      case 'WARN': return 'text-yellow-600 bg-yellow-50';
      case 'USER_ACTION': return 'text-blue-600 bg-blue-50';
      case 'API_REQUEST': return 'text-purple-600 bg-purple-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <>
      <Head>
        <title>System Logs - Admin</title>
        <link rel="icon" href="/logo_dark.svg" />
      </Head>
      <div className="min-h-screen flex flex-col bg-white text-black">
        <Navbar />
        <div className="flex-1 p-4 sm:p-6 md:p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-black">
                {activeTab === 'user' && selectedUser 
                  ? `Activity: ${selectedUser.name}` 
                  : 'System Logs'}
              </h1>
              <Link 
                href="/admin" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm sm:text-base font-semibold"
              >
                ← Back to Admin
              </Link>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              <button
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'system'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => { 
                  setActiveTab('system'); 
                  setLogType('all'); 
                  setSelectedUser(null);
                }}
              >
                System Logs
              </button>
              <button
                className={`py-2 px-4 font-medium text-sm focus:outline-none ${
                  activeTab === 'user'
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => { 
                  setActiveTab('user'); 
                  setLogType('user-actions'); 
                }}
              >
                User Activity
              </button>
            </div>
            
            {/* CONTENT AREA */}
            
            {/* 1. USER SELECTION LIST */}
            {activeTab === 'user' && !selectedUser && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search users by name or email..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="w-full border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500"
                />
                
                {loadingUsers ? (
                  <div className="text-center py-8 text-gray-500">Loading users...</div>
                ) : users.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">No users found.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {users.map(user => (
                      <div 
                        key={user.id}
                        onClick={() => setSelectedUser(user)}
                        className="bg-white border p-4 rounded-lg shadow-sm hover:shadow-md cursor-pointer hover:border-blue-300 transition-all group"
                      >
                        <div className="font-bold text-lg text-gray-800 group-hover:text-blue-600">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500 mb-2">{user.email}</div>
                        <div className="text-xs text-gray-400 bg-gray-100 inline-block px-2 py-1 rounded">
                          {user.department || 'No Dept'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* 2. LOGS VIEW (System or Selected User) */}
            {((activeTab === 'user' && selectedUser) || activeTab === 'system') && (
              <>
                {/* Controls */}
                <div className="mb-6 flex flex-col sm:flex-row gap-3">
                  {activeTab === 'user' && selectedUser && (
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-medium"
                    >
                      ← Back to Users
                    </button>
                  )}

                  {activeTab === 'system' && (
                    <select
                      value={logType}
                      onChange={(e) => setLogType(e.target.value)}
                      className="border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="all">All Logs</option>
                      <option value="errors">Errors Only</option>
                      <option value="user-actions">User Actions Only</option>
                    </select>
                  )}


              <button
                onClick={() => fetchLogs(true)}
                className="px-4 py-2 bg-[#142749] text-white rounded-lg hover:bg-[#1a3461] font-medium"
              >
                Refresh Logs
              </button>                  <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer ml-auto">
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-sm">Auto-refresh (5s)</span>
                  </label>
                </div>

                {/* Selected User Info Header */}
                {activeTab === 'user' && selectedUser && (
                  <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6 rounded-r">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-blue-800 text-lg">{selectedUser.name}</p>
                        <p className="text-blue-600 text-sm">{selectedUser.email}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Department</p>
                        <p className="text-blue-700 font-medium">{selectedUser.department}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Stats (Hide for specific user view to save space, or keep simpler version) */}
                {activeTab === 'system' && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                      <p className="text-sm text-gray-500">Total Logs</p>
                      <p className="text-2xl font-bold text-gray-800">{logs.length}</p>
                    </div>
                    <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                      <p className="text-sm text-red-600">Errors</p>
                      <p className="text-2xl font-bold text-red-800">
                        {logs.filter(l => l.level === 'ERROR').length}
                      </p>
                    </div>
                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      <p className="text-sm text-yellow-600">Warnings</p>
                      <p className="text-2xl font-bold text-yellow-800">
                        {logs.filter(l => l.level === 'WARN').length}
                      </p>
                    </div>
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-600">User Actions</p>
                      <p className="text-2xl font-bold text-blue-800">
                        {logs.filter(l => l.level === 'USER_ACTION').length}
                      </p>
                    </div>
                  </div>
                )}

                {/* Logs Table */}
                <div className="bg-white shadow border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-sm">
                      <thead className="bg-gray-100 text-gray-700 uppercase text-xs font-bold">
                        <tr>
                          <th className="p-3 border-b">Time</th>
                          <th className="p-3 border-b">Level</th>
                          <th className="p-3 border-b">Category</th>
                          <th className="p-3 border-b">Message</th>
                          <th className="p-3 border-b">Details</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {loading ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-500">
                              Loading logs...
                            </td>
                          </tr>
                        ) : error ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center">
                              <div className="text-red-600 font-semibold mb-2">Error loading logs</div>
                              <div className="text-sm text-gray-600">{error}</div>
                              <div className="text-sm text-gray-500 mt-2">Logs will appear here once the application starts logging events.</div>
                            </td>
                          </tr>
                        ) : logs.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="p-8 text-center text-gray-500">
                              {activeTab === 'user' 
                                ? "No activity logs found for this user." 
                                : "No logs found yet."}
                            </td>
                          </tr>
                        ) : (
                          logs.map((log, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="p-3 text-xs text-gray-600 whitespace-nowrap">
                                {new Date(log.timestamp).toLocaleString()}
                              </td>
                              <td className="p-3">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${getLevelColor(log.level)}`}>
                                  {log.level}
                                </span>
                              </td>
                              <td className="p-3 font-medium text-gray-700">{log.category}</td>
                              <td className="p-3 text-gray-600">{log.message}</td>
                              <td className="p-3">
                                {log.userId && activeTab !== 'user' && (
                                  <div className="text-xs text-gray-500">
                                    User: {log.userEmail || log.userId}
                                  </div>
                                )}
                                {log.error && (
                                  <details className="text-xs text-red-600 cursor-pointer">
                                    <summary>Error Details</summary>
                                    <pre className="mt-2 p-2 bg-red-50 rounded overflow-x-auto">
                                      {log.error.stack || log.error.message}
                                    </pre>
                                  </details>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Load More Button */}
                  {hasMore && !loading && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
                      <button
                        onClick={() => fetchLogs(false)}
                        className="px-6 py-2 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 text-gray-700 font-medium transition-colors"
                      >
                        Load More Logs
                      </button>
                    </div>
                  )}
                  {loading && logs.length > 0 && (
                     <div className="p-4 bg-gray-50 border-t border-gray-200 text-center text-gray-500 text-sm">
                       Loading more...
                     </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const { req, res } = context;
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: "/",
        permanent: false,
      },
    };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  });

  if (!user || !user.isAdmin) {
    return {
      redirect: {
        destination: "/dashboard",
        permanent: false,
      },
    };
  }

  return {
    props: {},
  };
}
