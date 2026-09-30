import { SignInForm } from "@/features/auth/auth-forms";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>;
}) {
  const { verified } = await searchParams;
  return <SignInForm isVerified={verified === "1"} />;
}
