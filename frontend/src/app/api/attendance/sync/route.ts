import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Mock successful sync
    // In a real application, this would save the attendance record to the database
    // or forward the request to the FastAPI backend.
    
    return NextResponse.json({
      status: "success",
      message: "Attendance synced successfully",
      record: data
    });
  } catch (error: unknown) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to sync attendance" },
      { status: 500 }
    );
  }
}
