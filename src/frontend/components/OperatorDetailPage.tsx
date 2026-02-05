import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Page,
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Alert,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { apiClient } from '../services/api-client';
import { OperatorStatus, UpgradeIssue } from '../types';

/**
 * Operator Detail Page - Detailed view of a single operator
 */
const OperatorDetailPage: React.FC = () => {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [operator, setOperator] = React.useState<OperatorStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (namespace && name) {
      loadOperator();
    }
  }, [namespace, name]);

  const loadOperator = async () => {
    if (!namespace || !name) return;

    try {
      setLoading(true);
      setError(null);
      const op = await apiClient.getOperatorStatus(namespace, name);
      setOperator(op);
    } catch (err: any) {
      setError(err.message || 'Failed to load operator');
    } finally {
      setLoading(false);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'red';
      case 'warning':
        return 'orange';
      default:
        return 'blue';
    }
  };

  if (loading) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <Spinner size="xl" />
            <EmptyStateBody>Loading operator details...</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageSection>
          <Alert variant="danger" title="Error loading operator">
            {error}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (!operator) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationCircleIcon} />
            <EmptyStateBody>Operator not found</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1">{operator.installation.displayName}</Title>
        <Label color={getSeverityColor(operator.healthStatus)}>{operator.healthStatus}</Label>
      </PageSection>

      <PageSection>
        {/* Installation Details */}
        <Card>
          <CardTitle>Installation Details</CardTitle>
          <CardBody>
            <DescriptionList isHorizontal>
              <DescriptionListGroup>
                <DescriptionListTerm>Namespace</DescriptionListTerm>
                <DescriptionListDescription>{operator.installation.namespace}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Current Version</DescriptionListTerm>
                <DescriptionListDescription>{operator.installation.currentVersion}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Channel</DescriptionListTerm>
                <DescriptionListDescription>{operator.installation.currentChannel}</DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Catalog Source</DescriptionListTerm>
                <DescriptionListDescription>
                  {operator.installation.catalogSource}/{operator.installation.catalogNamespace}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Auto Approval</DescriptionListTerm>
                <DescriptionListDescription>
                  {operator.installation.approved ? 'Enabled' : 'Disabled'}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Lifecycle Model</DescriptionListTerm>
                <DescriptionListDescription style={{ textTransform: 'capitalize' }}>
                  {operator.lifecycleInfo.lifecycleModel.replace('-', ' ')}
                </DescriptionListDescription>
              </DescriptionListGroup>
              <DescriptionListGroup>
                <DescriptionListTerm>Support Phase</DescriptionListTerm>
                <DescriptionListDescription style={{ textTransform: 'capitalize' }}>
                  {operator.lifecycleInfo.supportPhase.replace('-', ' ')}
                </DescriptionListDescription>
              </DescriptionListGroup>
            </DescriptionList>
          </CardBody>
        </Card>

        {/* Issues */}
        {operator.issues.length > 0 && (
          <Card style={{ marginTop: '1rem' }}>
            <CardTitle>Issues ({operator.issues.length})</CardTitle>
            <CardBody>
              {operator.issues.map((issue: UpgradeIssue) => (
                <Alert
                  key={issue.id}
                  variant={issue.severity === 'critical' ? 'danger' : 'warning'}
                  title={issue.title}
                  isInline
                  style={{ marginBottom: '0.5rem' }}
                >
                  <p>{issue.description}</p>
                  <p>
                    <strong>Recommendation:</strong> {issue.recommendation}
                  </p>
                  {issue.affectsClusterUpgrade && (
                    <p style={{ color: 'red', fontWeight: 'bold' }}>⚠️ Blocks cluster upgrade</p>
                  )}
                </Alert>
              ))}
            </CardBody>
          </Card>
        )}

        {/* Available Upgrades */}
        {operator.availableUpgrades.length > 0 && (
          <Card style={{ marginTop: '1rem' }}>
            <CardTitle>Available Upgrades ({operator.availableUpgrades.length})</CardTitle>
            <CardBody>
              <Table variant="compact">
                <Thead>
                  <Tr>
                    <Th>Target Version</Th>
                    <Th>Channel</Th>
                    <Th>Support Phase</Th>
                    <Th>Release Date</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {operator.availableUpgrades.map((upgrade, index) => (
                    <Tr key={index}>
                      <Td>{upgrade.targetVersion}</Td>
                      <Td>{upgrade.channel}</Td>
                      <Td style={{ textTransform: 'capitalize' }}>
                        {upgrade.lifecycleInfo.supportPhase.replace('-', ' ')}
                      </Td>
                      <Td>{new Date(upgrade.releaseDate).toLocaleDateString()}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </CardBody>
          </Card>
        )}

        {/* Available Channels */}
        <Card style={{ marginTop: '1rem' }}>
          <CardTitle>Available Channels ({operator.availableChannels.length})</CardTitle>
          <CardBody>
            <Table variant="compact">
              <Thead>
                <Tr>
                  <Th>Channel Name</Th>
                  <Th>Current CSV</Th>
                  <Th>Versions Available</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {operator.availableChannels.map((channel, index) => (
                  <Tr key={index}>
                    <Td>
                      {channel.name}
                      {channel.name === operator.installation.currentChannel && (
                        <Label color="blue" style={{ marginLeft: '8px' }}>
                          Current
                        </Label>
                      )}
                    </Td>
                    <Td>{channel.currentCSV}</Td>
                    <Td>{channel.availableVersions.length}</Td>
                    <Td>
                      {channel.deprecated ? (
                        <Label color="red">Deprecated</Label>
                      ) : (
                        <Label color="green">Active</Label>
                      )}
                    </Td>
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

export default OperatorDetailPage;
