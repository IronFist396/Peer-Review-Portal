// pages/api/toggle-user-reviews.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const admin = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { isAdmin: true, isDeptHead: true, department: true }
  });

  if (!admin.isAdmin && !admin.isDeptHead) {
    return res.status(403).json({ error: 'Forbidden - Admin or Dept Head access required' });
  }

  const { userId, acceptingReviews } = req.body;

  try {
    // Get the target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { department: true, applyingFor: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Department heads can only modify DAMP users from their department
    if (admin.isDeptHead && !admin.isAdmin) {
      if (targetUser.applyingFor !== 'damp' || targetUser.department !== admin.department) {
        return res.status(403).json({ 
          error: 'You can only modify DAMP users from your department' 
        });
      }
    }

    // Update the user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { acceptingReviews },
      select: { id: true, name: true, acceptingReviews: true }
    });

    res.json({ 
      success: true, 
      user: updatedUser
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
}
