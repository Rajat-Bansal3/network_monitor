// app/dashboard/page.tsx
import { requireRole } from "@/actions/auth.actions";
import { getDashboardStats } from "@/actions/dashboard-actions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Activity,
  AlertCircle,
  Cpu,
  Network,
  Server,
  Users,
} from "lucide-react";
import Link from "next/link";
import DeviceStatusChart from "./_components/DeviceStatusChart";
import RecentAlerts from "./_components/RecentAlerts";

export default async function DashboardPage() {
  await requireRole("Admin");
  const stats = await getDashboardStats();

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Admin Dashboard</h1>
        <div className='text-sm text-gray-500'>
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Network Devices
            </CardTitle>
            <Network className='h-4 w-4 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalDevices}</div>
            <div className='flex text-xs text-muted-foreground mt-2'>
              <span className='text-green-500 flex items-center mr-4'>
                <span className='w-2 h-2 bg-green-500 rounded-full mr-1'></span>
                {stats.onlineDevices} Online
              </span>
              <span className='text-red-500 flex items-center'>
                <span className='w-2 h-2 bg-red-500 rounded-full mr-1'></span>
                {stats.offlineDevices} Offline
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Alerts</CardTitle>
            <AlertCircle className='h-4 w-4 text-red-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.activeAlerts}</div>
            <p className='text-xs text-muted-foreground'>
              {stats.criticalAlerts} critical issues
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>System Health</CardTitle>
            <Server className='h-4 w-4 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>Normal</div>
            <p className='text-xs text-muted-foreground'>
              CPU: {stats.cpuUsage}% • Memory: {stats.memoryUsage}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Data Grids */}
      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6'>
        <Card className='lg:col-span-2'>
          <CardHeader>
            <CardTitle>Device Status Overview</CardTitle>
          </CardHeader>
          <CardContent className='pl-2'>
            <DeviceStatusChart data={stats.deviceStatusData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <CardTitle>Recent Alerts</CardTitle>
              <Link
                href='/alerts'
                className='text-sm text-blue-500 hover:underline'
              >
                View All
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentAlerts alerts={stats.recentAlerts} />
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Link href='/scan'>
          <Card className='transition-colors hover:bg-blue-50 cursor-pointer'>
            <CardContent className='p-4 flex items-center'>
              <div className='bg-blue-100 p-3 rounded-full mr-4'>
                <Cpu className='h-6 w-6 text-blue-600' />
              </div>
              <div>
                <h3 className='font-semibold'>Run Network Scan</h3>
                <p className='text-sm text-gray-500'>Discover new devices</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/settings'>
          <Card className='transition-colors hover:bg-green-50 cursor-pointer'>
            <CardContent className='p-4 flex items-center'>
              <div className='bg-green-100 p-3 rounded-full mr-4'>
                <Server className='h-6 w-6 text-green-600' />
              </div>
              <div>
                <h3 className='font-semibold'>System Settings</h3>
                <p className='text-sm text-gray-500'>Configure application</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/alerts'>
          <Card className='transition-colors hover:bg-yellow-50 cursor-pointer'>
            <CardContent className='p-4 flex items-center'>
              <div className='bg-yellow-100 p-3 rounded-full mr-4'>
                <AlertCircle className='h-6 w-6 text-yellow-600' />
              </div>
              <div>
                <h3 className='font-semibold'>Manage Alerts</h3>
                <p className='text-sm text-gray-500'>Configure notifications</p>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href='/settings/users'>
          <Card className='transition-colors hover:bg-purple-50 cursor-pointer'>
            <CardContent className='p-4 flex items-center'>
              <div className='bg-purple-100 p-3 rounded-full mr-4'>
                <Users className='h-6 w-6 text-purple-600' />
              </div>
              <div>
                <h3 className='font-semibold'>User Management</h3>
                <p className='text-sm text-gray-500'>Add/edit users</p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
