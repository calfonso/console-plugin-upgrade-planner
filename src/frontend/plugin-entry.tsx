// Initialize i18n before exporting components
import './i18n';

// Expose page components for dynamic loading by console
// The components are automatically code-split by webpack module federation
export { default as UpgradePlannerPage } from './components/UpgradePlannerPage';
export { default as LifecycleDashboard } from './components/LifecycleDashboard';
export { default as OperatorDetailPage } from './components/OperatorDetailPage';
export { default as OperatorUpgradeApprovalPage } from './components/OperatorUpgradeApprovalPage';
