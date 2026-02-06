// pages/api/admin/logs.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Check if user is admin
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { isAdmin: true }
  });

  if (!user || !user.isAdmin) {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }

  const { type = 'all', limit = 100 } = req.query;

  try {
    // Dynamic import to avoid module loading issues
    const { getRecentLogs } = require('@/lib/logger');
    const logs = getRecentLogs(type, parseInt(limit));
    res.status(200).json({ logs });
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: 'Failed to fetch logs', message: error.message });
  }
}
