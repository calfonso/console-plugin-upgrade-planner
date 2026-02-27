import * as React from 'react';
import { Tabs, Tab, TabTitleText } from '@patternfly/react-core';

interface UpgradeTabsProps {
  activeKey: string | number;
  onSelect: (event: React.MouseEvent<HTMLElement>, tabKey: string | number) => void;
}

export const UpgradeTabs: React.FC<UpgradeTabsProps> = ({ activeKey, onSelect }) => {
  return (
    <Tabs activeKey={activeKey} onSelect={onSelect}>
      <Tab eventKey={0} title={<TabTitleText>Details</TabTitleText>} />
      <Tab eventKey={1} title={<TabTitleText>YAML</TabTitleText>} />
      <Tab eventKey={2} title={<TabTitleText>Update plan</TabTitleText>} />
      <Tab eventKey={3} title={<TabTitleText>Events</TabTitleText>} />
      <Tab eventKey={4} title={<TabTitleText>Subscription</TabTitleText>} />
    </Tabs>
  );
};
