# OpenShift Upgrade Planner Dynamic Plugin

An OpenShift Console Dynamic Plugin that provides intelligent operator lifecycle management and upgrade planning capabilities to address the operator update challenges in OpenShift 4.

## Overview

The Upgrade Planner solves critical pain points identified in the OpenShift 4 operator lifecycle management:

- **Complex upgrade planning** - Automatically generates optimal upgrade paths
- **Inconsistent channels** - Detects and recommends proper channel selections
- **Stale subscription channels** - Identifies deprecated channels after cluster upgrades
- **Insufficient lifecycle visibility** - Provides comprehensive dashboard of support status
- **Version ceiling blockers** - Detects operators blocking cluster upgrades
- **Maintenance window optimization** - Recommends optimal timing for updates

## Features

### Phase 1 (Current Implementation)

1. **Lifecycle Visibility Dashboard**
   - Real-time platform health status
   - Operator support phase tracking
   - Critical issue detection
   - Support expiration warnings

2. **Intelligent Upgrade Planner**
   - Multiple upgrade path strategies (Critical, Conservative, Aggressive, Balanced)
   - Step-by-step upgrade guidance
   - Risk and benefit analysis
   - Estimated duration calculations

3. **Channel Management**
   - Automatic detection of stale/deprecated channels
   - Channel compatibility checking
   - Recommended channel suggestions

4. **Conflict Detection**
   - Version ceiling identification
   - Cluster upgrade blocker detection
   - Operator compatibility validation

5. **Maintenance Window Optimizer**
   - AI-powered scheduling recommendations
   - Priority-based window suggestions
   - Component grouping for efficient updates

## Architecture

```
┌─────────────────────────────────────────────────────┐
│          OpenShift Console (Browser)                 │
├─────────────────────────────────────────────────────┤
│                                                       │
│  ┌───────────────────────────────────────────────┐  │
│  │   Upgrade Planner Plugin (React/PatternFly)   │  │
│  │   - Lifecycle Dashboard                        │  │
│  │   - Upgrade Planner Page                       │  │
│  │   - Operator Detail Pages                      │  │
│  └───────────────────────────────────────────────┘  │
│                         │                             │
│                         │ REST API                    │
│                         ▼                             │
│  ┌───────────────────────────────────────────────┐  │
│  │   Backend Service (Node.js/Express)           │  │
│  │   - Lifecycle Service                          │  │
│  │   - Upgrade Planner Service                    │  │
│  │   - OLM Client                                 │  │
│  └───────────────────────────────────────────────┘  │
│                         │                             │
│                         │ Kubernetes API              │
│                         ▼                             │
├─────────────────────────────────────────────────────┤
│             OpenShift/Kubernetes Cluster             │
│   - OLM (Operator Lifecycle Manager)                │
│   - ClusterVersion API                               │
│   - Operator Subscriptions                           │
│   - PackageManifests                                 │
└─────────────────────────────────────────────────────┘
```

## Installation

### Prerequisites

- OpenShift 4.14+
- Cluster admin access
- Console operator version 5.0+

### Quick Install

```bash
# Clone the repository
git clone https://github.com/openshift/console-plugin-upgrade-planner.git
cd console-plugin-upgrade-planner

# Build and push the container image
podman build -t quay.io/your-org/upgrade-planner-plugin:latest .
podman push quay.io/your-org/upgrade-planner-plugin:latest

# Deploy to cluster
oc apply -f manifests/

# Enable the plugin in the console
oc patch consoles.operator.openshift.io cluster \
  --type=merge \
  --patch '{"spec":{"plugins":["upgrade-planner"]}}'
```

### Verification

```bash
# Check plugin deployment
oc get deployment -n openshift-console upgrade-planner-plugin

# Check plugin registration
oc get consoleplugin upgrade-planner

# Verify backend service
oc get svc -n openshift-console upgrade-planner-plugin
```

Access the plugin at: `https://<console-url>/upgrade-planner`

## Development

### Local Development Setup

```bash
# Install dependencies
npm install

# Start backend development server
npm run dev:backend

# In another terminal, start frontend development
npm run dev:frontend

# The plugin will be available at http://localhost:9001
```

### Project Structure

```
console-plugin-upgrade-planner/
├── src/
│   ├── backend/              # Backend service
│   │   ├── services/         # Business logic
│   │   │   ├── olm-client.ts         # Kubernetes OLM API client
│   │   │   ├── lifecycle-service.ts  # Lifecycle data aggregation
│   │   │   └── upgrade-planner.ts    # Upgrade path generation
│   │   ├── utils/            # Utilities
│   │   └── server.ts         # Express server
│   ├── frontend/             # Frontend plugin
│   │   ├── components/       # React components
│   │   │   ├── LifecycleDashboard.tsx
│   │   │   ├── UpgradePlannerPage.tsx
│   │   │   └── OperatorDetailPage.tsx
│   │   ├── services/         # API clients
│   │   ├── types/            # TypeScript types
│   │   └── plugin-entry.tsx  # Plugin entry point
│   └── utils/                # Shared utilities
├── manifests/                # Kubernetes manifests
├── config/                   # Configuration files
├── Dockerfile                # Container build
├── package.json              # Dependencies
├── tsconfig.json             # TypeScript config
├── webpack.config.ts         # Webpack config
└── README.md                 # This file
```

### Building

