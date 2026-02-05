import { parseCSV } from './parser';
import { generateCatalog, saveCatalog } from './catalog';
import { generateOutputPath } from './utils';
import * as path from 'path';
import { promises as fs } from 'fs';

async function main() {
  // Parse command-line arguments
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: CSV file path is required');
    console.log('\nUsage: npm start <csv-file-path> [output-path]');
    console.log('Example: npm start "data.csv"');
    console.log('Note: Output will be saved to output/<filename>_<timestamp>/catalog.json');
    process.exit(1);
  }

  const csvFilePath = args[0];

  // Generate unique output path based on CSV filename and timestamp
  const outputDir = args[1] ? path.dirname(args[1]) : generateOutputPath(csvFilePath);
  const outputPath = args[1] || path.join(outputDir, 'catalog.json');

  try {
    // Check if file exists
    await fs.access(csvFilePath);

    console.log(`Reading CSV file: ${csvFilePath}`);

    // Parse CSV
    const records = await parseCSV(csvFilePath);
    console.log(`Parsed ${records.length} records`);

    // Generate catalog
    const catalog = generateCatalog(records);
    const entColumnCount = Object.keys(catalog).length;
    console.log(`Found ${entColumnCount} entitlement columns`);

    // Display summary
    for (const [column, values] of Object.entries(catalog)) {
      console.log(`  ${column}: ${values.length} unique values`);
    }

    // Ensure output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Save catalog
    await saveCatalog(catalog, outputPath);
    console.log(`\nCatalog successfully saved to: ${outputPath}`);

  } catch (error) {
    console.error(`\nError: ${(error as Error).message}`);
    process.exit(1);
  }
}

main();
