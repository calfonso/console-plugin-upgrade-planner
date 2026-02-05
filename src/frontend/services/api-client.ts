import axios, { AxiosInstance } from 'axios';
import {
  PlatformStatus,
  OperatorStatus,
  OperatorLifecycleInfo,
  UpgradePlannerRecommendations,
  UpgradePath,
  MaintenanceWindow,
} from '../types';

/**
 * API client for communicating with the backend service
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Use the console proxy path for the backend API
    // The proxy alias is 'upgrade-planner-backend' defined in console-plugin.yaml
    const baseURL = '/api/proxy/plugin/upgrade-planner/upgrade-planner-backend';

    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        console.error('API Error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get platform status
   */
  async getPlatformStatus(): Promise<PlatformStatus> {
    const response = await this.client.get<PlatformStatus>('/api/v1/platform/status');
    return response.data;
  }

  /**
   * Get operator status
   */
  async getOperatorStatus(namespace: string, name: string): Promise<OperatorStatus> {
    const response = await this.client.get<OperatorStatus>(`/api/v1/operators/${namespace}/${name}`);
    return response.data;
  }

  /**
   * Get lifecycle information
   */
  async getLifecycleInfo(operatorName: string, version: string): Promise<OperatorLifecycleInfo> {
    const response = await this.client.get<OperatorLifecycleInfo>(
      `/api/v1/lifecycle/${operatorName}/${version}`
    );
    return response.data;
  }

  /**
   * Get upgrade recommendations
   */
  async getUpgradeRecommendations(): Promise<UpgradePlannerRecommendations> {
    const response = await this.client.get<UpgradePlannerRecommendations>(
      '/api/v1/upgrade/recommendations'
    );
    return response.data;
  }

  /**
   * Get specific upgrade path
   */
  async getUpgradePath(pathId: string): Promise<UpgradePath> {
    const response = await this.client.get<UpgradePath>(`/api/v1/upgrade/paths/${pathId}`);
    return response.data;
  }

  /**
   * Get maintenance windows
   */
  async getMaintenanceWindows(): Promise<MaintenanceWindow[]> {
    const response = await this.client.get<MaintenanceWindow[]>('/api/v1/upgrade/maintenance-windows');
    return response.data;
  }
}

export const apiClient = new ApiClient();
