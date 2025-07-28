/* eslint-disable @typescript-eslint/no-explicit-any */
import { Badge } from "@/components/ui/badge";

const formatTime = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleString();
};

const getRoleBadge = (role: string) => {
  switch (role) {
    case "Admin":
      return <Badge variant='destructive'>{role}</Badge>;
    case "Operator":
      return <Badge variant='secondary'>{role}</Badge>;
    default:
      return <Badge>{role}</Badge>;
  }
};

export default function UserActivityTable({
  activities,
}: {
  activities: any[];
}) {
  if (activities.length === 0) {
    return (
      <div className='text-center py-8 text-gray-500'>No recent activity</div>
    );
  }

  return (
    <div className='border rounded-lg overflow-hidden'>
      <table className='w-full'>
        <thead className='bg-gray-50'>
          <tr>
            <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
              User
            </th>
            <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
              Role
            </th>
            <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
              IP Address
            </th>
            <th className='text-left py-3 px-4 text-sm font-medium text-gray-700'>
              Time
            </th>
          </tr>
        </thead>
        <tbody className='divide-y divide-gray-200'>
          {activities.map((activity) => (
            <tr key={activity.id} className='hover:bg-gray-50'>
              <td className='py-3 px-4 text-sm'>{activity.email}</td>
              <td className='py-3 px-4 text-sm'>
                {getRoleBadge(activity.role)}
              </td>
              <td className='py-3 px-4 text-sm text-gray-600'>{activity.ip}</td>
              <td className='py-3 px-4 text-sm text-gray-600'>
                {formatTime(activity.time)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
