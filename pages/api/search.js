// pages/api/search.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const { q } = req.query;

  try {
    // Get current user's program and department
    const currentUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { applyingFor: true, department: true }
    });

    // Build filter based on user's program
    let programFilter = {};
    
    if (currentUser.applyingFor === 'ismp') {
      // ISMP users can see all ISMP applicants (any department)
      programFilter = { applyingFor: 'ismp' };
    } else if (currentUser.applyingFor === 'damp') {
      // DAMP users can only see DAMP applicants from their department
      programFilter = { 
        applyingFor: 'damp',
        department: currentUser.department 
      };
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Not myself
          { isAdmin: false }, // Exclude all admins from candidate pool
          { isDeptHead: false }, // Exclude dept heads from candidate pool
          { acceptingReviews: true }, // Only show users accepting reviews
          programFilter, // Apply program-based filter
          {
            OR: [
              { name: { contains: q || "", mode: "insensitive" } },
              { department: { contains: q || "", mode: "insensitive" } },
            ],
          },
        ],
      },
      // Include the "reviewsReceived" specifically where the reviewer is ME
      include: {
        reviewsReceived: {
          where: { reviewerId: session.user.id },
          select: { id: true } // We only need to know if an ID exists
        }
      },
      take: 50,
    });

    // Transform data: Add a simple "hasReviewed" flag
    const formattedUsers = users.map(u => ({
      id: u.id,
      name: u.name,
      department: u.department,
      year: u.year,
      hostel: u.hostel,
      applyingFor: u.applyingFor,
      hasReviewed: u.reviewsReceived.length > 0 // true if I reviewed them
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch" });
  }
}