import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return <main className="auth-page"><SignUp routing="path" path="/sign-up" signInUrl="/sign-in" fallbackRedirectUrl="/app" /></main>;
}
