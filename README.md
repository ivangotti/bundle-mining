# Bundle Mining - Role Mining Analysis Tool

A TypeScript-based CLI tool for analyzing CSV entitlement data and discovering role patterns using role mining techniques.

## What are Entitlements?

**Entitlements** represent fine-grained user authorizations in identity and access management systems. They are the specific permissions, roles, resources, or attributes assigned to users that determine what actions they can perform and what resources they can access.

In this tool, entitlements are represented as CSV columns with the `ent_` prefix:
- `ent_UserRole` - Job functions or organizational roles
- `ent_Permissions` - Specific access rights (View, Approve, Submit, etc.)
- `ent_CostCenter` - Organizational units or departments
- `ent_*` - Any custom entitlement attribute

This tool analyzes these entitlements to discover patterns and recommend consolidated role bundles, transforming complex, individualized access assignments into standardized, manageable role structures.

## Role Mining: Goals and Methodology

### What is Role Mining?

**Role Mining** is the process of discovering meaningful role structures from existing user-permission assignments. Instead of manually designing roles from scratch, role mining uses data-driven analysis to identify natural groupings and patterns in how entitlements are actually distributed across users.

### The Problem: Permission Sprawl

In many organizations, user permissions accumulate over time through:
- Ad-hoc access requests
- Job changes and promotions
- Temporary project assignments
- Lack of standardized provisioning processes

This results in:
- Every user having a unique combination of entitlements
- Difficult access reviews and audits
- Slow onboarding (each permission assigned individually)
- Security risks from excessive permissions
- No clear understanding of "who should have what"

### The Goal: Role-Based Access Control (RBAC)

Role mining aims to transform this chaos into structured RBAC:

1. **Discover Natural Groupings**: Identify users with similar entitlement patterns
2. **Create Role Bundles**: Define standard roles based on common patterns
3. **Reduce Complexity**: Convert hundreds of unique permission sets into ~10-20 standard roles
4. **Enable Scalability**: New users get assigned to roles, not individual permissions
5. **Improve Security**: Standardized roles are easier to audit and maintain

### How the Statistical Analysis Works

This tool employs multiple role mining techniques to discover patterns:

#### 1. Exact Match Clustering
**What it does:** Groups users with identical entitlement combinations

**Algorithm:**
- Creates a signature for each user's complete entitlement set
- Groups users with matching signatures
- Identifies how many users share each unique pattern

**Output:** Role candidates where users have exactly the same entitlements

**Example:** 9 users all have `[Investor + Risk Officer, Transfer + Approve + Reject]` → Suggests "Financial Risk Manager" role

#### 2. Role Co-occurrence Analysis
**What it does:** Finds entitlement attributes that frequently appear together

**Algorithm:**
- Analyzes all pairs of entitlements (e.g., "Investor" + "Risk Officer")
- Counts how often each pair appears across all users
- Ranks pairs by frequency

**Output:** Frequently paired roles that should be bundled together

**Example:** "Investor" and "Risk Officer" appear together in 9 users (9%) → Strong candidate for composite role

#### 3. Permission Pattern Mining
**What it does:** Discovers shared permission subsets regardless of role combinations

**Algorithm:**
- Extracts permission sets from all users
- Groups users with identical permission combinations
- Identifies common permission patterns across different roles

**Output:** Standard permission tiers that can be applied across multiple roles

**Example:** 13 users have "Transfer" permission → Create a "Transaction Handler" permission add-on

#### 4. Organizational Context Analysis
**What it does:** Analyzes patterns within organizational units (cost centers, departments)

**Algorithm:**
- Groups users by organizational attributes (e.g., cost center)
- Calculates most common roles and permissions within each group
- Identifies department-specific patterns

**Output:** Department-based role recommendations aligned with organizational structure

**Example:** CC300 (Audit Department) has 18 users primarily with "Verify, Approve, Reject" → Suggests "Audit Operations" role

#### 5. Frequency-Based Ranking
**What it does:** Prioritizes roles by prevalence to maximize impact

