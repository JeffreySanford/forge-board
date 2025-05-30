#!/bin/bash
set -e

ZIP_PATH="scripts/oscal/ssg-content.zip"
ZIP_URL="https://your-download-url/ssg-content.zip" # <-- Replace with actual URL

if [ ! -f "$ZIP_PATH" ]; then
  echo "Downloading ssg-content.zip..."
  curl -L -o "$ZIP_PATH" "$ZIP_URL"
else
  echo "ssg-content.zip already exists."
fi