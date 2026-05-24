import Link from 'next/link'
import { SignupForm } from '@/components/auth/SignupForm'
import { linkClassName } from '@/lib/ui-colors'
import { cn } from '@/lib/cn'

export default function SignupPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">Create your account</h1>
        <p className="mt-1 text-sm text-muted">Get started with FlowBoard.</p>
      </div>
      <SignupForm />
      <p className="text-xs text-muted">
        Already have an account?{' '}
        <Link href="/login" className={cn(linkClassName, 'text-xs')}>
          Sign in
        </Link>
      </p>
    </div>
  )
}
