import z from "zod";
export const authCreds = z.object({
  email: z.string().email(),
  password: z
    .string()
    .min(8, { message: "password must of atleast 8 chars long" })
    .max(64, { message: "passowrd cant be longer than 64 chars" }),
});
export const ScanSchema = z.object({
  id: z.string(),
  targets: z.string(),
  scanType: z.string(),
  status: z.enum(["pending", "running", "completed", "failed", "cancelled"]),
  statusMessage: z.string().optional(),
  progress: z.number().min(0).max(100).optional(),
  startedAt: z.coerce.date().optional(),
  completedAt: z.coerce.date().optional(),
  devicesFound: z.number().int().optional(),
  duration: z.number().optional(),
});
export const ScanResultSchema = z.object({
  ipAddress: z.string().ip(),
  hostname: z.string().optional(),
  macAddress: z.string().optional(),
  deviceType: z.string(),
  status: z.enum(["online", "offline", "unknown"]),
  openPorts: z.array(z.number().int()).optional(),
  osGuess: z.string().optional(),
  vendor: z.string().optional(),
});
export type Scan = z.infer<typeof ScanSchema>;
export type ScanResult = z.infer<typeof ScanResultSchema>;
export type AUTH = z.infer<typeof authCreds>;
