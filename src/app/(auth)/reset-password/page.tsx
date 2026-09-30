import { ResetPasswordForm } from "@/features/auth/auth-forms";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email } = await searchParams;
  return <ResetPasswordForm initialEmail={email ?? ""} />;
}
