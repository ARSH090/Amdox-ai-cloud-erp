export default function AuditLogsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-foreground">Cryptographic Audit Logs</h1>
          <p className="text-muted-foreground mt-1">Review the tamper-evident SHA-256 mutation log chain.</p>
        </div>
        <button className="px-4 py-2 border border-border text-foreground rounded-md font-medium hover:bg-muted transition-colors">
          Verify Chain Integrity
        </button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <table className="w-full text-sm text-left font-mono">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-semibold">Timestamp</th>
              <th className="px-6 py-4 font-semibold">Action</th>
              <th className="px-6 py-4 font-semibold">Actor</th>
              <th className="px-6 py-4 font-semibold">Endpoint</th>
              <th className="px-6 py-4 font-semibold">Hash Signature</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 text-muted-foreground">2026-06-14 13:14:02</td>
              <td className="px-6 py-4"><span className="text-emerald-400 font-bold">POST</span></td>
              <td className="px-6 py-4 text-foreground">alice.j@amdox.com</td>
              <td className="px-6 py-4 text-muted-foreground">/api/finance/journal-entries</td>
              <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</td>
            </tr>
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 text-muted-foreground">2026-06-14 11:42:15</td>
              <td className="px-6 py-4"><span className="text-blue-400 font-bold">PUT</span></td>
              <td className="px-6 py-4 text-foreground">bob.s@amdox.com</td>
              <td className="px-6 py-4 text-muted-foreground">/api/supply-chain/po/PO-9021</td>
              <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]">8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4</td>
            </tr>
            <tr className="hover:bg-muted/50 transition-colors">
              <td className="px-6 py-4 text-muted-foreground">2026-06-14 09:12:00</td>
              <td className="px-6 py-4"><span className="text-emerald-400 font-bold">POST</span></td>
              <td className="px-6 py-4 text-foreground">system_auto</td>
              <td className="px-6 py-4 text-muted-foreground">/api/hr/payroll/run</td>
              <td className="px-6 py-4 text-xs text-slate-500 truncate max-w-[200px]">a83b27b4097f48b948df91cb1d6159dbb41b3af831d10260db9352e008b8941f</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}
