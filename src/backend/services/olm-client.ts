import * as k8s from '@kubernetes/client-node';
import { OperatorInstallation, OperatorChannel } from '../../shared/types';
import { logger } from '../utils/logger';

/**
 * OLM API client for interacting with Operator Lifecycle Manager
 */
export class OLMClient {
  private k8sApi: k8s.CustomObjectsApi;
  private kc: k8s.KubeConfig;

  constructor() {
    this.kc = new k8s.KubeConfig();

    // Load kubeconfig from default location or in-cluster config
    if (process.env.KUBERNETES_SERVICE_HOST) {
      this.kc.loadFromCluster();
    } else {
      this.kc.loadFromDefault();
    }

    this.k8sApi = this.kc.makeApiClient(k8s.CustomObjectsApi);
  }

  /**
   * Get all operator subscriptions across all namespaces
   */
  async getOperatorSubscriptions(): Promise<OperatorInstallation[]> {
    try {
      const response = await this.k8sApi.listClusterCustomObject(
        'operators.coreos.com',
        'v1alpha1',
        'subscriptions'
      );

      const subscriptions = (response.body as any).items || [];

      return subscriptions.map((sub: any) => this.mapSubscriptionToInstallation(sub));
    } catch (error) {
      logger.error({ error }, 'Failed to fetch operator subscriptions');
      throw new Error('Failed to fetch operator subscriptions');
    }
  }

  /**
   * Get subscription for a specific operator
   */
  async getOperatorSubscription(name: string, namespace: string): Promise<OperatorInstallation | null> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'subscriptions',
        name
      );

      return this.mapSubscriptionToInstallation(response.body as any);
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return null;
      }
      logger.error({ error, name, namespace }, 'Failed to fetch operator subscription');
      throw new Error(`Failed to fetch operator subscription: ${name}`);
    }
  }

  /**
   * Get ClusterServiceVersion (CSV) for an operator
   */
  async getClusterServiceVersion(name: string, namespace: string): Promise<any> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'clusterserviceversions',
        name
      );

      return response.body;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return null;
      }
      logger.error({ error, name, namespace }, 'Failed to fetch CSV');
      throw new Error(`Failed to fetch CSV: ${name}`);
    }
  }

  /**
   * Get all available channels for an operator from catalog
   */
  async getOperatorChannels(packageName: string, catalogSource: string, catalogNamespace: string): Promise<OperatorChannel[]> {
    try {
      // Get the PackageManifest which contains channel information
      const response = await this.k8sApi.getNamespacedCustomObject(
        'packages.operators.coreos.com',
        'v1',
        catalogNamespace,
        'packagemanifests',
        packageName
      );

      const pkg = response.body as any;
      const channels = pkg.status?.channels || [];

      return channels.map((channel: any) => ({
        name: channel.name,
        currentCSV: channel.currentCSV,
        availableVersions: channel.entries?.map((e: any) => e.version) || [],
        deprecated: channel.deprecation?.message ? true : false,
        deprecationMessage: channel.deprecation?.message,
        availableInOCPVersion: this.extractOCPVersionsFromChannel(channel),
      }));
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        logger.warn({ packageName, catalogSource }, 'PackageManifest not found');
        return [];
      }
      logger.error({ error, packageName, catalogSource }, 'Failed to fetch operator channels');
      throw new Error(`Failed to fetch channels for: ${packageName}`);
    }
  }

  /**
   * Get InstallPlan for an operator to check upgrade status
   */
  async getInstallPlans(namespace: string): Promise<any[]> {
    try {
      const response = await this.k8sApi.listNamespacedCustomObject(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'installplans'
      );

      return (response.body as any).items || [];
    } catch (error) {
      logger.error({ error, namespace }, 'Failed to fetch install plans');
      throw new Error('Failed to fetch install plans');
    }
  }

  /**
   * Get CatalogSource information
   */
  async getCatalogSource(name: string, namespace: string): Promise<any> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        'operators.coreos.com',
        'v1alpha1',
        namespace,
        'catalogsources',
        name
      );

      return response.body;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return null;
      }
      logger.error({ error, name, namespace }, 'Failed to fetch catalog source');
      throw new Error(`Failed to fetch catalog source: ${name}`);
    }
  }

  /**
   * Get cluster version information
   */
  async getClusterVersion(): Promise<any> {
    try {
      const response = await this.k8sApi.getClusterCustomObject(
        'config.openshift.io',
        'v1',
        'clusterversions',
        'version'
      );

      return response.body;
    } catch (error) {
      logger.error({ error }, 'Failed to fetch cluster version');
      throw new Error('Failed to fetch cluster version');
    }
  }

  /**
   * Get OperatorCondition for an operator (health status)
   */
  async getOperatorCondition(name: string, namespace: string): Promise<any> {
    try {
      const response = await this.k8sApi.getNamespacedCustomObject(
        'operators.coreos.com',
        'v2',
        namespace,
        'operatorconditions',
        name
      );

      return response.body;
    } catch (error: any) {
      if (error.response?.statusCode === 404) {
        return null;
      }
      logger.error({ error, name, namespace }, 'Failed to fetch operator condition');
      return null;
    }
  }

  /**
   * Helper: Map subscription object to OperatorInstallation
   */
  private mapSubscriptionToInstallation(sub: any): OperatorInstallation {
    return {
      name: sub.metadata.name,
      displayName: sub.spec?.name || sub.metadata.name,
      namespace: sub.metadata.namespace,
      currentVersion: sub.status?.currentCSV || 'unknown',
      currentChannel: sub.spec?.channel || 'unknown',
      catalogSource: sub.spec?.source || 'unknown',
      catalogNamespace: sub.spec?.sourceNamespace || 'unknown',
      installedAt: new Date(sub.metadata.creationTimestamp),
      updatedAt: new Date(sub.status?.lastUpdated || sub.metadata.creationTimestamp),
      approved: sub.spec?.installPlanApproval === 'Automatic',
    };
  }

  /**
   * Helper: Extract OCP version compatibility from channel metadata
   */
  private extractOCPVersionsFromChannel(channel: any): string[] | undefined {
    // This would parse channel annotations or properties to determine
    // which OCP versions this channel is available for
    const properties = channel.currentCSVDesc?.annotations || {};
    const ocpVersionAnnotation = properties['com.redhat.openshift.versions'];

    if (ocpVersionAnnotation) {
      // Parse version ranges like "v4.14-v4.16"
      return ocpVersionAnnotation.split(',').map((v: string) => v.trim());
    }

    return undefined;
  }
}

export const olmClient = new OLMClient();
