// pages/api/toggle-reviews.js
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
    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { isAdmin: true }
    });

    if (!user?.isAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin only" });
    }

    const { enabled } = req.body;

    // Get or create settings
    let settings = await prisma.systemSettings.findFirst();
    
    if (!settings) {
      // Create initial settings
      settings = await prisma.systemSettings.create({
        data: { reviewsEnabled: enabled }
      });
    } else {
      // Update existing settings
      settings = await prisma.systemSettings.update({
        where: { id: settings.id },
        data: { reviewsEnabled: enabled }
      });
    }

    res.status(200).json({ 
      success: true, 
      reviewsEnabled: settings.reviewsEnabled 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to update settings" });
  }
}
