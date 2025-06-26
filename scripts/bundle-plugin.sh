#!/bin/bash

# Navigate to the parent directory (project root)
cd ..

# Remove existing zip file if it exists
rm -f festival-track-wizard.zip

# Create the zip file
# The -j option junk paths, so only the file itself is stored in the zip.
# The -r option recursively includes the contents of directories.
zip -r festival-track-wizard.zip festival-track-wizard.php build/