import * as React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { OperatorStatus } from '../../types';
import '../../styles/upgrade-approval-components.css';

interface RelatedOperatorsTableProps {
  operator: OperatorStatus;
}

interface RelatedOperator {
  name: string;
  status: 'Installed' | 'Pending update' | 'Not installed';
  version: string;
  description: string;
}

export const RelatedOperatorsTable: React.FC<RelatedOperatorsTableProps> = () => {

  // Mock data for demonstration - in real implementation, this would come from API
  const relatedOperators: RelatedOperator[] = [
    {
      name: 'PostgresQL',
      status: 'Installed',
      version: '1.8.0',
      description: 'PostgreSQL database operator',
    },
    {
      name: 'PostgresQL',
      status: 'Pending update',
      version: '2.1.3',
      description: 'PostgreSQL database operator - update available',
    },
    {
      name: 'Kafka Operator',
      status: 'Not installed',
      version: '3.0.0',
      description: 'Apache Kafka streaming platform',
    },
    {
      name: 'OpenShift Logging',
      status: 'Not installed',
      version: '4.1.0',
      description: 'Logging infrastructure for OpenShift',
    },
  ];

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Installed':
        return <Label color="green">Installed</Label>;
      case 'Pending update':
        return (
          <Label color="gold" icon={<span>⚠</span>}>
            Pending Update
          </Label>
        );
      case 'Not installed':
        return <Label color="grey">Not Installed</Label>;
      default:
        return <Label>{status}</Label>;
    }
  };

  return (
    <Card className="up-related-operators-card">
      <CardTitle>Related Operators</CardTitle>
      <CardBody>
        <Table variant="compact" borders={true}>
          <Thead>
            <Tr>
              <Th>Name</Th>
              <Th>Status</Th>
              <Th>Version</Th>
              <Th>Description</Th>
            </Tr>
          </Thead>
          <Tbody>
            {relatedOperators.map((relatedOp, index) => (
              <Tr key={`${relatedOp.name}-${index}`}>
                <Td dataLabel="Name">
                  <a
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(`Navigate to ${relatedOp.name}`);
                    }}
                    className="up-related-operator-link"
                  >
                    {relatedOp.name}
                  </a>
                </Td>
                <Td dataLabel="Status">{getStatusLabel(relatedOp.status)}</Td>
                <Td dataLabel="Version">{relatedOp.version}</Td>
                <Td dataLabel="Description">{relatedOp.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};
