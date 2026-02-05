# Bundle Mining - Role Mining Analysis Tool

A TypeScript-based CLI tool for analyzing CSV entitlement data and discovering role patterns using role mining techniques.

## Features

- **Entitlement Catalog Extraction**: Identifies and catalogs all unique entitlements from CSV files
- **Role Mining Analysis**: Discovers common role combinations and permission patterns
- **Statistical Pattern Analysis**: Multi-dimensional analysis of roles, permissions, and organizational structure
- **Role Bundle Recommendations**: Suggests standardized role bundles based on user patterns

## Installation

```bash
npm install
npm run build
```

## Usage

### 1. Extract Entitlement Catalog

Identifies all columns prefixed with `ent_` and extracts unique values:

```bash
npm start "<csv-file-path>"
```

**Example:**
```bash
npm start "entitlement-data.csv"
```

**Output:**
- `output/catalog.json` - JSON catalog of unique entitlements

### 2. Basic Role Mining Analysis

Finds users with identical permission sets and suggests role candidates:

```bash
npm run analyze "<csv-file-path>" [min-users]
```

**Parameters:**
- `csv-file-path` - Path to your CSV file
- `min-users` - Minimum users required to form a role (default: 2)

**Example:**
```bash
npm run analyze "data.csv" 2
```

**Output:**
- `output/role-analysis.json` - Detailed role candidate analysis

### 3. Advanced Pattern Analysis (Recommended)

Multi-dimensional analysis discovering patterns across roles, permissions, and departments:

```bash
npm run patterns "<csv-file-path>"
```

**Example:**
```bash
npm run patterns "entitlement-data.csv"
```

**Output:**
- `output/pattern-analysis.json` - Comprehensive statistical analysis

**Provides:**
- Most common role combinations
- Shared permission sets
- Frequently paired roles
- Cost center distribution
- Role mining recommendations
- Key insights and metrics

## CSV File Format

Your CSV must contain columns with the `ent_` prefix:

```csv
Username,firstName,lastName,ent_CostCenter,ent_UserRole,ent_Permissions
user1@example.com,John,Doe,CC100,"Manager,Analyst","View,Approve"
user2@example.com,Jane,Smith,CC200,Consultant,"View,Verify,Submit"
```

**Supported:**
- Comma-separated values within cells (e.g., "Role1,Role2")
- Any number of `ent_` prefixed columns
- Standard CSV format with headers

## Role Mining Methodology

This tool implements several role mining techniques:

1. **Exact Match Clustering**: Groups users with identical permission combinations
2. **Role Combination Analysis**: Identifies frequently co-occurring role pairs
3. **Permission Pattern Mining**: Discovers common permission subsets
4. **Organizational Context Analysis**: Analyzes patterns by cost center/department
5. **Frequency-Based Ranking**: Prioritizes roles by prevalence

### Key Metrics

- **Coverage**: % of users matching identified patterns
- **Frequency**: Number of users per pattern
- **Granularity**: Average permissions per role
- **Co-occurrence**: Role pairs appearing together

## Output Files

| File | Description |
|------|-------------|
| `catalog.json` | Complete entitlement catalog with unique values |
| `pattern-analysis.json` | Statistical analysis with role patterns, co-occurrence, and recommendations |
| `role-analysis.json` | Individual role candidates (when using basic analysis) |

## Example Analysis Results

For the sample "Financial Records" CSV with 100 users:

### Discovered Patterns

- **15 unique role combinations** (down from 100 individual users)
- **78% of users** have multiple concurrent roles
- **10 shared permission patterns** found

### Top Role Bundle

**Financial Risk Manager** (9 users, 9%)
- Roles: Investor + Risk Officer
- Permissions: View, Approve, Reject, Transfer, Verify
- Cost Centers: CC500, CC400, CC700

### Expected Benefits

- **78% reduction** in permission complexity
- **17 standardized roles** instead of 100 unique combinations
- Simplified user provisioning and access reviews
- Better compliance and audit capabilities

## Project Structure

```
bundle-mining/
├── src/
│   ├── index.ts              # Catalog extraction CLI
│   ├── analyze.ts            # Basic role mining CLI
│   ├── patterns.ts           # Advanced pattern analysis CLI
│   ├── parser.ts             # CSV parsing logic
│   ├── catalog.ts            # Catalog generation
│   ├── roleMining.ts         # Role mining algorithms
│   └── advancedAnalysis.ts   # Pattern analysis algorithms
├── dist/                     # Compiled JavaScript
├── output/                   # Generated analysis files
├── package.json
├── tsconfig.json
└── README.md
```

## Development

### Build
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev "<csv-file>"
```

## Technical Details

- **Runtime**: Node.js (v18+)
- **Language**: TypeScript
- **CSV Parser**: csv-parse library
- **Build**: TypeScript compiler (tsc)

## Use Cases

- **Identity & Access Management**: Consolidate fragmented permissions into structured roles
- **Compliance & Audit**: Identify and standardize access patterns
- **Role-Based Access Control (RBAC)**: Design role hierarchies based on actual usage
- **User Provisioning**: Simplify onboarding with standardized role bundles
- **Access Reviews**: Reduce complexity of periodic access certifications

## License

ISC

## Contributing

This is a specialized role mining tool for entitlement analysis. For issues or feature requests, please file an issue.
