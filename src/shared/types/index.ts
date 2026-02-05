/**
 * Operator Lifecycle Models for Upgrade Planner
 */

// Lifecycle model types as defined in the operator update problem document
export enum LifecycleModel {
  PLATFORM_ALIGNED = 'platform-aligned',
  PLATFORM_AGNOSTIC = 'platform-agnostic',
  ROLLING_RELEASE = 'rolling-release',
  UNKNOWN = 'unknown',
}

// Support phase for operators and platform
export enum SupportPhase {
  FULL_SUPPORT = 'full-support',
  MAINTENANCE_SUPPORT = 'maintenance-support',
  END_OF_LIFE = 'end-of-life',
  DEPRECATED = 'deprecated',
  UNKNOWN = 'unknown',
}

// Severity of upgrade issues
export enum IssueSeverity {
  CRITICAL = 'critical', // Blocks cluster upgrade
  WARNING = 'warning',   // May cause issues
  INFO = 'info',         // Informational
}

// Type of upgrade issue
export enum IssueType {
  VERSION_CEILING = 'version-ceiling',
  STALE_CHANNEL = 'stale-channel',
  OUTDATED_VERSION = 'outdated-version',
  LIFECYCLE_EXPIRING = 'lifecycle-expiring',
  INCOMPATIBLE_CLUSTER = 'incompatible-cluster',
}

/**
 * Operator installation information from OLM
 */
export interface OperatorInstallation {
  name: string;
  displayName: string;
  namespace: string;
  currentVersion: string;
  currentChannel: string;
  catalogSource: string;
  catalogNamespace: string;
  installedAt: Date;
  updatedAt: Date;
  approved: boolean; // Auto-approval setting
}

/**
 * Lifecycle information for an operator version
 */
export interface OperatorLifecycleInfo {
  operatorName: string;
  version: string;
  lifecycleModel: LifecycleModel;
  supportPhase: SupportPhase;
  fullSupportEndsAt?: Date;
  maintenanceSupportEndsAt?: Date;
  eolAt?: Date;
  minOCPVersion?: string;
  maxOCPVersion?: string;
  recommendedForOCPVersion?: string;
}

/**
 * Available upgrade for an operator
 */
export interface AvailableUpgrade {
  operatorName: string;
  currentVersion: string;
  targetVersion: string;
  channel: string;
  requiresIntermediateUpgrades: boolean;
  intermediateVersions?: string[];
  releaseDate: Date;
  lifecycleInfo: OperatorLifecycleInfo;
}

/**
 * Upgrade issue detected for an operator
 */
export interface UpgradeIssue {
  id: string;
  operatorName: string;
  severity: IssueSeverity;
  type: IssueType;
  title: string;
  description: string;
  recommendation: string;
  affectsClusterUpgrade: boolean;
  detectedAt: Date;
}

/**
 * Channel information for an operator
 */
export interface OperatorChannel {
  name: string;
  currentCSV: string;
  availableVersions: string[];
  deprecated: boolean;
  deprecationMessage?: string;
  availableInOCPVersion?: string[];
}

/**
 * Complete operator status including installation, lifecycle, and issues
 */
export interface OperatorStatus {
  installation: OperatorInstallation;
  lifecycleInfo: OperatorLifecycleInfo;
  availableUpgrades: AvailableUpgrade[];
  currentChannel: OperatorChannel;
  availableChannels: OperatorChannel[];
  issues: UpgradeIssue[];
  healthStatus: 'healthy' | 'warning' | 'critical';
}

/**
 * OpenShift cluster version information
 */
export interface ClusterVersion {
  currentVersion: string;
  desiredVersion: string;
  channel: string;
  availableUpdates: string[];
  isEUS: boolean;
  fullSupportEndsAt?: Date;
  maintenanceSupportEndsAt?: Date;
  eolAt?: Date;
}

/**
 * Recommended upgrade path for the cluster and operators
 */
export interface UpgradePath {
  id: string;
  description: string;
  estimatedDuration: string;
  confidence: 'high' | 'medium' | 'low';
  steps: UpgradeStep[];
  benefits: string[];
  risks: string[];
  supportedUntil: Date;
}

/**
 * Individual step in an upgrade path
 */
export interface UpgradeStep {
  order: number;
  type: 'cluster' | 'operator' | 'verification';
  target: string;
  fromVersion?: string;
  toVersion?: string;
  channel?: string;
  description: string;
  estimatedDuration: string;
  requiredPrerequisites: string[];
  rollbackStrategy: string;
}

/**
 * Maintenance window recommendation
 */
export interface MaintenanceWindow {
  id: string;
  recommendedDate: Date;
  priority: 'high' | 'medium' | 'low';
  reason: string;
  affectedComponents: string[];
  estimatedDuration: string;
  upgradePath: UpgradePath;
}

/**
 * Overall platform health status
 */
export interface PlatformStatus {
  cluster: ClusterVersion;
  operators: OperatorStatus[];
  overallHealth: 'healthy' | 'warning' | 'critical';
  totalIssues: number;
  criticalIssues: number;
  nextMaintenanceWindow?: MaintenanceWindow;
  supportExpiresIn?: number; // days
}

/**
 * Upgrade planner recommendations
 */
export interface UpgradePlannerRecommendations {
  platformStatus: PlatformStatus;
  recommendedPaths: UpgradePath[];
  maintenanceWindows: MaintenanceWindow[];
  generatedAt: Date;
}

/**
 * Filter and sort options for the dashboard
 */
export interface DashboardFilters {
  lifecycleModel?: LifecycleModel[];
  supportPhase?: SupportPhase[];
  healthStatus?: ('healthy' | 'warning' | 'critical')[];
  hasIssues?: boolean;
  searchTerm?: string;
}

export interface DashboardSortOptions {
  field: 'name' | 'version' | 'supportPhase' | 'healthStatus' | 'updatedAt';
  direction: 'asc' | 'desc';
}
