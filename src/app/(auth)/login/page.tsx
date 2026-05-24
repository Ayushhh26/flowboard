import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'
import { linkClassName } from '@/lib/ui-colors'
import { cn } from '@/lib/cn'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-xl font-semibold tracking-tight text-foreground">Sign in</h1>
        <p className="mt-1 text-sm text-muted">Welcome back to FlowBoard.</p>
      </div>
      <LoginForm />
      <p className="text-xs text-muted">
        No account?{' '}
        <Link href="/signup" className={cn(linkClassName, 'text-xs')}>
          Sign up
        </Link>
      </p>
    </div>
  )
}
