import * as semver from 'semver';
import { lifecycleService } from './lifecycle-service';
import {
  UpgradePath,
  UpgradeStep,
  MaintenanceWindow,
  UpgradePlannerRecommendations,
  PlatformStatus,
  OperatorStatus,
  IssueSeverity,
} from '../../shared/types';
import { logger } from '../utils/logger';

/**
 * Service for generating upgrade paths and maintenance window recommendations
 */
export class UpgradePlannerService {
  /**
   * Get complete upgrade recommendations for the platform
   */
  async getUpgradeRecommendations(): Promise<UpgradePlannerRecommendations> {
    try {
      const platformStatus = await lifecycleService.getPlatformStatus();

      const recommendedPaths = await this.generateUpgradePaths(platformStatus);
      const maintenanceWindows = this.generateMaintenanceWindows(platformStatus, recommendedPaths);

      return {
        platformStatus,
        recommendedPaths,
        maintenanceWindows,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error({ error }, 'Failed to generate upgrade recommendations');
      throw new Error('Failed to generate upgrade recommendations');
    }
  }

  /**
   * Generate recommended upgrade paths
   */
  private async generateUpgradePaths(platformStatus: PlatformStatus): Promise<UpgradePath[]> {
    const paths: UpgradePath[] = [];

    // Path 1: Critical issues first - address blocking operators
    const criticalPath = this.generateCriticalIssuePath(platformStatus);
    if (criticalPath) {
      paths.push(criticalPath);
    }

    // Path 2: Conservative path - minimize changes, maximize support time
    const conservativePath = this.generateConservativePath(platformStatus);
    if (conservativePath) {
      paths.push(conservativePath);
    }

    // Path 3: Aggressive path - upgrade everything to latest
    const aggressivePath = this.generateAggressivePath(platformStatus);
    if (aggressivePath) {
      paths.push(aggressivePath);
    }

    // Path 4: Balanced path - optimal mix of stability and currency
    const balancedPath = this.generateBalancedPath(platformStatus);
    if (balancedPath) {
      paths.push(balancedPath);
    }

    return paths;
  }

  /**
   * Generate path to address critical issues
   */
  private generateCriticalIssuePath(platformStatus: PlatformStatus): UpgradePath | null {
    const criticalOperators = platformStatus.operators.filter((op) =>
      op.issues.some((i) => i.severity === IssueSeverity.CRITICAL)
    );

    if (criticalOperators.length === 0) {
      return null;
    }

    const steps: UpgradeStep[] = [];
    let order = 1;

    // Add verification step first
    steps.push({
      order: order++,
      type: 'verification',
      target: 'cluster',
      description: 'Verify cluster health and backup current state',
      estimatedDuration: '15 minutes',
      requiredPrerequisites: ['Cluster backup', 'etcd snapshot'],
      rollbackStrategy: 'Restore from backup',
    });

    // Upgrade critical operators
    for (const operator of criticalOperators) {
      const upgrade = operator.availableUpgrades[0]; // Get first available upgrade

      if (upgrade) {
        steps.push({
          order: order++,
          type: 'operator',
          target: operator.installation.name,
          fromVersion: operator.installation.currentVersion,
          toVersion: upgrade.targetVersion,
          channel: upgrade.channel,
          description: `Upgrade ${operator.installation.displayName} to resolve critical issues`,
          estimatedDuration: '10-20 minutes',
          requiredPrerequisites: ['Review operator documentation', 'Check for breaking changes'],
          rollbackStrategy: 'Uninstall and reinstall previous version',
        });
      }
    }

    // Add cluster upgrade if cluster updates are available
    if (platformStatus.cluster.availableUpdates.length > 0) {
      const nextVersion = platformStatus.cluster.availableUpdates[0];
      steps.push({
        order: order++,
        type: 'cluster',
        target: 'OpenShift Cluster',
        fromVersion: platformStatus.cluster.currentVersion,
        toVersion: nextVersion,
        channel: platformStatus.cluster.channel,
        description: `Upgrade OpenShift to ${nextVersion}`,
        estimatedDuration: '45-90 minutes',
        requiredPrerequisites: [
          'All operators compatible',
          'Cluster health verified',
          'Backup completed',
        ],
        rollbackStrategy: 'Not supported - ensure all prerequisites are met',
      });
    }

    const totalDuration = this.calculateTotalDuration(steps);
    const supportedUntil = this.calculateSupportedUntil(platformStatus, steps);

    return {
      id: 'critical-issues-path',
      description: 'Address critical issues that block cluster operations and upgrades',
      estimatedDuration: totalDuration,
      confidence: 'high',
      steps,
      benefits: [
        'Resolves blocking issues',
        'Enables cluster upgrade',
        'Reduces immediate risks',
      ],
      risks: [
        'May require multiple operator updates',
        'Some downtime expected',
      ],
      supportedUntil,
    };
  }

  /**
   * Generate conservative upgrade path
   */
  private generateConservativePath(platformStatus: PlatformStatus): UpgradePath | null {
    const steps: UpgradeStep[] = [];
    let order = 1;

    steps.push({
      order: order++,
      type: 'verification',
      target: 'cluster',
      description: 'Verify cluster health and backup',
      estimatedDuration: '15 minutes',
      requiredPrerequisites: ['Cluster backup'],
      rollbackStrategy: 'Restore from backup',
    });

    // Only upgrade operators with warnings
    const operatorsWithWarnings = platformStatus.operators.filter((op) =>
      op.issues.some((i) => i.severity === IssueSeverity.WARNING)
    );

    for (const operator of operatorsWithWarnings) {
      // Only upgrade to the next minor version
      const conservativeUpgrade = this.findConservativeUpgrade(operator);
      if (conservativeUpgrade) {
        steps.push({
          order: order++,
          type: 'operator',
          target: operator.installation.name,
          fromVersion: operator.installation.currentVersion,
          toVersion: conservativeUpgrade.targetVersion,
          channel: conservativeUpgrade.channel,
          description: `Conservative upgrade of ${operator.installation.displayName}`,
          estimatedDuration: '10-20 minutes',
          requiredPrerequisites: ['Review release notes'],
          rollbackStrategy: 'Reinstall previous version',
        });
      }
    }

    if (steps.length === 1) {
      return null; // Only verification step, no actual upgrades
    }

    const totalDuration = this.calculateTotalDuration(steps);
    const supportedUntil = this.calculateSupportedUntil(platformStatus, steps);

    return {
      id: 'conservative-path',
      description: 'Minimal upgrades to extend support without major version changes',
      estimatedDuration: totalDuration,
      confidence: 'high',
      steps,
      benefits: [
        'Minimal risk',
        'Extends support period',
        'Small scope of changes',
      ],
      risks: [
        'May need another upgrade soon',
        'Not addressing all available updates',
      ],
      supportedUntil,
    };
  }

  /**
   * Generate aggressive upgrade path
   */
  private generateAggressivePath(platformStatus: PlatformStatus): UpgradePath | null {
    const steps: UpgradeStep[] = [];
    let order = 1;

    steps.push({
      order: order++,
      type: 'verification',
      target: 'cluster',
      description: 'Verify cluster health and backup',
      estimatedDuration: '15 minutes',
      requiredPrerequisites: ['Cluster backup'],
      rollbackStrategy: 'Restore from backup',
    });

    // Upgrade all operators to latest version
    for (const operator of platformStatus.operators) {
      if (operator.availableUpgrades.length > 0) {
        // Get the latest upgrade
        const latestUpgrade = operator.availableUpgrades.reduce((latest, current) =>
          semver.gt(this.cleanVersion(current.targetVersion), this.cleanVersion(latest.targetVersion))
            ? current
            : latest
        );

        steps.push({
          order: order++,
          type: 'operator',
          target: operator.installation.name,
          fromVersion: operator.installation.currentVersion,
          toVersion: latestUpgrade.targetVersion,
          channel: latestUpgrade.channel,
          description: `Upgrade ${operator.installation.displayName} to latest version`,
          estimatedDuration: '10-20 minutes',
          requiredPrerequisites: ['Review all release notes', 'Check for breaking changes'],
          rollbackStrategy: 'Reinstall previous version',
        });
      }
    }

    // Upgrade cluster to latest available
    if (platformStatus.cluster.availableUpdates.length > 0) {
      const latestVersion =
        platformStatus.cluster.availableUpdates[platformStatus.cluster.availableUpdates.length - 1];

      steps.push({
        order: order++,
        type: 'cluster',
        target: 'OpenShift Cluster',
        fromVersion: platformStatus.cluster.currentVersion,
        toVersion: latestVersion,
        channel: platformStatus.cluster.channel,
        description: `Upgrade OpenShift to latest version ${latestVersion}`,
        estimatedDuration: '45-90 minutes',
        requiredPrerequisites: [
          'All operators compatible',
          'Cluster health verified',
          'Backup completed',
        ],
        rollbackStrategy: 'Not supported - ensure all prerequisites are met',
      });
    }

    if (steps.length === 1) {
      return null;
    }

    const totalDuration = this.calculateTotalDuration(steps);
    const supportedUntil = this.calculateSupportedUntil(platformStatus, steps);

    return {
      id: 'aggressive-path',
      description: 'Upgrade all components to latest versions for maximum support duration',
      estimatedDuration: totalDuration,
      confidence: 'medium',
      steps,
      benefits: [
        'Maximum support duration',
        'Latest features and fixes',
        'Fewest future maintenance windows',
      ],
      risks: [
        'More potential for breaking changes',
        'Longer maintenance window',
        'More testing required',
      ],
      supportedUntil,
    };
  }

  /**
   * Generate balanced upgrade path
   */
  private generateBalancedPath(platformStatus: PlatformStatus): UpgradePath | null {
    const steps: UpgradeStep[] = [];
    let order = 1;

    steps.push({
      order: order++,
      type: 'verification',
      target: 'cluster',
      description: 'Verify cluster health and backup',
      estimatedDuration: '15 minutes',
      requiredPrerequisites: ['Cluster backup'],
      rollbackStrategy: 'Restore from backup',
    });

    // Upgrade operators with issues or outdated by more than one minor version
    for (const operator of platformStatus.operators) {
      const shouldUpgrade =
        operator.issues.length > 0 ||
        this.isSignificantlyOutdated(operator);

      if (shouldUpgrade && operator.availableUpgrades.length > 0) {
        const targetUpgrade = this.findBalancedUpgrade(operator);
        if (targetUpgrade) {
          steps.push({
            order: order++,
            type: 'operator',
            target: operator.installation.name,
            fromVersion: operator.installation.currentVersion,
            toVersion: targetUpgrade.targetVersion,
            channel: targetUpgrade.channel,
            description: `Upgrade ${operator.installation.displayName} to recommended version`,
            estimatedDuration: '10-20 minutes',
            requiredPrerequisites: ['Review release notes'],
            rollbackStrategy: 'Reinstall previous version',
          });
        }
      }
    }

    // Upgrade cluster if reasonable
    if (platformStatus.cluster.availableUpdates.length > 0) {
      // For balanced, upgrade to next minor version or latest patch of current minor
      const targetVersion = platformStatus.cluster.availableUpdates[0];

      steps.push({
        order: order++,
        type: 'cluster',
        target: 'OpenShift Cluster',
        fromVersion: platformStatus.cluster.currentVersion,
        toVersion: targetVersion,
        channel: platformStatus.cluster.channel,
        description: `Upgrade OpenShift to ${targetVersion}`,
        estimatedDuration: '45-90 minutes',
        requiredPrerequisites: [
          'All operators compatible',
          'Cluster health verified',
        ],
        rollbackStrategy: 'Not supported',
      });
    }

    if (steps.length === 1) {
      return null;
    }

    const totalDuration = this.calculateTotalDuration(steps);
    const supportedUntil = this.calculateSupportedUntil(platformStatus, steps);

    return {
      id: 'balanced-path',
      description: 'Optimal balance of risk, effort, and support duration',
      estimatedDuration: totalDuration,
      confidence: 'high',
      steps,
      benefits: [
        'Good balance of risk and reward',
        'Addresses key issues',
        'Reasonable maintenance window',
        'Extended support period',
      ],
      risks: [
        'Some operator updates required',
        'Moderate testing effort',
      ],
      supportedUntil,
    };
  }

  /**
   * Generate maintenance window recommendations
   */
  private generateMaintenanceWindows(
    platformStatus: PlatformStatus,
    paths: UpgradePath[]
  ): MaintenanceWindow[] {
    const windows: MaintenanceWindow[] = [];

    // Immediate window for critical issues
    if (platformStatus.criticalIssues > 0) {
      const criticalPath = paths.find((p) => p.id === 'critical-issues-path');
      if (criticalPath) {
        windows.push({
          id: 'immediate-window',
          recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
          priority: 'high',
          reason: 'Critical issues detected that may block cluster operations',
          affectedComponents: this.extractAffectedComponents(criticalPath),
          estimatedDuration: criticalPath.estimatedDuration,
          upgradePath: criticalPath,
        });
      }
    }

    // Regular maintenance window
    const balancedPath = paths.find((p) => p.id === 'balanced-path');
    if (balancedPath) {
      windows.push({
        id: 'regular-maintenance',
        recommendedDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1 month from now
        priority: platformStatus.criticalIssues > 0 ? 'high' : 'medium',
        reason: 'Regular maintenance to keep platform current and supported',
        affectedComponents: this.extractAffectedComponents(balancedPath),
        estimatedDuration: balancedPath.estimatedDuration,
        upgradePath: balancedPath,
      });
    }

    // Lifecycle-driven window if support is expiring soon
    if (platformStatus.supportExpiresIn && platformStatus.supportExpiresIn < 90) {
      const aggressivePath = paths.find((p) => p.id === 'aggressive-path');
      if (aggressivePath) {
        windows.push({
          id: 'lifecycle-maintenance',
          recommendedDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
          priority: 'high',
          reason: `Platform support expires in ${platformStatus.supportExpiresIn} days`,
          affectedComponents: this.extractAffectedComponents(aggressivePath),
          estimatedDuration: aggressivePath.estimatedDuration,
          upgradePath: aggressivePath,
        });
      }
    }

    return windows;
  }

  /**
   * Helper: Find conservative upgrade (next minor version)
   */
  private findConservativeUpgrade(operator: OperatorStatus) {
    if (operator.availableUpgrades.length === 0) {
      return null;
    }

    const currentVersion = this.cleanVersion(operator.installation.currentVersion);
    const currentSemver = semver.parse(currentVersion);

    if (!currentSemver) {
      return operator.availableUpgrades[0];
    }

    // Find the smallest upgrade (next patch or minor)
    return operator.availableUpgrades.reduce((closest, current) => {
      const closestVersion = this.cleanVersion(closest.targetVersion);
      const currentTargetVersion = this.cleanVersion(current.targetVersion);

      if (semver.diff(currentVersion, currentTargetVersion) === 'patch') {
        return current;
      }

      if (
        semver.diff(currentVersion, currentTargetVersion) === 'minor' &&
        semver.lt(currentTargetVersion, closestVersion)
      ) {
        return current;
      }

      return closest;
    });
  }

  /**
   * Helper: Find balanced upgrade (stable, recommended version)
   */
  private findBalancedUpgrade(operator: OperatorStatus) {
    if (operator.availableUpgrades.length === 0) {
      return null;
    }

    // Prefer stable channels and recommended versions
    const stableUpgrades = operator.availableUpgrades.filter(
      (u) => u.channel.includes('stable') || u.channel.includes('recommended')
    );

    if (stableUpgrades.length > 0) {
      // Return the latest stable
      return stableUpgrades[stableUpgrades.length - 1];
    }

    // Otherwise return the middle upgrade
    return operator.availableUpgrades[Math.floor(operator.availableUpgrades.length / 2)];
  }

  /**
   * Helper: Check if operator is significantly outdated
   */
  private isSignificantlyOutdated(operator: OperatorStatus): boolean {
    if (operator.availableUpgrades.length === 0) {
      return false;
    }

    const currentVersion = this.cleanVersion(operator.installation.currentVersion);
    const latestVersion = this.cleanVersion(
      operator.availableUpgrades[operator.availableUpgrades.length - 1].targetVersion
    );

    if (!semver.valid(currentVersion) || !semver.valid(latestVersion)) {
      return false;
    }

    const diff = semver.diff(currentVersion, latestVersion);
    return diff === 'minor' || diff === 'major';
  }

  /**
   * Helper: Calculate total duration
   */
  private calculateTotalDuration(steps: UpgradeStep[]): string {
    // Simple sum of maximum estimates
    let totalMinutes = 0;

    for (const step of steps) {
      const match = step.estimatedDuration.match(/(\d+)-?(\d+)?\s*minutes?/);
      if (match) {
        totalMinutes += parseInt(match[2] || match[1], 10);
      }
    }

    if (totalMinutes < 60) {
      return `${totalMinutes} minutes`;
    }

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}h ${minutes}m`;
  }

  /**
   * Helper: Calculate support end date after upgrades
   */
  private calculateSupportedUntil(_platformStatus: PlatformStatus, _steps: UpgradeStep[]): Date {
    // This would query the lifecycle API for the support dates of target versions
    // For now, estimate based on typical support cycles
    const now = new Date();
    const estimatedSupportMonths = 18; // Typical OCP support is 18 months
    return new Date(now.setMonth(now.getMonth() + estimatedSupportMonths));
  }

  /**
   * Helper: Extract affected components from upgrade path
   */
  private extractAffectedComponents(path: UpgradePath): string[] {
    return path.steps
      .filter((s) => s.type !== 'verification')
      .map((s) => s.target);
  }

  /**
   * Helper: Clean version string
   */
  private cleanVersion(version: string): string {
    const match = version.match(/v?(\d+\.\d+\.\d+)/);
    return match ? match[1] : version;
  }
}

export const upgradePlannerService = new UpgradePlannerService();
