// pages/api/recommendations.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    // 1. Get MY profile details
    const me = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { department: true, hostel: true, pors: true }
    });

    // 2. Find matches
    const matches = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: session.user.id } }, // Not myself
          { isAdmin: false }, // Exclude all admins from recommendations
          {
            OR: [
              { department: me.department },       // Same Dept
              { hostel: me.hostel },               // Same Hostel
              { pors: { hasSome: me.pors } }       // Shares at least one POR
            ]
          }
        ]
      },
      // 3. Check if reviewed
      include: {
        reviewsReceived: {
          where: { reviewerId: session.user.id },
          select: { id: true }
        }
      },
      take: 20 // Limit to 20 suggestions
    });

    // 4. Clean up data and explain WHY they matched
    const formatted = matches.map(user => {
      const matchReasons = [];
      if (user.department === me.department) matchReasons.push("Same Dept");
      if (user.hostel === me.hostel) matchReasons.push("Same Hostel");
      
      // Check which PORs overlap
      const commonPors = user.pors.filter(p => me.pors.includes(p));
      if (commonPors.length > 0) matchReasons.push("Shared POR");

      return {
        id: user.id,
        name: user.name,
        department: user.department,
        year: user.year,
        hostel: user.hostel,
        matchTag: matchReasons.join(" • "), // e.g. "Same Dept • Shared POR"
        hasReviewed: user.reviewsReceived.length > 0
      };
    });

    res.status(200).json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch recommendations" });
  }
}