import * as path from 'path';

/**
 * Generates an output directory path based on CSV filename and timestamp
 * @param csvFilePath - Path to the CSV file
 * @returns Output directory path in format: output/filename_YYYY-MM-DD_HH-MM-SS/
 */
export function generateOutputPath(csvFilePath: string): string {
  // Extract filename without extension
  const basename = path.basename(csvFilePath, path.extname(csvFilePath));

  // Generate timestamp
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/T/, '_')
    .replace(/\..+/, '')
    .replace(/:/g, '-');

  // Create output directory path
  return path.join('./output', `${basename}_${timestamp}`);
}

/**
 * Sanitizes filename for safe filesystem usage
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}
