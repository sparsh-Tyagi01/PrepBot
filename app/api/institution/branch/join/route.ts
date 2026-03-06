import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET — look up a branch by code (preview before joining)
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get("code")?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const branch = await prisma.branch.findUnique({
      where: { code },
      select: {
        id: true,
        name: true,
        description: true,
        institutionId: true,
        institution: { select: { name: true } },
        _count: { select: { sections: true } },
      },
    });

    if (!branch) return NextResponse.json({ error: "Invalid branch code. Please check with your institution." }, { status: 404 });

    return NextResponse.json({ branch });
  } catch (error) {
    console.error("Branch lookup error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

// POST — join a branch (student must already be in the institution)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const code = body.code?.toUpperCase().trim();
    if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { institutionId: true },
    });

    if (!user?.institutionId) {
      return NextResponse.json({ error: "You must join an institution first." }, { status: 400 });
    }

    const branch = await prisma.branch.findUnique({
      where: { code },
      select: { id: true, name: true, institutionId: true },
    });

    if (!branch) return NextResponse.json({ error: "Invalid branch code." }, { status: 404 });

    if (branch.institutionId !== user.institutionId) {
      return NextResponse.json({ error: "This branch belongs to a different institution." }, { status: 403 });
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { branchId: branch.id, sectionId: null }, // reset section when switching branch
    });

    return NextResponse.json({ branch: { id: branch.id, name: branch.name } });
  } catch (error) {
    console.error("Join branch error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
