/**
 * Database seeding.
 *
 * Two modes, deliberately separated:
 *
 *   baseline  (npm run db:seed)      Safe to run against production. Writes only
 *                                    club settings carried over from the old
 *                                    site and a starter order catalogue.
 *
 *   demo      (npm run db:seed:dev)  Development only, refuses to run when
 *                                    NODE_ENV=production. Adds sign-in accounts
 *                                    and sample records so the portal and
 *                                    officer dashboard can be exercised.
 *
 * Nothing in either mode invents a competitive result, an award, or a
 * membership figure. Every demo record is prefixed "[Sample]" so it is obvious
 * in the officer dashboard and cannot be mistaken for real club history.
 */
import { PrismaClient } from "@prisma/client";
import { SETTING_DEFAULTS } from "../lib/services/settings";
import { setDuesWaiver } from "../lib/services/dues";
import { currentSeasonYear } from "../lib/constants";

const prisma = new PrismaClient();

const DEMO = process.argv.includes("--demo");

async function seedSettings() {
  for (const [key, value] of Object.entries(SETTING_DEFAULTS)) {
    await prisma.clubSetting.upsert({ where: { key }, create: { key, value }, update: {} });
  }
  console.log(`  club settings: ${Object.keys(SETTING_DEFAULTS).length} keys ensured`);
}

async function seedCatalogue() {
  const items = [
    {
      slug: "nsda-membership",
      name: "NSDA Membership",
      description:
        "National Speech & Debate Association membership. Required to earn NSDA points and to compete at NSDA-affiliated tournaments. Purchase through the school, then an officer confirms it here.",
      category: "MEMBERSHIP",
      priceCents: null,
      externalLabel: "Pay on MySchoolBucks",
      sizes: "[]",
      sortOrder: 0,
    },
    {
      slug: "team-hoodie",
      name: "Team Hoodie",
      description: "Team hoodie. Officers place the bulk order once enough people have signed up — set the price and sizes before opening it.",
      category: "APPAREL",
      priceCents: null,
      sizes: JSON.stringify(["XS", "S", "M", "L", "XL", "XXL"]),
      isActive: false,
      sortOrder: 1,
    },
  ];

  for (const item of items) {
    await prisma.orderItem.upsert({ where: { slug: item.slug }, create: item, update: {} });
  }
  console.log(`  order catalogue: ${items.length} items ensured`);
}

