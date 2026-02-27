# OpenShift Console SDK Usage Guide

This document provides examples and best practices for using the OpenShift Console Dynamic Plugin SDK in this project.

## Using K8s Resource Hooks

The Console SDK provides powerful hooks for watching Kubernetes resources in real-time. Here's how to use them:

### Basic Resource Watching with `useK8sWatchResource`

```typescript
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk';
import type { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk';

// Define your resource type
interface Subscription extends K8sResourceCommon {
  spec: {
    name: string;
    source: string;
    sourceNamespace: string;
    channel: string;
    installPlanApproval: string;
  };
  status?: {
    currentCSV: string;
    installedCSV: string;
    state: string;
  };
}

// In your component
const MyOperatorList: React.FC = () => {
  const [subscriptions, loaded, loadError] = useK8sWatchResource<Subscription[]>({
    groupVersionKind: {
      group: 'operators.coreos.com',
      version: 'v1alpha1',
      kind: 'Subscription',
    },
    isList: true,
    namespaced: true,
  });

  if (loadError) {
    return <Alert variant="danger">Failed to load subscriptions: {loadError.message}</Alert>;
  }

  if (!loaded) {
    return <Spinner />;
  }

  return (
    <Table>
      {subscriptions.map((sub) => (
        <Tr key={sub.metadata.uid}>
          <Td>{sub.spec.name}</Td>
          <Td>{sub.status?.currentCSV}</Td>
        </Tr>
      ))}
    </Table>
  );
};
```

### Watching a Single Resource

```typescript
const [operator, loaded, loadError] = useK8sWatchResource<Subscription>({
  groupVersionKind: {
    group: 'operators.coreos.com',
    version: 'v1alpha1',
    kind: 'Subscription',
  },
  name: 'my-operator',
  namespace: 'openshift-operators',
});
```

### Using `useActiveNamespace`

```typescript
import { useActiveNamespace } from '@openshift-console/dynamic-plugin-sdk';

const MyComponent: React.FC = () => {
  const [activeNamespace] = useActiveNamespace();

  const [resources, loaded] = useK8sWatchResource({
    groupVersionKind: { version: 'v1', kind: 'Pod' },
    namespace: activeNamespace,
    isList: true,
  });

  return <div>Showing pods in namespace: {activeNamespace}</div>;
};
```

## Benefits of Using SDK Hooks vs Custom API Client

### Current Approach (Custom API Client)
```typescript
// src/frontend/components/LifecycleDashboard.tsx
const [platformStatus, setPlatformStatus] = React.useState<PlatformStatus | null>(null);
const [loading, setLoading] = React.useState(true);
const [error, setError] = React.useState<string | null>(null);

React.useEffect(() => {
  loadPlatformStatus();
}, []);

const loadPlatformStatus = async () => {
  try {
    setLoading(true);
    const status = await apiClient.getPlatformStatus();
    setPlatformStatus(status);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

### Recommended Approach (SDK Hooks)
```typescript
const [subscriptions, loaded, loadError] = useK8sWatchResource<Subscription[]>({
  groupVersionKind: {
    group: 'operators.coreos.com',
    version: 'v1alpha1',
    kind: 'Subscription',
  },
  isList: true,
});

// Automatically:
// - Handles loading state
// - Watches for updates in real-time
// - Provides error handling
// - Cleans up on unmount
```

### Advantages:
1. **Real-time Updates**: Automatically receives updates when resources change
2. **Less Boilerplate**: No need to manage loading/error states manually
3. **Better Performance**: Uses WebSocket connections efficiently
4. **Consistency**: Follows Console patterns for resource access
5. **Type Safety**: Full TypeScript support with K8s types

## Other Useful SDK Features

### Resource Links
```typescript
import { ResourceLink } from '@openshift-console/dynamic-plugin-sdk';

<ResourceLink
  groupVersionKind={{ version: 'v1', kind: 'Pod' }}
  name={podName}
  namespace={namespace}
/>
```

### Access Control
```typescript
import { useAccessReview } from '@openshift-console/dynamic-plugin-sdk';

const [canCreate] = useAccessReview({
  group: 'operators.coreos.com',
  resource: 'subscriptions',
  verb: 'create',
});

{canCreate && <Button>Create Subscription</Button>}
```

## Migration Path

For this project, consider gradually migrating from the custom `apiClient` to SDK hooks:

1. **Phase 1**: Keep backend API for aggregated/computed data (platform status, lifecycle info)
2. **Phase 2**: Use SDK hooks for direct K8s resource access (Subscriptions, CSVs, InstallPlans)
3. **Phase 3**: Replace polling with WebSocket-based watching for real-time updates

This hybrid approach leverages the best of both: backend business logic and frontend real-time K8s data.
