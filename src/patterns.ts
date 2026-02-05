import { parseCSV } from './parser';
import { performAdvancedAnalysis, saveAdvancedAnalysis } from './advancedAnalysis';
import { generateOutputPath } from './utils';
import { promises as fs } from 'fs';
import * as path from 'path';

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Error: CSV file path is required');
    console.log('\nUsage: node dist/patterns.js <csv-file-path> [output-path]');
    console.log('Example: node dist/patterns.js "data.csv"');
    console.log('Note: Output will be saved to output/<filename>_<timestamp>/pattern-analysis.json');
    process.exit(1);
  }

  const csvFilePath = args[0];

  // Generate unique output path based on CSV filename and timestamp
  const outputDir = args[1] ? path.dirname(args[1]) : generateOutputPath(csvFilePath);
  const outputPath = args[1] || path.join(outputDir, 'pattern-analysis.json');

  try {
    await fs.access(csvFilePath);

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║       ADVANCED PATTERN ANALYSIS - Role Mining Insights          ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 Reading CSV file: ${csvFilePath}`);
    const records = await parseCSV(csvFilePath);
    console.log(`✓ Parsed ${records.length} user records\n`);

    console.log('🔍 Analyzing patterns across multiple dimensions...');
    const analysis = performAdvancedAnalysis(records);

    // Display Role Patterns
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👥 MOST COMMON ROLE COMBINATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.rolePatterns.slice(0, 10).forEach((pattern, idx) => {
      console.log(`${idx + 1}. [${pattern.roles.join(' + ')}]`);
      console.log(`   → ${pattern.userCount} users (${pattern.percentage}%)`);
      console.log(`   → Average ${pattern.avgPermissions} permissions per user\n`);
    });

    // Display Permission Patterns
    if (analysis.permissionPatterns.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 SHARED PERMISSION SETS (2+ users)');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      analysis.permissionPatterns.forEach((pattern, idx) => {
        console.log(`${idx + 1}. Permissions: [${pattern.permissions.join(', ')}]`);
        console.log(`   → ${pattern.userCount} users (${pattern.percentage}%)`);
        if (pattern.commonRoles.length > 0) {
          console.log(`   → Common roles: ${pattern.commonRoles.join(', ')}`);
        }
        console.log('');
      });
    } else {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('🔐 SHARED PERMISSION SETS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log('⚠️  No permission sets are shared by multiple users.');
      console.log('   Each user has a unique combination of permissions.\n');
    }

    // Display Role Co-occurrence
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🔗 FREQUENTLY PAIRED ROLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.coOccurrence.frequentPairs.slice(0, 10).forEach((pair, idx) => {
      console.log(`${idx + 1}. ${pair.role1} + ${pair.role2}`);
      console.log(`   → ${pair.count} users (${pair.percentage}%)\n`);
    });

    // Display Cost Center Patterns
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🏢 COST CENTER DISTRIBUTION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.costCenterPatterns.forEach((pattern) => {
      console.log(`${pattern.costCenter}: ${pattern.userCount} users (${pattern.percentage}%)`);
      console.log(`   → Top roles: ${pattern.commonRoles.join(', ')}`);
      console.log(`   → Top permissions: ${pattern.commonPermissions.join(', ')}\n`);
    });

    // Display Recommendations
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💡 ROLE MINING RECOMMENDATIONS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    analysis.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}\n`);
    });

    // Key Insights
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 KEY INSIGHTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const topRolePattern = analysis.rolePatterns[0];
    console.log(`Most Common Role Combo: [${topRolePattern.roles.join(' + ')}]`);
    console.log(`   → Found in ${topRolePattern.userCount} users (${topRolePattern.percentage}%)\n`);

    const totalRoleCombos = analysis.rolePatterns.length;
    console.log(`Unique Role Combinations: ${totalRoleCombos}`);
    console.log(`   → High fragmentation indicates ad-hoc permission assignment\n`);

    if (analysis.permissionPatterns.length > 0) {
      console.log(`Shared Permission Sets: ${analysis.permissionPatterns.length}`);
      console.log(`   → Opportunity to create ${analysis.permissionPatterns.length} standard permission bundles\n`);
    } else {
      console.log('Shared Permission Sets: 0');
      console.log('   → Every user has unique permissions - high customization\n');
    }

    const multiRoleUsers = analysis.rolePatterns.filter(p => p.roles.length > 1)
      .reduce((sum, p) => sum + p.userCount, 0);
    const multiRolePercentage = Math.round((multiRoleUsers / records.length) * 100);

    console.log(`Multi-Role Users: ${multiRoleUsers} (${multiRolePercentage}%)`);
    console.log(`   → Consider creating composite roles for common combinations\n`);

    // Save results
    await saveAdvancedAnalysis(analysis, outputPath);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n✅ Detailed analysis saved to: ${outputPath}\n`);

  } catch (error) {
    console.error(`\n❌ Error: ${(error as Error).message}\n`);
    process.exit(1);
  }
}

main();
