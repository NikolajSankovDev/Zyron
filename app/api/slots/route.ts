import { NextRequest, NextResponse } from "next/server";
import { generateAvailableSlots, generateAvailableSlotsForService } from "@/lib/services/slot";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const barberId = searchParams.get("barberId");
  const serviceId = searchParams.get("serviceId");
  const date = searchParams.get("date");
  const duration = searchParams.get("duration");
  const interval = searchParams.get("interval");

  if (!date || !duration) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  try {
    // If serviceId is provided, get slots for service across all barbers
    if (serviceId) {
      const slotsByBarber = await generateAvailableSlotsForService(
        parseInt(serviceId),
        new Date(date),
        parseInt(duration),
        interval ? parseInt(interval) : 15
      );
      // Convert Date objects to ISO strings for JSON serialization
      const formattedSlotsByBarber = slotsByBarber.map((barberSlot) => ({
        barberId: barberSlot.barberId,
        slots: barberSlot.slots.map((slot) => ({
          start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
          end: slot.end instanceof Date ? slot.end.toISOString() : slot.end,
          available: slot.available,
        })),
      }));
      return NextResponse.json({ slotsByBarber: formattedSlotsByBarber });
    }

    // Otherwise, use barberId (legacy support)
    if (!barberId) {
      return NextResponse.json(
        { error: "Either barberId or serviceId must be provided" },
        { status: 400 }
      );
    }

    const slots = await generateAvailableSlots(
      barberId,
      new Date(date),
      parseInt(duration),
      interval ? parseInt(interval) : 15
    );

    // Convert Date objects to ISO strings for JSON serialization
    const formattedSlots = slots.map((slot) => ({
      start: slot.start instanceof Date ? slot.start.toISOString() : slot.start,
      end: slot.end instanceof Date ? slot.end.toISOString() : slot.end,
      available: slot.available,
    }));

    return NextResponse.json({ slots: formattedSlots });
  } catch (error) {
    console.error("Error generating slots:", error);
    return NextResponse.json(
      { error: "Failed to generate slots", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

