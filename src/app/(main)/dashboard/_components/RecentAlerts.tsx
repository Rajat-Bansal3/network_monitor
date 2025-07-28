/* eslint-disable @typescript-eslint/no-explicit-any */
import { AlertCircle, CheckCircle, Info } from "lucide-react";
import Link from "next/link";

const getSeverityIcon = (severity: string) => {
  switch (severity) {
    case "Critical":
      return <AlertCircle className='h-5 w-5 text-red-500' />;
    case "Warning":
      return <AlertCircle className='h-5 w-5 text-yellow-500' />;
    default:
      return <Info className='h-5 w-5 text-blue-500' />;
  }
};

export default function RecentAlerts({ alerts }: { alerts: any[] }) {
  if (alerts.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center h-40 text-gray-500'>
        <CheckCircle className='h-10 w-10 text-green-500 mb-2' />
        <p>No active alerts</p>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {alerts.map((alert) => (
        <Link
          key={alert.id}
          href={`/alerts/${alert.id}`}
          className='block p-3 border rounded-lg hover:bg-gray-50 transition-colors'
        >
          <div className='flex items-start'>
            <div className='mt-0.5 mr-3'>{getSeverityIcon(alert.severity)}</div>
            <div className='flex-1'>
              <div className='flex justify-between'>
                <h4 className='font-medium'>{alert.title}</h4>
                <span className='text-xs text-gray-500'>
                  {new Date(alert.time).toLocaleTimeString()}
                </span>
              </div>
              <p className='text-sm text-gray-600 mt-1'>
                {alert.device} • {alert.severity}
              </p>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
