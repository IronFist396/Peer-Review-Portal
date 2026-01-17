// pages/api/submit-final.js
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    // Check if reviews are enabled
    const settings = await prisma.systemSettings.findFirst();
    if (settings && !settings.reviewsEnabled) {
      return res.status(403).json({ error: "Review submissions are currently disabled" });
    }

    // Check if user has at least 5 reviews
    const reviewCount = await prisma.review.count({
      where: { reviewerId: session.user.id }
    });

    if (reviewCount < 5) {
      return res.status(400).json({ error: "You need at least 5 reviews before submitting" });
    }

    // Mark user as submitted
    const updatedUser = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        hasSubmitted: true,
        submittedAt: new Date()
      }
    });

    res.status(200).json({ 
      success: true, 
      message: "Reviews submitted successfully!",
      submittedAt: updatedUser.submittedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to submit reviews" });
  }
}
