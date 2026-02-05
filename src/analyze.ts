import { parseCSV } from './parser';
import { analyzeRoles, RoleMiningResult } from './roleMining';
import { generateOutputPath } from './utils';
import { promises as fs } from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: CSV file path is required');
    console.log('\nUsage: node dist/analyze.js <csv-file-path> [min-users] [output-path]');
    console.log('Example: node dist/analyze.js "data.csv" 2');
    console.log('\nmin-users: Minimum number of users to form a role candidate (default: 2)');
    console.log('Note: Output will be saved to output/<filename>_<timestamp>/role-analysis.json');
    process.exit(1);
  }

  const csvFilePath = args[0];
  const minUserThreshold = args[1] ? parseInt(args[1]) : 2;

  // Generate unique output path based on CSV filename and timestamp
  const outputDir = args[2] ? path.dirname(args[2]) : generateOutputPath(csvFilePath);
  const outputPath = args[2] || path.join(outputDir, 'role-analysis.json');

  try {
    await fs.access(csvFilePath);

    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║           ROLE MINING ANALYSIS - Permission Bundler           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Reading CSV file: ${csvFilePath}`);
    const records = await parseCSV(csvFilePath);
    console.log(`✓ Parsed ${records.length} user records\n`);

    console.log(`🔍 Analyzing permission patterns (min threshold: ${minUserThreshold} users)...`);
    const analysis = analyzeRoles(records, minUserThreshold);

    console.log(`✓ Found ${analysis.uniqueProfiles} unique permission profiles`);
    console.log(`✓ Identified ${analysis.roleCandidates.length} role candidates\n`);

    // Display summary statistics
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 ANALYSIS SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`Total Users:              ${analysis.totalUsers}`);
    console.log(`Unique Permission Sets:   ${analysis.uniqueProfiles}`);
    console.log(`Suggested Roles:          ${analysis.roleCandidates.length}`);
    console.log(`Coverage:                 ${analysis.coverage.usersWithSuggestedRoles}/${analysis.totalUsers} users (${analysis.coverage.coveragePercentage}%)`);
    console.log('');

    // Display role candidates
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💼 SUGGESTED ROLE BUNDLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.roleCandidates.forEach((role, index) => {
      console.log(`\x1b[1m${index + 1}. ${role.roleName}\x1b[0m`);
      console.log(`   Users: ${role.userCount} (${role.percentage}%)`);
      console.log(`   ${role.description}`);

      // Display permission details
      if (role.permissions.ent_UserRole.length > 0) {
        console.log(`   └─ Roles: ${role.permissions.ent_UserRole.join(', ')}`);
      }
      if (role.permissions.ent_Permissions.length > 0) {
        console.log(`   └─ Permissions: ${role.permissions.ent_Permissions.join(', ')}`);
      }
      if (role.permissions.ent_CostCenter.length > 0 && role.permissions.ent_CostCenter.length <= 3) {
        console.log(`   └─ Cost Centers: ${role.permissions.ent_CostCenter.join(', ')}`);
      }

      console.log('');
    });

    // Recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (analysis.roleCandidates.length > 0) {
      const topRole = analysis.roleCandidates[0];
      console.log(`1. Most Common Pattern: "${topRole.roleName}"`);
      console.log(`   → Covers ${topRole.userCount} users (${topRole.percentage}%)`);
      console.log(`   → Consider this as your primary role template\n`);

      if (analysis.roleCandidates.length > 1) {
        console.log(`2. Role Consolidation Opportunity:`);
        console.log(`   → ${analysis.roleCandidates.length} distinct roles identified`);
        console.log(`   → ${analysis.coverage.coveragePercentage}% of users fit these patterns`);
        console.log(`   → Consider creating these ${analysis.roleCandidates.length} roles to standardize access\n`);
      }

      const outliers = analysis.totalUsers - analysis.coverage.usersWithSuggestedRoles;
      if (outliers > 0) {
        const outlierPercentage = ((outliers / analysis.totalUsers) * 100).toFixed(1);
        console.log(`3. Outlier Users: ${outliers} (${outlierPercentage}%)`);
        console.log(`   → These users have unique permission combinations`);
        console.log(`   → Review if they need special access or can fit into existing roles\n`);
      }

      console.log(`4. Implementation Strategy:`);
      console.log(`   → Start with the top ${Math.min(3, analysis.roleCandidates.length)} most common roles`);
      console.log(`   → Migrate users from individual permissions to role-based access`);
      console.log(`   → Monitor and adjust based on business needs\n`);
    } else {
      console.log(`⚠️  No common patterns found with threshold of ${minUserThreshold} users.`);
      console.log(`   → Try lowering the threshold to find smaller groups`);
      console.log(`   → Users may have highly individualized permissions\n`);
    }

    // Save results
    await fs.mkdir(outputDir, { recursive: true });
    await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Detailed analysis saved to: ${outputPath}\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

main();
