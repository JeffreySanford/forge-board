#!/bin/bash
# fedramp-oscal.sh - Run OpenSCAP (oscap) with selected SCAP Security Guide profile for Fedora
# Usage:
#   sudo ./scripts/fedramp-oscal.sh [standard|ospp|pci-dss|cusp|truenorth]
#
# Runs an OpenSCAP (oscap) scan using the selected SCAP Security Guide profile for Fedora.
# Generates XML and HTML reports in ./oscal-analysis/ for each profile.
#
# Profiles:
#   standard   - Baseline security (recommended for most)
#   ospp       - Protection Profile for General Purpose Operating Systems
#   pci-dss    - Payment Card Industry Data Security Standard
#   cusp       - Custom User Security Profile (Fedora-specific)
#   truenorth  - TrueNorth custom OSCAL profile (exceeds all other standards)
#
# Example:
#   sudo ./scripts/fedramp-oscal.sh standard
#   sudo ./scripts/fedramp-oscal.sh ospp
#
# Reports:
#   XML:  ./oscal-analysis/oscap-results-<profile>.xml
#   HTML: ./oscal-analysis/oscap-report-<profile>.html
#
# Requires: openscap, scap-security-guide, xmllint (optional for summary)
#
# For vibrant environment summary and time estimate, see script output.

# === COLORS (ensure all used colors are defined) ===
GREEN=$'\033[0;32m'
RED=$'\033[0;31m'
YELLOW=$'\033[1;33m'
BLUE=$'\033[0;34m'
CYAN=$'\033[0;36m'
PURPLE=$'\033[0;35m'
WHITE=$'\033[1;37m'
BOLD=$'\033[1m'
NC=$'\033[0m'

OSCAL_DIR="$(cd "$(dirname "$0")/.." && pwd)/oscal-analysis"
mkdir -p "$OSCAL_DIR"

PROFILE=${1:-standard}
SUPPRESS_PRE_SCAN_SUMMARY_FLAG=$2 # Expects --no-summary or nothing
PROFILE_ID=""

case "$PROFILE" in
  standard)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_standard" ;;
  ospp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_ospp" ;;
  pci-dss)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_pci-dss" ;;
  cusp)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_cusp_fedora" ;;
  medium-high)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_PLACEHOLDER_medium_high" ;; # Placeholder for future FedRAMP Rev 5 Medium/High - Update when actual ID is known
  rev5)
    PROFILE_ID="xccdf_org.ssgproject.content_profile_PLACEHOLDER_rev5" ;; # Placeholder for future FedRAMP Rev 5 - Update when actual ID is known
  truenorth)
    PROFILE_ID="oscal_truenorth_profile" ;; # Placeholder for TrueNorth OSCAL profile, update as needed
  *)
    echo "Unknown profile: $PROFILE"
    echo "Usage: $0 [standard|ospp|pci-dss|cusp|medium-high (placeholder for Rev 5)|rev5 (placeholder for Rev 5)|truenorth]"
    exit 1
    ;;
esac

