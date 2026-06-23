import { InventoryAllocationMatrix } from './components/InventoryAllocationMatrix'
import { VendorOrderTriggerWizard } from './components/VendorOrderTriggerWizard'
import { InventoryTrendChart } from '@/components/charts/InventoryTrendChart'
import { KPICard } from '@/components/charts/KPICard'
import { Package, AlertTriangle, TrendingDown, Zap } from 'lucide-react'

export const metadata = {
  title: 'Supply Chain Dashboard | AMDOX',
  description: 'Inventory management and vendor order processing',
}

export default function SupplyChainDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Supply Chain Module
        </h1>
        <p className="text-muted-foreground mt-2">
          Inventory tracking, demand planning, and vendor management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total SKUs"
          value="2,847"
          unit="products"
          change={12}
          trend="up"
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard 
          title="Stock Outs"
          value="4"
          unit="this week"
          change={-50}
          trend="down"
          icon={<AlertTriangle className="h-6 w-6" />}
        />
        <KPICard 
          title="Inventory Value"
          value="$2.3M"
          unit="USD"
          change={5}
          trend="up"
          icon={<Package className="h-6 w-6" />}
        />
        <KPICard 
          title="Reorder Efficiency"
          value="96.8%"
          change={1.5}
          trend="up"
          icon={<Zap className="h-6 w-6" />}
        />
      </div>

      <InventoryTrendChart />

      <InventoryAllocationMatrix />

      <VendorOrderTriggerWizard />
    </div>
  )
}
