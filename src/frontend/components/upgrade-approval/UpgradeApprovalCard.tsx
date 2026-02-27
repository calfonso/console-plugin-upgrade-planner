import * as React from 'react';
import {
  Card,
  CardBody,
  Alert,
  FormGroup,
  FormSelect,
  FormSelectOption,
  Button,
  Grid,
  GridItem,
} from '@patternfly/react-core';
import { InfoCircleIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { OperatorStatus } from '../../types';
import '../../styles/upgrade-approval-components.css';

interface UpgradeApprovalCardProps {
  operator: OperatorStatus;
  onUpdate: () => void;
}

export const UpgradeApprovalCard: React.FC<UpgradeApprovalCardProps> = ({
  operator,
}) => {
  const { t } = useTranslation();
  const [targetVersion, setTargetVersion] = React.useState('');
  const [targetChannel, setTargetChannel] = React.useState(operator.installation.currentChannel);

  // Get available versions for target channel
  const availableTargetVersions = React.useMemo(() => {
    const channel = operator.availableChannels.find((ch) => ch.name === targetChannel);
    return channel?.availableVersions || [];
  }, [targetChannel, operator.availableChannels]);

  // Set initial target version when component mounts or target channel changes
  React.useEffect(() => {
    if (availableTargetVersions.length > 0 && !targetVersion) {
      // Find the latest version
      const latestVersion = availableTargetVersions[availableTargetVersions.length - 1];
      setTargetVersion(latestVersion);
    }
  }, [availableTargetVersions, targetVersion]);

  const handleApproveUpdate = async () => {
    // TODO: Implement approve update API call
    console.log('Approving update:', {
      targetChannel,
      targetVersion,
    });
    alert(t('approvalFunctionalityComingSoon'));
  };

  const handlePreviewUpdate = () => {
    // TODO: Implement preview update functionality
    console.log('Preview update:', {
      targetChannel,
      targetVersion,
    });
    alert(t('previewUpdateComingSoon'));
  };

  return (
    <Card>
      <CardBody>
        {/* Alert for new version */}
        <Alert
          variant="info"
          isInline
          title={t('newVersionAvailable')}
          customIcon={<InfoCircleIcon />}
          className="up-approval-alert"
        />

        <Grid hasGutter>
          {/* Current and Target Channel */}
          <GridItem span={12}>
            <Grid hasGutter>
              <GridItem span={4}>
                <FormGroup label={t('currentChannel')} fieldId="current-channel">
                  <div className="up-current-field-value">
                    {operator.installation.currentChannel}
                  </div>
                </FormGroup>
              </GridItem>
              <GridItem span={1} className="up-channel-arrow-container">
                <div className="up-channel-arrow">→</div>
              </GridItem>
              <GridItem span={5}>
                <FormGroup label={t('targetChannel')} fieldId="target-channel">
                  <FormSelect
                    value={targetChannel}
                    onChange={(_event, value) => {
                      setTargetChannel(value);
                      setTargetVersion('');
                    }}
                    id="target-channel"
                  >
                    {operator.availableChannels.map((channel) => (
                      <FormSelectOption
                        key={channel.name}
                        value={channel.name}
                        label={channel.name}
                        isDisabled={channel.deprecated}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>
              </GridItem>
            </Grid>
          </GridItem>

          {/* Current and Target Version */}
          <GridItem span={12}>
            <Grid hasGutter>
              <GridItem span={4}>
                <FormGroup label={t('currentVersion')} fieldId="current-version">
                  <div className="up-current-field-value">
                    {operator.installation.currentVersion}
                  </div>
                </FormGroup>
              </GridItem>
              <GridItem span={1} className="up-channel-arrow-container">
                <div className="up-channel-arrow">→</div>
              </GridItem>
              <GridItem span={5}>
                <FormGroup label={t('targetVersion')} fieldId="target-version">
                  <FormSelect
                    value={targetVersion}
                    onChange={(_event, value) => setTargetVersion(value)}
                    id="target-version"
                  >
                    {availableTargetVersions.map((version) => (
                      <FormSelectOption
                        key={version}
                        value={version}
                        label={version}
                      />
                    ))}
                  </FormSelect>
                </FormGroup>
              </GridItem>
            </Grid>
          </GridItem>

          {/* Release Notes Link */}
          <GridItem span={12}>
            <Button
              variant="link"
              isInline
              component="a"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                alert(t('releaseNotesComingSoon'));
              }}
            >
              {t('viewReleaseNotes')}
            </Button>
          </GridItem>

          {/* Action Buttons */}
          <GridItem span={12} className="up-approval-actions">
            <Button
              variant="primary"
              onClick={handleApproveUpdate}
              className="up-approve-btn"
            >
              {t('approveUpdate')}
            </Button>
            <Button variant="secondary" onClick={handlePreviewUpdate}>
              {t('previewUpdate')}
            </Button>
          </GridItem>
        </Grid>
      </CardBody>
    </Card>
  );
};
