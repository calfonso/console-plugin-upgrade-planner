import * as React from 'react';
import {
  Page,
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Grid,
  GridItem,
  Alert,
  AlertVariant,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Toolbar,
  ToolbarContent,
  ToolbarItem,
  SearchInput,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { ExclamationCircleIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@patternfly/react-icons';
import { apiClient } from '../services/api-client';
import { PlatformStatus, OperatorStatus, IssueSeverity } from '../types';

/**
 * Lifecycle Dashboard - Shows overall platform and operator lifecycle status
 */
const LifecycleDashboard: React.FC = () => {
  const [platformStatus, setPlatformStatus] = React.useState<PlatformStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    loadPlatformStatus();
  }, []);

  const loadPlatformStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const status = await apiClient.getPlatformStatus();
      setPlatformStatus(status);
    } catch (err: any) {
      setError(err.message || 'Failed to load platform status');
    } finally {
      setLoading(false);
    }
  };

  const filteredOperators = React.useMemo(() => {
    if (!platformStatus) return [];

    if (!searchTerm) {
      return platformStatus.operators;
    }

    return platformStatus.operators.filter(
      (op) =>
        op.installation.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        op.installation.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [platformStatus, searchTerm]);

  const getHealthIcon = (health: 'healthy' | 'warning' | 'critical') => {
    switch (health) {
      case 'healthy':
        return <CheckCircleIcon color="green" />;
      case 'warning':
        return <ExclamationTriangleIcon color="orange" />;
      case 'critical':
        return <ExclamationCircleIcon color="red" />;
    }
  };


  if (loading) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <Spinner size="xl" />
            <EmptyStateBody>Loading platform status...</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageSection>
          <Alert variant={AlertVariant.danger} title="Error loading platform status">
            {error}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (!platformStatus) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationCircleIcon} />
            <EmptyStateBody>No platform status available</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1">Platform Lifecycle Dashboard</Title>
      </PageSection>

      <PageSection>
        {/* Overall Status Cards */}
        <Grid hasGutter>
          <GridItem span={3}>
            <Card>
              <CardTitle>Overall Health</CardTitle>
              <CardBody>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1.5rem' }}>
                  {getHealthIcon(platformStatus.overallHealth)}
                  <span style={{ textTransform: 'capitalize' }}>{platformStatus.overallHealth}</span>
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card>
              <CardTitle>Cluster Version</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.2rem' }}>{platformStatus.cluster.currentVersion}</div>
                <div style={{ fontSize: '0.9rem', color: '#666' }}>
                  Channel: {platformStatus.cluster.channel}
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card>
              <CardTitle>Total Issues</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.5rem' }}>
                  {platformStatus.totalIssues}
                  {platformStatus.criticalIssues > 0 && (
                    <span style={{ color: 'red', marginLeft: '8px' }}>
                      ({platformStatus.criticalIssues} critical)
                    </span>
                  )}
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={3}>
            <Card>
              <CardTitle>Support Expires In</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.5rem' }}>
                  {platformStatus.supportExpiresIn !== undefined
                    ? `${platformStatus.supportExpiresIn} days`
                    : 'Unknown'}
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Critical Alerts */}
        {platformStatus.criticalIssues > 0 && (
          <Alert
            variant={AlertVariant.danger}
            title={`${platformStatus.criticalIssues} critical issue(s) detected`}
            style={{ marginTop: '1rem' }}
          >
            Critical issues may block cluster upgrades or cause operational problems. Review operators below for
            details.
          </Alert>
        )}

        {/* Next Maintenance Window */}
        {platformStatus.nextMaintenanceWindow && (
          <Alert
            variant={AlertVariant.info}
            title="Recommended Maintenance Window"
            style={{ marginTop: '1rem' }}
          >
            <strong>{platformStatus.nextMaintenanceWindow.reason}</strong>
            <div>
              Recommended date:{' '}
              {new Date(platformStatus.nextMaintenanceWindow.recommendedDate).toLocaleDateString()}
            </div>
            <div>Estimated duration: {platformStatus.nextMaintenanceWindow.estimatedDuration}</div>
          </Alert>
        )}

        {/* Operators Table */}
        <Card style={{ marginTop: '1.5rem' }}>
          <CardTitle>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Installed Operators ({filteredOperators.length})</span>
              <Toolbar style={{ padding: 0 }}>
                <ToolbarContent>
                  <ToolbarItem>
                    <SearchInput
                      placeholder="Filter operators"
                      value={searchTerm}
                      onChange={(_event, value) => setSearchTerm(value)}
                      onClear={() => setSearchTerm('')}
                    />
                  </ToolbarItem>
                </ToolbarContent>
              </Toolbar>
            </div>
          </CardTitle>
          <CardBody>
            <Table variant="compact">
              <Thead>
                <Tr>
                  <Th>Status</Th>
                  <Th>Operator</Th>
                  <Th>Version</Th>
                  <Th>Channel</Th>
                  <Th>Lifecycle Model</Th>
                  <Th>Support Phase</Th>
                  <Th>Issues</Th>
                  <Th>Upgrades Available</Th>
                </Tr>
              </Thead>
              <Tbody>
                {filteredOperators.map((operator: OperatorStatus) => (
                  <Tr key={`${operator.installation.namespace}/${operator.installation.name}`}>
                    <Td>{getHealthIcon(operator.healthStatus)}</Td>
                    <Td>
                      <a href={`/upgrade-planner/operator/${operator.installation.namespace}/${operator.installation.name}`}>
                        {operator.installation.displayName}
                      </a>
                    </Td>
                    <Td>{operator.installation.currentVersion}</Td>
                    <Td>{operator.installation.currentChannel}</Td>
                    <Td style={{ textTransform: 'capitalize' }}>
                      {operator.lifecycleInfo.lifecycleModel.replace('-', ' ')}
                    </Td>
                    <Td style={{ textTransform: 'capitalize' }}>
                      {operator.lifecycleInfo.supportPhase.replace('-', ' ')}
                    </Td>
                    <Td>
                      {operator.issues.length > 0 ? (
                        <span>
                          {operator.issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length > 0 && (
                            <span style={{ color: 'red', marginRight: '4px' }}>
                              {operator.issues.filter((i) => i.severity === IssueSeverity.CRITICAL).length} critical
                            </span>
                          )}
                          {operator.issues.filter((i) => i.severity === IssueSeverity.WARNING).length > 0 && (
                            <span style={{ color: 'orange' }}>
                              {operator.issues.filter((i) => i.severity === IssueSeverity.WARNING).length} warning
                            </span>
                          )}
                        </span>
                      ) : (
                        <span style={{ color: 'green' }}>None</span>
                      )}
                    </Td>
                    <Td>{operator.availableUpgrades.length}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </CardBody>
        </Card>
      </PageSection>
    </Page>
  );
};

export default LifecycleDashboard;