if [ "$SUPPRESS_PRE_SCAN_SUMMARY_FLAG" != "--no-summary" ]; then
  # === Actionable OSCAL Scans Summary (pre-scan check) ===
  OSCAL_PROFILES_TO_CHECK=(standard ospp pci-dss cusp medium-high rev5 truenorth) # Added truenorth for monitoring
  OSCAL_MAX_AGE_DAYS=7
  actionable_scans_display=()
  all_scans_ok=true

  echo -e "${BOLD}${CYAN}Checking status of all OSCAL profiles...${NC}"
  for profile_to_check in "${OSCAL_PROFILES_TO_CHECK[@]}"; do
      current_profile_result_file=""
      # Define potential file names
      user_readable_profile_specific="$OSCAL_DIR/user-readable-results-$profile_to_check.xml"
      admin_profile_specific="$OSCAL_DIR/oscap-results-$profile_to_check.xml"
      user_readable_generic_standard="$OSCAL_DIR/user-readable-results.xml" # Only for standard profile legacy
      admin_generic_standard="$OSCAL_DIR/oscap-results.xml"               # Only for standard profile legacy

      # Prefer user-readable files
      if [ -f "$user_readable_profile_specific" ]; then
          current_profile_result_file="$user_readable_profile_specific"
      elif [ "$profile_to_check" = "standard" ]; then # Check for legacy standard files
          if [ -f "$user_readable_generic_standard" ]; then
              current_profile_result_file="$user_readable_generic_standard"
          elif [ -f "$admin_generic_standard" ]; then
              current_profile_result_file="$admin_generic_standard"
          fi
      fi
      # Fallback to admin profile-specific if no user-readable or generic standard found
      if [ -z "$current_profile_result_file" ] && [ -f "$admin_profile_specific" ]; then
          current_profile_result_file="$admin_profile_specific"
      fi

      if [ -n "$current_profile_result_file" ] && [ -f "$current_profile_result_file" ]; then
          LAST_RUN=$(stat -c %Y "$current_profile_result_file")
          NOW_TS=$(date +%s)
          AGE_DAYS=$(( (NOW_TS - LAST_RUN) / 86400 ))
          if [ "$AGE_DAYS" -gt "$OSCAL_MAX_AGE_DAYS" ]; then
              actionable_scans_display+=("${YELLOW}${profile_to_check} (stale - $AGE_DAYS days old)${NC}")
              all_scans_ok=false
          fi
      else
          actionable_scans_display+=("${RED}${profile_to_check} (missing)${NC}")
          all_scans_ok=false
      fi
  done

  if [ "$all_scans_ok" = false ] && [ ${#actionable_scans_display[@]} -gt 0 ]; then
    printf "${BOLD}${CYAN}Actionable OSCAL Scans:${NC} %s\n\n" "$(IFS=, ; echo "${actionable_scans_display[*]}")"
  else
    echo -e "${GREEN}✓ All OSCAL profiles appear up-to-date.${NC}\n"
  fi
  # === End of Actionable OSCAL Scans Summary (pre-scan check) ===
fi

SCAP_CONTENT="/usr/share/xml/scap/ssg/content/ssg-fedora-ds.xml"
RESULTS="$OSCAL_DIR/oscap-results-$PROFILE.xml"
REPORT="$OSCAL_DIR/oscap-report-$PROFILE.html"

if [ ! -f "$SCAP_CONTENT" ]; then
  echo "SCAP Security Guide content not found: $SCAP_CONTENT"
  exit 1
fi

# Vibrant OSCAL scan header for each profile
PROFILE_LABEL="Standard"
CURRENT_PROFILE_COLOR="$PURPLE" # Default color
if [ "$PROFILE" = "ospp" ]; then PROFILE_LABEL="OSPP"; CURRENT_PROFILE_COLOR="$CYAN"; fi
if [ "$PROFILE" = "pci-dss" ]; then PROFILE_LABEL="PCI-DSS"; CURRENT_PROFILE_COLOR="$YELLOW"; fi
if [ "$PROFILE" = "cusp" ]; then PROFILE_LABEL="CUSP"; CURRENT_PROFILE_COLOR="$GREEN"; fi
if [ "$PROFILE" = "medium-high" ]; then PROFILE_LABEL="Med-High R5"; CURRENT_PROFILE_COLOR="$BLUE"; fi # Placeholder for FedRAMP Rev 5 Medium/High
if [ "$PROFILE" = "rev5" ]; then PROFILE_LABEL="FedRAMP Rev5"; CURRENT_PROFILE_COLOR="$MAGENTA"; fi # Placeholder for FedRAMP Rev 5
if [ "$PROFILE" = "truenorth" ]; then PROFILE_LABEL="TrueNorth"; CURRENT_PROFILE_COLOR="$WHITE"; fi

# --- Progress Function ---
print_progress() {
    local title="$1"
    local estimated_total_seconds="$2"
    local start_time_epoch="$3"
    local progress_bar_width=30

    if [ ! -t 1 ]; then return; fi # Only run if TTY

    while true; do
        local current_time_epoch=$(date +%s)
        local elapsed_seconds=$((current_time_epoch - start_time_epoch))
        local remaining_seconds=$((estimated_total_seconds - elapsed_seconds))

        [ "$remaining_seconds" -lt 0 ] && remaining_seconds=0

        local percent_done=0
        [ "$estimated_total_seconds" -gt 0 ] && percent_done=$((elapsed_seconds * 100 / estimated_total_seconds))
        [ "$percent_done" -gt 100 ] && percent_done=100

        local filled_width=$((percent_done * progress_bar_width / 100))
        local empty_width=$((progress_bar_width - filled_width))

        local bar_str="" # Renamed from 'bar' to avoid conflict with old function name if not removed
        for ((i=0; i<filled_width; i++)); do bar_str+="█"; done
        for ((i=0; i<empty_width; i++)); do bar_str+="░"; done

        local rem_min=$((remaining_seconds / 60))
        local rem_sec=$((remaining_seconds % 60))
        local time_left_str=$(printf "%02d:%02d" "$rem_min" "$rem_sec")

        # Use CURRENT_PROFILE_COLOR for the title
        printf "\r${BOLD}${CURRENT_PROFILE_COLOR}%-25s ${WHITE}[%s] ${GREEN}%3d%%${NC} ${YELLOW}(%s remaining)${NC}\033[K" "$title:" "$bar_str" "$percent_done" "$time_left_str"

        if [ "$remaining_seconds" -eq 0 ] && [ "$elapsed_seconds" -ge "$estimated_total_seconds" ]; then break; fi
        command sleep 1 # Update interval to 1 second for oscap internal progress
    done
}

cleanup_progress_line() { [ -t 1 ] && printf "\r\033[K"; }

# --- End of Progress Function ---

CPU_CORES=$(nproc 2>/dev/null || echo 1)
MEM_TOTAL_MB=$(free -m 2>/dev/null | awk '/^Mem:/ {print $2}' || echo 2000)
DISK_AVAIL=$(df -h / | awk 'NR==2{print $4}')
OSCAL_EST=3
if [ "$CPU_CORES" -le 1 ]; then OSCAL_EST=7; fi
if [ "$CPU_CORES" -le 2 ]; then OSCAL_EST=5; fi
if [ "$MEM_TOTAL_MB" -lt 1500 ]; then OSCAL_EST=$((OSCAL_EST+2)); fi
OSCAL_ESTIMATE_SECONDS=$((OSCAL_EST * 60))

printf "${BOLD}${CYAN}\n╔══════════════════════════════════════════════════════════════╗\n"
printf "║        🛡️  FedRAMP OSCAL Scan: %-10s Environment      ║\n" "$PROFILE_LABEL"
printf "╚══════════════════════════════════════════════════════════════╝${NC}\n"
echo -e "${BLUE}CPU Cores:   ${GREEN}$CPU_CORES${NC}   ${BLUE}Memory: ${GREEN}${MEM_TOTAL_MB}MB${NC}   ${BLUE}Disk Free: ${GREEN}${DISK_AVAIL}${NC}"
# The print_progress function will show the estimated time.

# Add informational message for placeholder profiles
if [ "$PROFILE" = "medium-high" ] || [ "$PROFILE" = "rev5" ] || [ "$PROFILE" = "truenorth" ]; then
  echo
  echo -e "${YELLOW}----------------------------------------------------------------------${NC}"
  echo -e "${YELLOW}${BOLD}INFO: Placeholder Profile - '$PROFILE_LABEL'${NC}"
  echo -e "${YELLOW}This profile ('$PROFILE') is a placeholder for an upcoming or custom OSCAL-aligned standard.${NC}"
  echo -e "${YELLOW}The current SCAP Profile ID ('${PROFILE_ID}') is temporary or custom.${NC}"
  echo -e "${YELLOW}You may need to update this ID in the script once the official or custom profile is finalized${NC}"
  echo -e "${YELLOW}----------------------------------------------------------------------${NC}"
fi

if [ "$PROFILE" = "truenorth" ]; then
  echo -e "${BOLD}${CYAN}TrueNorth OSCAL profile selected. No SCAP scan will be run.${NC}"
  echo -e "${CYAN}Validating truenorth-template.json and truenorth-test.json...${NC}"
  bash "$OSCAL_DIR/../scripts/truenorth-oscal-test.sh"
  exit $?
fi

echo -e "${BOLD}${CYAN}Running OpenSCAP scan with profile: ${YELLOW}$PROFILE_ID${NC}"

phase_start_time=$(date +%s)
print_progress "OSCAP Scan ($PROFILE_LABEL)" "$OSCAL_ESTIMATE_SECONDS" "$phase_start_time" &
progress_pid=$!

oscap xccdf eval --profile "$PROFILE_ID" \
  --results "$RESULTS" \
  --report "$REPORT" \
  "$SCAP_CONTENT"
oscap_status=$?

kill "$progress_pid" &>/dev/null || true
wait "$progress_pid" &>/dev/null || true
cleanup_progress_line

# After OpenSCAP scan, parse and print vibrant pass/fail summary with progress bars
if [ $oscap_status -eq 0 ] || [ $oscap_status -eq 2 ]; then # 0 for success, 2 for success with failures
  echo -e "${GREEN}✓ OpenSCAP scan complete.${NC}"
  echo -e "${WHITE}Results: ${CYAN}$RESULTS${NC}"
  if [ -f "$RESULTS" ]; then
    echo -e "${WHITE}Report last modified: $(stat -c '%y' "$RESULTS")${NC}"
  fi
  echo -e "${WHITE}HTML Report: ${CYAN}$REPORT${NC}"
  if [ -f "$REPORT" ]; then
    echo -e "${WHITE}HTML report last modified: $(stat -c '%y' "$REPORT")${NC}"
    # --- PDF/Markdown Export ---
    if command -v node >/dev/null 2>&1; then
      echo -e "${CYAN}Exporting OSCAL report to PDF and Markdown...${NC}"
      # Ensure Puppeteer browser is installed and cache dir is set for PDF export
      export PUPPETEER_CACHE_DIR=C:/Users/jeffrey/.cache/puppeteer
      npx puppeteer browsers install chrome
      node "$(dirname "$0")/../tools/oscal-export.js"
    else
      echo -e "${YELLOW}Node.js not found, skipping PDF/Markdown export.${NC}"
    fi
  fi
  # Show vibrant pass/fail summary for each control if xmllint is available
  # More specific XPath for OSCAP results:
    # Assumes rule-result elements are within a TestResult, often under a Benchmark root.
    # Using //rule-result as the iteration logic below successfully uses this simpler path. Let's use it for counting too.
    TOTAL_XPATH="count(//rule-result)"
    PASS_XPATH="count(//rule-result[result='pass'])"
    FAIL_XPATH="count(//rule-result[result='fail'])"
    NOTAPPLICABLE_XPATH="count(//rule-result[result='notapplicable'])"
    TOTAL=$(xmllint --xpath "$TOTAL_XPATH" "$RESULTS" 2>/dev/null)
    PASS=$(xmllint --xpath "$PASS_XPATH" "$RESULTS" 2>/dev/null)
    FAIL=$(xmllint --xpath "$FAIL_XPATH" "$RESULTS" 2>/dev/null)
    NOTAPPLICABLE=$(xmllint --xpath "$NOTAPPLICABLE_XPATH" "$RESULTS" 2>/dev/null)
    PASS=${PASS:-0}
    FAIL=${FAIL:-0}
    TOTAL=${TOTAL:-0}
    NOTAPPLICABLE=${NOTAPPLICABLE:-0}
    OTHER=$((TOTAL - PASS - FAIL - NOTAPPLICABLE))
    [ $OTHER -lt 0 ] && OTHER=0
    echo -e "${BOLD}${CYAN}\nFedRAMP OSCAL Control Results:${NC}"
    echo -e "${GREEN}Pass: $PASS${NC}  ${RED}Fail: $FAIL${NC}  ${YELLOW}N/A: $NOTAPPLICABLE${NC}  ${WHITE}Other: $OTHER${NC}  ${WHITE}Total: $TOTAL${NC}"
    # Print a vibrant progress bar for each control
    if [ "$VERBOSE" = true ]; then
      xmllint --xpath '//rule-result' "$RESULTS" 2>/dev/null | \
        grep -oP '<rule-result[\s\S]*?</rule-result>' | \
        while read -r rule; do
          TITLE=$(echo "$rule" | grep -oP 'idref="[^"]+"' | cut -d'"' -f2)
          RESULT=$(echo "$rule" | grep -oP '<result>[^<]+</result>' | sed 's/<\/\?result>//g')
          TIME=$(echo "$rule" | grep -oP '<time>[^<]+</time>' | sed 's/<\/\?time>//g')
          DESC=$(echo "$rule" | grep -oP '<description>[^<]+</description>' | sed 's/<\/\?description>//g')
          DETAILS=$(echo "$rule" | xmllint --xpath 'string(check/message/text())' - 2>/dev/null)
          COLOR="$WHITE"; ICON="•"
          if [ "$RESULT" = "pass" ]; then COLOR="$GREEN"; ICON="✓"; fi
          if [ "$RESULT" = "fail" ]; then COLOR="$RED"; ICON="✗"; fi
          if [ "$RESULT" = "notapplicable" ]; then COLOR="$YELLOW"; ICON="!"; fi
          printf "%b%s %b%-12s%b [%s] %s\n" "$COLOR" "$ICON" "$BOLD" "$TITLE" "$NC" "$RESULT" "$TIME"
          printf "    %s\n" "$DESC"
          if [ "$RESULT" = "notapplicable" ] && [ -n "$DETAILS" ]; then
            printf "    ${YELLOW}Reason: %s${NC}\n" "$DETAILS"
          elif [ -n "$DETAILS" ]; then
            printf "    Details: %s\n" "$DETAILS"
          fi
        done
      echo
    fi
else
  echo -e "${RED}✗ OpenSCAP scan failed (oscap exit code: $oscap_status).${NC}"
fi

# At the end, print colored monitored profiles
colored_profiles=""
for p in "standard" "ospp" "pci-dss" "cusp" "medium-high" "rev5" "truenorth"; do
  if [ -f "$OSCAL_DIR/user-readable-results-$p.xml" ] || [ -f "$OSCAL_DIR/oscap-results-$p.xml" ]; then
    colored_profiles+="${GREEN}$p${NC} ";
  else
    colored_profiles+="${RED}$p${NC} ";
  fi
done
echo -e "${BOLD}${CYAN}Monitored OSCAL scan profiles:${NC} $colored_profiles"

exit $oscap_status # Exit with oscap's status code