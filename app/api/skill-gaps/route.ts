import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const skillGaps = await prisma.skillGap.findMany({
      where: { userId: session.user.id },
      orderBy: { priority: "desc" },
    });

    return NextResponse.json({ skillGaps });
  } catch (error) {
    console.error("Get skill gaps error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { skillName, category, currentLevel, targetLevel, priority, resources } = body;

    if (!skillName || !category || currentLevel === undefined || targetLevel === undefined) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const skillGap = await prisma.skillGap.create({
      data: {
        userId: session.user.id,
        skillName,
        category,
        currentLevel,
        targetLevel,
        priority: priority || "medium",
        resources: resources || [],
      },
    });

    return NextResponse.json({ skillGap }, { status: 201 });
  } catch (error) {
    console.error("Create skill gap error:", error);
    return NextResponse.json(
      { error: "Something went wrong" },
      { status: 500 }
    );
  }
}
