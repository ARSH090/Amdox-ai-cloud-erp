import { PayrollBatchProgressScreen } from './components/PayrollBatchProgressScreen'
import { OrgChartTree } from './components/OrgChartTree'
import { HeadcountByDepartment, AttendanceStatus } from '@/components/charts/HRAnalyticsChart'
import { KPICard } from '@/components/charts/KPICard'
import { Users, Calendar, DollarSign, TrendingUp } from 'lucide-react'

export const metadata = {
  title: 'HR Dashboard | AMDOX',
  description: 'Payroll processing and organization management',
}

export default function HRDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Human Resources Module
        </h1>
        <p className="text-muted-foreground mt-2">
          Payroll processing, attendance tracking, and organization management
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Total Headcount"
          value="67"
          unit="employees"
          change={8}
          trend="up"
          icon={<Users className="h-6 w-6" />}
        />
        <KPICard 
          title="Avg Attendance"
          value="94.2%"
          change={2.1}
          trend="up"
          icon={<Calendar className="h-6 w-6" />}
        />
        <KPICard 
          title="Monthly Payroll"
          value="$187K"
          unit="USD"
          change={0}
          trend="neutral"
          icon={<DollarSign className="h-6 w-6" />}
        />
        <KPICard 
          title="YTD Cost per Employee"
          value="$23.4K"
          change={-3.2}
          trend="down"
          icon={<TrendingUp className="h-6 w-6" />}
        />
      </div>

      <PayrollBatchProgressScreen />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <HeadcountByDepartment />
        <AttendanceStatus />
      </div>

      <OrgChartTree />
    </div>
  )
}
