import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0];

/** Generates a short readable join code like "X7K4RM" */
function generateJoinCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O/1/I to avoid confusion
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { adminName, adminEmail, password, institutionName, institutionType, institutionEmail } = body;

    if (!adminName || !adminEmail || !password || !institutionName || !institutionEmail) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 });
    }

    const normalizedAdminEmail = adminEmail.toLowerCase().trim();
    const normalizedInstitutionEmail = institutionEmail.toLowerCase().trim();

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({ where: { email: normalizedAdminEmail } });
    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists" }, { status: 400 });
    }

    // Check if institution email already exists
    const existingInstitution = await prisma.institution.findUnique({ where: { email: normalizedInstitutionEmail } });
    if (existingInstitution) {
      return NextResponse.json({ error: "An institution with this email already exists" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Generate a unique join code
    let joinCode = generateJoinCode();
    while (await prisma.institution.findUnique({ where: { joinCode } })) {
      joinCode = generateJoinCode(); // retry if collision (extremely rare)
    }

    // Create everything atomically
    const { institution, user } = await prisma.$transaction(async (tx: TxClient) => {
      const institution = await tx.institution.create({
        data: {
          name: institutionName,
          email: normalizedInstitutionEmail,
          type: institutionType || "university",
          joinCode,
        },
      });

      await tx.institutionAnalytics.create({ data: { institutionId: institution.id } });

      const user = await tx.user.create({
        data: {
          name: adminName,
          email: normalizedAdminEmail,
          password: hashedPassword,
          role: "institution-admin",
          institutionId: institution.id,
        },
      });

      await tx.analytics.create({ data: { userId: user.id } });

      return { institution, user };
    });

    return NextResponse.json(
      {
        user: { id: user.id, email: user.email, name: user.name, role: user.role },
        institution: { id: institution.id, name: institution.name, joinCode: institution.joinCode },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Institution registration error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
