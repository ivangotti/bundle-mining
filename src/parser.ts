import { parse } from 'csv-parse/sync';
import { promises as fs } from 'fs';

export interface CSVRecord {
  [key: string]: string;
}

/**
 * Parses a CSV file and returns an array of record objects
 * @param filePath - Path to the CSV file
 * @returns Array of parsed CSV records
 */
export async function parseCSV(filePath: string): Promise<CSVRecord[]> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');

    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return records;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(`Permission denied reading file: ${filePath}`);
    }
    throw new Error(`Error parsing CSV file: ${(error as Error).message}`);
  }
}
