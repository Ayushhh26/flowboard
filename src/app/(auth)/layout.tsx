import { AppLogo } from '@/components/ui/AppLogo'
import { ThemeToggle } from '@/components/ui/ThemeToggle'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="hidden min-h-screen w-[42%] shrink-0 flex-col justify-between bg-foreground p-10 text-background lg:flex">
        <AppLogo variant="inverted" />
        <div className="space-y-3">
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            Collaborate in real time
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-background/70">
            Move cards across columns, share boards with your team, and stay aligned — built for
            fast-moving product work.
          </p>
        </div>
        <p className="text-xs text-background/50">FlowBoard · Kanban for teams</p>
      </aside>
      <main className="relative flex min-h-screen flex-1 items-center justify-center bg-background p-6">
        <div className="absolute right-6 top-6">
          <ThemeToggle />
        </div>
        <div className="w-full max-w-sm rounded-lg border border-border bg-surface p-8 shadow-md">
          <div className="mb-6 lg:hidden">
            <AppLogo />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
