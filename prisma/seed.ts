import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

/**
 * Test User Credentials:
 * 
 * Admin:
 *   Email: admin@zyronstudio.de
 *   Password: admin123
 * 
 * Barbers:
 *   Email: daniyar@zyronstudio.de
 *   Password: daniyar123
 * 
 *   Email: valentyn@zyronstudio.de
 *   Password: valentyn123
 * 
 * Barber:
 *   Email: barber@zyronstudio.de
 *   Password: barber123
 * 
 * Customers:
 *   Email: customer1@zyronstudio.de
 *   Password: customer123
 * 
 *   Email: customer2@zyronstudio.de
 *   Password: customer123
 * 
 *   Email: customer3@zyronstudio.de
 *   Password: customer123
 */

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPasswordHash = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@zyronstudio.de" },
    update: {},
    create: {
      email: "admin@zyronstudio.de",
      name: "Admin",
      passwordHash: adminPasswordHash,
      role: UserRole.ADMIN,
    },
  });
  console.log("Created admin user:", admin.email);

  // Create Daniyar barber
  const daniyarPasswordHash = await bcrypt.hash("daniyar123", 10);
  const daniyarUser = await prisma.user.upsert({
    where: { email: "daniyar@zyronstudio.de" },
    update: {},
    create: {
      email: "daniyar@zyronstudio.de",
      name: "Daniyar",
      passwordHash: daniyarPasswordHash,
      role: UserRole.BARBER,
      phone: "+49 30 12345679",
    },
  });

  const daniyarBarber = await prisma.barber.upsert({
    where: { userId: daniyarUser.id },
    update: {
      displayName: "Daniyar",
      bio: "Ambassador Barber",
      languages: ["en", "de", "ru", "tk", "uz"],
      active: true,
    },
    create: {
      userId: daniyarUser.id,
      displayName: "Daniyar",
      bio: "Ambassador Barber",
      languages: ["en", "de", "ru", "tk", "uz"],
      active: true,
    },
  });
  console.log("Created barber:", daniyarBarber.displayName);

  // Create Valentyn barber
  const valentynPasswordHash = await bcrypt.hash("valentyn123", 10);
  const valentynUser = await prisma.user.upsert({
    where: { email: "valentyn@zyronstudio.de" },
    update: {},
    create: {
      email: "valentyn@zyronstudio.de",
      name: "Valentyn",
      passwordHash: valentynPasswordHash,
      role: UserRole.BARBER,
      phone: "+49 30 12345680",
    },
  });

  const valentynBarber = await prisma.barber.upsert({
    where: { userId: valentynUser.id },
    update: {
      displayName: "Valentyn",
      bio: "Top Barber (with 6 years of experience)",
      languages: ["uk", "ru", "bg", "de"],
      active: true,
    },
    create: {
      userId: valentynUser.id,
      displayName: "Valentyn",
      bio: "Top Barber (with 6 years of experience)",
      languages: ["uk", "ru", "bg", "de"],
      active: true,
    },
  });
  console.log("Created barber:", valentynBarber.displayName);

  // Create a simple barber user for testing
  const barberPasswordHash = await bcrypt.hash("barber123", 10);
  const barberUser = await prisma.user.upsert({
    where: { email: "barber@zyronstudio.de" },
    update: {},
    create: {
      email: "barber@zyronstudio.de",
      name: "Test Barber",
      passwordHash: barberPasswordHash,
      role: UserRole.BARBER,
      phone: "+49 30 12345678",
    },
  });
  console.log("Created barber user:", barberUser.email);

  // Create customer users
  const customerPasswordHash = await bcrypt.hash("customer123", 10);
  
  const customer1 = await prisma.user.upsert({
    where: { email: "customer1@zyronstudio.de" },
    update: {},
    create: {
      email: "customer1@zyronstudio.de",
      name: "John Doe",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      phone: "+49 30 11111111",
    },
  });
  console.log("Created customer:", customer1.email);

  const customer2 = await prisma.user.upsert({
    where: { email: "customer2@zyronstudio.de" },
    update: {},
    create: {
      email: "customer2@zyronstudio.de",
      name: "Jane Smith",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
      phone: "+49 30 22222222",
    },
  });
  console.log("Created customer:", customer2.email);

  const customer3 = await prisma.user.upsert({
    where: { email: "customer3@zyronstudio.de" },
    update: {},
    create: {
      email: "customer3@zyronstudio.de",
      name: "Mike Johnson",
      passwordHash: customerPasswordHash,
      role: UserRole.CUSTOMER,
    },
  });
  console.log("Created customer:", customer3.email);

  // Create services
  // Service 1: Haircut & Beard Trim + Hot Towel Shave (goes to services category)
  const haircutBeardHotTowelService = await prisma.service.upsert({
    where: { slug: "haircut-beard-hot-towel" },
    update: {
      durationMinutes: 60,
      basePrice: 75.0,
      active: true,
    },
    create: {
      slug: "haircut-beard-hot-towel",
      durationMinutes: 60,
      basePrice: 75.0,
      active: true,
    },
  });

  // Service 2: Haircut & Beard Shaping (goes to services category)
  const haircutBeardShapingService = await prisma.service.upsert({
    where: { slug: "haircut-beard-shaping" },
    update: {
      durationMinutes: 45,
      basePrice: 60.0,
      active: true,
    },
    create: {
      slug: "haircut-beard-shaping",
      durationMinutes: 45,
      basePrice: 60.0,
      active: true,
    },
  });

  // Beard Services (only these 4 go to beardServices category)
  // Beard Service 1: Beard Trim + Hot Towel Shave
  const beardTrimHotTowelService = await prisma.service.upsert({
    where: { slug: "beard-trim-hot-towel" },
    update: {
      durationMinutes: 45,
      basePrice: 40.0,
      active: true,
    },
    create: {
      slug: "beard-trim-hot-towel",
      durationMinutes: 45,
      basePrice: 40.0,
      active: true,
    },
  });

  // Beard Service 2: Beard Shaping
  const beardShapingService = await prisma.service.upsert({
    where: { slug: "beard-shaping" },
    update: {
      durationMinutes: 30,
      basePrice: 30.0,
      active: true,
    },
    create: {
      slug: "beard-shaping",
      durationMinutes: 30,
      basePrice: 30.0,
      active: true,
    },
  });

  // Beard Service 3: Buzzcut & Beard Shaping
  const buzzcutBeardShapingService = await prisma.service.upsert({
    where: { slug: "buzzcut-beard-shaping" },
    update: {
      durationMinutes: 45,
      basePrice: 50.0,
      active: true,
    },
    create: {
      slug: "buzzcut-beard-shaping",
      durationMinutes: 45,
      basePrice: 50.0,
      active: true,
    },
  });

  // Beard Service 4: Buzzcut & Beard Trim + Razor
  const buzzcutBeardTrimRazorService = await prisma.service.upsert({
    where: { slug: "buzzcut-beard-trim-razor" },
    update: {
      durationMinutes: 45,
      basePrice: 60.0,
      active: true,
    },
    create: {
      slug: "buzzcut-beard-trim-razor",
      durationMinutes: 45,
      basePrice: 60.0,
      active: true,
    },
  });

  // Service 3: Haircut
  const haircutService = await prisma.service.upsert({
    where: { slug: "haircut" },
    update: {
      durationMinutes: 45,
      basePrice: 40.0,
      active: true,
    },
    create: {
      slug: "haircut",
      durationMinutes: 45,
      basePrice: 40.0,
      active: true,
    },
  });

  // Service 4: Long Haircut
  const longHaircutService = await prisma.service.upsert({
    where: { slug: "long-haircut" },
    update: {},
    create: {
      slug: "long-haircut",
      durationMinutes: 45,
      basePrice: 50.0,
      active: true,
    },
  });

  // Service 5: Buzzcut
  const buzzcutService = await prisma.service.upsert({
    where: { slug: "buzzcut" },
    update: {},
    create: {
      slug: "buzzcut",
      durationMinutes: 30,
      basePrice: 30.0,
      active: true,
    },
  });

  // Service 6: Father and Son
  const fatherSonService = await prisma.service.upsert({
    where: { slug: "father-son" },
    update: {},
    create: {
      slug: "father-son",
      durationMinutes: 60,
      basePrice: 75.0,
      active: true,
    },
  });

  // Service 7: Children's Haircut
  const childrenHaircutService = await prisma.service.upsert({
    where: { slug: "children-haircut" },
    update: {},
    create: {
      slug: "children-haircut",
      durationMinutes: 30,
      basePrice: 35.0,
      active: true,
    },
  });

  // Head Wash + Massage + Styling Service
  const headWashMassageStylingService = await prisma.service.upsert({
    where: { slug: "head-wash-massage-styling" },
    update: {
      durationMinutes: 15,
      basePrice: 25.0,
      active: true,
    },
    create: {
      slug: "head-wash-massage-styling",
      durationMinutes: 15,
      basePrice: 25.0,
      active: true,
    },
  });

  // Create service translations
  // Service 1: Haircut & Beard Trim + Hot Towel Shave
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardHotTowelService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardHotTowelService.id,
      locale: "de",
      name: "Haarschnitt & Bartpflege + Heiße Handtuch-Rasur",
      description: "Ein umfassender Service, der auf Ihre Bedürfnisse zugeschnitten ist - ob Sie Ihre Länge beibehalten oder Ihren Bart verfeinern möchten, Kopfwäsche und eine persönliche Beratung",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardHotTowelService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardHotTowelService.id,
      locale: "en",
      name: "Haircut & Beard Trim + Hot Towel Shave",
      description: "A comprehensive service tailored to your needs — whether it's maintaining your length or refining your beard, head wash and a personalized consultation",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardHotTowelService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardHotTowelService.id,
      locale: "ru",
      name: "Стрижка и уход за бородой + Бритье горячим полотенцем",
      description: "Комплексная услуга, адаптированная к вашим потребностям — будь то поддержание длины или уточнение бороды, мытье головы и индивидуальная консультация",
    },
  });

  // Service 2: Haircut & Beard Shaping
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardShapingService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardShapingService.id,
      locale: "de",
      name: "Haarschnitt & Bartformung",
      description: "Effizient, sauber, Wäsche und klassisch. Ideal für die regelmäßige Pflege mit individueller Beratung",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardShapingService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardShapingService.id,
      locale: "en",
      name: "Haircut & Beard Shaping",
      description: "Efficient, clean, wash and classic. Ideal for regular maintenance with individual consultation",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutBeardShapingService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: haircutBeardShapingService.id,
      locale: "ru",
      name: "Стрижка и формирование бороды",
      description: "Эффективно, чисто, мытье и классика. Идеально для регулярного ухода с индивидуальной консультацией",
    },
  });

  // Service 3: Haircut translations
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutService.id,
        locale: "de",
      },
    },
    update: {
      name: "Haarschnitt",
      description: "Individuelle Beratung, professioneller Schnitt, Wäsche und Styling",
    },
    create: {
      serviceId: haircutService.id,
      locale: "de",
      name: "Haarschnitt",
      description: "Individuelle Beratung, professioneller Schnitt, Wäsche und Styling",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutService.id,
        locale: "en",
      },
    },
    update: {
      name: "Haircut",
      description: "Tailored consultation, professional cut, wash, and styling",
    },
    create: {
      serviceId: haircutService.id,
      locale: "en",
      name: "Haircut",
      description: "Tailored consultation, professional cut, wash, and styling",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: haircutService.id,
        locale: "ru",
      },
    },
    update: {
      name: "Стрижка",
      description: "Индивидуальная консультация, профессиональная стрижка, мытье и укладка",
    },
    create: {
      serviceId: haircutService.id,
      locale: "ru",
      name: "Стрижка",
      description: "Индивидуальная консультация, профессиональная стрижка, мытье и укладка",
    },
  });

  // Service 4: Long Haircut
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: longHaircutService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: longHaircutService.id,
      locale: "de",
      name: "Langhaarschnitt",
      description: "Für mittlere bis lange Längen. Beinhaltet vollständige Beratung, Schnitt, Wäsche und Finish",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: longHaircutService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: longHaircutService.id,
      locale: "en",
      name: "Long Haircut",
      description: "For medium to long lengths. Includes full consultation, cut, wash, and finish",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: longHaircutService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: longHaircutService.id,
      locale: "ru",
      name: "Стрижка длинных волос",
      description: "Для средней и длинной длины. Включает полную консультацию, стрижку, мытье и финиш",
    },
  });

  // Service 5: Buzzcut
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutService.id,
      locale: "de",
      name: "Buzzcut",
      description: "Eine Länge. Nur Maschine. Sauber, Wäsche und konsistent - mit Kopfwäsche inklusive",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutService.id,
      locale: "en",
      name: "Buzzcut",
      description: "One length. Machine only. Clean, wash and consistent - with head wash included",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutService.id,
      locale: "ru",
      name: "Баззкат",
      description: "Одна длина. Только машинка. Чисто, мытье и последовательно - с мытьем головы включено",
    },
  });

  // Service 6: Father and Son
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: fatherSonService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: fatherSonService.id,
      locale: "de",
      name: "Vater und Sohn",
      description: "Zwei umwerfende Haarschnitte für Vater & Sohn",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: fatherSonService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: fatherSonService.id,
      locale: "en",
      name: "Father and Son",
      description: "Two mind blowing haircuts for father & son",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: fatherSonService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: fatherSonService.id,
      locale: "ru",
      name: "Отец и сын",
      description: "Две потрясающие стрижки для отца и сына",
    },
  });

  // Service 7: Children's Haircut
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: childrenHaircutService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: childrenHaircutService.id,
      locale: "de",
      name: "Kinderhaarschnitt",
      description: "Professioneller Haarschnitt für Kinder, einschließlich Beratung, präziser Schnitt und leichtem Styling. Entwickelt, um Komfort und ein sauberes, altersgerechtes Aussehen zu gewährleisten",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: childrenHaircutService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: childrenHaircutService.id,
      locale: "en",
      name: "Children's Haircut",
      description: "Professional haircut for children, including consultation, precise cutting, and light styling. Designed to ensure comfort and a clean, age-appropriate look",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: childrenHaircutService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: childrenHaircutService.id,
      locale: "ru",
      name: "Детская стрижка",
      description: "Профессиональная стрижка для детей, включая консультацию, точную стрижку и легкую укладку. Разработано для обеспечения комфорта и чистого, соответствующего возрасту вида",
    },
  });

  // Head Wash + Massage + Styling translations
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: headWashMassageStylingService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: headWashMassageStylingService.id,
      locale: "de",
      name: "Kopfwäsche + Massage + Styling",
      description: "Genießen Sie eine erfrischende Haarwäsche mit Premium-Shampoo und Tonic, gefolgt von einer tief entspannenden Kopfmassage — kombiniert aus Experten-Handtechniken und einem professionellen Massagegerät — abgeschlossen mit makellosem, maßgeschneidertem Styling",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: headWashMassageStylingService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: headWashMassageStylingService.id,
      locale: "en",
      name: "Head Wash + Massage + Styling",
      description: "Indulge in a refreshing hair wash with premium shampoo and tonic, followed by a deeply relaxing head massage — combining expert hand techniques and a professional massage device — finished with flawless, tailored styling",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: headWashMassageStylingService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: headWashMassageStylingService.id,
      locale: "ru",
      name: "Мытье головы + Массаж + Укладка",
      description: "Насладитесь освежающим мытьем волос премиальным шампунем и тоником, за которым следует глубоко расслабляющий массаж головы — сочетание экспертных ручных техник и профессионального массажного устройства — завершенный безупречной, индивидуальной укладкой",
    },
  });

  // Create working hours (Monday to Saturday, 10:00-20:00 with lunch break 14:30-15:00)
  const weekdays = [
    { day: 1, name: "Monday" },
    { day: 2, name: "Tuesday" },
    { day: 3, name: "Wednesday" },
    { day: 4, name: "Thursday" },
    { day: 5, name: "Friday" },
    { day: 6, name: "Saturday" },
  ];

  // Set up working hours for Daniyar
  for (const { day, name } of weekdays) {
    const startTime = "10:00";
    const endTime = "20:00";

    await prisma.barberWorkingHours.upsert({
      where: {
        barberId_weekday: {
          barberId: daniyarBarber.id,
          weekday: day,
        },
      },
      update: {
        startTime,
        endTime,
      },
      create: {
        barberId: daniyarBarber.id,
        weekday: day,
        startTime,
        endTime,
        defaultSlotIntervalMinutes: 15,
      },
    });
    console.log(`Created working hours for Daniyar - ${name}`);
  }

  // Set up working hours for Valentyn
  for (const { day, name } of weekdays) {
    const startTime = "10:00";
    const endTime = "20:00";

    await prisma.barberWorkingHours.upsert({
      where: {
        barberId_weekday: {
          barberId: valentynBarber.id,
          weekday: day,
        },
      },
      update: {
        startTime,
        endTime,
      },
      create: {
        barberId: valentynBarber.id,
        weekday: day,
        startTime,
        endTime,
        defaultSlotIntervalMinutes: 15,
      },
    });
    console.log(`Created working hours for Valentyn - ${name}`);
  }

  // Create additional test barbers for scalability testing
  const additionalBarbers = [
    { name: "Alex", email: "alex@zyronstudio.de", password: "alex123", bio: "Master Barber", languages: ["en", "de"] },
    { name: "Marcus", email: "marcus@zyronstudio.de", password: "marcus123", bio: "Senior Barber", languages: ["de", "en", "fr"] },
    { name: "Tom", email: "tom@zyronstudio.de", password: "tom123", bio: "Expert Barber", languages: ["en", "de", "es"] },
    { name: "Lucas", email: "lucas@zyronstudio.de", password: "lucas123", bio: "Professional Barber", languages: ["de", "en"] },
  ];

  const createdBarbers = [];

  for (const barberData of additionalBarbers) {
    const passwordHash = await bcrypt.hash(barberData.password, 10);
    const user = await prisma.user.upsert({
      where: { email: barberData.email },
      update: {},
      create: {
        email: barberData.email,
        name: barberData.name,
        passwordHash,
        role: UserRole.BARBER,
        phone: `+49 30 ${Math.floor(Math.random() * 100000000)}`,
      },
    });

    const barber = await prisma.barber.upsert({
      where: { userId: user.id },
      update: {
        displayName: barberData.name,
        bio: barberData.bio,
        languages: barberData.languages,
        active: true,
      },
      create: {
        userId: user.id,
        displayName: barberData.name,
        bio: barberData.bio,
        languages: barberData.languages,
        active: true,
      },
    });

    createdBarbers.push(barber);
    console.log(`Created barber: ${barber.displayName}`);

    // Set up working hours for each additional barber
    for (const { day, name } of weekdays) {
      const startTime = "10:00";
      const endTime = "20:00";

      await prisma.barberWorkingHours.upsert({
        where: {
          barberId_weekday: {
            barberId: barber.id,
            weekday: day,
          },
        },
        update: {
          startTime,
          endTime,
        },
        create: {
          barberId: barber.id,
          weekday: day,
          startTime,
          endTime,
          defaultSlotIntervalMinutes: 15,
        },
      });
    }
    console.log(`Created working hours for ${barber.displayName}`);
  }

  // Beard Service translations
  // Beard Service 1: Beard Trim + Hot Towel Shave
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardTrimHotTowelService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: beardTrimHotTowelService.id,
      locale: "de",
      name: "Bartpflege + Heiße Handtuch-Rasur",
      description: "Präzise Formgebung mit heißem Handtuch und Rasiermesser-Finish",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardTrimHotTowelService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: beardTrimHotTowelService.id,
      locale: "en",
      name: "Beard Trim + Hot Towel Shave",
      description: "Precision shaping with a hot towel and razor finish",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardTrimHotTowelService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: beardTrimHotTowelService.id,
      locale: "ru",
      name: "Уход за бородой + Бритье горячим полотенцем",
      description: "Точное формирование с горячим полотенцем и финишной обработкой бритвой",
    },
  });

  // Beard Service 2: Beard Shaping
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardShapingService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: beardShapingService.id,
      locale: "de",
      name: "Bartformung",
      description: "Definierte Konturen und saubere Linien",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardShapingService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: beardShapingService.id,
      locale: "en",
      name: "Beard Shaping",
      description: "Defined contours and clean lines",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: beardShapingService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: beardShapingService.id,
      locale: "ru",
      name: "Формирование бороды",
      description: "Четкие контуры и чистые линии",
    },
  });

  // Beard Service 3: Buzzcut & Beard Shaping
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardShapingService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardShapingService.id,
      locale: "de",
      name: "Buzzcut & Bartformung",
      description: "Minimaler Schnitt, verfeinerter Bart",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardShapingService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardShapingService.id,
      locale: "en",
      name: "Buzzcut & Beard Shaping",
      description: "Minimal cut, refined beard",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardShapingService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardShapingService.id,
      locale: "ru",
      name: "Баззкат и формирование бороды",
      description: "Минимальная стрижка, утонченная борода",
    },
  });

  // Beard Service 4: Buzzcut & Beard Trim + Razor
  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardTrimRazorService.id,
        locale: "de",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardTrimRazorService.id,
      locale: "de",
      name: "Buzzcut & Bartpflege + Rasiermesser",
      description: "Maschinenschnitt kombiniert mit vollständigem Bartservice, heißem Handtuch und Rasiermesser-Detailing",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardTrimRazorService.id,
        locale: "en",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardTrimRazorService.id,
      locale: "en",
      name: "Buzzcut & Beard Trim + Razor",
      description: "Clipper cut combined with a full beard service, hot towel, and razor detailing",
    },
  });

  await prisma.serviceTranslation.upsert({
    where: {
      serviceId_locale: {
        serviceId: buzzcutBeardTrimRazorService.id,
        locale: "ru",
      },
    },
    update: {},
    create: {
      serviceId: buzzcutBeardTrimRazorService.id,
      locale: "ru",
      name: "Баззкат и уход за бородой + Бритва",
      description: "Стрижка машинкой в сочетании с полным уходом за бородой, горячим полотенцем и детализацией бритвой",
    },
  });

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

