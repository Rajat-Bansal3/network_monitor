#!/bin/bash

scan_network() {
    interfaces=$(ip -o link show | awk -F': ' '{print $2}' | grep -v "lo")
    echo "{"
    echo "  \"timestamp\": \"$(date -u +"%Y-%m-%dT%H:%M:%SZ")\","
    echo "  \"hostname\": \"$(hostname)\","
    echo "  \"interfaces\": ["

    first_interface=true
    for intf in $interfaces; do
        [[ $intf == docker* ]] && continue
        [[ $intf == br-* ]] && continue
        [[ $intf == veth* ]] && continue
        
        mac=$(ip link show "$intf" | awk '/link\/ether/ {print $2}')
        status=$(ip link show "$intf" | awk '/state/ {print $9}')
        mtu=$(ip link show "$intf" | awk '/mtu/ {print $5}')
        ipv4_cidrs=($(ip -4 addr show "$intf" | awk '/inet/ {print $2}'))
        ipv6_addrs=($(ip -6 addr show "$intf" | awk '/inet6/ {print $2}' | cut -d'/' -f1))
        gateway=$(ip route | awk '/default/ {print $3; exit}')

        ipv4_addresses=()
        ipv4_subnets=()
        for cidr in "${ipv4_cidrs[@]}"; do
            ipv4_addresses+=("$(echo "$cidr" | cut -d'/' -f1)")
            ipv4_subnets+=("$(echo "$cidr" | cut -d'/' -f2)")
        done

        network_devices=()
        if [ "$status" = "UP" ] && [ ${#ipv4_cidrs[@]} -gt 0 ]; then
            for cidr in "${ipv4_cidrs[@]}"; do
                while IFS= read -r device; do
                    [[ -z "$device" ]] && continue
                    network_devices+=("$device")
                done < <(arp-scan --interface "$intf" --localnet --quiet --ignoredups | awk 'NR>2 && /^[0-9]/ {print $1}')
            done
        fi

        if [ "$first_interface" = false ]; then
            echo ","
        fi
        
        echo "    {"
        echo "      \"name\": \"$intf\","
        echo "      \"mac_address\": \"$mac\","
        echo "      \"status\": \"$status\","
        echo "      \"mtu\": \"$mtu\","
        echo "      \"ipv4_addresses\": [$(printf '\"%s\",' "${ipv4_addresses[@]}" | sed 's/,$//')],"
        echo "      \"ipv4_subnets\": [$(printf '\"%s\",' "${ipv4_subnets[@]}" | sed 's/,$//')],"
        echo "      \"ipv6_addresses\": [$(printf '\"%s\",' "${ipv6_addrs[@]}" | sed 's/,$//')],"
        echo "      \"default_gateway\": \"$gateway\","
        echo "      \"network_devices\": [$(printf '\"%s\",' "${network_devices[@]}" | sed 's/,$//')]"
        echo -n "    }"
        
        first_interface=false
    done
  
    echo ""
    echo "  ]"
    echo "}"
}

if ! command -v arp-scan &> /dev/null; then
    echo "Installing arp-scan (required for device discovery)..." >&2
    sudo apt-get update > /dev/null
    sudo apt-get install -y arp-scan > /dev/null
fi

scan_network