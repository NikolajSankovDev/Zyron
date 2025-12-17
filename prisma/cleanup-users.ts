import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanupUsers() {
  console.log("Starting user database cleanup...");
  console.log("Keeping: Admin, Daniyar, Valentyn, Nikolaj Sankov, and all barbers\n");

  // Get all users with their related data
  const allUsers = await prisma.user.findMany({
    include: {
      customerAppointments: true,
      barber: true,
    },
  });

  console.log(`Found ${allUsers.length} total users\n`);

  // Names to keep (case-insensitive)
  const namesToKeep = ["Admin", "Daniyar", "Valentyn", "Nikolaj Sankov"].map(name =>
    name.toLowerCase()
  );

  // Identify users to keep
  const usersToKeep = allUsers.filter((user) => {
    const nameLower = user.name.toLowerCase();
    
    // Keep if name matches one of the protected names
    if (namesToKeep.includes(nameLower)) {
      return true;
    }
    
    // Keep all barbers
    if (user.role === "BARBER") {
      return true;
    }
    
    return false;
  });

  // Identify users to delete (all others)
  const usersToDelete = allUsers.filter((user) => {
    const nameLower = user.name.toLowerCase();
    
    // Don't delete if name matches one of the protected names
    if (namesToKeep.includes(nameLower)) {
      return false;
    }
    
    // Don't delete barbers
    if (user.role === "BARBER") {
      return false;
    }
    
    // Everything else can be deleted
    return true;
  });

  console.log(`✅ Users to keep: ${usersToKeep.length}`);
  usersToKeep.forEach((user) => {
    console.log(`   - ${user.name} (${user.email}) - Role: ${user.role}`);
  });

  console.log(`\n🗑️  Users to delete: ${usersToDelete.length}`);
  
  if (usersToDelete.length === 0) {
    console.log("   No users to delete.\n");
    return;
  }

  usersToDelete.forEach((user) => {
    const appointmentCount = user.customerAppointments.length;
    console.log(
      `   - ${user.name} (${user.email}) - Role: ${user.role} - Appointments: ${appointmentCount}`
    );
  });

  console.log("\n⚠️  WARNING: Deleting users will also delete their associated appointments!");
  console.log("Starting deletion...\n");

  let deletedCount = 0;
  let skippedCount = 0;

  for (const user of usersToDelete) {
    try {
      // Delete the user (cascade will handle related data including appointments)
      await prisma.user.delete({
        where: { id: user.id },
      });

      console.log(`   ✅ Deleted: ${user.name} (${user.email})`);
      deletedCount++;
    } catch (error: any) {
      console.error(`   ❌ Error deleting ${user.name} (${user.email}): ${error.message}`);
      skippedCount++;
    }
  }

  console.log(`\n✅ Cleanup completed!`);
  console.log(`   Deleted: ${deletedCount} user(s)`);
  console.log(`   Skipped: ${skippedCount} user(s)`);
  console.log(`   Kept: ${usersToKeep.length} user(s)`);
}

cleanupUsers()
  .catch((e) => {
    console.error("Cleanup error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

