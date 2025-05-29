#!/bin/bash
# TRUE NORTH INSIGHTS: Craft Fusion System Monitor
# This script monitors system health, memory, CPU, network, and OSCAL/FedRAMP compliance. No system or npm clean scripts are called.

# Color codes for output formatting
BOLD='\033[1m'
NC='\033[0m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'

# Display header
clear
printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════════════════════╗\n"
printf "║        🖥️  TRUE NORTH INSIGHTS: CRAFT FUSION SYSTEM MONITOR v2.1         ║\n"
printf "║                by True North Insights  |  LIVE UPDATING                   ║\n"
printf "╚══════════════════════════════════════════════════════════════════════════════╝${NC}\n"

# Network monitoring state
LAST_RX_BYTES=0
LAST_TX_BYTES=0
LAST_CHECK_TIME=0

# Progress bar characters
PROGRESS_CHAR="█"
EMPTY_CHAR="░"

# Get the main network interface name
get_network_interface() {
    ip route | grep default | awk '{print $5}' | head -1
}

# Get RX/TX bytes for a network interface
get_network_stats() {
    local interface=$1
    if [ -f "/sys/class/net/$interface/statistics/rx_bytes" ]; then
        local rx_bytes=$(cat /sys/class/net/$interface/statistics/rx_bytes)
        local tx_bytes=$(cat /sys/class/net/$interface/statistics/tx_bytes)
        echo "$rx_bytes $tx_bytes"
    else
        echo "0 0"
    fi
}

# Format bytes as human-readable string
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$((bytes/1024))KB"
    elif [ $bytes -lt 1073741824 ]; then
        echo "$((bytes/1048576))MB"
    else
        echo "$((bytes/1073741824))GB"
    fi
}

# Check network connectivity and latency
check_network_connectivity() {
    local endpoints=("8.8.8.8" "1.1.1.1" "github.com")
    local success=0
    local latency_sum=0
    for endpoint in "${endpoints[@]}"; do
        if ping -c 1 -W 2 "$endpoint" >/dev/null 2>&1; then
            local latency=$(ping -c 1 -W 2 "$endpoint" 2>/dev/null | grep 'time=' | sed 's/.*time=\([0-9.]*\).*/\1/')
            if [ -n "$latency" ]; then
                latency_sum=$(echo "$latency_sum + $latency" | bc 2>/dev/null || echo "$latency_sum")
                success=$((success + 1))
            fi
        fi
    done
    echo "$success $latency_sum"
}

# Check health endpoints for backend APIs
check_deployment_endpoints() {
    local endpoints=("localhost:3000" "localhost:4000")
    local api_status=""
    for endpoint in "${endpoints[@]}"; do
        if curl -s --max-time 2 "http://$endpoint/health" >/dev/null 2>&1 || \
           curl -s --max-time 2 "http://$endpoint" >/dev/null 2>&1; then
            if [[ "$endpoint" == *":3000"* ]]; then
                api_status="${api_status}${GREEN}NestJS✓${NC} "
            else
                api_status="${api_status}${GREEN}Go✓${NC} "
            fi
        else
            if [[ "$endpoint" == *":3000"* ]]; then
                api_status="${api_status}${RED}NestJS✗${NC} "
            else
                api_status="${api_status}${RED}Go✗${NC} "
            fi
        fi
    done
    echo "$api_status"
}

