import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    hasKey: Boolean(process.env.OPENAI_API_KEY),
    keyStartsWith: process.env.OPENAI_API_KEY?.slice(0, 3) ?? null,
  });
}