**Algorithm:**
- Counts users matching each pattern
- Calculates coverage percentage (% of total users)
- Ranks patterns from most to least common

**Output:** Prioritized list of role candidates starting with highest impact

**Example:** Top 5 roles cover 35% of users → Implement these first for quick wins

### Statistical Metrics

The analysis provides key metrics to evaluate role quality:

- **Coverage**: Percentage of users that fit into suggested roles (higher is better)
- **User Count**: Number of users per role (determines role value)
- **Percentage**: % of total user population (measures impact)
- **Average Permissions**: Granularity of access per role (helps balance security vs. usability)
- **Unique Patterns**: Number of distinct entitlement combinations (indicates fragmentation level)

### Implementation Strategy

The tool recommends a **3-tier role system**:

1. **Primary Role Bundles**: 5-10 roles covering the most common combinations (35-50% of users)
2. **Permission Add-ons**: Modular permission sets that can be added to base roles
3. **Department Roles**: Organizational unit-specific roles aligned with cost centers

This approach balances standardization with flexibility, allowing most users to fit standard roles while accommodating exceptions.

## Features

- **Entitlement Catalog Extraction**: Identifies and catalogs all unique entitlements from CSV files
- **Role Mining Analysis**: Discovers common role combinations and permission patterns
- **Statistical Pattern Analysis**: Multi-dimensional analysis of roles, permissions, and organizational structure
- **Role Bundle Recommendations**: Suggests standardized role bundles based on user patterns
- **Timestamped Output**: Each analysis creates unique timestamped folders to preserve historical runs

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

Your CSV must contain **entitlement columns** with the `ent_` prefix. These columns represent the fine-grained authorizations assigned to users in your IAM solution.

**Example CSV Structure:**

```csv
Username,firstName,lastName,ent_CostCenter,ent_UserRole,ent_Permissions
user1@example.com,John,Doe,CC100,"Manager,Analyst","View,Approve"
user2@example.com,Jane,Smith,CC200,Consultant,"View,Verify,Submit"
```

**Entitlement Column Examples:**
- `ent_UserRole` - User's organizational roles (e.g., Manager, Analyst, Consultant)
- `ent_Permissions` - Specific access rights (e.g., View, Approve, Submit, Verify)
- `ent_CostCenter` - Department or cost center assignments
- `ent_Application` - Application access entitlements
- `ent_Groups` - Security group memberships
- `ent_*` - Any custom entitlement attribute

**Format Requirements:**
- Comma-separated values within cells (e.g., "Role1,Role2") for multiple entitlements
- Any number of `ent_` prefixed columns
- Standard CSV format with headers
- UTF-8 encoding recommended

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

Each analysis run creates a **timestamped output directory** to preserve historical results:

```
output/
├── <filename>_YYYY-MM-DD_HH-MM-SS/
│   ├── catalog.json
│   ├── pattern-analysis.json
│   └── role-analysis.json
```

**Example:**
```
output/
└── entitlement-data_2026-02-04_23-06-43/
    ├── catalog.json
    └── pattern-analysis.json
```

| File | Description |
|------|-------------|
| `catalog.json` | Complete entitlement catalog with unique values per `ent_*` column |
| `pattern-analysis.json` | Statistical analysis with role patterns, co-occurrence, and recommendations |
| `role-analysis.json` | Individual role candidates (when using basic analysis mode) |

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

- **IAM Entitlement Optimization**: Analyze fine-grained IAM entitlements and consolidate into manageable role bundles
- **Identity & Access Management**: Consolidate fragmented permissions into structured roles
- **Compliance & Audit**: Identify and standardize access patterns for regulatory compliance
- **Role-Based Access Control (RBAC)**: Design role hierarchies based on actual usage patterns
- **User Provisioning**: Simplify onboarding with standardized role bundles instead of individual entitlements
- **Access Reviews**: Reduce complexity of periodic access certifications by reviewing roles instead of individual permissions
- **Permission Creep Detection**: Discover users with excessive or unusual entitlement combinations

## License

ISC

## Contributing

This is a specialized role mining tool for entitlement analysis. For issues or feature requests, please file an issue.
