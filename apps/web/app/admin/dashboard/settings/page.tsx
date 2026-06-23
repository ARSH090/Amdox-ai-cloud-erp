export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-4xl font-bold text-foreground">Tenant Settings</h1>
        <p className="text-muted-foreground mt-1">Configure global preferences, API keys, and Webhook integrations.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 space-y-8">
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">Organization Profile</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Company Name</label>
              <input type="text" defaultValue="Amdox Global Inc." className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">Fiscal Year End</label>
              <select className="w-full px-3 py-2 bg-background border border-border rounded-md text-foreground focus:outline-none focus:border-primary">
                <option>December 31</option>
                <option>March 31</option>
                <option>June 30</option>
              </select>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border">
          <h3 className="text-lg font-semibold text-foreground mb-4">Security & Authentication</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">Require Multi-Factor Authentication (MFA)</p>
                <p className="text-sm text-muted-foreground">Enforce 2FA for all administrative accounts.</p>
              </div>
              <div className="w-12 h-6 bg-primary rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1"></div>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
              <div>
                <p className="font-medium text-foreground">Single Sign-On (SAML/OIDC)</p>
                <p className="text-sm text-muted-foreground">Allow login via Okta or Microsoft Entra.</p>
              </div>
              <div className="w-12 h-6 bg-slate-600 rounded-full relative cursor-pointer">
                <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-border flex justify-end">
          <button className="px-6 py-2 bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 transition-colors">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}
