import * as React from 'react';
import { useHistory } from 'react-router-dom';

/**
 * Upgrade Planner Page - Redirects to the lifecycle dashboard
 */
const UpgradePlannerPage: React.FC = () => {
  const history = useHistory();

  React.useEffect(() => {
    // Redirect to lifecycle dashboard
    history.replace('/upgrade-planner/lifecycle');
  }, [history]);

  return null;
};

export default UpgradePlannerPage;
