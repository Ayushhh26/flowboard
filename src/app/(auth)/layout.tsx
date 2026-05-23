import { AppLogo } from '@/components/ui/AppLogo'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <aside className="relative hidden min-h-screen w-[42%] shrink-0 overflow-hidden bg-indigo-600 lg:flex lg:flex-col lg:justify-between lg:p-10">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,255,255,0.12),_transparent_55%)]" />
        <div className="relative">
          <AppLogo variant="light" />
        </div>
        <div className="relative space-y-3">
          <h2 className="text-2xl font-semibold tracking-tight text-white">
            Collaborate in real time
          </h2>
          <p className="max-w-sm text-sm leading-relaxed text-indigo-100">
            Move cards across columns, share boards with your team, and stay aligned — built for
            fast-moving product work.
          </p>
        </div>
        <p className="relative text-xs text-indigo-200/80">FlowBoard · Kanban for teams</p>
      </aside>
      <main className="flex min-h-screen flex-1 items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <div className="mb-6 lg:hidden">
            <AppLogo />
          </div>
          {children}
        </div>
      </main>
    </div>
  )
}