```bash
# Build both frontend and backend
npm run build

# Build individually
npm run build:backend
npm run build:frontend

# Run linting
npm run lint

# Run tests
npm test
```

## Usage

### Viewing Platform Status

1. Navigate to **Administration → Upgrade Planner** in the OpenShift Console
2. View overall platform health and operator status
3. Click on individual operators for detailed information

### Planning an Upgrade

1. Navigate to **Administration → Upgrade Planner**
2. Review the **Recommended Paths** tab
3. Select an upgrade path based on your requirements:
   - **Critical Path**: Addresses blocking issues immediately
   - **Conservative Path**: Minimal risk, extends support
   - **Aggressive Path**: Maximum currency, longest support
   - **Balanced Path**: Optimal risk/reward balance
4. Review the step-by-step plan and execute when ready

### Maintenance Window Planning

1. Navigate to the **Maintenance Windows** tab
2. Review AI-recommended windows based on:
   - Critical issues requiring immediate attention
   - Support lifecycle expiration timelines
   - Optimal component grouping
3. Schedule maintenance during recommended windows

### Lifecycle Dashboard

1. Navigate to **Administration → Upgrade Planner → Lifecycle**
2. Filter operators by health status, lifecycle model, or search
3. View detailed support phases and expiration dates
4. Identify operators requiring attention

## API Reference

### Backend API Endpoints

#### Platform Status
```
GET /api/v1/platform/status
Returns: PlatformStatus object with cluster and all operators
```

#### Operator Status
```
GET /api/v1/operators/:namespace/:name
Returns: Detailed OperatorStatus for specific operator
```

#### Lifecycle Information
```
GET /api/v1/lifecycle/:operatorName/:version
Returns: OperatorLifecycleInfo for a specific version
```

#### Upgrade Recommendations
```
GET /api/v1/upgrade/recommendations
Returns: Complete UpgradePlannerRecommendations
```

#### Upgrade Paths
```
GET /api/v1/upgrade/paths/:pathId
Returns: Specific UpgradePath details
```

#### Maintenance Windows
```
GET /api/v1/upgrade/maintenance-windows
Returns: List of recommended MaintenanceWindow objects
```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | `9000` |
| `LOG_LEVEL` | Logging level (info, debug, warn, error) | `info` |
| `NODE_ENV` | Environment (development, production) | `production` |
| `BACKEND_URL` | Backend API URL for frontend | `http://localhost:9000` |

### RBAC Permissions

The plugin requires the following cluster permissions:

- **Read** access to:
  - ClusterVersion (config.openshift.io)
  - Subscriptions (operators.coreos.com)
  - ClusterServiceVersions (operators.coreos.com)
  - InstallPlans (operators.coreos.com)
  - CatalogSources (operators.coreos.com)
  - PackageManifests (packages.operators.coreos.com)

## Troubleshooting

### Plugin Not Loading

```bash
# Check if plugin is enabled
oc get console.operator.openshift.io cluster -o jsonpath='{.spec.plugins}'

# Check plugin pod status
oc get pods -n openshift-console -l app=upgrade-planner-plugin

# View plugin logs
oc logs -n openshift-console -l app=upgrade-planner-plugin
```

### Backend Service Issues

```bash
# Check service health
oc exec -n openshift-console deployment/upgrade-planner-plugin -- curl http://localhost:9000/health

# View detailed logs
oc logs -n openshift-console deployment/upgrade-planner-plugin --tail=100
```

### Missing Operator Data

The plugin requires access to OLM resources. Verify RBAC permissions:

```bash
# Check service account permissions
oc auth can-i list subscriptions.operators.coreos.com \
  --as=system:serviceaccount:openshift-console:upgrade-planner-plugin
```

## Contributing

We welcome contributions! Please follow these guidelines:

1. Follow the [Dynamic Plugin Guide](https://docs.openshift.com/container-platform/latest/web_console/dynamic-plugins.html)
2. Adhere to TypeScript and React best practices
3. Use PatternFly components for UI consistency
4. Add tests for new features
5. Update documentation

### Submitting Issues

Create issues at: https://github.com/openshift/console-plugin-upgrade-planner/issues

Include:
- OpenShift version
- Plugin version
- Steps to reproduce
- Expected vs actual behavior
- Relevant logs

## Roadmap

### Phase 2 (Future)
- Automated upgrade execution
- Integration with ACM OperatorPolicy
- Historical upgrade tracking
- Custom upgrade path creation
- Upgrade simulation/dry-run
- Integration with Red Hat Product Lifecycle API
- Support for disconnected/air-gapped environments
- Webhook notifications for lifecycle events

### Phase 3 (Future)
- ML-based upgrade timing optimization
- Cluster fleet management integration
- Custom lifecycle policy definitions
- Rollback strategy planning
- Impact analysis for upgrades

## License

Apache License 2.0

## Support

- **Documentation**: https://docs.openshift.com/
- **Community**: #forum-ocp-console on Red Hat Internal Slack
- **Issues**: https://github.com/openshift/console-plugin-upgrade-planner/issues

## Acknowledgments

This plugin addresses the operator lifecycle challenges documented in "Solving OpenShift 4's Operator Update Problem" by Daniel Messer and Siamak Sadeghianfar.

Built with:
- [OpenShift Console Dynamic Plugin SDK](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)
- [PatternFly](https://www.patternfly.org/)
- [Kubernetes JavaScript Client](https://github.com/kubernetes-client/javascript)
