/* eslint-disable @typescript-eslint/no-explicit-any */
// app/scan/page.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Scan, ScanResult } from "@/lib/types";
import {
  startNetworkScan,
  getScanStatus,
  getScanResults,
  cancelScan,
} from "@/actions/scan-actions";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  CircleSlash,
  Clock,
  Server,
  Wifi,
} from "lucide-react";

export default function ScanPage() {
  const router = useRouter();
  const [ipRange, setIpRange] = useState<string>("192.168.1.0/24");
  const [scanType, setScanType] = useState<string>("quick");
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scanResults, setScanResults] = useState<ScanResult[]>([]);
  const [currentScan, setCurrentScan] = useState<Scan | null>(null);
  const [scanHistory, setScanHistory] = useState<Scan[]>([]);
  const [activeTab, setActiveTab] = useState<"new" | "results" | "history">(
    "new"
  );

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch("/api/scans/history");
        if (response.ok) {
          const data = await response.json();
          setScanHistory(data);
        }
      } catch (error) {
        console.error("Failed to load scan history:", error);
      }
    };

    loadHistory();
  }, []);

  // Handle scan progress updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;

    if (isScanning && currentScan) {
      intervalId = setInterval(async () => {
        try {
          const status = await getScanStatus(currentScan.id);
          setScanProgress(status.progress);
          setScanStatus(status.message);

          if (status.progress === 100 || status.state === "completed") {
            setIsScanning(false);
            if (intervalId) clearInterval(intervalId);

            // Get final results
            const results = await getScanResults(currentScan.id);
            setScanResults(results);
            setActiveTab("results");
            toast.success("Scan completed successfully", {
              description: `Found ${results.length} devices`,
            });

            // Update history
            const historyResponse = await fetch("/api/scans/history");
            if (historyResponse.ok) {
              const data = await historyResponse.json();
              setScanHistory(data);
            }
          }

          if (status.state === "failed") {
            setIsScanning(false);
            if (intervalId) clearInterval(intervalId);
            toast.error("Scan failed", {
              description:
                status.message || "An error occurred during scanning",
            });
          }
        } catch (error) {
          console.error("Error checking scan status:", error);
        }
      }, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isScanning, currentScan]);

  const handleStartScan = async () => {
    if (isScanning) return;

    try {
      setIsScanning(true);
      setScanProgress(0);
      setScanStatus("Initializing scan...");
      setScanResults([]);
      setActiveTab("results");

      const newScan = await startNetworkScan({
        targets: ipRange,
        scanType,
      });

      setCurrentScan(newScan);
      toast.info("Scan started", {
        description: "Network scan is now in progress",
      });
    } catch (error) {
      setIsScanning(false);
      toast.error("Failed to start scan", {
        description:
          (error as Error).message || "Please check your network settings",
      });
    }
  };

  const handleCancelScan = async () => {
    if (!currentScan) return;

    try {
      await cancelScan(currentScan.id);
      setIsScanning(false);
      setScanProgress(0);
      setScanStatus("Scan cancelled");
      toast.warning("Scan cancelled", {
        description: "The network scan was stopped",
      });
    } catch (error) {
      toast.error("Failed to cancel scan", {
        description: (error as Error).message || "Please try again",
      });
    }
  };

  const handleViewScanDetails = (scanId: string) => {
    router.push(`/scan/${scanId}`);
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "router":
        return <Wifi className='h-5 w-5 text-blue-500' />;
      case "switch":
        return <Server className='h-5 w-5 text-green-500' />;
      case "server":
        return <Activity className='h-5 w-5 text-purple-500' />;
      default:
        return <Server className='h-5 w-5 text-gray-500' />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "online":
        return <Badge variant='default'>Online</Badge>;
      case "offline":
        return <Badge variant='destructive'>Offline</Badge>;
      default:
        return <Badge variant='secondary'>Unknown</Badge>;
    }
  };

  return (
    <div className='p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h1 className='text-2xl font-bold'>Network Scanner</h1>
        <div className='flex items-center space-x-2'>
          <Button variant='outline' onClick={() => router.push("/devices")}>
            View All Devices
          </Button>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v: any) => setActiveTab(v)}
        className='w-full'
      >
        <TabsList className='grid w-full grid-cols-3'>
          <TabsTrigger value='new'>New Scan</TabsTrigger>
          <TabsTrigger value='results' disabled={!scanResults.length}>
            Scan Results
          </TabsTrigger>
          <TabsTrigger value='history'>Scan History</TabsTrigger>
        </TabsList>

        <TabsContent value='new'>
          <Card>
            <CardHeader>
              <CardTitle>Configure Network Scan</CardTitle>
              <CardDescription>
                Scan your network to discover devices and services
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                <div>
                  <Label htmlFor='ip-range'>IP Range / Subnet</Label>
                  <Input
                    id='ip-range'
                    value={ipRange}
                    onChange={(e: any) => setIpRange(e.target.value)}
                    placeholder='e.g., 192.168.1.0/24 or 10.0.0.1-100'
                  />
                  <p className='text-sm text-gray-500 mt-2'>
                    Enter CIDR notation or IP range to scan
                  </p>
                </div>

                <div>
                  <Label htmlFor='scan-type'>Scan Type</Label>
                  <div className='flex space-x-4'>
                    <Button
                      variant={scanType === "quick" ? "default" : "outline"}
                      onClick={() => setScanType("quick")}
                      className='flex-1'
                    >
                      Quick Scan
                    </Button>
                    <Button
                      variant={scanType === "full" ? "default" : "outline"}
                      onClick={() => setScanType("full")}
                      className='flex-1'
                    >
                      Full Scan
                    </Button>
                  </div>
                  <p className='text-sm text-gray-500 mt-2'>
                    {scanType === "quick"
                      ? "Ping sweep to identify active devices"
                      : "Comprehensive scan including port and service detection"}
                  </p>
                </div>
              </div>

              <div className='pt-4'>
                <Button
                  onClick={handleStartScan}
                  disabled={isScanning}
                  className='w-full md:w-auto'
                >
                  {isScanning ? (
                    <>
                      <svg
                        className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                        xmlns='http://www.w3.org/2000/svg'
                        fill='none'
                        viewBox='0 0 24 24'
                      >
                        <circle
                          className='opacity-25'
                          cx='12'
                          cy='12'
                          r='10'
                          stroke='currentColor'
                          strokeWidth='4'
                        ></circle>
                        <path
                          className='opacity-75'
                          fill='currentColor'
                          d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                        ></path>
                      </svg>
                      Scanning...
                    </>
                  ) : (
                    "Start Network Scan"
                  )}
                </Button>

                {isScanning && (
                  <div className='mt-4'>
                    <div className='flex justify-between mb-1'>
                      <span className='text-sm font-medium'>Scan Progress</span>
                      <span className='text-sm font-medium'>
                        {scanProgress}%
                      </span>
                    </div>
                    <Progress value={scanProgress} />
                    <div className='mt-2 text-sm text-gray-600 flex items-center'>
                      <Clock className='h-4 w-4 mr-2' />
                      {scanStatus}
                    </div>
                    <div className='mt-4'>
                      <Button variant='destructive' onClick={handleCancelScan}>
                        <CircleSlash className='h-4 w-4 mr-2' />
                        Cancel Scan
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className='mt-6 grid grid-cols-1 md:grid-cols-3 gap-6'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Quick Scan
                </CardTitle>
                <Wifi className='h-4 w-4 text-blue-500' />
              </CardHeader>
              <CardContent>
                <div className='text-xl font-bold'>Ping Sweep</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Fast discovery of active devices
                </p>
                <ul className='mt-3 text-sm space-y-1'>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Identifies online hosts
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Low network impact
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Typically under 1 minute
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>Full Scan</CardTitle>
                <Server className='h-4 w-4 text-purple-500' />
              </CardHeader>
              <CardContent>
                <div className='text-xl font-bold'>Comprehensive</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Detailed device analysis
                </p>
                <ul className='mt-3 text-sm space-y-1'>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Port scanning
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Service detection
                  </li>
                  <li className='flex items-center'>
                    <CheckCircle2 className='h-4 w-4 text-green-500 mr-2' />
                    Device fingerprinting
                  </li>
                  <li className='flex items-center'>
                    <AlertCircle className='h-4 w-4 text-yellow-500 mr-2' />
                    Can take several minutes
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  Best Practices
                </CardTitle>
                <AlertCircle className='h-4 w-4 text-yellow-500' />
              </CardHeader>
              <CardContent>
                <div className='text-xl font-bold'>Scan Safely</div>
                <p className='text-xs text-muted-foreground mt-1'>
                  Follow network scanning guidelines
                </p>
                <ul className='mt-3 text-sm space-y-1'>
                  <li className='flex items-start'>
                    <AlertCircle className='h-4 w-4 text-yellow-500 mr-2 mt-0.5' />
                    Scan only networks you own or have permission to scan
                  </li>
                  <li className='flex items-start'>
                    <AlertCircle className='h-4 w-4 text-yellow-500 mr-2 mt-0.5' />
                    Avoid scanning during business hours
                  </li>
                  <li className='flex items-start'>
                    <AlertCircle className='h-4 w-4 text-yellow-500 mr-2 mt-0.5' />
                    Full scans may trigger security alerts
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value='results'>
          <Card>
            <CardHeader>
              <CardTitle>Scan Results</CardTitle>
              <CardDescription>
                {scanResults.length > 0
                  ? `Found ${scanResults.length} devices in the network`
                  : "No scan results available. Run a scan to discover devices."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanResults.length > 0 ? (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Device</TableHead>
                        <TableHead>IP Address</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>MAC Address</TableHead>
                        <TableHead>Open Ports</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanResults.map((result) => (
                        <TableRow key={result.ipAddress}>
                          <TableCell className='font-medium flex items-center'>
                            {getDeviceIcon(result.deviceType)}
                            <span className='ml-2'>
                              {result.hostname || "Unknown"}
                            </span>
                          </TableCell>
                          <TableCell>{result.ipAddress}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>{result.deviceType}</Badge>
                          </TableCell>
                          <TableCell>{getStatusBadge(result.status)}</TableCell>
                          <TableCell>{result.macAddress || "N/A"}</TableCell>
                          <TableCell>
                            {result.openPorts && result.openPorts.length > 0
                              ? `${result.openPorts.length} ports`
                              : "None"}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() =>
                                router.push(
                                  `/devices/new?ip=${result.ipAddress}`
                                )
                              }
                            >
                              Add to Inventory
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12'>
                  <Wifi className='h-16 w-16 text-gray-300 mb-4' />
                  <h3 className='text-xl font-semibold mb-2'>
                    No Scan Results
                  </h3>
                  <p className='text-gray-500 mb-4 text-center'>
                    Run a network scan to discover devices in your network
                  </p>
                  <Button onClick={() => setActiveTab("new")}>
                    Start a Scan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='history'>
          <Card>
            <CardHeader>
              <CardTitle>Scan History</CardTitle>
              <CardDescription>
                {scanHistory.length > 0
                  ? `View past network scans`
                  : "No scan history available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scanHistory.length > 0 ? (
                <div className='rounded-md border'>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Scan ID</TableHead>
                        <TableHead>Targets</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Devices Found</TableHead>
                        <TableHead>Duration</TableHead>
                        <TableHead className='text-right'>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {scanHistory.map((scan) => (
                        <TableRow key={scan.id}>
                          <TableCell className='font-medium'>
                            {scan.id.slice(0, 8)}...
                          </TableCell>
                          <TableCell>{scan.targets}</TableCell>
                          <TableCell>
                            <Badge variant='outline'>
                              {scan.scanType === "quick" ? "Quick" : "Full"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                scan.status === "completed"
                                  ? "default"
                                  : scan.status === "failed"
                                    ? "destructive"
                                    : "secondary"
                              }
                            >
                              {scan.status}
                            </Badge>
                          </TableCell>
                          <TableCell>{scan.devicesFound || 0}</TableCell>
                          <TableCell>
                            {scan.duration ? `${scan.duration} sec` : "N/A"}
                          </TableCell>
                          <TableCell className='text-right'>
                            <Button
                              variant='outline'
                              size='sm'
                              onClick={() => handleViewScanDetails(scan.id)}
                            >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className='flex flex-col items-center justify-center py-12'>
                  <Clock className='h-16 w-16 text-gray-300 mb-4' />
                  <h3 className='text-xl font-semibold mb-2'>
                    No Scan History
                  </h3>
                  <p className='text-gray-500 mb-4 text-center'>
                    Run a network scan to start tracking scan history
                  </p>
                  <Button onClick={() => setActiveTab("new")}>
                    Start a Scan
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
