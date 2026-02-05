import * as semver from 'semver';
import { olmClient } from './olm-client';
import {
  OperatorStatus,
  OperatorLifecycleInfo,
  LifecycleModel,
  SupportPhase,
  UpgradeIssue,
  IssueSeverity,
  IssueType,
  AvailableUpgrade,
  ClusterVersion,
  PlatformStatus,
} from '../../shared/types';
import { logger } from '../utils/logger';

/**
 * Service for aggregating operator lifecycle data
 */
export class LifecycleService {
  private lifecycleCache: Map<string, OperatorLifecycleInfo> = new Map();
  private cacheExpiry: number = 3600000; // 1 hour in ms
  private lastCacheUpdate: number = 0;

  /**
   * Get complete platform status including cluster and all operators
   */
  async getPlatformStatus(): Promise<PlatformStatus> {
    try {
      // Get cluster version
      const clusterVersionData = await olmClient.getClusterVersion();
      const cluster = this.mapToClusterVersion(clusterVersionData);

      // Get all operator subscriptions
      const subscriptions = await olmClient.getOperatorSubscriptions();

      // Build operator statuses
      const operators: OperatorStatus[] = [];
      for (const subscription of subscriptions) {
        try {
          const status = await this.getOperatorStatus(subscription.name, subscription.namespace);
          if (status) {
            operators.push(status);
          }
        } catch (error) {
          logger.error({ error, operator: subscription.name }, 'Failed to get operator status');
        }
      }

      // Calculate overall health
      const criticalIssues = operators.reduce(
        (count, op) => count + op.issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length,
        0
      );
      const totalIssues = operators.reduce((count, op) => count + op.issues.length, 0);

      const overallHealth = criticalIssues > 0 ? 'critical' : totalIssues > 0 ? 'warning' : 'healthy';

      // Calculate support expiry
      const supportExpiresIn = this.calculateSupportExpiry(cluster, operators);

      return {
        cluster,
        operators,
        overallHealth,
        totalIssues,
        criticalIssues,
        supportExpiresIn,
      };
    } catch (error) {
      logger.error({ error }, 'Failed to get platform status');
      throw new Error('Failed to get platform status');
    }
  }

  /**
   * Get status for a specific operator
   */
  async getOperatorStatus(name: string, namespace: string): Promise<OperatorStatus | null> {
    try {
      // Get installation info
      const installation = await olmClient.getOperatorSubscription(name, namespace);
      if (!installation) {
        return null;
      }

      // Get lifecycle info
      const lifecycleInfo = await this.getOperatorLifecycleInfo(
        installation.name,
        installation.currentVersion
      );

      // Get available channels
      const availableChannels = await olmClient.getOperatorChannels(
        installation.name,
        installation.catalogSource,
        installation.catalogNamespace
      );

      const currentChannel = availableChannels.find((c) => c.name === installation.currentChannel) || {
        name: installation.currentChannel,
        currentCSV: installation.currentVersion,
        availableVersions: [],
        deprecated: false,
      };

      // Detect available upgrades
      const availableUpgrades = await this.detectAvailableUpgrades(installation, availableChannels);

      // Detect issues
      const issues = await this.detectUpgradeIssues(installation, lifecycleInfo, currentChannel);

      // Calculate health status
      const healthStatus = this.calculateHealthStatus(issues);

      return {
        installation,
        lifecycleInfo,
        availableUpgrades,
        currentChannel,
        availableChannels,
        issues,
        healthStatus,
      };
    } catch (error) {
      logger.error({ error, name, namespace }, 'Failed to get operator status');
      return null;
    }
  }

  /**
   * Get lifecycle information for an operator version
   * This would typically query an external API or database
   */
  async getOperatorLifecycleInfo(operatorName: string, version: string): Promise<OperatorLifecycleInfo> {
    const cacheKey = `${operatorName}:${version}`;

    // Check cache
    if (this.lifecycleCache.has(cacheKey) && Date.now() - this.lastCacheUpdate < this.cacheExpiry) {
      return this.lifecycleCache.get(cacheKey)!;
    }

    try {
      // In production, this would query the Red Hat Product Lifecycle API
      // or a dedicated lifecycle database
      // For now, we'll implement fallback logic based on operator naming patterns

      const lifecycleInfo = await this.fetchLifecycleInfoFromAPI(operatorName, version);

      // Cache the result
      this.lifecycleCache.set(cacheKey, lifecycleInfo);
      this.lastCacheUpdate = Date.now();

      return lifecycleInfo;
    } catch (error) {
      logger.warn({ error, operatorName, version }, 'Failed to fetch lifecycle info, using defaults');
      return this.getDefaultLifecycleInfo(operatorName, version);
    }
  }

