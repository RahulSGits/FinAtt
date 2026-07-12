import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { employees, company, leaves, payroll } from "@/lib/mock";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { message, role } = await req.json();

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build context
    const contextStr = `
You are an AI assistant built into the geoSelfie HR & Attendance platform.
The user you are talking to has the role: ${role}. 
If the user is an employee, only give them their own data if possible, or act as an HR helper.
If the user is HR or Admin, give them full access to all insights.

Context Data (Mock Database):
Company Info: ${JSON.stringify(company)}
Employees Data (includes attendance % and this week's status): ${JSON.stringify(employees.map(e => ({ id: e.id, name: e.name, dept: e.department, role: e.designation, attendancePct: e.attendancePct, weekStatus: e.today })))}
Leaves Data: ${JSON.stringify(leaves)}
Payroll Summary (just top level info): ${payroll.length} employees on payroll.

Be concise, friendly, and helpful. Use markdown for bolding (**like this**) or lists. 
Do not expose the raw JSON or state you are an AI reading JSON. Just answer naturally as if you looked it up in the system.
    `;

    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: contextStr }],
        },
        {
          role: "model",
          parts: [{ text: "Understood! I'm ready to act as the geoSelfie assistant based on this data." }],
        }
      ],
    });

    const result = await chat.sendMessage(message);
    const responseText = result.response.text();

    return NextResponse.json({ response: responseText });
  } catch (error: unknown) {
    console.error("AI Error:", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to generate AI response" }, { status: 500 });
  }
}
