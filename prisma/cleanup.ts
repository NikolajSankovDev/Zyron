import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("Starting database cleanup...");

  // Delete old/deactivated services
  const oldServiceSlugs = ["beard-trim", "haircut-beard"];
  
  for (const slug of oldServiceSlugs) {
    const service = await prisma.service.findUnique({
      where: { slug },
      include: {
        appointmentServices: true,
        translations: true,
      },
    });

    if (service) {
      // Check if service is used in any appointments
      if (service.appointmentServices.length > 0) {
        console.log(`⚠️  Service "${slug}" is used in ${service.appointmentServices.length} appointment(s). Skipping deletion.`);
        continue;
      }

      // Delete translations first (due to foreign key constraints)
      await prisma.serviceTranslation.deleteMany({
        where: { serviceId: service.id },
      });

      // Delete the service
      await prisma.service.delete({
        where: { slug },
      });

      console.log(`✅ Deleted service: ${slug}`);
    } else {
      console.log(`ℹ️  Service "${slug}" not found.`);
    }
  }

  // Delete expired password reset tokens
  const deletedTokens = await prisma.passwordResetToken.deleteMany({
    where: {
      expiresAt: {
        lt: new Date(),
      },
    },
  });
  console.log(`✅ Deleted ${deletedTokens.count} expired password reset token(s)`);

  // Find and delete any other inactive services that are not used
  const inactiveServices = await prisma.service.findMany({
    where: { active: false },
    include: {
      appointmentServices: true,
      translations: true,
    },
  });

  if (inactiveServices.length > 0) {
    console.log(`\n🗑️  Found ${inactiveServices.length} inactive service(s):`);
    for (const service of inactiveServices) {
      const appointmentCount = service.appointmentServices.length;
      if (appointmentCount === 0) {
        // Delete translations first
        await prisma.serviceTranslation.deleteMany({
          where: { serviceId: service.id },
        });

        // Delete the service
        await prisma.service.delete({
          where: { id: service.id },
        });

        console.log(`   ✅ Deleted inactive service: ${service.slug} (ID: ${service.id})`);
      } else {
        console.log(`   ⚠️  Skipped ${service.slug} (ID: ${service.id}) - Used in ${appointmentCount} appointment(s)`);
      }
    }
  }

  // Delete duplicate customers (second group with @zyronstudio.de emails)
  const duplicateCustomerEmails = [
    "customer1@zyronstudio.de",
    "customer2@zyronstudio.de",
    "customer3@zyronstudio.de",
  ];

  console.log("\n🗑️  Deleting duplicate customers...");
  for (const email of duplicateCustomerEmails) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        customerAppointments: true,
        barber: true,
        passwordResetTokens: true,
      },
    });

    if (user) {
      if (user.customerAppointments.length > 0) {
        console.log(`   ⚠️  Skipped ${email} - Has ${user.customerAppointments.length} appointment(s)`);
        continue;
      }

      // Delete password reset tokens first
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Delete the user (cascade will handle related data)
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log(`   ✅ Deleted duplicate customer: ${email}`);
    } else {
      console.log(`   ℹ️  Customer "${email}" not found.`);
    }
  }

  // Delete test barber
  const testBarberEmail = "barber@zyronstudio.de";
  console.log("\n🗑️  Deleting test barber...");
  const testBarber = await prisma.user.findUnique({
    where: { email: testBarberEmail },
    include: {
      barber: {
        include: {
          appointments: true,
        },
      },
      passwordResetTokens: true,
    },
  });

  if (testBarber) {
    if (testBarber.barber && testBarber.barber.appointments.length > 0) {
      console.log(`   ⚠️  Skipped ${testBarberEmail} - Has ${testBarber.barber.appointments.length} appointment(s)`);
    } else {
      // Delete password reset tokens first
      await prisma.passwordResetToken.deleteMany({
        where: { userId: testBarber.id },
      });

      // Delete the user (cascade will handle related data including barber record)
      await prisma.user.delete({
        where: { id: testBarber.id },
      });

      console.log(`   ✅ Deleted test barber: ${testBarberEmail}`);
    }
  } else {
    console.log(`   ℹ️  Test barber "${testBarberEmail}" not found.`);
  }

  // Find and delete other test/dummy users
  const allUsers = await prisma.user.findMany({
    include: {
      customerAppointments: true,
      barber: true,
      passwordResetTokens: true,
    },
  });

  const testUsers = allUsers.filter(
    (user) =>
      (user.email.includes("test") ||
        user.email.includes("dummy") ||
        user.email.includes("example")) &&
      user.role === "CUSTOMER" &&
      user.customerAppointments.length === 0 &&
      !user.barber &&
      !duplicateCustomerEmails.includes(user.email)
  );

  if (testUsers.length > 0) {
    console.log(`\n🗑️  Found ${testUsers.length} other test/dummy user(s) to delete:`);
    for (const user of testUsers) {
      // Delete password reset tokens first
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      });

      // Delete the user (cascade will handle related data)
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log(`   ✅ Deleted test user: ${user.email}`);
    }
  }

  console.log("\n✅ Cleanup completed!");
}

cleanup()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