  /**
   * Fetch lifecycle info from external API
   * This is a placeholder for the actual Red Hat Product Lifecycle API
   */
  private async fetchLifecycleInfoFromAPI(
    operatorName: string,
    version: string
  ): Promise<OperatorLifecycleInfo> {
    // TODO: Implement actual API call to Red Hat Product Lifecycle database
    // const response = await axios.get(
    //   `https://access.redhat.com/api/product-lifecycle/operators/${operatorName}/versions/${version}`
    // );

    // For now, return a reasonable default based on operator patterns
    return this.getDefaultLifecycleInfo(operatorName, version);
  }

  /**
   * Get default lifecycle info based on operator naming patterns
   */
  private getDefaultLifecycleInfo(operatorName: string, version: string): OperatorLifecycleInfo {
    // Determine lifecycle model based on operator name patterns
    let lifecycleModel = LifecycleModel.UNKNOWN;
    let supportPhase = SupportPhase.FULL_SUPPORT;

    // Platform-aligned operators (part of OpenShift Platform Plus)
    const platformAlignedOperators = [
      'advanced-cluster-management',
      'multicluster-engine',
      'odf-operator',
      'quay-operator',
      'acs-operator',
    ];

    // Rolling release operators
    const rollingReleaseOperators = ['compliance-operator', 'cost-management-metrics-operator'];

    if (platformAlignedOperators.some((op) => operatorName.includes(op))) {
      lifecycleModel = LifecycleModel.PLATFORM_ALIGNED;
    } else if (rollingReleaseOperators.some((op) => operatorName.includes(op))) {
      lifecycleModel = LifecycleModel.ROLLING_RELEASE;
    } else {
      // Most operators are platform-agnostic
      lifecycleModel = LifecycleModel.PLATFORM_AGNOSTIC;
    }

    return {
      operatorName,
      version,
      lifecycleModel,
      supportPhase,
      // These would come from the API in production
      fullSupportEndsAt: undefined,
      maintenanceSupportEndsAt: undefined,
      eolAt: undefined,
      minOCPVersion: undefined,
      maxOCPVersion: undefined,
    };
  }

  /**
   * Detect available upgrades for an operator
   */
  private async detectAvailableUpgrades(
    installation: any,
    availableChannels: any[]
  ): Promise<AvailableUpgrade[]> {
    const upgrades: AvailableUpgrade[] = [];

    for (const channel of availableChannels) {
      const currentVersionClean = this.cleanVersion(installation.currentVersion);
      const latestVersion = this.cleanVersion(channel.currentCSV);

      if (semver.valid(currentVersionClean) && semver.valid(latestVersion)) {
        if (semver.gt(latestVersion, currentVersionClean)) {
          const lifecycleInfo = await this.getOperatorLifecycleInfo(installation.name, latestVersion);

          upgrades.push({
            operatorName: installation.name,
            currentVersion: installation.currentVersion,
            targetVersion: channel.currentCSV,
            channel: channel.name,
            requiresIntermediateUpgrades: false, // TODO: Detect intermediate upgrades needed
            releaseDate: new Date(), // TODO: Get from catalog metadata
            lifecycleInfo,
          });
        }
      }
    }

    return upgrades;
  }

