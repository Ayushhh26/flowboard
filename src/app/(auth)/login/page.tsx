import Link from 'next/link'
import { LoginForm } from '@/components/auth/LoginForm'

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Sign in</h1>
        <p className="mt-1 text-sm text-gray-500">Welcome back to FlowBoard.</p>
      </div>
      <LoginForm />
      <p className="text-xs text-gray-500">
        No account?{' '}
        <Link href="/signup" className="font-medium text-blue-600 hover:text-blue-700">
          Sign up
        </Link>
      </p>
    </div>
  )
}
