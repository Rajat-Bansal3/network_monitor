import nmap
import json
import sys
import os
import time
from datetime import datetime
import logging
import socket
import concurrent.futures

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def validate_ip(targets):
    """Validate IP addresses or CIDR ranges"""
    for target in targets.split(','):
        if '/' in target:  
            base, mask = target.split('/')
            if not (0 <= int(mask) <= 32):
                raise ValueError(f"Invalid CIDR mask: {target}")
        else:  
            try:
                socket.inet_aton(target)
            except socket.error:
                raise ValueError(f"Invalid IP address: {target}")

def write_status(status_file, status_data):
    """Safely write status updates"""
    try:
        with open(status_file, "w") as f:
            json.dump(status_data, f, indent=2)
    except Exception as e:
        logger.error(f"Failed to write status: {str(e)}")

def check_cancellation(cancel_file, status_file, status_data):
    """Check for cancellation request"""
    if os.path.exists(cancel_file):
        status_data.update({
            "state": "cancelled",
            "message": "Scan cancelled by user",
            "end_time": datetime.now().isoformat()
        })
        write_status(status_file, status_data)
        logger.info("Scan cancelled by user")
        return True
    return False

def infer_device_type(os_guess, vendor, open_ports):
    """Infer device type based on scan results"""
    vendor_lower = vendor.lower() if vendor else ""
    os_lower = os_guess.lower() if os_guess else ""
    
    if any(x in vendor_lower for x in ["cisco", "juniper", "arista"]):
        return "Router"
    if "switch" in vendor_lower:
        return "Switch"
    if "firewall" in vendor_lower or "fortinet" in vendor_lower:
        return "Firewall"
    if any(x in os_lower for x in ["server", "windows server", "linux"]):
        return "Server"
    if any(x in os_lower for x in ["router", "ios", "nx-os"]):
        return "Router"
    if any(x in os_lower for x in ["switch", "catos"]):
        return "Switch"
    
    if open_ports:
        if 179 in open_ports:  # BGP
            return "Router"
        if 161 in open_ports:  # SNMP
            return "Switch"
        if 3389 in open_ports:  # RDP
            return "Workstation"
        if 80 in open_ports or 443 in open_ports:  # HTTP/HTTPS
            return "Server"
    
    return "Unknown"

def host_discovery(targets, nm, status_file, status_data, cancel_file):
    """Perform host discovery (ping sweep)"""
    logger.info(f"Starting host discovery for {targets}")
    status_data["message"] = "Performing host discovery..."
    write_status(status_file, status_data)
    
    nm.scan(hosts=targets, arguments='-sn --max-retries 1 --host-timeout 30s')
    discovered_hosts = nm.all_hosts()
    
    if check_cancellation(cancel_file, status_file, status_data):
        return None
    
    logger.info(f"Discovered {len(discovered_hosts)} hosts")
    return discovered_hosts

def scan_host(host, scan_args, status_data, cancel_file):
    """Scan a single host with specified arguments"""
    if check_cancellation(cancel_file, None, status_data):
        return None
    
    try:
        host_nm = nmap.PortScanner()
        host_nm.scan(hosts=host, arguments=scan_args)
        
        if host not in host_nm.all_hosts():
            return None
            
        host_info = host_nm[host]
        result = {
            "ipAddress": host,
            "status": "online" if host_info.state() == "up" else "offline",
            "macAddress": host_info["addresses"].get("mac", ""),
            "hostname": host_info.hostname() or "",
            "vendor": list(host_info["vendor"].values())[0] if host_info.get("vendor") else "",
            "openPorts": [],
            "osGuess": "",
            "deviceType": "Unknown"
        }
        
        for proto in host_info.all_protocols():
            if proto in ["tcp", "udp"]:
                for port, port_info in host_info[proto].items():
                    if port_info["state"] == "open":
                        result["openPorts"].append(port)
        
        if "osmatch" in host_info and host_info["osmatch"]:
            result["osGuess"] = host_info["osmatch"][0]["name"]
        
        result["deviceType"] = infer_device_type(
            result["osGuess"],
            result["vendor"],
            result["openPorts"]
        )
        
        return result
        
    except Exception as e:
        logger.error(f"Error scanning {host}: {str(e)}")
        return {
            "ipAddress": host,
            "status": "error",
            "error": str(e)
        }

def quick_scan(targets, nm, status_file, status_data, cancel_file):
    """Perform quick scan (host discovery only)"""
    discovered_hosts = host_discovery(targets, nm, status_file, status_data, cancel_file)
    if discovered_hosts is None:
        return []
    
    results = []
    for host in discovered_hosts:
        if check_cancellation(cancel_file, status_file, status_data):
            return []
        
        results.append({
            "ipAddress": host,
            "status": "online" if nm[host].state() == "up" else "offline",
            "macAddress": nm[host]["addresses"].get("mac", ""),
            "deviceType": "Unknown"
        })
    
    return results

