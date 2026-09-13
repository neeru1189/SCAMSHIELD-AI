import { NextResponse } from "next/server";
import { createUserSession, registerUser } from "@/lib/auth";
import { signUpSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsed = signUpSchema.safeParse(payload);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid sign up details." }, { status: 400 });
    }

    const user = await registerUser(parsed.data);
    await createUserSession(user);

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: "Unable to sign up." }, { status: 500 });
  }
}
