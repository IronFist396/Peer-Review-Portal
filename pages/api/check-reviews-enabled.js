// pages/api/check-reviews-enabled.js
import { prisma } from "@/lib/prisma";

export default async function handler(req, res) {
  try {
    const settings = await prisma.systemSettings.findFirst();
    
    res.status(200).json({ 
      reviewsEnabled: settings?.reviewsEnabled ?? true // Default to enabled if no settings
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to check settings" });
  }
}
