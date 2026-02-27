import * as React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  DescriptionList,
  DescriptionListGroup,
  DescriptionListTerm,
  DescriptionListDescription,
  Button,
} from '@patternfly/react-core';
import { PencilAltIcon, ExternalLinkAltIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { OperatorStatus } from '../../types';
import '../../styles/upgrade-approval-components.css';

interface UpdateStrategySidebarProps {
  operator: OperatorStatus;
}

export const UpdateStrategySidebar: React.FC<UpdateStrategySidebarProps> = ({ operator }) => {
  const { t } = useTranslation();

  return (
    <Card isCompact>
      <CardTitle>{t('updateStrategy')}</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          {/* Update approval */}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('updateApproval')}</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="up-update-strategy-field">
                <span className="up-update-strategy-value">
                  {operator.installation.approved ? t('automatic') : t('manual')}
                </span>
                <Button
                  variant="plain"
                  aria-label={t('editUpdateApproval')}
                  onClick={() => alert(t('editUpdateApprovalComingSoon'))}
                  className="up-update-strategy-edit-btn"
                >
                  <PencilAltIcon className="up-update-strategy-edit-icon" />
                </Button>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Update channel */}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('updateChannel')}</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="up-update-strategy-field">
                <span>{operator.installation.currentChannel}</span>
                <Button
                  variant="plain"
                  aria-label={t('editUpdateChannel')}
                  onClick={() => alert(t('editUpdateChannelComingSoon'))}
                  className="up-update-strategy-edit-btn"
                >
                  <PencilAltIcon className="up-update-strategy-edit-icon" />
                </Button>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Version */}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('version')}</DescriptionListTerm>
            <DescriptionListDescription>
              {operator.installation.currentVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Manage Subscription */}
          <DescriptionListGroup>
            <DescriptionListTerm>{t('manageSubscription')}</DescriptionListTerm>
            <DescriptionListDescription>
              <Button
                variant="link"
                isInline
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert(t('navigateToClusterManagement'));
                }}
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
                className="up-manage-subscription-btn"
              >
                {t('manageInOpenShiftClusterManagement')}
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
