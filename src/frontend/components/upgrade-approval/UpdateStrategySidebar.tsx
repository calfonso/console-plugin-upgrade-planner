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
import { OperatorStatus } from '../../types';
import '../../styles/upgrade-approval-components.css';

interface UpdateStrategySidebarProps {
  operator: OperatorStatus;
}

export const UpdateStrategySidebar: React.FC<UpdateStrategySidebarProps> = ({ operator }) => {

  return (
    <Card isCompact>
      <CardTitle>Update Strategy</CardTitle>
      <CardBody>
        <DescriptionList isCompact>
          {/* Update approval */}
          <DescriptionListGroup>
            <DescriptionListTerm>Update Approval</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="up-update-strategy-field">
                <span className="up-update-strategy-value">
                  {operator.installation.approved ? 'Automatic' : 'Manual'}
                </span>
                <Button
                  variant="plain"
                  aria-label="Edit update approval"
                  onClick={() => alert('Edit update approval functionality coming soon')}
                  className="up-update-strategy-edit-btn"
                >
                  <PencilAltIcon className="up-update-strategy-edit-icon" />
                </Button>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Update channel */}
          <DescriptionListGroup>
            <DescriptionListTerm>Update Channel</DescriptionListTerm>
            <DescriptionListDescription>
              <div className="up-update-strategy-field">
                <span>{operator.installation.currentChannel}</span>
                <Button
                  variant="plain"
                  aria-label="Edit update channel"
                  onClick={() => alert('Edit update channel functionality coming soon')}
                  className="up-update-strategy-edit-btn"
                >
                  <PencilAltIcon className="up-update-strategy-edit-icon" />
                </Button>
              </div>
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Version */}
          <DescriptionListGroup>
            <DescriptionListTerm>Version</DescriptionListTerm>
            <DescriptionListDescription>
              {operator.installation.currentVersion}
            </DescriptionListDescription>
          </DescriptionListGroup>

          {/* Manage Subscription */}
          <DescriptionListGroup>
            <DescriptionListTerm>Manage Subscription</DescriptionListTerm>
            <DescriptionListDescription>
              <Button
                variant="link"
                isInline
                component="a"
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Navigate to cluster management');
                }}
                icon={<ExternalLinkAltIcon />}
                iconPosition="right"
                className="up-manage-subscription-btn"
              >
                Manage in OpenShift Cluster Management
              </Button>
            </DescriptionListDescription>
          </DescriptionListGroup>
        </DescriptionList>
      </CardBody>
    </Card>
  );
};
