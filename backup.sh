#!/bin/bash

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Get the project directory name
PROJECT_NAME="claygrounds-webapp"

# Set backup directory to Downloads folder
BACKUP_DIR="/Users/arpitgupta/Downloads"

# Create backup with timestamp
BACKUP_NAME="${PROJECT_NAME}_${TIMESTAMP}"
BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_PATH"

echo "====================================="
echo "Backing up $PROJECT_NAME to $BACKUP_PATH"
echo "====================================="

# Create backup using rsync to exclude node_modules
# This is more reliable than cp and allows us to exclude specific directories
echo "Creating backup with rsync (excluding only node_modules)..."
rsync -av --progress . "$BACKUP_PATH" --exclude node_modules

# If rsync is not available, fall back to cp and manual deletion
if [ $? -ne 0 ]; then
  echo "Rsync failed, falling back to cp method..."
  echo "Creating backup of $PROJECT_NAME..."
  cp -r . "$BACKUP_PATH"
  
  # Only remove node_modules
  echo "Removing node_modules from backup..."
  rm -rf "$BACKUP_PATH/node_modules"
fi

# Verify backup contents
echo "====================================="
echo "Verifying backup contents..."
echo "====================================="

# Count files in important directories to verify they were copied
SRC_COUNT=$(find "$BACKUP_PATH/src" -type f | wc -l)
PUBLIC_COUNT=$(find "$BACKUP_PATH/public" -type f | wc -l)

echo "Files in src directory: $SRC_COUNT"
echo "Files in public directory: $PUBLIC_COUNT"

# List important configuration files
echo "Checking key configuration files:"
for file in package.json vite.config.js tailwind.config.js netlify.toml; do
  if [ -f "$BACKUP_PATH/$file" ]; then
    echo "✅ $file was backed up successfully"
  else
    echo "❌ WARNING: $file was not backed up!"
  fi
done

# Only proceed with zip creation if backup looks good
if [ $SRC_COUNT -eq 0 ] || [ $PUBLIC_COUNT -eq 0 ]; then
  echo "====================================="
  echo "❌ ERROR: Backup appears incomplete!"
  echo "Source files or public files are missing."
  echo "Backup not zipped. Please check the backup directory: $BACKUP_PATH"
  echo "====================================="
  exit 1
fi

# Create a zip archive
echo "====================================="
echo "Creating zip archive..."
cd "$BACKUP_DIR"
zip -r "${BACKUP_NAME}.zip" "$BACKUP_NAME"

# Check if zip was created successfully
if [ -f "${BACKUP_DIR}/${BACKUP_NAME}.zip" ]; then
  # Get zip file size
  ZIP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.zip" | cut -f1)
  
  echo "====================================="
  echo "✅ Backup completed successfully!"
  echo "Backup location: ${BACKUP_DIR}/${BACKUP_NAME}.zip"
  echo "Backup size: $ZIP_SIZE"
  echo "====================================="
  
  # Remove the folder after creating zip
  rm -rf "$BACKUP_PATH"
else
  echo "====================================="
  echo "❌ ERROR: Zip file creation failed!"
  echo "Temporary backup folder preserved at: $BACKUP_PATH"
  echo "====================================="
  exit 1
fi 