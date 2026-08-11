import { NextResponse } from "next/server";

// This runs on the server only, so GROQ_API_KEY is never exposed to the browser.
export const runtime = "nodejs";

const SYSTEM_PROMPT = `You are the CampusDesk AI Help Desk — a friendly, concise assistant embedded in a college complaint management system.

You help students with:
- Explaining how to file, track, or check the status of a complaint on CampusDesk.
- Suggesting the right complaint category/department for an issue they describe (Wi-Fi / Network, Hostel, Library, Canteen, Faculty, Examination, Infrastructure, Fees & Accounts, Other).
- General guidance on campus-life issues (who to contact, what info to include in a complaint).
- Being warm, brief, and practical — most answers should be a short paragraph or a few bullet points, not an essay.

You do NOT have live access to any specific student's account, complaints, or personal data — if asked about "my complaint status", direct them to the Track Complaint or My Complaints page instead of guessing.
Stay strictly on topic (campus complaints, college services, using this app). If asked something unrelated, politely redirect back to how you can help with campus issues.`;

export async function POST(req) {
  try {
    const { messages } = await req.json();

    if (!process.env.GROQ_API_KEY) {
      return NextResponse.json(
        { error: "GROQ_API_KEY is not set on the server. Add it to .env.local (see .env.example)." },
        { status: 500 }
      );
    }

    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        temperature: 0.6,
        max_tokens: 600,
      }),
    });

    if (!groqRes.ok) {
      const errText = await groqRes.text();
      return NextResponse.json({ error: `Groq API error: ${errText}` }, { status: groqRes.status });
    }

    const data = await groqRes.json();
    const reply = data.choices?.[0]?.message?.content || "Sorry, I couldn't generate a response.";
    return NextResponse.json({ reply });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Something went wrong." }, { status: 500 });
  }
}
