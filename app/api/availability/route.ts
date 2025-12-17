import { NextRequest, NextResponse } from "next/server";
import { checkServiceAvailabilityForDateRange } from "@/lib/services/slot";
import { addDays, startOfMonth, endOfMonth } from "date-fns";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date"); // Base date for the month
  const duration = searchParams.get("duration");

  if (!serviceId || !date || !duration) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    const baseDate = new Date(date);
    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);

    const availability = await checkServiceAvailabilityForDateRange(
      parseInt(serviceId),
      monthStart,
      monthEnd,
      parseInt(duration)
    );

    // Convert Map to object for JSON serialization
    const availabilityObj: Record<string, "available" | "booked" | "sunday"> = {};
    availability.forEach((value, key) => {
      availabilityObj[key] = value;
    });

    return NextResponse.json({ availability: availabilityObj });
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability" },
      { status: 500 }
    );
  }
}


