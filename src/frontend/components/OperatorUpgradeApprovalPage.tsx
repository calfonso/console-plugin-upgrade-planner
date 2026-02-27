import * as React from 'react';
import { useParams } from 'react-router-dom';
import {
  Page,
  PageSection,
  PageSectionVariants,
  Title,
  Breadcrumb,
  BreadcrumbItem,
  Grid,
  GridItem,
  Spinner,
  Alert,
  EmptyState,
  EmptyStateIcon,
  EmptyStateBody,
} from '@patternfly/react-core';
import { ExclamationCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../services/api-client';
import { OperatorStatus } from '../types';
import { UpgradeApprovalCard } from './upgrade-approval/UpgradeApprovalCard';
import { VersionProgressStepper } from './upgrade-approval/VersionProgressStepper';
import { RelatedOperatorsTable } from './upgrade-approval/RelatedOperatorsTable';
import { UpdateStrategySidebar } from './upgrade-approval/UpdateStrategySidebar';
import { UpgradeTabs } from './upgrade-approval/UpgradeTabs';
import '../styles/operator-upgrade-approval.css';

/**
 * Operator Upgrade Approval Page
 * Displays upgrade options, version progression, and related operators
 */
const OperatorUpgradeApprovalPage: React.FC = () => {
  const { t } = useTranslation();
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const [operator, setOperator] = React.useState<OperatorStatus | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [activeTabKey, setActiveTabKey] = React.useState<string | number>(0);

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

  if (loading) {
    return (
      <Page>
        <PageSection>
          <EmptyState>
            <Spinner size="xl" />
            <EmptyStateBody>{t('loadingOperatorDetails')}</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  if (error) {
    return (
      <Page>
        <PageSection>
          <Alert variant="danger" title={t('errorLoadingOperator')}>
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
            <EmptyStateBody>{t('operatorNotFound')}</EmptyStateBody>
          </EmptyState>
        </PageSection>
      </Page>
    );
  }

  return (
    <Page>
      {/* Page Header */}
      <PageSection variant={PageSectionVariants.light}>
        <Breadcrumb>
          <BreadcrumbItem to="/ecosystem">{t('ecosystem')}</BreadcrumbItem>
          <BreadcrumbItem to="/software-lifecycle-management">
            {t('softwareLifecycleManagement')}
          </BreadcrumbItem>
          <BreadcrumbItem isActive>
            {operator.installation.displayName}-v{operator.installation.currentVersion}
          </BreadcrumbItem>
        </Breadcrumb>

        <div className="up-page-header-title">
          <Title headingLevel="h1" size="2xl">
            {operator.installation.displayName}-v{operator.installation.currentVersion}
          </Title>
          <div className="up-page-header-subtitle">
            {operator.installation.currentVersion} {t('providedBy')} {operator.installation.catalogSource}
          </div>
        </div>
      </PageSection>

      {/* Tabs */}
      <PageSection variant={PageSectionVariants.light} padding={{ default: 'noPadding' }}>
        <div className="up-tabs-container">
          <UpgradeTabs
            activeKey={activeTabKey}
            onSelect={(_event, tabKey) => setActiveTabKey(tabKey)}
          />
        </div>
      </PageSection>

      {/* Main Content */}
      <PageSection>
        <Grid hasGutter>
          <GridItem span={9}>
            {/* Upgrade Approval Card */}
            <UpgradeApprovalCard operator={operator} onUpdate={loadOperator} />

            {/* Version Progress Stepper */}
            <VersionProgressStepper operator={operator} />

            {/* Related Operators Table */}
            <RelatedOperatorsTable operator={operator} />
          </GridItem>

          <GridItem span={3}>
            {/* Update Strategy Sidebar */}
            <UpdateStrategySidebar operator={operator} />
          </GridItem>
        </Grid>
      </PageSection>
    </Page>
  );
};

export default OperatorUpgradeApprovalPage;
