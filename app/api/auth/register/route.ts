import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password, name, role, institutionCode } = body;

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Resolve institution if code provided
    let institutionId: string | undefined;
    if (institutionCode) {
      const code = institutionCode.toUpperCase().trim();
      const institution = await prisma.institution.findUnique({ where: { joinCode: code } });
      if (!institution) {
        return NextResponse.json({ error: "Invalid institution code" }, { status: 400 });
      }
      institutionId = institution.id;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name,
        password: hashedPassword,
        role: role || "student",
        ...(institutionId ? { institutionId } : {}),
      },
    });

    // Create analytics record — non-fatal (analytics API will create it on first load if missing)
    try {
      await prisma.analytics.create({ data: { userId: user.id } });
    } catch (analyticsError) {
      console.warn("Analytics record creation failed (non-fatal):", analyticsError);
    }

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
