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
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [error, setError] = useState(null);

  const fetchLogs = async () => {
    try {
      setError(null);
      const res = await fetch(`/portal/api/admin/logs?type=${logType}&limit=200`);
      
      if (!res.ok) {
        throw new Error(`Failed to fetch logs: ${res.status}`);
      }
      
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
      setError(error.message);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [logType]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchLogs, 5000); // Refresh every 5s
      return () => clearInterval(interval);
    }
  }, [autoRefresh, logType]);

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
              <h1 className="text-2xl sm:text-3xl font-bold text-black">System Logs</h1>
              <Link 
                href="/admin" 
                className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 text-sm sm:text-base font-semibold"
              >
                ← Back to Admin
              </Link>
            </div>

            {/* Controls */}
            <div className="mb-6 flex flex-col sm:flex-row gap-3">
              <select
                value={logType}
                onChange={(e) => setLogType(e.target.value)}
                className="border border-gray-300 p-3 rounded-lg bg-white text-sm text-black focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Logs</option>
                <option value="errors">Errors Only</option>
                <option value="user-actions">User Actions Only</option>
              </select>

              <button
                onClick={fetchLogs}
                className="px-4 py-2 bg-[#142749] text-white rounded-lg hover:bg-[#1a3461] font-medium"
              >
                Refresh
              </button>

              <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg bg-white cursor-pointer">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={(e) => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm">Auto-refresh (5s)</span>
              </label>
            </div>

            {/* Stats */}
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
                          No logs found yet. Logs will appear here as users interact with the system.
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
                            {log.userId && (
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
            </div>
          </div>
        </div>
        <Footer />
      </div>
    </>
  );
}

export async function getServerSideProps(context) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) {
    return { redirect: { destination: "/", permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  });

  if (!user || !user.isAdmin) {
    return { redirect: { destination: "/dashboard", permanent: false } };
  }

  return { props: {} };
}
