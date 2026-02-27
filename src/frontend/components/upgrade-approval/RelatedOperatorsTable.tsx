import * as React from 'react';
import {
  Card,
  CardTitle,
  CardBody,
  Label,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();

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
        return <Label color="green">{t('relatedOperatorInstalled')}</Label>;
      case 'Pending update':
        return (
          <Label color="gold" icon={<span>⚠</span>}>
            {t('relatedOperatorPendingUpdate')}
          </Label>
        );
      case 'Not installed':
        return <Label color="grey">{t('relatedOperatorNotInstalled')}</Label>;
      default:
        return <Label>{status}</Label>;
    }
  };

  return (
    <Card className="up-related-operators-card">
      <CardTitle>{t('relatedOperators')}</CardTitle>
      <CardBody>
        <Table variant="compact" borders={true}>
          <Thead>
            <Tr>
              <Th>{t('name')}</Th>
              <Th>{t('status')}</Th>
              <Th>{t('version')}</Th>
              <Th>{t('description')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {relatedOperators.map((relatedOp, index) => (
              <Tr key={`${relatedOp.name}-${index}`}>
                <Td dataLabel={t('name')}>
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
                <Td dataLabel={t('status')}>{getStatusLabel(relatedOp.status)}</Td>
                <Td dataLabel={t('version')}>{relatedOp.version}</Td>
                <Td dataLabel={t('description')}>{relatedOp.description}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </CardBody>
    </Card>
  );
};
