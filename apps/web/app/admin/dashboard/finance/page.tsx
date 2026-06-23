import { FinancialLedgerTable } from './components/FinancialLedgerTable'
import { FXRateStalenessCard } from './components/FXRateStalenessCard'
import { OCRInvoiceExceptionQueue } from './components/OCRInvoiceExceptionQueue'
import { RevenueTrendChart } from '@/components/charts/RevenueTrendChart'
import { KPICard } from '@/components/charts/KPICard'
import { DepartmentBudgetChart } from '@/components/charts/DepartmentBudgetChart'
import { DollarSign, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react'

export const metadata = {
  title: 'Finance Dashboard | AMDOX',
  description: 'Financial ledger, FX rates, and invoice processing',
}

export default function FinanceDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Finance Module
        </h1>
        <p className="text-muted-foreground mt-2">
          Revenue tracking, budget allocation, and cash flow analysis
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Revenue"
          value="$328K"
          unit="YTD"
          change={12}
          trend="up"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard 
          title="Net Profit Margin"
          value="24.5%"
          change={2.3}
          trend="up"
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <KPICard 
          title="Outstanding A/R"
          value="$52K"
          unit="USD"
          change={-5}
          trend="down"
          icon={<AlertCircle className="h-6 w-6" />}
        />
        <KPICard 
          title="Reconciled"
          value="98.7%"
          unit="of accounts"
          change={0}
          trend="neutral"
          icon={<CheckCircle2 className="h-6 w-6" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <FXRateStalenessCard />
      </div>

      <RevenueTrendChart />

      <DepartmentBudgetChart />

      <FinancialLedgerTable />

      <OCRInvoiceExceptionQueue />
    </div>
  )
}
