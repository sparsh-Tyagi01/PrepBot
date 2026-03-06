import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — look up institution by join code (preview before joining)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { joinCode: code },
      select: { id: true, name: true, type: true, email: true },
    });

    if (!institution) {
      return NextResponse.json({ error: "Invalid institution code. Please check and try again." }, { status: 404 });
    }

    return NextResponse.json({ institution });
  } catch (error) {
    console.error("Join code lookup error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — join institution (for already-registered students)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const code = body.code?.toUpperCase().trim();

    if (!code) {
      return NextResponse.json({ error: "Code is required" }, { status: 400 });
    }

    const institution = await prisma.institution.findUnique({
      where: { joinCode: code },
      select: { id: true, name: true, type: true },
    });

    if (!institution) {
      return NextResponse.json({ error: "Invalid institution code. Please check and try again." }, { status: 404 });
    }

    // Update user to link to institution
    await prisma.user.update({
      where: { id: session.user.id },
      data: { institutionId: institution.id, branchId: null, sectionId: null },
    });

    return NextResponse.json({ institution });
  } catch (error) {
    console.error("Join institution error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// DELETE — leave institution
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { institutionId: null, branchId: null, sectionId: null },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Leave institution error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
