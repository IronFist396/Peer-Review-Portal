// pages/api/admin/users.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
const { logger } = require("@/lib/logger");

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

  const { skip = 0, take = 50, search = '', department = '' } = req.query;

  try {
    logger.userAction('ADMIN_USER_SEARCH', session.user.id, session.user.email, {
      search,
      department,
      skip: parseInt(skip)
    });

    // Build where clause with filters
    const whereClause = {
      AND: [
        { isAdmin: false },
        // Search filter
        search ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { email: { contains: search, mode: 'insensitive' } }
          ]
        } : {},
        // Department filter
        department ? { department: department } : {}
      ]
    };

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        department: true,
        email: true,
        hasSubmitted: true,
        _count: {
          select: { reviewsWritten: true, reviewsReceived: true }
        }
      },
      orderBy: { name: 'asc' },
      skip: parseInt(skip),
      take: parseInt(take) + 1, // Fetch 1 extra to check if more exist
    });

    const hasMore = users.length > parseInt(take);
    const returnUsers = hasMore ? users.slice(0, -1) : users; // Remove the extra one

    res.status(200).json({
      users: returnUsers,
      hasMore
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
}
