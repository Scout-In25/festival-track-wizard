#!/bin/bash

# Ensure we are in the root directory
original_dir=$(pwd)
cd "$(dirname "$0")"

# Get the current version from festival-track-wizard.php
current_version=$(awk '/Version:/ {print $3}' ../festival-track-wizard.php)
echo "Current plugin version: $current_version"

# Use Node.js to increment the version
new_version=$(node -e "import { incrementVersion } from '../frontend/src/versionUtils.js'; console.log(incrementVersion('$current_version'));")
echo "New plugin version: $new_version"

# Update the version in festival-track-wizard.php
# Use a temporary file for sed to ensure compatibility across systems
sed "s/Version: $current_version/Version: $new_version/" ../festival-track-wizard.php > ../festival-track-wizard.php.tmp && mv ../festival-track-wizard.php.tmp ../festival-track-wizard.php
echo "Updated festival-track-wizard.php"

# Update the version in frontend/package.json
# Use a temporary file for jq to ensure compatibility
jq ".version = \"$new_version\"" ../frontend/package.json > ../frontend/package.json.tmp && mv ../frontend/package.json.tmp ../frontend/package.json
echo "Updated frontend/package.json"

echo "Version updated from $current_version to $new_version in both files."

# Navigate back to original directory
cd "$original_dir"