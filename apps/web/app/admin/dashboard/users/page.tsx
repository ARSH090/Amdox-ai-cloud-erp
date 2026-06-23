export default function UsersRolesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Users & Roles</h1>
          <p className="text-muted-foreground mt-1">Manage tenant users and assign specific RBAC policies here.</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
          + Add User
        </button>
      </div>
      
      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">User</th>
              <th className="px-6 py-4 font-semibold">Role</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Last Login</th>
              <th className="px-6 py-4 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-foreground">Alice Johnson</div>
                <div className="text-muted-foreground text-xs">alice.j@amdox.com</div>
              </td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs font-medium border border-blue-500/20">Finance Manager</span></td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium border border-emerald-500/20">Active</span></td>
              <td className="px-6 py-4 text-muted-foreground">10 mins ago</td>
              <td className="px-6 py-4"><button className="text-primary hover:underline font-medium">Edit</button></td>
            </tr>
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-foreground">Bob Smith</div>
                <div className="text-muted-foreground text-xs">bob.s@amdox.com</div>
              </td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-amber-500/10 text-amber-400 rounded text-xs font-medium border border-amber-500/20">Supply Chain Operator</span></td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded text-xs font-medium border border-emerald-500/20">Active</span></td>
              <td className="px-6 py-4 text-muted-foreground">2 hours ago</td>
              <td className="px-6 py-4"><button className="text-primary hover:underline font-medium">Edit</button></td>
            </tr>
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-medium text-foreground">Charlie Davis</div>
                <div className="text-muted-foreground text-xs">charlie.d@amdox.com</div>
              </td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs font-medium border border-purple-500/20">Super Admin</span></td>
              <td className="px-6 py-4"><span className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs font-medium border border-red-500/20">Inactive</span></td>
              <td className="px-6 py-4 text-muted-foreground">3 days ago</td>
              <td className="px-6 py-4"><button className="text-primary hover:underline font-medium">Edit</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
