import { LoadingOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal } from 'antd';
import { Spin } from 'antd';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { type UserProfile, UserRole, type UsersSettings } from '../../../entity/users';
import type { WorkspaceResponse } from '../../../entity/workspaces';
import { workspaceApi } from '../../../entity/workspaces';

interface Props {
  user: UserProfile;
  globalSettings: UsersSettings;

  onClose: () => void;
  onWorkspaceCreated: (workspace: WorkspaceResponse) => void;

  workspacesCount: number;
}

export const CreateWorkspaceDialogComponent = ({
  user,
  globalSettings,
  onClose,
  onWorkspaceCreated,
  workspacesCount,
}: Props) => {
  const { t } = useTranslation('workspaces');
  const { message } = App.useApp();
  const [isCreating, setIsCreating] = useState(false);
  const [workspaceName, setWorkspaceName] = useState(workspacesCount === 0 ? 'My workspace' : '');

  const isAllowedToCreateWorkspaces =
    globalSettings.isMemberAllowedToCreateWorkspaces || user.role === UserRole.ADMIN;

  const handleCreateWorkspace = async () => {
    if (!workspaceName.trim()) {
      message.error(t('pleaseEnterAWorkspaceName'));
      return;
    }

    setIsCreating(true);

    try {
      const newWorkspace = await workspaceApi.createWorkspace({
        name: workspaceName.trim(),
      });

      message.success(t('workspaceCreatedSuccessfully'));
      onWorkspaceCreated(newWorkspace);
      onClose();
    } catch (error) {
      message.error((error as Error).message || t('failedToCreateWorkspace'));
    } finally {
      setIsCreating(false);
    }
  };

  if (!isAllowedToCreateWorkspaces) {
    return (
      <Modal
        title={t('permissionDenied')}
        open
        onCancel={onClose}
        footer={[
          <Button key="ok" type="primary" onClick={onClose}>
            {t('ok')}
          </Button>,
        ]}
      >
        <p dangerouslySetInnerHTML={{ __html: t('youDontHavePermissionToCreateWorkspaces') }} />
      </Modal>
    );
  }

  return (
    <Modal
      title={t('createWorkspace')}
      open
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose} disabled={isCreating}>
          {t('cancel')}
        </Button>,

        <Button
          key="create"
          type="primary"
          onClick={handleCreateWorkspace}
          disabled={isCreating || !workspaceName.trim()}
          className="border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
        >
          {isCreating ? (
            <Spin indicator={<LoadingOutlined spin />} size="small" />
          ) : (
            t('createWorkspace')
          )}
        </Button>,
      ]}
    >
      <div className="mb-4">
        <div className="dark:text-gray-300" dangerouslySetInnerHTML={{ __html: t('workspaceDescription') }} />

        <label className="mt-5 mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('workspaceNameLabel')}
        </label>
        <Input
          value={workspaceName}
          onChange={(e) => setWorkspaceName(e.target.value)}
          placeholder={t('enterWorkspaceNamePlaceholder')}
          disabled={isCreating}
          onPressEnter={handleCreateWorkspace}
          autoFocus
        />
      </div>
    </Modal>
  );
};
