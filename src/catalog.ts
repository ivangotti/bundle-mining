import { promises as fs } from 'fs';
import { CSVRecord } from './parser';

export interface EntitlementCatalog {
  [columnName: string]: string[];
}

/**
 * Generates a catalog of unique entitlements from CSV records
 * @param records - Array of CSV records
 * @returns Catalog object with unique values per entitlement column
 */
export function generateCatalog(records: CSVRecord[]): EntitlementCatalog {
  const catalog: EntitlementCatalog = {};

  if (records.length === 0) {
    return catalog;
  }

  // Find all columns that start with 'ent_'
  const entColumns = Object.keys(records[0]).filter(col => col.startsWith('ent_'));

  // Process each entitlement column
  for (const column of entColumns) {
    const uniqueValues = new Set<string>();

    // Extract values from all records
    for (const record of records) {
      const cellValue = record[column];

      if (cellValue && cellValue.trim() !== '') {
        // Split by comma to handle comma-separated values
        const values = cellValue.split(',').map(v => v.trim());

        // Add each value to the set (automatically deduplicates)
        for (const value of values) {
          if (value !== '') {
            uniqueValues.add(value);
          }
        }
      }
    }

    // Convert Set to sorted array
    catalog[column] = Array.from(uniqueValues).sort();
  }

  return catalog;
}

/**
 * Saves the catalog to a JSON file
 * @param catalog - The catalog object to save
 * @param outputPath - Path where to save the catalog
 */
export async function saveCatalog(catalog: EntitlementCatalog, outputPath: string): Promise<void> {
  try {
    const jsonContent = JSON.stringify(catalog, null, 2);
    await fs.writeFile(outputPath, jsonContent, 'utf-8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EACCES') {
      throw new Error(`Permission denied writing to: ${outputPath}`);
    }
    throw new Error(`Error saving catalog: ${(error as Error).message}`);
  }
}
