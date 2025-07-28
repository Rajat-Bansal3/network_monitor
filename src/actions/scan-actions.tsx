"use server";
import { exec } from "child_process";
import { promisify } from "util";
import { client } from "@/lib/prisma";
import { v4 as uuidv4 } from "uuid";
import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";

const execAsync = promisify(exec);

const SCANS_DIR = path.join(process.cwd(), "scans");
if (!fs.existsSync(SCANS_DIR)) {
  fs.mkdirSync(SCANS_DIR, { recursive: true });
}

export const startNetworkScan = async (params: {
  targets: string;
  scanType: "quick" | "full";
}): Promise<{ scanId: string }> => {
  const scanId = uuidv4();
  const scanDir = path.join(SCANS_DIR, scanId);

  // Create scan directory
  fs.mkdirSync(scanDir, { recursive: true });

  await client.scan.create({
    data: {
      id: scanId,
      targets: params.targets,
      scanType: params.scanType,
      status: "running",
      progress: 0,
      statusMessage: "Initializing scan...",
      startedAt: new Date(),
    },
  });

  // Start scan in background
  const command = `python3 ${path.join(process.cwd(), "scripts", "scanner.py")} ${params.targets} ${params.scanType} ${scanDir}`;
  exec(command, (error) => {
    if (error) {
      console.error(`Scan ${scanId} failed to start:`, error);
      prisma.scan.update({
        where: { id: scanId },
        data: {
          status: "failed",
          statusMessage: `Failed to start: ${error.message}`,
          completedAt: new Date(),
        },
      });
    }
  });

  return { scanId };
};

export const getScanStatus = async () => {};
export const getScanResults = async () => {};
export const cancelScan = async () => {};
export const getScanHistory = async () => {};