  /**
   * Detect upgrade issues for an operator
   */
  private async detectUpgradeIssues(
    installation: any,
    lifecycleInfo: OperatorLifecycleInfo,
    currentChannel: any
  ): Promise<UpgradeIssue[]> {
    const issues: UpgradeIssue[] = [];

    // Check for stale channel
    if (currentChannel.deprecated) {
      issues.push({
        id: `${installation.name}-stale-channel`,
        operatorName: installation.name,
        severity: IssueSeverity.WARNING,
        type: IssueType.STALE_CHANNEL,
        title: 'Channel is deprecated',
        description: currentChannel.deprecationMessage || 'The current subscription channel has been deprecated.',
        recommendation: `Switch to a supported channel: ${currentChannel.name}`,
        affectsClusterUpgrade: false,
        detectedAt: new Date(),
      });
    }

    // Check for lifecycle expiration
    if (lifecycleInfo.supportPhase === SupportPhase.MAINTENANCE_SUPPORT) {
      issues.push({
        id: `${installation.name}-maintenance`,
        operatorName: installation.name,
        severity: IssueSeverity.WARNING,
        type: IssueType.LIFECYCLE_EXPIRING,
        title: 'Operator in maintenance support',
        description: 'This operator version is in maintenance support phase.',
        recommendation: 'Plan an upgrade to a version in full support.',
        affectsClusterUpgrade: false,
        detectedAt: new Date(),
      });
    }

    if (lifecycleInfo.supportPhase === SupportPhase.END_OF_LIFE) {
      issues.push({
        id: `${installation.name}-eol`,
        operatorName: installation.name,
        severity: IssueSeverity.CRITICAL,
        type: IssueType.LIFECYCLE_EXPIRING,
        title: 'Operator end of life',
        description: 'This operator version has reached end of life.',
        recommendation: 'Upgrade immediately to a supported version.',
        affectsClusterUpgrade: true,
        detectedAt: new Date(),
      });
    }

    // Check for version ceiling (blocks cluster upgrade)
    const clusterVersion = await olmClient.getClusterVersion();
    const availableUpdates = clusterVersion.status?.availableUpdates || [];

    if (lifecycleInfo.maxOCPVersion && availableUpdates.length > 0) {
      const nextUpdate = availableUpdates[0];
      const nextVersion = this.extractVersionFromUpdate(nextUpdate);

      if (semver.valid(nextVersion) && semver.valid(lifecycleInfo.maxOCPVersion)) {
        if (semver.gt(nextVersion, lifecycleInfo.maxOCPVersion)) {
          issues.push({
            id: `${installation.name}-version-ceiling`,
            operatorName: installation.name,
            severity: IssueSeverity.CRITICAL,
            type: IssueType.VERSION_CEILING,
            title: 'Operator blocks cluster upgrade',
            description: `This operator version does not support OCP ${nextVersion}. Max supported: ${lifecycleInfo.maxOCPVersion}`,
            recommendation: `Upgrade operator to a version compatible with OCP ${nextVersion} before upgrading the cluster.`,
            affectsClusterUpgrade: true,
            detectedAt: new Date(),
          });
        }
      }
    }

    return issues;
  }

  /**
   * Calculate health status based on issues
   */
  private calculateHealthStatus(issues: UpgradeIssue[]): 'healthy' | 'warning' | 'critical' {
    if (issues.some((i) => i.severity === IssueSeverity.CRITICAL)) {
      return 'critical';
    }
    if (issues.some((i) => i.severity === IssueSeverity.WARNING)) {
      return 'warning';
    }
    return 'healthy';
  }

  /**
   * Map cluster version data to ClusterVersion type
   */
  private mapToClusterVersion(data: any): ClusterVersion {
    const version = data.status?.desired?.version || 'unknown';
    const channel = data.spec?.channel || 'unknown';
    const availableUpdates = data.status?.availableUpdates?.map((u: any) => u.version || u) || [];
    const isEUS = channel.includes('eus');

    return {
      currentVersion: version,
      desiredVersion: data.status?.desired?.version || version,
      channel,
      availableUpdates,
      isEUS,
      // These would come from lifecycle API
      fullSupportEndsAt: undefined,
      maintenanceSupportEndsAt: undefined,
      eolAt: undefined,
    };
  }

  /**
   * Calculate days until support expires
   */
  private calculateSupportExpiry(cluster: ClusterVersion, operators: OperatorStatus[]): number | undefined {
    const dates: Date[] = [];

    if (cluster.maintenanceSupportEndsAt) {
      dates.push(cluster.maintenanceSupportEndsAt);
    }

    operators.forEach((op) => {
      if (op.lifecycleInfo.maintenanceSupportEndsAt) {
        dates.push(op.lifecycleInfo.maintenanceSupportEndsAt);
      }
    });

    if (dates.length === 0) {
      return undefined;
    }

    const earliestExpiry = new Date(Math.min(...dates.map((d) => d.getTime())));
    const now = new Date();
    const daysUntilExpiry = Math.floor((earliestExpiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    return daysUntilExpiry;
  }

  /**
   * Clean version string for semver comparison
   */
  private cleanVersion(version: string): string {
    // Extract version from CSV name like "openshift-gitops-operator.v1.10.0"
    const match = version.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : version;
  }

  /**
   * Extract version from update object
   */
  private extractVersionFromUpdate(update: any): string {
    return typeof update === 'string' ? update : update.version || '';
  }
}

export const lifecycleService = new LifecycleService();