# Print a memory usage bar
print_memory_bar() {
    local used=$1
    local total=$2
    local percent=$((used * 100 / total))
    local filled=$((used * 30 / total))
    local empty=$((30 - filled))
    if [ $percent -lt 60 ]; then
        color=$GREEN
    elif [ $percent -lt 80 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${YELLOW}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

# Print a CPU usage bar
print_cpu_bar() {
    local percent=$1
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    if [ $percent -lt 50 ]; then
        color=$GREEN
    elif [ $percent -lt 80 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${BLUE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

# Print a disk usage bar
print_disk_bar() {
    local used=$1
    local total=$2
    local percent=$((used * 100 / total))
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    if [ $percent -lt 70 ]; then
        color=$GREEN
    elif [ $percent -lt 90 ]; then
        color=$YELLOW
    else
        color=$RED
    fi
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${PURPLE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

# Print a network speed bar
print_network_bar() {
    local speed=$1
    local max_speed=$2
    local percent=0
    if [ $max_speed -gt 0 ]; then
        percent=$((speed * 100 / max_speed))
        if [ $percent -gt 100 ]; then
            percent=100
        fi
    fi
    local filled=$((percent * 30 / 100))
    local empty=$((30 - filled))
    if [ $percent -lt 30 ]; then
        color=$WHITE
    elif [ $percent -lt 70 ]; then
        color=$CYAN
    else
        color=$GREEN
    fi
    printf "${color}"
    for ((i=0; i<filled; i++)); do printf "${PROGRESS_CHAR}"; done
    printf "${NC}${WHITE}"
    for ((i=0; i<empty; i++)); do printf "${EMPTY_CHAR}"; done
    printf "${NC} ${BOLD}%d%%${NC}" "$percent"
}

# Cursor control utilities
hide_cursor() { printf "\033[?25l"; }
show_cursor() { printf "\033[?25h"; }
move_cursor_home() { printf "\033[H"; }
clear_to_end() { printf "\033[J"; }

# Initialize the monitor screen
init_screen() {
    clear
    hide_cursor
    START_TIME=$(date +%s)
    echo -e "${BOLD}${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}${CYAN}║              🖥️  SYSTEM MONITOR v2.1                        ║${NC}"
    echo -e "${BOLD}${CYAN}║                   LIVE UPDATING                             ║${NC}"
    echo -e "${BOLD}${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo
}

# Check server status for a given process and port
check_server_status() {
    local name=$1
    local port=$2
    local process_pattern=$3
    local status=""
    local color=""
    local health_url="http://localhost:$port/health"
    local pid=$(pgrep -f "$process_pattern" | head -1)
    local health_resp=""
    if [ -n "$pid" ]; then
        health_resp=$(curl -s --max-time 2 "$health_url")
        if [ $? -eq 0 ] && [ -n "$health_resp" ]; then
            status="UP"
            color=$GREEN
        else
            status="RESTARTING"
            color=$YELLOW
        fi
    else
        status="DOWN"
        color=$RED
    fi
    printf "   %s: %b%s%b\n" "$name" "$color" "$status" "$NC"
}

# OSCAL/SCAP scan check (FedRAMP compliance)
OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"

# Dynamically load profiles from oscal-profiles.json if jq is available
if command -v jq &>/dev/null && [ -f "$OSCAL_DIR/../oscal-profiles.json" ]; then
  mapfile -t OSCAL_PROFILES < <(jq -r '.profiles[].name' "$OSCAL_DIR/../oscal-profiles.json")
else
  OSCAL_PROFILES=("standard" "ospp" "pci-dss" "cusp" "medium-high" "rev5" "truenorth")
fi
OSCAL_MAX_AGE_DAYS=7

# Vibrant OSCAL scan status header
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')
BOLD="\033[1m"; CYAN="\033[0;36m"; NC="\033[0m"; WHITE="\033[1;37m"; GREEN="\033[0;32m"; YELLOW="\033[1;33m"; RED="\033[0;31m"; MAGENTA="\033[0;35m"; BLUE="\033[0;34m"

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  OSCAL/FedRAMP Compliance Scan Status      ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
echo

# Show available OSCAL scan profiles in two columns (available vs pending)
available_profiles=()
pending_profiles=()
for profile in "${OSCAL_PROFILES[@]}"; do
  if [ -f "$OSCAL_DIR/user-readable-results-$profile.xml" ] || [ -f "$OSCAL_DIR/oscap-results-$profile.xml" ]; then
    available_profiles+=("$profile")
  else
    pending_profiles+=("$profile")
  fi
  # Mark truenorth as available if its report exists
  if [ "$profile" = "truenorth" ] && [ -f "$OSCAL_DIR/oscap-report-truenorth.html" ]; then
    if [[ ! " ${available_profiles[*]} " =~ " truenorth " ]]; then
      available_profiles+=("truenorth")
      pending_profiles=("${pending_profiles[@]/truenorth}")
    fi
  fi
done

# Print two-column table for scan profiles
printf "${BOLD}${CYAN}Scan Profiles:${NC}\n"
max_len=${#available_profiles[@]}
[ ${#pending_profiles[@]} -gt $max_len ] && max_len=${#pending_profiles[@]}
printf "${WHITE}%-20s %-20s${NC}\n" "Available" "Pending"
for ((i=0; i<$max_len; i++)); do
  a="${available_profiles[$i]}"; p="${pending_profiles[$i]}"
  printf "${GREEN}%-20s${NC} ${YELLOW}%-20s${NC}\n" "$a" "$p"
done

# Show status for each profile
missing_profiles=()
for profile in "${OSCAL_PROFILES[@]}"; do
  OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results-$profile.xml"
  OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report-$profile.html"
  USER_RESULT_FILE="$OSCAL_DIR/user-readable-results-$profile.xml"
  USER_REPORT_FILE="$OSCAL_DIR/user-readable-report-$profile.html"
  # Check for user-readable files first, then admin files
  if [ -f "$USER_RESULT_FILE" ]; then
    OSCAL_RESULT_FILE="$USER_RESULT_FILE"
    OSCAL_REPORT_FILE="$USER_REPORT_FILE"
  elif [ "$profile" = "standard" ]; then
    # Also check for legacy report names for standard
    if [ -f "$OSCAL_DIR/user-readable-results.xml" ]; then
      OSCAL_RESULT_FILE="$OSCAL_DIR/user-readable-results.xml"
      OSCAL_REPORT_FILE="$OSCAL_DIR/user-readable-report.html"
    elif [ -f "$OSCAL_DIR/oscap-results.xml" ]; then
      OSCAL_RESULT_FILE="$OSCAL_DIR/oscap-results.xml"
      OSCAL_REPORT_FILE="$OSCAL_DIR/oscap-report.html"
    fi
  fi
  if [ -f "$OSCAL_RESULT_FILE" ]; then
    LAST_RUN=$(stat -c %Y "$OSCAL_RESULT_FILE")
    NOW_TS=$(date +%s)
    AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
    printf "   ${GREEN}✓ %s scan found (%d days ago)${NC}\n" "$profile" "$AGE_DAYS"
    printf "   Report: ${CYAN}%s${NC}\n" "$OSCAL_REPORT_FILE"
    printf "   Server date/time: ${WHITE}%s${NC}\n" "$(date)"
    # Show pass/fail/total summary if xmllint is available
    if command -v xmllint &>/dev/null; then
      # Use more robust XPath and add notapplicable
      TOTAL_XPATH="count(//rule-result)"
      PASS_XPATH="count(//rule-result[result='pass'])"
      FAIL_XPATH="count(//rule-result[result='fail'])"
      NOTAPPLICABLE_XPATH="count(//rule-result[result='notapplicable'])"
      TOTAL=$(xmllint --xpath "$TOTAL_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      PASS=$(xmllint --xpath "$PASS_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      FAIL=$(xmllint --xpath "$FAIL_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)
      NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH" "$OSCAL_RESULT_FILE" 2>/dev/null)

      PASS=${PASS:-0}
      FAIL=${FAIL:-0}
      TOTAL=${TOTAL:-0}
      NOTAPPLICABLE=${NOTAPPLICABLE:-0}
      if [[ "$PASS" =~ ^[0-9]+$ ]] && [[ "$FAIL" =~ ^[0-9]+$ ]] && [[ "$TOTAL" =~ ^[0-9]+$ ]] && [[ "$NOTAPPLICABLE" =~ ^[0-9]+$ ]]; then
        printf "   ${GREEN}Pass: %s${NC}  ${RED}Fail: %s${NC}  ${YELLOW}N/A: %s${NC}  ${WHITE}Total: %s${NC}\n" "$PASS" "$FAIL" "$NOTAPPLICABLE" "$TOTAL"
      fi
    fi
  else
    printf "   ${RED}✗ No OpenSCAP scan results found for %s${NC}\n" "$profile"
    missing_profiles+=("$profile")
  fi
done

# Only show available options if any are missing
if [ ${#missing_profiles[@]} -gt 0 ]; then
  printf "${BOLD}${CYAN}Actionable OSCAL Scans (missing from monitor):${NC} ${YELLOW}%s${NC}\n" "${missing_profiles[*]}"
fi

# Vibrant environment summary and time estimate for memory monitoring
CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')

bar() {
  local label="$1"; local value="$2"; local max="$3"; local color="$4"
  local n=$((value > max ? max : value))
  printf "${color}%-18s [" "$label"
  for ((i=0;i<n;i++)); do printf "█"; done
  for ((i=n;i<max;i++)); do printf "·"; done
  printf "]${NC} %s\n" "$value"
}

MONITOR_EST=1
if [ "$CPU_CORES" -le 1 ]; then MONITOR_EST=2; fi
if [ "$MEM_TOTAL_MB" -lt 1500 ]; then MONITOR_EST=$((MONITOR_EST+1)); fi

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🧠 Memory Monitor Environment                 ║\n"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
bar "Monitoring" $MONITOR_EST 10 "$GREEN"
echo -e "${BOLD}${WHITE}Estimated Time: Continuous${NC}\n"

init_screen
START_TIME=$(date +%s)

# Helper: Find latest OSCAL result/report file for a profile
find_latest_oscal_file() {
    local base_dir="$1"
    local profile="$2"
    local type="$3" # 'xml' or 'html'
    local user_pattern="$base_dir/user-readable-results-$profile*.${type}"
    local admin_pattern="$base_dir/oscap-results-$profile*.${type}"
    local user_files=( $user_pattern )
    local admin_files=( $admin_pattern )
    local latest_file=""
    if compgen -G "$user_pattern" > /dev/null; then
        latest_file=$(ls -1t $user_pattern 2>/dev/null | head -1)
    elif compgen -G "$admin_pattern" > /dev/null; then
        latest_file=$(ls -1t $admin_pattern 2>/dev/null | head -1)
    fi
    echo "$latest_file"
}

while true; do
    # Clear the screen before redraw
    clear

    # Initialize network speed variables to avoid unbound variable errors
    rx_speed=0
    tx_speed=0
    
    move_cursor_home
    clear_to_end
    now_time=$(date '+%H:%M:%S')
    current_time=$(date +%s)
    elapsed=$((current_time - START_TIME))
    elapsed_h=$((elapsed / 3600))
    elapsed_m=$(((elapsed % 3600) / 60))
    elapsed_s=$((elapsed % 60))
    elapsed_fmt=$(printf "%02d:%02d:%02d" $elapsed_h $elapsed_m $elapsed_s)

    # Vibrant color cycling for time and elapsed (alternates CYAN, GREEN, PURPLE)
    color_cycle=($CYAN $GREEN $PURPLE)
    color_idx=$(( (current_time / 2) % 3 ))
    time_color=${color_cycle[$color_idx]}
    elapsed_color=${color_cycle[$(( (color_idx+1)%3 ))]}

    # Elapsed time progress bar (30 chars, fills as time passes in the hour)
    elapsed_percent=$(( (elapsed % 3600) * 100 / 3600 ))
    elapsed_bar_filled=$((elapsed_percent * 30 / 100))
    elapsed_bar_empty=$((30 - elapsed_bar_filled))
    elapsed_bar=""
    for ((i=0; i<elapsed_bar_filled; i++)); do elapsed_bar+="${GREEN}━${NC}"; done
    for ((i=0; i<elapsed_bar_empty; i++)); do elapsed_bar+="${CYAN}─${NC}"; done

    # Print legendary header (no box)
    echo -e "${BOLD}${CYAN}🖥️  TRUE NORTH INSIGHTS: CRAFT FUSION SYSTEM MONITOR${NC}"
    echo -e "${WHITE}${BOLD}by True North Insights${NC}"
    printf "${BOLD}${time_color}⏰ %s${NC}    ${BOLD}${elapsed_color}⏳ Elapsed: %s${NC}\n" "$now_time" "$elapsed_fmt"
    echo -e "$elapsed_bar"
    echo -e "${PURPLE}${BOLD}LIVE UPDATING • LEGENDARY MODE${NC}"
    echo
    
    # Print timestamp at top (human readable, with timezone)
    local_tz=$(date +"%Z")
    local_time=$(date '+%Y-%m-%d %H:%M:%S')
    utc_time=$(TZ=UTC date '+%Y-%m-%d %H:%M:%S UTC')
    echo -e "${BOLD}${CYAN}Server Time: $local_time $local_tz${NC} | ${WHITE}UTC: $utc_time${NC}"
    
    # Get memory info
    if command -v free >/dev/null 2>&1; then
        mem_info=$(free -m)
        mem_line=$(echo "$mem_info" | grep "^Mem:")
        swap_line=$(echo "$mem_info" | grep "^Swap:")
        
        # Parse memory values
        mem_total=$(echo $mem_line | awk '{print $2}')
        mem_used=$(echo $mem_line | awk '{print $3}')
        mem_free=$(echo $mem_line | awk '{print $4}')
        mem_shared=$(echo $mem_line | awk '{print $5}')
        mem_buffers=$(echo $mem_line | awk '{print $6}')
        mem_available=$(echo $mem_line | awk '{print $7}')
        
        swap_total=$(echo $swap_line | awk '{print $2}')
        swap_used=$(echo $swap_line | awk '{print $3}')
        swap_free=$(echo $swap_line | awk '{print $4}')
        
        echo -e "${BOLD}${BLUE}💾 Memory Usage:${NC}"
        printf "   RAM:  %4d MB / %4d MB  " "$mem_used" "$mem_total"
        print_memory_bar "$mem_used" "$mem_total"
        echo
        
        printf "   Free: %4d MB            " "$mem_free"
        if [ $mem_free -lt 100 ]; then
            echo -e "${RED}${BOLD}⚠️  LOW${NC}"
        elif [ $mem_free -lt 300 ]; then
            echo -e "${YELLOW}${BOLD}⚠️  TIGHT${NC}"
        else
            echo -e "${GREEN}${BOLD}✓ OK${NC}"
        fi
        
        printf "   Avail:%4d MB            " "$mem_available"
        if [ $mem_available -lt 200 ]; then
            echo -e "${RED}${BOLD}⚠️  CRITICAL${NC}"
        elif [ $mem_available -lt 500 ]; then
            echo -e "${YELLOW}${BOLD}⚠️  LOW${NC}"
        else
            echo -e "${GREEN}${BOLD}✓ GOOD${NC}"
        fi
        
        echo
        echo -e "${BOLD}${PURPLE}💽 Swap Usage:${NC}"
        if [ $swap_total -gt 0 ]; then
            printf "   Swap: %4d MB / %4d MB  " "$swap_used" "$swap_total"
            print_memory_bar "$swap_used" "$swap_total"
            echo
            
            if [ $swap_used -gt 0 ]; then
                echo -e "   ${CYAN}📊 System is using swap (memory pressure)${NC}"
            fi
        else
            echo -e "   ${YELLOW}⚠️  No swap configured${NC}"
        fi
    fi
    
    echo
    echo -e "${BOLD}${WHITE}🌐 Network Connectivity:${NC}"
    
    # Get network interface
    NETWORK_INTERFACE=$(get_network_interface)
    if [ -n "$NETWORK_INTERFACE" ]; then
        echo -e "   Interface: ${CYAN}$NETWORK_INTERFACE${NC}"
        
        # Check network connectivity and latency
        connectivity_result=$(check_network_connectivity)
        success_count=$(echo "$connectivity_result" | awk '{print $1}')
        total_latency=$(echo "$connectivity_result" | awk '{print $2}')
        
        if [ $success_count -eq 3 ]; then
            avg_latency=$(echo "scale=1; $total_latency / 3" | bc 2>/dev/null || echo "$((${total_latency%.*} / 3))")
            echo -e "   Status:    ${GREEN}${BOLD}✓ ONLINE${NC} (${avg_latency}ms avg)"
        elif [ $success_count -gt 0 ]; then
            avg_latency=$(echo "scale=1; $total_latency / $success_count" | bc 2>/dev/null || echo "$((${total_latency%.*} / $success_count))")
            echo -e "   Status:    ${YELLOW}${BOLD}⚠️  PARTIAL${NC} ($success_count/3, ${avg_latency}ms)"
        else
            echo -e "   Status:    ${RED}${BOLD}✗ OFFLINE${NC}"
        fi
        
        # Get current network stats
        current_stats=$(get_network_stats "$NETWORK_INTERFACE")
        current_rx=$(echo "$current_stats" | awk '{print $1}')
        current_tx=$(echo "$current_stats" | awk '{print $2}')
        current_time=$(date +%s)
        
        # Calculate network speed if we have previous data
        if [ $LAST_CHECK_TIME -gt 0 ] && [ $current_time -gt $LAST_CHECK_TIME ]; then
            time_diff=$((current_time - LAST_CHECK_TIME))
            rx_diff=$((current_rx - LAST_RX_BYTES))
            tx_diff=$((current_tx - LAST_TX_BYTES))
            
            if [ $time_diff -gt 0 ]; then
                rx_speed=$((rx_diff / time_diff))
                tx_speed=$((tx_diff / time_diff))
                
                echo -e "   Traffic:   ${GREEN}↓$(format_bytes $rx_speed)/s${NC} ${YELLOW}↑$(format_bytes $tx_speed)/s${NC}"
            fi
        fi
        
        # Update last values
        LAST_RX_BYTES=$current_rx
        LAST_TX_BYTES=$current_tx
        LAST_CHECK_TIME=$current_time
        
        # Show total data transfer
        echo -e "   Total RX:  ${CYAN}$(format_bytes $current_rx)${NC}"
        echo -e "   Total TX:  ${CYAN}$(format_bytes $current_tx)${NC}"
        
    else
        echo -e "   ${RED}✗ No network interface detected${NC}"
    fi
    
    echo
    echo -e "${BOLD}${PURPLE}🎯 API Endpoints:${NC}"
    api_status=$(check_deployment_endpoints)
    if [ -n "$api_status" ]; then
        echo -e "   Services:  $api_status"
    else
        echo -e "   ${YELLOW}⚪ No APIs responding${NC}"
    fi
    # Explicitly check Go and Nest servers
    check_server_status "NestJS" 3000 "node.*main.js"
    check_server_status "Go" 4000 "craft-go"
    
    echo
    # Top Memory Consumers Table
    echo -e "${BOLD}${GREEN}🔄 Top Memory Consumers:${NC}"
    total_mem=$(free -m | awk '/^Mem:/ {print $2}')
    printf "${WHITE}%-8s %-6s %-6s %-30s${NC}\n" "USER" "PID" "%MEM" "COMMAND"
    ps aux --sort=-%mem | head -6 | tail -5 | while read line; do
        user=$(echo $line | awk '{print $1}')
        pid=$(echo $line | awk '{print $2}')
        mem_perc=$(echo $line | awk '{print $4}')
        mem_mb=$(awk -v perc="$mem_perc" -v total="$total_mem" 'BEGIN {printf "%d", perc*total/100}')
        cmd=$(echo $line | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}' | cut -c1-30)
        printf "${CYAN}%-8s${NC} ${YELLOW}%-6s${NC} ${GREEN}%-6s${NC} %-30s\n" "$user" "$pid" "$mem_perc" "$cmd"
    done
    
    echo
    # CPU Usage Table
    echo -e "${BOLD}${WHITE}🧮 CPU Usage:${NC}"
    if command -v mpstat >/dev/null 2>&1; then
        mpstat -P ALL 1 1 | awk 'NR==4{printf "${WHITE}%-8s %-8s %-8s %-8s %-8s %-8s\n", "CPU", "%USER", "%SYS", "%IDLE", "%IOWAIT", "%STEAL"} NR==4{printf "${CYAN}%-8s${NC} %-8s %-8s %-8s %-8s %-8s\n", $3, $5, $6, $13, $7, $12} NR>4 && $3 ~ /[0-9]+/ {printf "${CYAN}%-8s${NC} %-8s %-8s %-8s %-8s %-8s\n", $3, $4, $6, $13, $7, $12}'
    else
        echo -e "   ${YELLOW}mpstat not found. Showing top CPU-consuming processes:${NC}"
        printf "${WHITE}%-8s %-6s %-6s %-30s${NC}\n" "USER" "PID" "%CPU" "COMMAND"
        ps aux --sort=-%cpu | head -6 | tail -5 | awk '{printf "${CYAN}%-8s${NC} ${YELLOW}%-6s${NC} ${GREEN}%-6s${NC} %-30s\n", $1, $2, $3, $11}'
    fi
    echo
    
    # Check if no build processes are running
    if ! ps aux | grep -E "(node|ng|nx|npm|tsc)" | grep -v grep >/dev/null; then
        echo -e "   ${YELLOW}⚪ No active build processes${NC}"
    fi
    
    echo
    echo -e "${BOLD}${WHITE}🌍 Network Conditions:${NC}"
    
    # Network Conditions Table
    printf "${WHITE}%-12s %-12s %-12s %-12s${NC}\n" "QUALITY" "ACTIVITY" "MEMORY" "SWAP"
    # Fill in values for each column
    quality="NO CONNECTION"; activity="MEASURING"; mem_status="LOW PRESSURE"; swap_status="No usage"
    if [ $success_count -eq 3 ] && [ -n "$avg_latency" ] && [ "$avg_latency" != "N/A" ]; then
        latency_num=$(echo "$avg_latency" | cut -d'.' -f1 2>/dev/null || echo "$avg_latency")
        if [ "$latency_num" -lt 50 ] 2>/dev/null; then
            quality="EXCELLENT"
        elif [ "$latency_num" -lt 100 ] 2>/dev/null; then
            quality="GOOD"
        elif [ "$latency_num" -lt 200 ] 2>/dev/null; then
            quality="FAIR"
        else
            quality="POOR"
        fi
    elif [ $success_count -gt 0 ]; then
        quality="UNSTABLE"
    fi
    if [ $LAST_CHECK_TIME -gt 0 ] && [ -n "$rx_speed" ] && [ -n "$tx_speed" ]; then
        total_speed=$((rx_speed + tx_speed))
        if [ $total_speed -gt 1048576 ]; then
            activity="HIGH"
        elif [ $total_speed -gt 102400 ]; then
            activity="MODERATE"
        elif [ $total_speed -gt 1024 ]; then
            activity="LOW"
        else
            activity="IDLE"
        fi
    fi
    if [ $mem_available -lt 200 ]; then
        mem_status="HIGH PRESSURE"
    elif [ $mem_available -lt 500 ]; then
        mem_status="MODERATE PRESSURE"
    fi
    if [ $swap_used -gt 100 ]; then
        swap_status="Heavy usage"
    elif [ $swap_used -gt 0 ]; then
        swap_status="Light usage"
    fi
    printf "${CYAN}%-12s %-12s %-12s %-12s${NC}\n" "$quality" "$activity" "$mem_status" "$swap_status"
    
    echo
    echo -e "${BOLD}${CYAN}📈 System Health Summary:${NC}"
    
    # Memory pressure
    if [ $mem_available -lt 200 ]; then
        echo -e "   Memory:    ${RED}🔥 HIGH PRESSURE - System may slow down${NC}"
    elif [ $mem_available -lt 500 ]; then
        echo -e "   Memory:    ${YELLOW}⚠️  MODERATE PRESSURE - Monitor closely${NC}"
    else
        echo -e "   Memory:    ${GREEN}✅ LOW PRESSURE - System performing well${NC}"
    fi
    
    # Swap activity
    if [ $swap_used -gt 100 ]; then
        echo -e "   Swap:      ${YELLOW}💽 Heavy usage - Build may be slower${NC}"
    elif [ $swap_used -gt 0 ]; then
        echo -e "   Swap:      ${CYAN}💭 Light usage - Normal for large builds${NC}"
    else
        echo -e "   Swap:      ${GREEN}✓ No usage - Memory sufficient${NC}"
    fi
    
    # Network status
    if [ $success_count -eq 3 ]; then
        echo -e "   Network:   ${GREEN}✓ Stable connection - Deployments OK${NC}"
    elif [ $success_count -gt 0 ]; then
        echo -e "   Network:   ${YELLOW}⚠️  Unstable - Watch deployment progress${NC}"
    else
        echo -e "   Network:   ${RED}✗ No connection - Deployments will fail${NC}"
    fi
    
    echo
    echo -e "${CYAN}Press Ctrl+C to exit monitor${NC}"
    
    echo
    # OSCAL/FedRAMP Compliance Scan:
    echo -e "${BOLD}${CYAN}🛡️  OSCAL/FedRAMP Compliance Scan:${NC}"
    for profile_loop_var in "${OSCAL_PROFILES[@]}"; do
        current_profile_result_file="$(find_latest_oscal_file "$OSCAL_DIR" "$profile_loop_var" "xml")"
        current_profile_report_file="$(find_latest_oscal_file "$OSCAL_DIR" "$profile_loop_var" "html")"
        # Define potential file names
        user_readable_profile_specific="$OSCAL_DIR/user-readable-results-$profile_loop_var.xml"
        admin_profile_specific="$OSCAL_DIR/oscap-results-$profile_loop_var.xml"
        # Use user-readable if available, else admin
        if [ -f "$user_readable_profile_specific" ]; then
            current_profile_result_file="$user_readable_profile_specific"
        elif [ -f "$admin_profile_specific" ]; then
            current_profile_result_file="$admin_profile_specific"
        fi
        if [ -n "$current_profile_result_file" ]; then
            if command -v xmllint &>/dev/null; then
                TOTAL=$(xmllint --xpath 'count(//rule-result)' "$current_profile_result_file" 2>/dev/null || echo 0)
                PASS=$(xmllint --xpath 'count(//rule-result[result=\"pass\"])' "$current_profile_result_file" 2>/dev/null || echo 0)
                FAIL=$(xmllint --xpath 'count(//rule-result[result=\"fail\"])' "$current_profile_result_file" 2>/dev/null || echo 0)
                NOTAPPLICABLE=$(xmllint --xpath 'count(//rule-result[result=\"notapplicable\"])' "$current_profile_result_file" 2>/dev/null || echo 0)
                echo -e "   ${CYAN}$profile_loop_var${NC}: ${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}  ${YELLOW}N/A: $NOTAPPLICABLE${NC}  ${WHITE}Total: $TOTAL${NC}"
            else
                echo -e "   ${YELLOW}xmllint not found, cannot parse $profile_loop_var results${NC}"
                echo -e "   ${WHITE}Install with: sudo apt-get install libxml2-utils${NC}"
            fi
        else
            echo -e "   ${RED}✗ No scan results for $profile_loop_var${NC}"
        fi
    done
    # At the end, print colored monitored profiles
    colored_profiles=""
    for p in "${OSCAL_PROFILES[@]}"; do
      if [ -f "$OSCAL_DIR/user-readable-results-$p.xml" ] || [ -f "$OSCAL_DIR/oscap-results-$p.xml" ]; then
        colored_profiles+="${GREEN}$p${NC} ";
      else
        colored_profiles+="${RED}$p${NC} ";
      fi

    done
    echo -e "${BOLD}${CYAN}Monitored OSCAL scan profiles:${NC} $colored_profiles"
    
    echo
    echo -e "${BOLD}${CYAN}🌐 Frontend (nginx) Service:${NC}"
    # Check nginx service status
    if command -v systemctl &>/dev/null; then
        nginx_status=$(systemctl is-active nginx 2>/dev/null)
        if [ "$nginx_status" = "active" ]; then
            echo -e "   ${GREEN}✓ nginx is running${NC}"
        else
            echo -e "   ${RED}✗ nginx is not running${NC} (status: $nginx_status)"
        fi
    else
        # Fallback for systems without systemctl
        if pgrep -x nginx >/dev/null; then
            echo -e "   ${GREEN}✓ nginx process found${NC}"
        else
            echo -e "   ${RED}✗ nginx process not found${NC}"
        fi
    fi
    # Check web root and permissions
    WEB_ROOT="/var/www/jeffreysanford.us"
    if [ -d "$WEB_ROOT" ]; then
        owner_group=$(stat -c '%U:%G' "$WEB_ROOT")
        echo -e "   Web root: ${CYAN}$WEB_ROOT${NC} (owner:group ${YELLOW}$owner_group${NC})"
        index_file="$WEB_ROOT/index.html"
        if [ -f "$index_file" ]; then
            echo -e "   ${GREEN}✓ index.html present${NC}"
        else
            echo -e "   ${YELLOW}⚠ index.html missing${NC}"
        fi
    else
        echo -e "   ${RED}✗ Web root $WEB_ROOT not found${NC}"
    fi
    echo
    # Condensed OSCAL file summary with multi-column table
    if [ -d "$OSCAL_DIR" ]; then
        html_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f -iname '*.html' | wc -l)
        xml_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f -iname '*.xml' | wc -l)
        md_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f -iname '*.md' | wc -l)
        pdf_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f -iname '*.pdf' | wc -l)
        json_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f -iname '*.json' | wc -l)
        other_count=$(find "$OSCAL_DIR" -maxdepth 1 -type f ! \( -iname '*.html' -o -iname '*.xml' -o -iname '*.md' -o -iname '*.pdf' -o -iname '*.json' \) | wc -l)
        # Table header
        echo -e "${BOLD}${CYAN}🗂️  OSCAL Files Summary:${NC}"
        printf "${WHITE}%-10s %-10s %-10s %-10s %-10s %-10s${NC}\n" "HTML" "XML" "MD" "PDF" "JSON" "OTHER"
        printf "${CYAN}%-10d %-10d %-10d %-10d %-10d %-10d${NC}\n" $html_count $xml_count $md_count $pdf_count $json_count $other_count
    else
        echo -e "${RED}✗ OSCAL directory not found${NC}"
    fi
    echo -e "${BOLD}${CYAN}🟢 PM2 Process Status:${NC}"
    if command -v pm2 &>/dev/null; then
        pm2 list || echo -e "   ${YELLOW}⚠ pm2 list failed${NC}"
    else
        echo -e "   ${YELLOW}⚠ pm2 not installed${NC}"
    fi

    # Allow update interval override
    sleep_time=30
    if [ -n "$1" ] && [[ "$1" =~ ^[0-9]+$ ]]; then
      sleep_time=$1
    fi
    sleep $sleep_time
done
