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
      `Approving updates for ${selectedOperators.size} operators. Approval functionality coming soon.`
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
      title="Approve Updates"
      isOpen={isOpen}
      onClose={onClose}
      actions={[
        <Button
          key="approve"
          variant="primary"
          onClick={handleApprove}
          isDisabled={selectedOperators.size === 0}
        >
          Approve Selected ({selectedOperators.size})
        </Button>,
        <Button key="cancel" variant="link" onClick={onClose}>
          Cancel
        </Button>,
      ]}
      className="up-approve-modal"
    >
      <TextContent className="up-approve-modal__description">
        <Text component={TextVariants.p}>Select operators to approve for updates. Approved operators will be updated to their target versions.</Text>
      </TextContent>

      {operatorsWithUpdates.length === 0 ? (
        <Alert variant={AlertVariant.info} isInline title="No Updates Available" className="up-approve-modal__alert">
          All operators are up to date
        </Alert>
      ) : (
        <>
          <Alert
            variant={AlertVariant.warning}
            isInline
            title="Approval Warning"
            className="up-approve-modal__alert"
          >
            Approving updates will initiate the update process. Please ensure you have reviewed the release notes and compatibility information.
          </Alert>

          <Form className="up-approve-modal__form">
            <FormGroup>
              <Checkbox
                id="select-all-operators"
                label={`Select all operators (${operatorsWithUpdates.length})`}
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
                <Th width={30}>Operator</Th>
                <Th width={20}>Current Version</Th>
                <Th width={20}>Target Version</Th>
                <Th width={20}>Channel</Th>
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
                        aria-label={`Select ${operator.installation.displayName}`}
                        isChecked={isSelected}
                        onChange={(_event, checked) => handleSelectOperator(operatorId, checked)}
                      />
                    </Td>
                    <Td dataLabel="Operator">{operator.installation.displayName}</Td>
                    <Td dataLabel="Current Version">{operator.installation.currentVersion}</Td>
                    <Td dataLabel="Target Version" className="up-approve-modal__target-version">
                      {getLatestVersion(operator)}
                    </Td>
                    <Td dataLabel="Channel">{operator.installation.currentChannel}</Td>
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
