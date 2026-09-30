import { VerifyEmailForm } from "@/features/auth/auth-forms";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <VerifyEmailForm initialEmail={email ?? ""} />;
}
