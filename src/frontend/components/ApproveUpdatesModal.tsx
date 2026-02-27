import * as React from 'react';
import {
  Modal,
  ModalVariant,
  Button,
  Alert,
  AlertVariant,
  Form,
  FormGroup,
  Checkbox,
  TextContent,
  Text,
  TextVariants,
} from '@patternfly/react-core';
import { Table, Thead, Tbody, Tr, Th, Td } from '@patternfly/react-table';
import { useTranslation } from 'react-i18next';
import { OperatorStatus } from '../types';
import '../styles/approve-updates-modal.css';

interface ApproveUpdatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  operators: OperatorStatus[];
}

export const ApproveUpdatesModal: React.FC<ApproveUpdatesModalProps> = ({
  isOpen,
  onClose,
  operators,
}) => {
  const { t } = useTranslation();
  const [selectedOperators, setSelectedOperators] = React.useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = React.useState(false);

  // Filter operators that have available updates
  const operatorsWithUpdates = React.useMemo(() => {
    return operators.filter((op) => op.availableUpgrades.length > 0);
  }, [operators]);

  // Reset selection when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setSelectedOperators(new Set());
      setSelectAll(false);
    }
  }, [isOpen]);

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      const allOperatorIds = new Set(
        operatorsWithUpdates.map((op) => `${op.installation.namespace}/${op.installation.name}`)
      );
      setSelectedOperators(allOperatorIds);
    } else {
      setSelectedOperators(new Set());
    }
  };

  const handleSelectOperator = (operatorId: string, checked: boolean) => {
    const newSelected = new Set(selectedOperators);
    if (checked) {
      newSelected.add(operatorId);
    } else {
      newSelected.delete(operatorId);
      setSelectAll(false);
    }
    setSelectedOperators(newSelected);

    // Update select all if all are now selected
    if (newSelected.size === operatorsWithUpdates.length) {
      setSelectAll(true);
    }
  };

  const handleApprove = () => {
    // TODO: Implement actual approval API call
    console.log('Approving updates for:', Array.from(selectedOperators));
    alert(
      `${t('approvingUpdatesFor')} ${selectedOperators.size} ${t('operators')}. ${t('approvalFunctionalityComingSoon')}`
    );
    onClose();
  };

  const getLatestVersion = (operator: OperatorStatus): string => {
    if (operator.availableUpgrades.length === 0) return operator.installation.currentVersion;
    return operator.availableUpgrades[0].targetVersion;
  };

  return (
    <Modal
      variant={ModalVariant.large}
      title={t('approveUpdates')}
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="approve"
          variant="primary"
          onClick={handleApprove}
          isDisabled={selectedOperators.size === 0}
        >
          {t('approveSelected', { count: selectedOperators.size })}
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          {t('cancel')}
        </Button>,
      ]}
      className="up-approve-modal"
    >
      <TextContent className="up-approve-modal__description">
        <Text component={TextVariants.p}>{t('approveUpdatesDescription')}</Text>
      </TextContent>

      {operatorsWithUpdates.length === 0 ? (
        <Alert variant={AlertVariant.info} isInline title={t('noUpdatesAvailable')} className="up-approve-modal__alert">
          {t('allOperatorsUpToDate')}
        </Alert>
      ) : (
        <>
          <Alert
            variant={AlertVariant.warning}
            isInline
            title={t('approvalWarningTitle')}
            className="up-approve-modal__alert"
          >
            {t('approvalWarningMessage')}
          </Alert>

          <Form className="up-approve-modal__form">
            <FormGroup>
              <Checkbox
                id="select-all-operators"
                label={t('selectAllOperators', { count: operatorsWithUpdates.length })}
                isChecked={selectAll}
                onChange={(_event, checked) => handleSelectAll(checked)}
                className="up-approve-modal__select-all"
              />
            </FormGroup>
          </Form>

          <Table variant="compact" borders className="up-approve-modal__table">
            <Thead>
              <Tr>
                <Th width={10}></Th>
                <Th width={30}>{t('operator')}</Th>
                <Th width={20}>{t('currentVersion')}</Th>
                <Th width={20}>{t('targetVersion')}</Th>
                <Th width={20}>{t('channel')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {operatorsWithUpdates.map((operator) => {
                const operatorId = `${operator.installation.namespace}/${operator.installation.name}`;
                const isSelected = selectedOperators.has(operatorId);

                return (
                  <Tr key={operatorId}>
                    <Td>
                      <Checkbox
                        id={`select-${operatorId}`}
                        aria-label={t('selectOperator', { name: operator.installation.displayName })}
                        isChecked={isSelected}
                        onChange={(_event, checked) => handleSelectOperator(operatorId, checked)}
                      />
                    </Td>
                    <Td dataLabel={t('operator')}>{operator.installation.displayName}</Td>
                    <Td dataLabel={t('currentVersion')}>{operator.installation.currentVersion}</Td>
                    <Td dataLabel={t('targetVersion')} className="up-approve-modal__target-version">
                      {getLatestVersion(operator)}
                    </Td>
                    <Td dataLabel={t('channel')}>{operator.installation.currentChannel}</Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </>
      )}
    </Modal>
  );
};
