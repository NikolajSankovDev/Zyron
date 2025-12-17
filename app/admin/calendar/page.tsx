import { redirect } from "next/navigation";
import { safePrismaQuery, prisma } from "@/lib/prisma";
import { getTranslations, getLocale } from "next-intl/server";
import { AdminCalendarClient } from "@/components/admin/admin-calendar-client";
import { getCurrentPrismaUser } from "@/lib/clerk-user-sync";
import type {
  AppointmentDisplayData,
  BarberDisplayData,
} from "@/lib/types/admin-calendar";

export default async function AdminCalendarPage() {
  const t = await getTranslations("admin");
  const locale = await getLocale();

  // Get current user from Prisma (synced from Clerk)
  const user = await getCurrentPrismaUser();

  if (!user) {
    redirect(`/${locale}/auth/sign-in`);
  }

  if (!["ADMIN", "BARBER"].includes(user.role)) {
    redirect(`/${locale}`);
  }

  // Get today's date
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekday = today.getDay();

  // Get barbers with their working hours
  const barbersData = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.barber.findMany({
        where: {
          active: true,
        },
        include: {
          user: true,
          workingHours: {
            where: {
              weekday: weekday,
            },
          },
        },
        orderBy: {
          displayName: "asc",
        },
      });
    },
    []
  );

  // Barber avatar images mapping
  const barberImages: Record<string, string> = {
    "Daniyar": "https://cdn-nearcut.s3.amazonaws.com/RDTUXH/large_IMG_1683.jpg",
    "Valentyn": "https://cdn-nearcut.s3.amazonaws.com/TJUU82/large_f959831e-e2fd-46ac-a46d-9f393d65529e.jpeg",
  };

  // Transform barbers data
  const barbers: BarberDisplayData[] = barbersData.map((barber: any) => ({
    id: barber.id,
    displayName: barber.displayName,
    avatar: barberImages[barber.displayName] || undefined,
    workingHours: barber.workingHours?.[0]
      ? {
          startTime: barber.workingHours[0].startTime,
          endTime: barber.workingHours[0].endTime,
          weekday: barber.workingHours[0].weekday,
        }
      : null,
  }));

  // Get appointments for the next 7 days (for week view)
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7); // Get a bit before today for safety
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 14); // Get a bit after today

  const appointmentsData = await safePrismaQuery(
    async () => {
      if (!prisma) return [];
      return await prisma.appointment.findMany({
        where: {
          startTime: {
            gte: weekStart,
            lte: weekEnd,
          },
          status: {
            not: "CANCELED",
          },
        },
        include: {
          customer: true,
          barber: {
            include: {
              user: true,
            },
          },
          appointmentServices: {
            include: {
              service: {
                include: {
                  translations: true,
                },
              },
            },
            orderBy: {
              order: "asc",
            },
          },
        },
        orderBy: {
          startTime: "asc",
        },
      });
    },
    []
  );

  // Transform appointments data
  const appointments: AppointmentDisplayData[] = appointmentsData.map((apt: any) => ({
    id: apt.id,
    customerId: apt.customerId,
    customerName: apt.customer.name || "Customer",
    customerPhone: apt.customer.phone,
    customerEmail: apt.customer.email,
    barberId: apt.barberId,
    barberName: apt.barber.displayName,
    startTime: new Date(apt.startTime),
    endTime: new Date(apt.endTime),
    status: apt.status,
    totalPrice: Number(apt.totalPrice),
    notes: apt.notes,
    services: apt.appointmentServices.map((aptService: any) => ({
      id: aptService.id,
      serviceId: aptService.serviceId,
      serviceName: aptService.service.translations[0]?.name || "Service",
      price: Number(aptService.priceOverride || aptService.service.basePrice),
    })),
  }));

  return (
    <AdminCalendarClient
      initialDate={today}
      barbers={barbers}
      appointments={appointments}
    />
  );
}
