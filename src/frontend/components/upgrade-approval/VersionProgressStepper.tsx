import * as React from 'react';
import {
  Card,
  CardBody,
  Button,
} from '@patternfly/react-core';
import {
  CheckCircleIcon,
  InProgressIcon,
  PendingIcon,
  ExclamationCircleIcon,
} from '@patternfly/react-icons';
import { OperatorStatus } from '../../types';
import '../../styles/upgrade-approval-components.css';

interface VersionProgressStepperProps {
  operator: OperatorStatus;
}

interface UpgradeStep {
  version: string;
  channel?: string;
  status: 'completed' | 'current' | 'pending' | 'blocked';
  isCurrent?: boolean;
}

export const VersionProgressStepper: React.FC<VersionProgressStepperProps> = () => {

  // Mock data for demonstration - in real implementation, this would come from API
  const stableChannelSteps: UpgradeStep[] = [
    { version: '3.0.0 (Current)', channel: 'Stable-4.5', status: 'current', isCurrent: true },
    { version: '3.0.2', status: 'pending' },
    { version: '3.0.3', status: 'pending' },
    { version: '3.0.4', status: 'pending' },
    { version: '3.0.5', status: 'pending' },
    { version: '3.1.0', status: 'pending' },
  ];

  const nextMajorSteps: UpgradeStep[] = [
    { version: '4.0.0', status: 'blocked' },
    { version: '4.0.0', status: 'pending' },
  ];

  const [showMoreSteps, setShowMoreSteps] = React.useState(false);

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="var(--pf-v5-global--success-color--100)" />;
      case 'current':
        return <InProgressIcon color="var(--pf-v5-global--primary-color--100)" />;
      case 'blocked':
        return <ExclamationCircleIcon color="var(--pf-v5-global--danger-color--100)" />;
      default:
        return <PendingIcon color="var(--pf-v5-global--Color--200)" />;
    }
  };

  const renderProgressLine = (isActive: boolean) => (
    <div
      className={
        isActive ? 'up-stepper-progress-line up-stepper-progress-line--active' : 'up-stepper-progress-line up-stepper-progress-line--inactive'
      }
    />
  );

  const renderStep = (step: UpgradeStep, index: number, isLast: boolean) => (
    <div
      key={`${step.version}-${index}`}
      className={`up-stepper-step ${index === 0 ? 'up-stepper-step--first' : ''} ${isLast ? 'up-stepper-step--last' : ''}`}
    >
      {!isLast && renderProgressLine(step.status === 'completed')}

      <div className="up-stepper-step-content">
        {step.channel && (
          <div className="up-stepper-channel">
            {step.channel}
          </div>
        )}
        <div
          className={`up-stepper-version ${step.isCurrent ? 'up-stepper-version--current' : ''}`}
        >
          {step.version}
        </div>
        <div className="up-stepper-icon">{getStepIcon(step.status)}</div>
      </div>
    </div>
  );

  return (
    <Card className="up-version-stepper-card">
      <CardBody>
        {/* Stable Channel Progress */}
        <div className="up-stepper-section">
          <div className="up-stepper-container">
            {stableChannelSteps.map((step, index) =>
              renderStep(step, index, index === stableChannelSteps.length - 1)
            )}
          </div>
        </div>

        {/* Separator */}
        <div className="up-stepper-separator" />

        {/* Next Major Version Progress */}
        <div style={{ position: 'relative' }}>
          <div className="up-stepper-container">
            {renderStep(nextMajorSteps[0], 0, false)}

            {/* "+8 more" button in the middle */}
            <div className="up-stepper-more-button-container">
              {renderProgressLine(false)}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowMoreSteps(!showMoreSteps)}
                className="up-stepper-more-button"
              >
                +8 more
              </Button>
            </div>

            {renderStep(nextMajorSteps[1], 1, true)}
          </div>

          {showMoreSteps && (
            <div className="up-stepper-expanded-content">
              <p className="up-stepper-expanded-text">
                Additional upgrade steps would be shown here in a real implementation.
              </p>
            </div>
          )}
        </div>
      </CardBody>
    </Card>
  );
};
