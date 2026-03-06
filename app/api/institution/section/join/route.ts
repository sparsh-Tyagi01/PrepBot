import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — look up a section by code (preview before joining)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const section = await prisma.branchSection.findUnique({
      where: { code },
      select: {
        id: true,
        name: true,
        description: true,
        branchId: true,
        branch: { select: { name: true, institutionId: true, institution: { select: { name: true } } } },
      },
    });

    if (!section) return NextResponse.json({ error: "Invalid section code. Please check with your institution." }, { status: 404 });

    return NextResponse.json({ section });
  } catch (error) {
    console.error("Section lookup error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — join a section (student must already be in the matching branch)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const code = body.code?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true, branchId: true },
    });

    if (!user?.institutionId) {
      return NextResponse.json({ error: "You must join an institution first." }, { status: 400 });
    }
    if (!user.branchId) {
      return NextResponse.json({ error: "You must join a branch first." }, { status: 400 });
    }

    const section = await prisma.branchSection.findUnique({
      where: { code },
      select: { id: true, name: true, branchId: true, branch: { select: { institutionId: true } } },
    });

    if (!section) return NextResponse.json({ error: "Invalid section code." }, { status: 404 });

    if (section.branchId !== user.branchId) {
      return NextResponse.json({ error: "This section belongs to a different branch." }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { sectionId: section.id },
    });

    return NextResponse.json({ section: { id: section.id, name: section.name } });
  } catch (error) {
    console.error("Join section error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