def full_scan(targets, status_file, status_data, cancel_file):
    """Perform full scan with parallel processing"""
    nm = nmap.PortScanner()
    discovered_hosts = host_discovery(targets, nm, status_file, status_data, cancel_file)
    if not discovered_hosts:
        return []
    
    total_hosts = len(discovered_hosts)
    results = []
    completed = 0
    
    scan_args = '-A -sV --script=banner --top-ports 1000'
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=10) as executor:
        future_to_host = {
            executor.submit(
                scan_host, 
                host, 
                scan_args,
                status_data,
                cancel_file
            ): host for host in discovered_hosts
        }
        
        for future in concurrent.futures.as_completed(future_to_host):
            completed += 1
            progress = 30 + int((completed / total_hosts) * 65)
            status_data["progress"] = progress
            status_data["message"] = f"Scanned {completed}/{total_hosts} hosts"
            write_status(status_file, status_data)
            
            if check_cancellation(cancel_file, status_file, status_data):
                executor.shutdown(wait=False, cancel_futures=True)
                return []
                
            try:
                result = future.result()
                if result:
                    results.append(result)
            except Exception as e:
                logger.error(f"Scan error: {str(e)}")
    
    return results

def port_scan(targets, status_file, status_data, cancel_file):
    """Perform port scan only"""
    nm = nmap.PortScanner()
    discovered_hosts = host_discovery(targets, nm, status_file, status_data, cancel_file)
    if not discovered_hosts:
        return []
    
    results = []
    for i, host in enumerate(discovered_hosts):
        if check_cancellation(cancel_file, status_file, status_data):
            return []
        
        progress = 30 + int((i / len(discovered_hosts)) * 65)
        status_data["progress"] = progress
        status_data["message"] = f"Scanning ports on host {i+1}/{len(discovered_hosts)}"
        write_status(status_file, status_data)
        
        try:
            nm.scan(hosts=host, arguments='-T3 -F --top-ports 1000')
            if host not in nm.all_hosts():
                continue
                
            ports = []
            for proto in nm[host].all_protocols():
                if proto in ["tcp", "udp"]:
                    for port in nm[host][proto]:
                        if nm[host][proto][port]["state"] == "open":
                            ports.append(port)
            
            results.append({
                "ipAddress": host,
                "status": "online" if nm[host].state() == "up" else "offline",
                "openPorts": ports
            })
        except Exception as e:
            logger.error(f"Error scanning {host}: {str(e)}")
            results.append({
                "ipAddress": host,
                "status": "error",
                "error": str(e)
            })
    
    return results

def main():
    try:
        if len(sys.argv) < 4:
            raise ValueError("Usage: scanner.py <targets> <scan_type> <output_dir>")
        
        targets = sys.argv[1]
        scan_type = sys.argv[2]
        output_dir = sys.argv[3]
        
        valid_scans = ["quick", "full", "port", "os", "vulnerability"]
        if scan_type not in valid_scans:
            raise ValueError(f"Invalid scan type. Valid options: {', '.join(valid_scans)}")
        
        validate_ip(targets)
        
        os.makedirs(output_dir, exist_ok=True)
        
        status_file = os.path.join(output_dir, "status.json")
        results_file = os.path.join(output_dir, "results.json")
        cancel_file = os.path.join(output_dir, "cancel")
        
        status_data = {
            "state": "running",
            "progress": 0,
            "message": "Initializing scan...",
            "scan_type": scan_type,
            "targets": targets,
            "start_time": datetime.now().isoformat(),
            "end_time": None
        }
        write_status(status_file, status_data)
        
        nm = nmap.PortScanner()
        results = []
        
        if check_cancellation(cancel_file, status_file, status_data):
            return
        
        if scan_type == "quick":
            status_data["message"] = "Starting quick scan"
            write_status(status_file, status_data)
            results = quick_scan(targets, nm, status_file, status_data, cancel_file)
            status_data["progress"] = 100
            
        elif scan_type == "full":
            status_data["message"] = "Starting full scan"
            write_status(status_file, status_data)
            results = full_scan(targets, status_file, status_data, cancel_file)
            status_data["progress"] = 100
            
        elif scan_type == "port":
            status_data["message"] = "Starting port scan"
            write_status(status_file, status_data)
            results = port_scan(targets, status_file, status_data, cancel_file)
            status_data["progress"] = 100
        #WIP : todo
        elif scan_type == "os":
            status_data["message"] = "OS detection not implemented yet"
            status_data["progress"] = 100

        #WIP : todo
        elif scan_type == "vulnerability":
            status_data["message"] = "Vulnerability scan not implemented yet"
            status_data["progress"] = 100
        
        if status_data["state"] == "running":
            status_data.update({
                "state": "completed",
                "message": "Scan completed successfully",
                "end_time": datetime.now().isoformat(),
                "host_count": len(results)
            })
            write_status(status_file, status_data)
            
            with open(results_file, "w") as f:
                json.dump(results, f, indent=2)
                
            logger.info(f"Scan completed. Results for {len(results)} hosts saved")
    
    except Exception as e:
        logger.exception("Scan failed")
        error_status = {
            "state": "failed",
            "message": f"Scan failed: {str(e)}",
            "end_time": datetime.now().isoformat(),
            "progress": 0
        }
        if 'status_data' in locals():
            status_data.update(error_status)
            write_status(status_file, status_data)
        else:
            with open(status_file, "w") as f:
                json.dump(error_status, f)

if __name__ == "__main__":
    main()