import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return <main className="auth-page"><SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" fallbackRedirectUrl="/app" /></main>;
}
