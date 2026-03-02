import * as React from 'react';
import {
  Page,
  PageSection,
  Title,
  Text,
  TextVariants,
  Card,
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
  Button,
  Breadcrumb,
  BreadcrumbItem,
  FormSelect,
  FormSelectOption,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import {
  ExclamationCircleIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InfoCircleIcon,
  EllipsisVIcon,
} from '@patternfly/react-icons';
import { apiClient } from '../services/api-client';
import { PlatformStatus, OperatorStatus, SupportPhase } from '../types';
import { ApproveUpdatesModal } from './ApproveUpdatesModal';
import '../styles/lifecycle-dashboard.css';

/**
 * Lifecycle Dashboard - Shows overall platform and operator lifecycle status
 */
const LifecycleDashboard: React.FC = () => {
  const [platformStatus, setPlatformStatus] = React.useState<PlatformStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('all');
  const [isApproveModalOpen, setIsApproveModalOpen] = React.useState(false);

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
          <Alert variant={AlertVariant.danger} title="Error Loading Platform Status">
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

  // Calculate summary card counts
  const installedCount = platformStatus?.operators.length || 0;
  const updatesAvailable = platformStatus?.operators.filter((op) => op.availableUpgrades.length > 0).length || 0;
  const endOfLifeCount = platformStatus?.operators.filter(
    (op) => op.lifecycleInfo.supportPhase === SupportPhase.END_OF_LIFE || op.lifecycleInfo.supportPhase === SupportPhase.DEPRECATED
  ).length || 0;

  return (
    <Page>
      {/* Breadcrumb and Page Header */}
      <PageSection variant="light" className="up-page-section-header">
        <Breadcrumb className="up-breadcrumb">
          <BreadcrumbItem to="#">Ecosystem</BreadcrumbItem>
          <BreadcrumbItem to="#" isActive>
            Software Lifecycle Management
          </BreadcrumbItem>
        </Breadcrumb>
        <Title headingLevel="h1" size="2xl" className="up-page-title">
          Software Lifecycle Management
        </Title>
        <Text component={TextVariants.p} className="up-page-description">
          Monitor, manage, and schedule upgrades for your platform and operators
        </Text>
      </PageSection>

      <PageSection>
        {/* Summary Cards */}
        <Grid hasGutter className="up-summary-cards">
          <GridItem md={4}>
            <Card className="up-summary-card up-summary-card--success">
              <CardBody>
                <div className="up-summary-card__content">
                  <div className="up-summary-card__icon">
                    <CheckCircleIcon />
                  </div>
                  <div className="up-summary-card__details">
                    <div className="up-summary-card__count">{installedCount}</div>
                    <div className="up-summary-card__label">Installed Software</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={4}>
            <Card className="up-summary-card up-summary-card--info">
              <CardBody>
                <div className="up-summary-card__content">
                  <div className="up-summary-card__icon">
                    <InfoCircleIcon />
                  </div>
                  <div className="up-summary-card__details">
                    <div className="up-summary-card__count">{updatesAvailable}</div>
                    <div className="up-summary-card__label">Available Updates</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </GridItem>

          <GridItem md={4}>
            <Card className="up-summary-card up-summary-card--warning">
              <CardBody>
                <div className="up-summary-card__content">
                  <div className="up-summary-card__icon">
                    <ExclamationTriangleIcon />
                  </div>
                  <div className="up-summary-card__details">
                    <div className="up-summary-card__count">{endOfLifeCount}</div>
                    <div className="up-summary-card__label">End of Life Support</div>
                  </div>
                </div>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>

        {/* Toolbar */}
        <Toolbar className="up-main-toolbar">
          <ToolbarContent>
            <ToolbarItem>
              <FormSelect
                value={typeFilter}
                onChange={(_event, value) => setTypeFilter(value as string)}
                aria-label="Type filter"
                className="up-type-filter"
              >
                <FormSelectOption key="all" value="all" label="All Types" />
                <FormSelectOption key="update-available" value="update-available" label="Update Available" />
                <FormSelectOption key="up-to-date" value="up-to-date" label="Up to Date" />
              </FormSelect>
            </ToolbarItem>
            <ToolbarItem>
              <SearchInput
                placeholder="Find by name"
                value={searchTerm}
                onChange={(_event, value) => setSearchTerm(value)}
                onClear={() => setSearchTerm('')}
                className="up-search-input"
              />
            </ToolbarItem>
            <ToolbarItem>
              <Button variant="primary" onClick={() => setIsApproveModalOpen(true)}>
                Approve Update
              </Button>
            </ToolbarItem>
            <ToolbarItem>
              <Button
                variant="link"
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Browse software catalog functionality coming soon');
                }}
              >
                Browse Software Catalog
              </Button>
            </ToolbarItem>
          </ToolbarContent>
        </Toolbar>

        {/* Operators Table */}
        <Table variant="compact" className="up-operators-table">
          <Thead>
            <Tr>
              <Th width={20}>Name</Th>
              <Th width={15}>Status</Th>
              <Th width={10}>Version</Th>
              <Th width={15}>Update Plan</Th>
              <Th width={15}>Support</Th>
              <Th width={15}>Cluster Compatibility</Th>
              <Th width={10}>Last Updated</Th>
              <Th>Actions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {filteredOperators.map((operator: OperatorStatus) => (
              <Tr key={`${operator.installation.namespace}/${operator.installation.name}`}>
                <Td dataLabel="Name">
                  <a
                    href={`/upgrade-planner/operator/${operator.installation.namespace}/${operator.installation.name}`}
                    className="up-operator-name-link"
                  >
                    {operator.installation.displayName}
                  </a>
                </Td>
                <Td dataLabel="Status">
                  {operator.availableUpgrades.length > 0 ? (
                    <Label color="purple" icon={<InfoCircleIcon />}>
                      Update Available
                    </Label>
                  ) : (
                    <Label color="green">Up to Date</Label>
                  )}
                </Td>
                <Td dataLabel="Version">{operator.installation.currentVersion}</Td>
                <Td dataLabel="Update Plan">
                  {operator.installation.approved ? 'Automatic' : 'Manual'}
                </Td>
                <Td dataLabel="Support">
                  <div>
                    {new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </div>
                  <Label color="grey" className="up-support-label">
                    {operator.lifecycleInfo.supportPhase === SupportPhase.END_OF_LIFE ? 'End of Life' : '2 years 8 months remaining'}
                  </Label>
                </Td>
                <Td dataLabel="Cluster Compatibility">
                  <Label color="green">Compatible</Label>
                </Td>
                <Td dataLabel="Last Updated">
                  {new Date().toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                  <br />
                  {new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </Td>
                <Td dataLabel="Actions">
                  <Button
                    variant="plain"
                    aria-label="Actions"
                    onClick={() => alert('Actions coming soon')}
                  >
                    <EllipsisVIcon />
                  </Button>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </PageSection>

      {/* Approve Updates Modal */}
      <ApproveUpdatesModal
        isOpen={isApproveModalOpen}
        onClose={() => setIsApproveModalOpen(false)}
        operators={platformStatus?.operators || []}
      />
    </Page>
  );
};

export default LifecycleDashboard;
