"use server";

import { client } from "@/lib/prisma";

export const getDashboardStats = async () => {
  // Device stats
  const totalDevices = await client.device.count();
  const onlineDevices = await client.device.count({
    where: { status: "Online" },
  });
  const offlineDevices = await client.device.count({
    where: { status: "Offline" },
  });

  // Alert stats
  const activeAlerts = await client.alert.count({
    where: { status: "Active" },
  });
  const criticalAlerts = await client.alert.count({
    where: {
      status: "Active",
      severity: "Critical",
    },
  });

  // System stats (mock values - in real app these would come from system monitoring)
  const cpuUsage = 28;
  const memoryUsage = 64;

  // User stats
  const activeUsers = await client.user.count();
  const deviceStatusData = [
    { type: "Router", online: 12, offline: 2 },
    { type: "Switch", online: 24, offline: 3 },
    { type: "Node", online: 142, offline: 18 },
    { type: "Server", online: 8, offline: 0 },
  ];

  // Recent alerts
  const recentAlerts = await client.alert.findMany({
    where: { status: "Active" },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { device: true },
  });

  return {
    totalDevices,
    onlineDevices,
    offlineDevices,
    activeAlerts,
    criticalAlerts,
    cpuUsage,
    memoryUsage,
    activeUsers,
    deviceStatusData,
    recentAlerts: recentAlerts.map((a) => ({
      id: a.id,
      title: a.title,
      device: a.device?.name || a.device?.ipAddress || "Unknown",
      severity: a.severity,
      time: a.createdAt.toISOString(),
    })),
  };
};
