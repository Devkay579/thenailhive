import { NextRequest, NextResponse } from "next/server";
import { sendTomorrowReminders } from "@/lib/email/send";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");

  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await sendTomorrowReminders();
    return NextResponse.json(result);
  } catch (err) {
    console.error("Reminder cron failed", err);
    return NextResponse.json({ error: "Failed to send reminders" }, { status: 500 });
  }
}
