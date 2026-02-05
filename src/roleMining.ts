import { CSVRecord } from './parser';

export interface PermissionBundle {
  ent_CostCenter: string[];
  ent_UserRole: string[];
  ent_Permissions: string[];
}

export interface UserProfile {
  username: string;
  bundle: PermissionBundle;
  bundleSignature: string;
}

export interface RoleCandidate {
  roleName: string;
  userCount: number;
  percentage: number;
  users: string[];
  permissions: PermissionBundle;
  description: string;
}

export interface RoleMiningResult {
  totalUsers: number;
  uniqueProfiles: number;
  roleCandidates: RoleCandidate[];
  coverage: {
    usersWithSuggestedRoles: number;
    coveragePercentage: number;
  };
}

/**
 * Extracts permission bundle from a CSV record
 */
function extractBundle(record: CSVRecord): PermissionBundle {
  const bundle: PermissionBundle = {
    ent_CostCenter: [],
    ent_UserRole: [],
    ent_Permissions: []
  };

  // Extract and split comma-separated values for each entitlement column
  const entColumns: (keyof PermissionBundle)[] = ['ent_CostCenter', 'ent_UserRole', 'ent_Permissions'];

  for (const column of entColumns) {
    const value = record[column];
    if (value && value.trim() !== '') {
      bundle[column] = value.split(',')
        .map(v => v.trim())
        .filter(v => v !== '')
        .sort();
    }
  }

  return bundle;
}

/**
 * Creates a signature string for a permission bundle for comparison
 */
function createBundleSignature(bundle: PermissionBundle): string {
  return JSON.stringify({
    costCenters: bundle.ent_CostCenter.sort(),
    roles: bundle.ent_UserRole.sort(),
    permissions: bundle.ent_Permissions.sort()
  });
}

/**
 * Generates a descriptive role name based on the permission bundle
 */
function generateRoleName(bundle: PermissionBundle, index: number): string {
  const roles = bundle.ent_UserRole;
  const permissions = bundle.ent_Permissions;

  if (roles.length > 0) {
    if (roles.length === 1) {
      return roles[0];
    } else if (roles.length === 2) {
      return `${roles[0]}-${roles[1]}`;
    } else {
      return `Multi-Role-${index + 1}`;
    }
  }

  if (permissions.length > 0) {
    return `Role-${permissions[0]}-${index + 1}`;
  }

  return `Role-${index + 1}`;
}

/**
 * Generates a human-readable description for a role candidate
 */
function generateRoleDescription(bundle: PermissionBundle): string {
  const parts: string[] = [];

  if (bundle.ent_UserRole.length > 0) {
    parts.push(`User Roles: ${bundle.ent_UserRole.join(', ')}`);
  }

  if (bundle.ent_Permissions.length > 0) {
    parts.push(`Permissions: ${bundle.ent_Permissions.join(', ')}`);
  }

  if (bundle.ent_CostCenter.length > 0) {
    if (bundle.ent_CostCenter.length <= 3) {
      parts.push(`Cost Centers: ${bundle.ent_CostCenter.join(', ')}`);
    } else {
      parts.push(`Cost Centers: ${bundle.ent_CostCenter.length} centers`);
    }
  }

  return parts.join(' | ');
}

/**
 * Performs role mining analysis on CSV records
 */
export function analyzeRoles(records: CSVRecord[], minUserThreshold: number = 2): RoleMiningResult {
  const userProfiles: UserProfile[] = [];
  const bundleMap = new Map<string, UserProfile[]>();

  // Extract permission bundles for each user
  for (const record of records) {
    const username = record.Username || record.username || record.email || 'Unknown';
    const bundle = extractBundle(record);
    const signature = createBundleSignature(bundle);

    const profile: UserProfile = {
      username,
      bundle,
      bundleSignature: signature
    };

    userProfiles.push(profile);

    // Group users by bundle signature
    if (!bundleMap.has(signature)) {
      bundleMap.set(signature, []);
    }
    bundleMap.get(signature)!.push(profile);
  }

  // Create role candidates from bundles that meet the threshold
  const roleCandidates: RoleCandidate[] = [];
  let roleIndex = 0;

  for (const [signature, profiles] of bundleMap.entries()) {
    if (profiles.length >= minUserThreshold) {
      const bundle = profiles[0].bundle;
      const userCount = profiles.length;
      const percentage = (userCount / records.length) * 100;

      const candidate: RoleCandidate = {
        roleName: generateRoleName(bundle, roleIndex),
        userCount,
        percentage: Math.round(percentage * 100) / 100,
        users: profiles.map(p => p.username),
        permissions: bundle,
        description: generateRoleDescription(bundle)
      };

      roleCandidates.push(candidate);
      roleIndex++;
    }
  }

  // Sort by user count (descending)
  roleCandidates.sort((a, b) => b.userCount - a.userCount);

  // Calculate coverage
  const usersInRoles = roleCandidates.reduce((sum, role) => sum + role.userCount, 0);
  const coveragePercentage = (usersInRoles / records.length) * 100;

  return {
    totalUsers: records.length,
    uniqueProfiles: bundleMap.size,
    roleCandidates,
    coverage: {
      usersWithSuggestedRoles: usersInRoles,
      coveragePercentage: Math.round(coveragePercentage * 100) / 100
    }
  };
}

/**
 * Finds similar permission bundles (Jaccard similarity)
 */
export function calculateBundleSimilarity(bundle1: PermissionBundle, bundle2: PermissionBundle): number {
  const allPerms1 = new Set([
    ...bundle1.ent_CostCenter,
    ...bundle1.ent_UserRole,
    ...bundle1.ent_Permissions
  ]);

  const allPerms2 = new Set([
    ...bundle2.ent_CostCenter,
    ...bundle2.ent_UserRole,
    ...bundle2.ent_Permissions
  ]);

  const intersection = new Set([...allPerms1].filter(x => allPerms2.has(x)));
  const union = new Set([...allPerms1, ...allPerms2]);

  return intersection.size / union.size;
}
