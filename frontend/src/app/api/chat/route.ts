import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { createClient } from '@/utils/supabase/server'

const apiKey = process.env.GEMINI_API_KEY || ''
const genAI = new GoogleGenerativeAI(apiKey)

/**
 * Models to try, in order.
 *
 * A chain rather than one name because Gemini model availability has proven
 * genuinely unstable: `gemini-1.5-flash` was retired (404), `gemini-2.5-flash`
 * is refused for new keys, and `gemini-2.0-flash` returns 429 on the free tier.
 * Any single pinned name is one deprecation away from a dead assistant.
 *
 * `gemini-flash-latest` leads because it is an alias Google repoints at the
 * current flash model, so it survives retirements on its own.
 */
const MODEL_CHAIN = ['gemini-flash-latest', 'gemini-3.6-flash', 'gemini-flash-lite-latest']

function modelsToTry(): string[] {
  const override = process.env.GEMINI_MODEL?.trim()
  // An explicit override goes first but still falls back, so a stale value in
  // .env.local degrades instead of taking the assistant down.
  return override ? [override, ...MODEL_CHAIN.filter((m) => m !== override)] : MODEL_CHAIN
}

/** 404 = retired/unavailable, 429 = quota. Both mean "try the next model". */
function shouldFallThrough(message: string): boolean {
  return /not found|no longer available|not supported for generateContent|quota|429|503|overloaded|high demand/i.test(
    message,
  )
}

export async function POST(req: NextRequest) {
  try {
    if (!apiKey) {
      return NextResponse.json(
        { error: 'The AI assistant is not configured on this deployment.' },
        { status: 503 },
      )
    }

    const { message, role } = await req.json()
    if (typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Ask a question first.' }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Unauthenticated callers get nothing: the context below is real staff data.
    if (!user) {
      return NextResponse.json({ error: 'Not signed in.' }, { status: 401 })
    }

    // RLS already scopes these reads to the caller, so an employee cannot pull
    // the roster even if they claim role: 'hr' in the request body.
    let contextData: unknown = {}
    if (role === 'hr') {
      const { data: employees } = await supabase
        .from('employees')
        .select('full_name, department, designation, status')
      contextData = { type: 'hr', employees }
    } else {
      const { data: employee } = await supabase
        .from('employees')
        .select('full_name, department, designation, status')
        .eq('user_id', user.id)
        .maybeSingle()
      contextData = { type: 'employee', employee }
    }

    const contextStr = `
You are an AI assistant built into the FinAtt HR & Attendance platform.
The user you are talking to has the role: ${role}.
If the user is an employee, only discuss their own data.
If the user is HR, you may discuss the whole roster in Context Data.

Context Data:
${JSON.stringify(contextData)}

Be concise, friendly, and helpful. Use markdown for bolding (**like this**) or lists.
Do not expose the raw JSON or mention that you are reading JSON. Answer naturally,
as though you looked it up in the system.
    `.trim()

    const attempts: string[] = []
    let lastError = ''

    for (const modelName of modelsToTry()) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName })
        const chat = model.startChat({
          history: [
            { role: 'user', parts: [{ text: contextStr }] },
            {
              role: 'model',
              parts: [{ text: "Understood — I'm ready to help with FinAtt." }],
            },
          ],
        })

        const result = await chat.sendMessage(message)
        return NextResponse.json({ response: result.response.text(), model: modelName })
      } catch (err) {
        lastError = err instanceof Error ? err.message : String(err)
        attempts.push(modelName)

        if (!shouldFallThrough(lastError)) throw err
        console.warn(`[chat] ${modelName} unavailable, trying next:`, lastError.slice(0, 120))
      }
    }

    console.error('[chat] every model failed:', lastError)
    return NextResponse.json(
      {
        error:
          `No available AI model responded (tried ${attempts.join(', ')}). ` +
          'This usually means the API key is out of quota. Set GEMINI_MODEL to a model ' +
          'your key can use, or check quota in Google AI Studio.',
      },
      { status: 503 },
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to generate a response.'
    console.error('[chat]', message)

    const friendly = /api[_ ]?key|API_KEY_INVALID|PERMISSION_DENIED/i.test(message)
      ? 'The AI provider rejected the API key. Check GEMINI_API_KEY and restart the server.'
      : message

    return NextResponse.json({ error: friendly }, { status: 500 })
  }
}
