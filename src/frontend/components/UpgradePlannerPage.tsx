import * as React from 'react';
import {
  Page,
  PageSection,
  Title,
  Card,
  CardTitle,
  CardBody,
  Alert,
  AlertVariant,
  Spinner,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
  Tabs,
  Tab,
  TabTitleText,
  Grid,
  GridItem,
  List,
  ListItem,
  Badge,
  Button,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td, ExpandableRowContent } from '@patternfly/react-table';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  InfoCircleIcon,
  CalendarAltIcon,
} from '@patternfly/react-icons';
import { apiClient } from '../services/api-client';
import { UpgradePlannerRecommendations, UpgradePath, MaintenanceWindow } from '../types';

/**
 * Upgrade Planner Page - Main entry point showing recommendations and paths
 */
const UpgradePlannerPage: React.FC = () => {
  const [recommendations, setRecommendations] = React.useState<UpgradePlannerRecommendations | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<string | number>(0);
  const [expandedPaths, setExpandedPaths] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);
      const recs = await apiClient.getUpgradeRecommendations();
      setRecommendations(recs);
    } catch (err: any) {
      setError(err.message || 'Failed to load recommendations');
    } finally {
      setLoading(false);
    }
  };

  const togglePathExpansion = (pathId: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(pathId)) {
      newExpanded.delete(pathId);
    } else {
      newExpanded.add(pathId);
    }
    setExpandedPaths(newExpanded);
  };

  const getConfidenceBadge = (confidence: string) => {
    return <Badge isRead>{confidence}</Badge>;
  };

  const getPriorityVariant = (priority: string): AlertVariant => {
    switch (priority) {
      case 'high':
        return AlertVariant.danger;
      case 'medium':
        return AlertVariant.warning;
      default:
        return AlertVariant.info;
    }
  };

  if (loading) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <Spinner size="xl" />
            <EmptyStateBody>Generating upgrade recommendations...</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageSection>
          <Alert variant={AlertVariant.danger} title="Error loading recommendations">
            {error}
          </Alert>
        </PageSection>
      </Page>
    );
  }

  if (!recommendations) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <EmptyStateIcon icon={ExclamationCircleIcon} />
            <EmptyStateBody>No recommendations available</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1">Upgrade Planner</Title>
        <p style={{ marginTop: '0.5rem', color: '#666' }}>
          AI-powered recommendations for managing operator and cluster upgrades
        </p>
      </PageSection>

      <PageSection>
        {/* Platform Status Summary */}
        <Grid hasGutter>
          <GridItem span={4}>
            <Card>
              <CardTitle>Platform Health</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.2rem', textTransform: 'capitalize' }}>
                  {recommendations.platformStatus.overallHealth === 'healthy' && (
                    <CheckCircleIcon color="green" />
                  )}
                  {recommendations.platformStatus.overallHealth === 'warning' && (
                    <InfoCircleIcon color="orange" />
                  )}
                  {recommendations.platformStatus.overallHealth === 'critical' && (
                    <ExclamationCircleIcon color="red" />
                  )}
                  <span style={{ marginLeft: '8px' }}>
                    {recommendations.platformStatus.overallHealth}
                  </span>
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {recommendations.platformStatus.totalIssues} issues detected
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardTitle>Installed Operators</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.5rem' }}>
                  {recommendations.platformStatus.operators.length}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {recommendations.platformStatus.operators.filter((op) => op.availableUpgrades.length > 0).length}{' '}
                  have updates available
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem span={4}>
            <Card>
              <CardTitle>Cluster Version</CardTitle>
              <CardBody>
                <div style={{ fontSize: '1.2rem' }}>
                  {recommendations.platformStatus.cluster.currentVersion}
                </div>
                <div style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  {recommendations.platformStatus.cluster.availableUpdates.length} updates available
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Tabs for different views */}
        <Card style={{ marginTop: '1.5rem' }}>
          <Tabs
            activeKey={activeTab}
            onSelect={(_event, tabIndex) => setActiveTab(tabIndex)}
            aria-label="Upgrade planner tabs"
          >
            <Tab eventKey={0} title={<TabTitleText>Recommended Paths</TabTitleText>}>
              <CardBody>
                {recommendations.recommendedPaths.length === 0 ? (
                  <EmptyState>
                    <EmptyStateIcon icon={CheckCircleIcon} />
                    <EmptyStateBody>
                      No upgrade paths recommended. Your platform is up to date!
                    </EmptyStateBody>
                  </EmptyState>
                ) : (
                  <Table variant="compact">
                    <Thead>
                      <Tr>
                        <Th />
                        <Th>Path</Th>
                        <Th>Confidence</Th>
                        <Th>Duration</Th>
                        <Th>Steps</Th>
                        <Th>Benefits</Th>
                        <Th>Supported Until</Th>
                        <Th>Actions</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {recommendations.recommendedPaths.map((path: UpgradePath, index: number) => (
                        <React.Fragment key={path.id}>
                          <Tr>
                            <Td
                              expand={{
                                rowIndex: index,
                                isExpanded: expandedPaths.has(path.id),
                                onToggle: () => togglePathExpansion(path.id),
                              }}
                            />
                            <Td>
                              <strong>{path.description}</strong>
                            </Td>
                            <Td>{getConfidenceBadge(path.confidence)}</Td>
                            <Td>{path.estimatedDuration}</Td>
                            <Td>{path.steps.length} steps</Td>
                            <Td>{path.benefits.length} benefits</Td>
                            <Td>{new Date(path.supportedUntil).toLocaleDateString()}</Td>
                            <Td>
                              <Button variant="primary" size="sm">
                                Execute
                              </Button>
                            </Td>
                          </Tr>
                          <Tr isExpanded={expandedPaths.has(path.id)}>
                            <Td colSpan={8}>
                              <ExpandableRowContent>
                                <Grid hasGutter>
                                  <GridItem span={6}>
                                    <Title headingLevel="h4">Upgrade Steps</Title>
                                    <List isPlain>
                                      {path.steps.map((step) => (
                                        <ListItem key={step.order}>
                                          <strong>
                                            {step.order}. {step.target}
                                          </strong>{' '}
                                          ({step.type})
                                          <br />
                                          {step.fromVersion && step.toVersion && (
                                            <span style={{ fontSize: '0.9rem' }}>
                                              {step.fromVersion} → {step.toVersion}
                                            </span>
                                          )}
                                          <br />
                                          <span style={{ fontSize: '0.9rem', color: '#666' }}>
                                            {step.description}
                                          </span>
                                          <br />
                                          <span style={{ fontSize: '0.85rem', fontStyle: 'italic' }}>
                                            Est. {step.estimatedDuration}
                                          </span>
                                        </ListItem>
                                      ))}
                                    </List>
                                  </GridItem>
                                  <GridItem span={6}>
                                    <Title headingLevel="h4">Benefits</Title>
                                    <List>
                                      {path.benefits.map((benefit, i) => (
                                        <ListItem key={i}>{benefit}</ListItem>
                                      ))}
                                    </List>
                                    <Title headingLevel="h4" style={{ marginTop: '1rem' }}>
                                      Risks
                                    </Title>
                                    <List>
                                      {path.risks.map((risk, i) => (
                                        <ListItem key={i}>{risk}</ListItem>
                                      ))}
                                    </List>
                                  </GridItem>
                                </Grid>
                              </ExpandableRowContent>
                            </Td>
                          </Tr>
                        </React.Fragment>
                      ))}
                    </Tbody>
                  </Table>
                )}
              </CardBody>
            </Tab>

            <Tab eventKey={1} title={<TabTitleText>Maintenance Windows</TabTitleText>}>
              <CardBody>
                {recommendations.maintenanceWindows.length === 0 ? (
                  <EmptyState>
                    <EmptyStateIcon icon={CheckCircleIcon} />
                    <EmptyStateBody>No maintenance windows recommended</EmptyStateBody>
                  </EmptyState>
                ) : (
                  <Grid hasGutter>
                    {recommendations.maintenanceWindows.map((window: MaintenanceWindow) => (
                      <GridItem key={window.id} span={12}>
                        <Alert
                          variant={getPriorityVariant(window.priority)}
                          title={
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <CalendarAltIcon />
                              <span>
                                {new Date(window.recommendedDate).toLocaleDateString()} - Priority:{' '}
                                {window.priority}
                              </span>
                            </div>
                          }
                          isInline
                        >
                          <p>
                            <strong>Reason:</strong> {window.reason}
                          </p>
                          <p>
                            <strong>Duration:</strong> {window.estimatedDuration}
                          </p>
                          <p>
                            <strong>Affected Components:</strong> {window.affectedComponents.join(', ')}
                          </p>
                          <Button
                            variant="link"
                            onClick={() => {
                              setActiveTab(0);
                              setExpandedPaths(new Set([window.upgradePath.id]));
                            }}
                          >
                            View recommended upgrade path
                          </Button>
                        </Alert>
                      </GridItem>
                    ))}
                  </Grid>
                )}
              </CardBody>
            </Tab>

            <Tab eventKey={2} title={<TabTitleText>Platform Status</TabTitleText>}>
              <CardBody>
                <Button
                  variant="link"
                  component="a"
                  href="/upgrade-planner/lifecycle"
                  style={{ padding: 0, marginBottom: '1rem' }}
                >
                  View detailed lifecycle dashboard →
                </Button>
                <Alert
                  variant={AlertVariant.info}
                  title="Platform Overview"
                  isInline
                  style={{ marginTop: '1rem' }}
                >
                  <p>
                    <strong>Overall Health:</strong> {recommendations.platformStatus.overallHealth}
                  </p>
                  <p>
                    <strong>Total Issues:</strong> {recommendations.platformStatus.totalIssues} (
                    {recommendations.platformStatus.criticalIssues} critical)
                  </p>
                  <p>
                    <strong>Support Expires In:</strong>{' '}
                    {recommendations.platformStatus.supportExpiresIn !== undefined
                      ? `${recommendations.platformStatus.supportExpiresIn} days`
                      : 'Unknown'}
                  </p>
                </Alert>
              </CardBody>
            </Tab>
          </Tabs>
        </Card>
      </PageSection>
    </Page>
  );
};

export default UpgradePlannerPage;
