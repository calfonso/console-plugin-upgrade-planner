import * as React from 'react';
import {
  Page,
  PageSection,
  Title,
} from '@patternfly/react-core';

/**
 * Simple Upgrade Planner Page for testing
 */
const UpgradePlannerPageSimple: React.FC = () => {
  return (
    <Page>
      <PageSection variant="light">
        <Title headingLevel="h1">Upgrade Planner</Title>
        <p>This is a test page to verify the plugin is loading correctly.</p>
      </PageSection>
    </Page>
  );
};

export default UpgradePlannerPageSimple;
