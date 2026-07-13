import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from '@/utils/supabase/server';

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json({ error: "Gemini API key not configured" }, { status: 500 });
    }

    const { message, role } = await req.json();

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    let contextData = {};
    if (user) {
       if (role === 'hr') {
          const { data: employees } = await supabase.from('employees').select('id, full_name, department, designation, status');
          contextData = { type: 'hr', employees };
       } else {
          const { data: employee } = await supabase.from('employees').select('id, full_name, department, designation, status').eq('user_id', user.id).single();
          contextData = { type: 'employee', employee };
       }
    }

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build context
    const contextStr = `
You are an AI assistant built into the FinAtt HR & Attendance platform.
The user you are talking to has the role: ${role}. 
If the user is an employee, only give them their own data if possible, or act as an HR helper.
If the user is HR, give them full access to all insights based on the Context Data.

Context Data:
${JSON.stringify(contextData)}

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
          parts: [{ text: "Understood! I'm ready to act as the FinAtt assistant based on this data." }],
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
