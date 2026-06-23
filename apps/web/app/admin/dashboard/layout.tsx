import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
}

export const metadata = {
  title: 'AMDOX ERP Dashboard',
  description: 'Advanced ERP system with Finance, HR, and Supply Chain modules',
}

function NavLink({
  href,
  label,
  icon,
}: {
  href: string
  label: string
  icon: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors text-foreground hover:text-primary"
    >
      <span className="text-lg">{icon}</span>
      <span className="font-medium">{label}</span>
    </Link>
  )
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-card flex flex-col">
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Amdox Logo" className="h-10 w-10 object-cover rounded-xl shadow-sm border border-border/50" />
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Amdox</h1>
          </div>
          <p className="text-xs text-muted-foreground mt-2 font-medium uppercase tracking-wider">Enterprise ERP</p>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="mb-6">
            <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-3">
              ERP Modules
            </p>
            <NavLink href="/admin/dashboard/finance" label="Finance" icon="💰" />
            <NavLink href="/admin/dashboard/hr" label="Human Resources" icon="👥" />
            <NavLink
              href="/admin/dashboard/supply-chain"
              label="Supply Chain"
              icon="🚚"
            />
          </div>


          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase px-4 mb-3">
              Admin
            </p>
            <NavLink href="/admin/dashboard/users" label="Users & Roles" icon="👨‍💼" />
            <NavLink href="/admin/dashboard/audit" label="Audit Logs" icon="📝" />
            <NavLink href="/admin/dashboard/settings" label="Settings" icon="⚙️" />
          </div>
        </nav>

        <div className="p-4 border-t border-border">
          <div className="text-xs text-muted-foreground">
            <p>System Status</p>
            <p className="text-green-400 font-semibold mt-1">✓ Online</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
