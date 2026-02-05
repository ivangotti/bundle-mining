import { CSVRecord } from './parser';
import { promises as fs } from 'fs';
import * as path from 'path';

interface PatternAnalysis {
  rolePatterns: RolePattern[];
  permissionPatterns: PermissionPattern[];
  costCenterPatterns: CostCenterPattern[];
  coOccurrence: CoOccurrenceAnalysis;
  recommendations: string[];
}

interface RolePattern {
  roles: string[];
  userCount: number;
  percentage: number;
  avgPermissions: number;
}

interface PermissionPattern {
  permissions: string[];
  userCount: number;
  percentage: number;
  commonRoles: string[];
}

interface CostCenterPattern {
  costCenter: string;
  userCount: number;
  percentage: number;
  commonRoles: string[];
  commonPermissions: string[];
}

interface CoOccurrenceAnalysis {
  frequentPairs: Array<{
    role1: string;
    role2: string;
    count: number;
    percentage: number;
  }>;
  permissionSets: Array<{
    permissions: string[];
    count: number;
    percentage: number;
  }>;
}

/**
 * Performs advanced pattern analysis to find common substructures
 */
export function performAdvancedAnalysis(records: CSVRecord[]): PatternAnalysis {
  // Analyze role combinations
  const roleCombos = new Map<string, number>();
  const permissionSets = new Map<string, number>();
  const costCenterMap = new Map<string, { count: number; roles: string[]; perms: string[] }>();

  // Track co-occurrence of roles
  const rolePairs = new Map<string, number>();

  // Collect all permissions per user for averaging
  const roleToPermissions = new Map<string, number[]>();

  for (const record of records) {
    // Extract data
    const roles = (record.ent_UserRole || '').split(',').map(r => r.trim()).filter(r => r);
    const permissions = (record.ent_Permissions || '').split(',').map(p => p.trim()).filter(p => p);
    const costCenters = (record.ent_CostCenter || '').split(',').map(c => c.trim()).filter(c => c);

    // Role combinations
    const roleKey = roles.sort().join('|');
    roleCombos.set(roleKey, (roleCombos.get(roleKey) || 0) + 1);

    // Track permissions per role combo
    if (!roleToPermissions.has(roleKey)) {
      roleToPermissions.set(roleKey, []);
    }
    roleToPermissions.get(roleKey)!.push(permissions.length);

    // Permission sets
    const permKey = permissions.sort().join('|');
    permissionSets.set(permKey, (permissionSets.get(permKey) || 0) + 1);

    // Role pairs (co-occurrence)
    for (let i = 0; i < roles.length; i++) {
      for (let j = i + 1; j < roles.length; j++) {
        const pair = [roles[i], roles[j]].sort().join('|');
        rolePairs.set(pair, (rolePairs.get(pair) || 0) + 1);
      }
    }

    // Cost center patterns
    for (const cc of costCenters) {
      if (!costCenterMap.has(cc)) {
        costCenterMap.set(cc, { count: 0, roles: [], perms: [] });
      }
      const ccData = costCenterMap.get(cc)!;
      ccData.count++;
      ccData.roles.push(...roles);
      ccData.perms.push(...permissions);
    }
  }

  // Process role patterns
  const rolePatterns: RolePattern[] = [];
  for (const [roleKey, count] of roleCombos.entries()) {
    if (roleKey) {
      const roles = roleKey.split('|');
      const permCounts = roleToPermissions.get(roleKey) || [];
      const avgPerms = permCounts.reduce((a, b) => a + b, 0) / permCounts.length;

      rolePatterns.push({
        roles,
        userCount: count,
        percentage: Math.round((count / records.length) * 10000) / 100,
        avgPermissions: Math.round(avgPerms * 10) / 10
      });
    }
  }
  rolePatterns.sort((a, b) => b.userCount - a.userCount);

  // Process permission patterns
  const permissionPatterns: PermissionPattern[] = [];
  for (const [permKey, count] of permissionSets.entries()) {
    if (permKey && count >= 2) { // At least 2 users with same permissions
      const permissions = permKey.split('|');

      // Find common roles for this permission set
      const rolesForThisPermSet = new Set<string>();
      for (const record of records) {
        const recPerms = (record.ent_Permissions || '').split(',').map(p => p.trim()).filter(p => p).sort().join('|');
        if (recPerms === permKey) {
          const roles = (record.ent_UserRole || '').split(',').map(r => r.trim()).filter(r => r);
          roles.forEach(r => rolesForThisPermSet.add(r));
        }
      }

      permissionPatterns.push({
        permissions,
        userCount: count,
        percentage: Math.round((count / records.length) * 10000) / 100,
        commonRoles: Array.from(rolesForThisPermSet).slice(0, 5)
      });
    }
  }
  permissionPatterns.sort((a, b) => b.userCount - a.userCount);

  // Process cost center patterns
  const costCenterPatterns: CostCenterPattern[] = [];
  for (const [cc, data] of costCenterMap.entries()) {
    const roleFreq = new Map<string, number>();
    const permFreq = new Map<string, number>();

    data.roles.forEach(r => roleFreq.set(r, (roleFreq.get(r) || 0) + 1));
    data.perms.forEach(p => permFreq.set(p, (permFreq.get(p) || 0) + 1));

    const topRoles = Array.from(roleFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([role]) => role);

    const topPerms = Array.from(permFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([perm]) => perm);

    costCenterPatterns.push({
      costCenter: cc,
      userCount: data.count,
      percentage: Math.round((data.count / records.length) * 10000) / 100,
      commonRoles: topRoles,
      commonPermissions: topPerms
    });
  }
  costCenterPatterns.sort((a, b) => b.userCount - a.userCount);

  // Co-occurrence analysis
  const frequentPairs = Array.from(rolePairs.entries())
    .map(([pair, count]) => {
      const [role1, role2] = pair.split('|');
      return {
        role1,
        role2,
        count,
        percentage: Math.round((count / records.length) * 10000) / 100
      };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topPermissionSets = Array.from(permissionSets.entries())
    .map(([key, count]) => ({
      permissions: key.split('|'),
      count,
      percentage: Math.round((count / records.length) * 10000) / 100
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate recommendations
  const recommendations = generateRecommendations(
    rolePatterns,
    permissionPatterns,
    costCenterPatterns,
    frequentPairs
  );

  return {
    rolePatterns: rolePatterns.slice(0, 15),
    permissionPatterns: permissionPatterns.slice(0, 10),
    costCenterPatterns,
    coOccurrence: {
      frequentPairs,
      permissionSets: topPermissionSets
    },
    recommendations
  };
}

function generateRecommendations(
  rolePatterns: RolePattern[],
  permissionPatterns: PermissionPattern[],
  costCenterPatterns: CostCenterPattern[],
  frequentPairs: any[]
): string[] {
  const recommendations: string[] = [];

  // Check for common role combinations
  if (frequentPairs.length > 0) {
    const topPair = frequentPairs[0];
    recommendations.push(
      `Create a composite role "${topPair.role1}-${topPair.role2}" - this combination appears in ${topPair.count} users (${topPair.percentage}%)`
    );
  }

  // Check for permission patterns
  if (permissionPatterns.length > 0) {
    const topPerm = permissionPatterns[0];
    recommendations.push(
      `Define a base permission set [${topPerm.permissions.join(', ')}] - shared by ${topPerm.userCount} users (${topPerm.percentage}%)`
    );
  }

  // Role consolidation
  if (rolePatterns.length > 0) {
    const singleRoleUsers = rolePatterns.filter(p => p.roles.length === 1);
    const multiRoleUsers = rolePatterns.filter(p => p.roles.length > 1);

    if (multiRoleUsers.length > 0) {
      const totalMulti = multiRoleUsers.reduce((sum, p) => sum + p.userCount, 0);
      const percentage = Math.round((totalMulti / (singleRoleUsers.reduce((sum, p) => sum + p.userCount, 0) + totalMulti)) * 100);
      recommendations.push(
        `${totalMulti} users have multiple roles (${percentage}%) - Consider creating simplified composite roles instead`
      );
    }
  }

  // Cost center based recommendations
  if (costCenterPatterns.length > 0) {
    recommendations.push(
      `Consider creating ${costCenterPatterns.length} cost center-based role groups to organize permissions by department`
    );
  }

  // Hierarchical role suggestion
  recommendations.push(
    `Implement a 2-tier role system: Base Roles (job function) + Permission Add-ons (specific capabilities)`
  );

  return recommendations;
}

export async function saveAdvancedAnalysis(analysis: PatternAnalysis, outputPath: string): Promise<void> {
  const outputDir = path.dirname(outputPath);
  await fs.mkdir(outputDir, { recursive: true});
  await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2), 'utf-8');
}
