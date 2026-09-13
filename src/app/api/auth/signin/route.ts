import { NextResponse } from "next/server";
import { authenticateUser, createUserSession } from "@/lib/auth";
import { signInSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = signInSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sign in details." }, { status: 400 });
    }

    const user = await authenticateUser(parsed.data.email, parsed.data.password);
    if (!user) {
      return NextResponse.json({ error: "Incorrect email or password." }, { status: 401 });
    }

    await createUserSession(user);
    return NextResponse.json({ user });
  } catch {
    return NextResponse.json({ error: "Unable to sign in." }, { status: 500 });
  }
}
