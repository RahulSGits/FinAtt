import { NextRequest, NextResponse } from "next/server";
import { SignJWT } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "fallback_secret_for_development_only_12345"
);

export async function POST(req: NextRequest) {
  try {
    const { email, password, companyId } = await req.json();

    // Mock validation
    // In reality, this would check against a DB. We just check email.
    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    // Determine mock role based on email domain or hardcoded mock users
    let role = "employee";
    let name = "Mock Employee";
    
    if (email.includes("hr@") || email === "alice@example.com") {
      role = "hr";
      name = "Alice (HR)";
    } else if (email.includes("admin@")) {
      role = "admin";
      name = "Admin User";
    } else {
      role = "employee";
      name = email.split("@")[0];
    }

    // Generate Access Token (short lived)
    const accessToken = await new SignJWT({
      userId: email, // Use email as mock ID
      role,
      name,
      companyId: companyId || "default_company",
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(JWT_SECRET);

    // Generate Refresh Token (long lived)
    const refreshToken = await new SignJWT({
      userId: email,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d")
      .sign(JWT_SECRET);

    return NextResponse.json({
      accessToken,
      refreshToken,
      user: {
        id: email,
        email,
        name,
        role,
      },
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unknown error" }, { status: 500 });
  }
}