async function seedDemo() {
  const season = currentSeasonYear();

  const people = [
    { ionUsername: "2027demoofficer", firstName: "Jordan", lastName: "Ellis", grade: 11, role: "OFFICER", position: "Captain" },
    { ionUsername: "2027demotreasurer", firstName: "Priya", lastName: "Nandakumar", grade: 11, role: "OFFICER", position: "Treasurer" },
    { ionUsername: "2028demomember", firstName: "Sam", lastName: "Okafor", grade: 10, role: "MEMBER" },
    { ionUsername: "2029demonovice", firstName: "Riley", lastName: "Chen", grade: 9, role: "MEMBER" },
    { ionUsername: "2026demosenior", firstName: "Ana", lastName: "Duarte", grade: 12, role: "MEMBER" },
  ] as const;

  const users = [];
  for (const person of people) {
    const user = await prisma.user.upsert({
      where: { ionUsername: person.ionUsername },
      create: {
        ionUsername: person.ionUsername,
        firstName: person.firstName,
        lastName: person.lastName,
        displayName: `${person.firstName} ${person.lastName}`,
        tjEmail: `${person.ionUsername}@tjhsst.edu`,
        gradeNumber: person.grade,
        graduationYear: Number.parseInt(person.ionUsername.slice(0, 4), 10),
        role: person.role,
        events: JSON.stringify([person.grade <= 9 ? "POLICY_NOVICE" : "POLICY_VARSITY"]),
      },
      update: { role: person.role },
    });
    users.push({ user, person });
  }
  console.log(`  demo accounts: ${users.length}`);

  for (const [index, { user, person }] of users.entries()) {
    if (!("position" in person)) continue;
    await prisma.officerProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        position: person.position,
        bio: "[Sample] Replace this biography from the officer dashboard.",
        termYear: season,
        sortOrder: index,
        events: JSON.stringify(["POLICY_VARSITY"]),
      },
      update: {},
    });
  }

  const officer = users[0].user;
  const day = 24 * 60 * 60 * 1000;

  const tournaments = [
    {
      slug: "sample-season-opener",
      name: "[Sample] Season Opener Invitational",
      startDate: new Date(Date.now() + 21 * day),
      endDate: new Date(Date.now() + 22 * day),
      location: "Alexandria, VA",
      circuit: "LOCAL",
      status: "OPEN",
      registrationDeadline: new Date(Date.now() + 12 * day),
      description: "Sample record created by the development seed. Delete it before launch.",
      divisions: [
        { name: "Policy — Varsity", code: "VCX", feeCents: 4000 },
        { name: "Policy — Novice", code: "NCX", feeCents: 3000, capacity: 8 },
      ],
    },
    {
      slug: "sample-winter-regional",
      name: "[Sample] Winter Regional",
      startDate: new Date(Date.now() + 60 * day),
      location: "Online",
      circuit: "REGIONAL",
      status: "OPEN",
      registrationDeadline: new Date(Date.now() + 45 * day),
      description: "Sample record created by the development seed. Delete it before launch.",
      divisions: [{ name: "Policy — Open", code: "CX", feeCents: 3500 }],
    },
    {
      slug: "sample-past-tournament",
      name: "[Sample] Early Autumn Scrimmage",
      startDate: new Date(Date.now() - 30 * day),
      location: "Alexandria, VA",
      circuit: "SCRIMMAGE",
      status: "CLOSED",
      description: "Sample record created by the development seed. Delete it before launch.",
      divisions: [{ name: "Policy — Open", code: "CX" }],
    },
  ];

  for (const tournament of tournaments) {
    const { divisions, ...rest } = tournament;
    const existing = await prisma.tournament.findUnique({ where: { slug: rest.slug } });
    if (existing) continue;
    await prisma.tournament.create({
      data: {
        ...rest,
        createdById: officer.id,
        divisions: { create: divisions.map((division, index) => ({ ...division, sortOrder: index })) },
      },
    });
  }
  console.log(`  demo tournaments: ${tournaments.length}`);

  // A couple of registrations so the officer views — and the computed balance
  // on each profile — are not empty. Fee amounts here are what makes the
  // amount owed on the dues pages non-zero for these three members.
  const opener = await prisma.tournament.findUnique({
    where: { slug: "sample-season-opener" },
    include: { divisions: true },
  });
  const registrationDetails = {
    schoolEmail: (username: string) => `${username}@tjhsst.edu`,
    tabroomEmail: (username: string) => `${username}@gmail.com`,
    phoneNumber: "555-0100",
    partnerName: "[Sample] Partner",
    partnerSchoolEmail: "sample.partner@tjhsst.edu",
  } as const;

  if (opener) {
    for (const [index, { user, person }] of users.slice(2).entries()) {
      const division = opener.divisions[index % opener.divisions.length];
      await prisma.tournamentRegistration.upsert({
        where: { userId_divisionId: { userId: user.id, divisionId: division.id } },
        create: {
          userId: user.id,
          tournamentId: opener.id,
          divisionId: division.id,
          status: index === 0 ? "REGISTERED" : "PENDING",
          grade: person.grade,
          schoolEmail: registrationDetails.schoolEmail(user.ionUsername),
          tabroomEmail: registrationDetails.tabroomEmail(user.ionUsername),
          phoneNumber: registrationDetails.phoneNumber,
          partnerName: registrationDetails.partnerName,
          partnerSchoolEmail: registrationDetails.partnerSchoolEmail,
        },
        update: {},
      });
    }
  }

  // Demo-only merchandise item and order, purely so one member's balance
  // shows a mix of paid and unpaid items (status "Pending") rather than only
  // the fully-paid/fully-unpaid ends of the range.
  const sampleItem = await prisma.orderItem.upsert({
    where: { slug: "sample-water-bottle" },
    create: {
      slug: "sample-water-bottle",
      name: "[Sample] Water Bottle",
      description: "Sample catalogue item created by the development seed. Delete it before launch.",
      category: "MERCH",
      priceCents: 1500,
      sortOrder: 99,
    },
    update: {},
  });

  const sam = users[2].user;
  const samRegistration = opener
    ? await prisma.tournamentRegistration.findUnique({
        where: { userId_divisionId: { userId: sam.id, divisionId: opener.divisions[0].id } },
      })
    : null;
  if (samRegistration) {
    await prisma.tournamentRegistration.update({ where: { id: samRegistration.id }, data: { feePaid: true } });
  }
  const existingOrder = await prisma.order.findFirst({ where: { userId: sam.id, itemId: sampleItem.id } });
  if (!existingOrder) {
    await prisma.order.create({ data: { userId: sam.id, itemId: sampleItem.id, quantity: 1 } });
  }

  // One member excused from dues entirely, to demonstrate the waiver.
  const ana = users[4].user;
  await setDuesWaiver({
    userId: ana.id,
    seasonYear: season,
    waived: true,
    note: "[Sample] Waived for the development seed.",
    updatedById: officer.id,
  });

  const newsSlug = "sample-welcome-post";
  if (!(await prisma.newsPost.findUnique({ where: { slug: newsSlug } }))) {
    await prisma.newsPost.create({
      data: {
        slug: newsSlug,
        title: "[Sample] Welcome back for the new season",
        excerpt: "A sample post created by the development seed so the news layout can be reviewed. Delete it before launch.",
        body: [
          "This is a **sample** post written by the development seed. It exists so the news templates can be checked with real-looking content.",
          "",
          "Officers can write posts from the dashboard using a small Markdown subset:",
          "",
          "- headings, lists, and quotes",
          "- `inline code` and [links](https://www.tabroom.com/)",
          "- **bold** and *italic* text",
          "",
          "> Delete this post before the site goes live.",
        ].join("\n"),
        status: "DRAFT",
        tags: JSON.stringify(["sample"]),
        authorId: officer.id,
      },
    });
  }

  console.log("\n  Sign in at /signin with any of these development accounts:");
  for (const { user, person } of users) {
    console.log(`    ${user.ionUsername.padEnd(20)} ${person.role.padEnd(8)} ${user.displayName}`);
  }
}

async function main() {
  console.log(`Seeding (${DEMO ? "demo" : "baseline"})…`);

  if (DEMO && process.env.NODE_ENV === "production") {
    throw new Error("Refusing to write demo data with NODE_ENV=production.");
  }

  await seedSettings();
  await seedCatalogue();
  if (DEMO) await seedDemo();

  console.log("Done.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
