#!/bin/bash

scan_netwrok() {

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

    mac=$(ip link show $intf | awk '/link\/ether/ {print $2}')
    status=$(ip link show $intf | awk '/state/ {print $9}')
    mtu=$(ip link show $intf | awk '/mtu/ {print $5}')

    cidr=($(ip -4 addr show $intf | awk '/inet/ {print$2}'))
    ipv4=($(echo $cidr | cut -d'/' -f1))
    ipv6=($(ip -6 addr show $intf | awk '/inet6/ {print$2}' | cut -d'/' -f1))
    subnet=($(echo $cidr | cut -d'/' -f2))

    gateway=($(ip route | awk '/default/ {print$3;exit}'))

    network_devices=""
    if [ ${#ipv4[@]} -gt 0 ]; then
      network_devices=$(nmap -sn $cidr -oG - | awk '/Host:/ {print$2}' | grep -v $ipv4)

    fi
   if [ "$first_interface" = false ]; then
      echo ","
    fi
    
    echo "    {"
    echo "      \"name\": \"$intf\","
    echo "      \"mac_address\": \"$mac\","
    echo "      \"status\": \"$status\","
    echo "      \"mtu\": \"$mtu\","
    echo "      \"ipv4_addresses\": [$(printf '\"%s\",' "${ipv4[@]}" | sed 's/,$//')],"
    echo "      \"ipv6_addresses\": [$(printf '\"%s\",' "${ipv6[@]}" | sed 's/,$//')],"
    echo "      \"default_gateway\": \"$gateway\","
    echo "      \"network_devices\": [$(printf '\"%s\",' ${network_devices[@]} | sed 's/,$//')]"
    echo -n "    }"
    
    first_interface=false
  done
  
  echo ""
  echo "  ]"
  echo "}"


}
scan_netwrok