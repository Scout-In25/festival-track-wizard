export function incrementVersion(currentVersion) {
  if (typeof currentVersion !== 'string' || !currentVersion) {
    return currentVersion;
  }

  const versionParts = currentVersion.split('.').map(Number);

  // Check if all parts are valid numbers
  if (versionParts.some(isNaN)) {
    return currentVersion;
  }

  if (versionParts.length === 2) {
    versionParts[1]++;
  } else if (versionParts.length === 1) {
    versionParts[0]++;
    versionParts.push(0); // Add .0 if only major version
  } else {
    // For versions with more than two parts, or other unexpected formats, return original
    return currentVersion;
  }
  return versionParts.join('.');
}