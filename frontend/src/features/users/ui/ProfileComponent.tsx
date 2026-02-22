import { EyeInvisibleOutlined, EyeTwoTone, LoadingOutlined } from '@ant-design/icons';
import { App, Button, Input, Spin } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { userApi } from '../../../entity/users/api/userApi';
import type { ChangePasswordRequest } from '../../../entity/users/model/ChangePasswordRequest';
import type { SignInRequest } from '../../../entity/users/model/SignInRequest';
import type { UpdateUserInfoRequest } from '../../../entity/users/model/UpdateUserInfoRequest';
import type { UserProfile } from '../../../entity/users/model/UserProfile';
import { UserRole } from '../../../entity/users/model/UserRole';

interface Props {
  contentHeight: number;
}

const getRoleDisplayText = (role: UserRole): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Admin';
    case UserRole.MEMBER:
      return 'Member';
    default:
      return role;
  }
};

export function ProfileComponent({ contentHeight }: Props) {
  const { t } = useTranslation('users');
  const { message } = App.useApp();
  const [user, setUser] = useState<UserProfile | undefined>(undefined);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile edit state
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [editNameError, setEditNameError] = useState(false);
  const [editEmailError, setEditEmailError] = useState(false);

  // Password change form state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newPasswordVisible, setNewPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  // Error states
  const [newPasswordError, setNewPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = () => {
    userApi
      .getCurrentUser()
      .then((user) => {
        setUser(user);
        setEditName(user.name);
        setEditEmail(user.email);
      })
      .catch((error) => {
        message.error(error.message);
      });
  };

  const validatePasswordFields = (): boolean => {
    let isValid = true;

    if (!newPassword) {
      setNewPasswordError(true);
      isValid = false;
    } else if (newPassword.length < 6) {
      setNewPasswordError(true);
      message.error(t('passwordMustBeAtLeast6CharactersLong'));
      isValid = false;
    } else {
      setNewPasswordError(false);
    }

    if (!confirmPassword) {
      setConfirmPasswordError(true);
      isValid = false;
    } else if (newPassword !== confirmPassword) {
      setConfirmPasswordError(true);
      message.error(t('newPasswordsDoNotMatch'));
      isValid = false;
    } else {
      setConfirmPasswordError(false);
    }

    return isValid;
  };

  const handlePasswordChange = async () => {
    if (!validatePasswordFields()) {
      return;
    }

    setIsChangingPassword(true);

    try {
      const request: ChangePasswordRequest = {
        newPassword,
      };

      await userApi.changePassword(request);

      // Reset form fields
      setNewPassword('');
      setConfirmPassword('');

      // Sign in again with new password
      if (user?.email) {
        try {
          const signInRequest: SignInRequest = {
            email: user.email,
            password: newPassword,
          };
          await userApi.signIn(signInRequest);
          message.success(t('successfullySignedInWithNewPassword'));
        } catch (signInError: unknown) {
          const errorMessage =
            signInError instanceof Error ? signInError.message : t('failedToSignInWithNewPassword');
          message.error(errorMessage);
          // If sign in fails, logout and redirect to login page
          userApi.logout();
          userApi.notifyAuthListeners();
          window.location.reload();
        }
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('failedToChangePassword');
      message.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleProfileUpdate = async () => {
    // Validate name
    if (!editName || editName.trim() === '') {
      setEditNameError(true);
      message.error(t('nameIsRequired'));
      return;
    }
    setEditNameError(false);

    // Validate email (only if not admin)
    if (user?.email !== 'admin') {
      if (!editEmail || editEmail.trim() === '') {
        setEditEmailError(true);
        message.error(t('emailIsRequired'));
        return;
      }
      setEditEmailError(false);
    }

    setIsUpdatingProfile(true);

    try {
      const request: UpdateUserInfoRequest = {};

      // Only include fields that changed
      if (editName !== user?.name) {
        request.name = editName;
      }
      // Only include email if not admin and changed
      if (user?.email !== 'admin' && editEmail !== user?.email) {
        request.email = editEmail;
      }

      // If nothing changed, just show a message
      if (Object.keys(request).length === 0) {
        message.info(t('noChangesToSave'));
        setIsUpdatingProfile(false);
        return;
      }

      await userApi.updateUserInfo(request);
      message.success(t('profileUpdatedSuccessfully'));

      // Reload user profile
      loadUserProfile();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : t('failedToUpdateProfile');
      message.error(errorMessage);
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleLogout = () => {
    userApi.logout();
    window.location.reload();
  };

  return (
    <div className="flex grow">
      <div className="w-full">
        <div
          className="grow overflow-y-auto rounded bg-white p-5 shadow dark:bg-gray-800"
          style={{ height: contentHeight }}
        >
          <h1 className="text-2xl font-bold dark:text-white">{t('profile')}</h1>

          <div className="mt-5">
            {user ? (
              <>
                <div className="mb-6">
                  <h3 className="mb-4 text-lg font-semibold dark:text-white">
                    {t('profileInformation')}
                  </h3>
                  <div className="max-w-md">
                    <div className="text-xs font-semibold dark:text-gray-200">{t('userId')}</div>
                    <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">{user.id}</div>

                    <div className="mb-1 text-xs font-semibold dark:text-gray-200">
                      {t('userName')}
                    </div>
                    <Input
                      value={editName}
                      onChange={(e) => {
                        setEditNameError(false);
                        setEditName(e.currentTarget.value);
                      }}
                      status={editNameError ? 'error' : undefined}
                      placeholder={t('enterYourName')}
                      className="mb-4"
                    />

                    <div className="mt-2 mb-1 text-xs font-semibold dark:text-gray-200">
                      {t('userEmail')}
                    </div>
                    <Input
                      value={editEmail}
                      onChange={(e) => {
                        setEditEmailError(false);
                        setEditEmail(e.currentTarget.value.trim().toLowerCase());
                      }}
                      status={editEmailError ? 'error' : undefined}
                      placeholder={t('enterYourEmail')}
                      type="email"
                      className="mb-4"
                      disabled={user.email === 'admin'}
                    />
                    {user.email === 'admin' && (
                      <div className="mb-4 text-xs text-gray-500 dark:text-gray-400">
                        {t('adminEmailCannotBeChanged')}
                      </div>
                    )}

                    <div className="mt-2 mb-1 text-xs font-semibold dark:text-gray-200">
                      {t('userRole')}
                    </div>
                    <div className="mb-4">
                      <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {getRoleDisplayText(user.role)}
                      </span>
                    </div>

                    {(editName !== user.name || editEmail !== user.email) && (
                      <Button
                        type="primary"
                        onClick={handleProfileUpdate}
                        loading={isUpdatingProfile}
                        disabled={isUpdatingProfile}
                        className="border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
                      >
                        {t('saveChanges')}
                      </Button>
                    )}
                  </div>
                </div>

                <div className="mb-8">
                  <Button type="primary" ghost onClick={handleLogout} danger>
                    {t('logout')}
                  </Button>
                </div>

                <div className="max-w-xs">
                  <h3 className="mb-4 text-lg font-semibold dark:text-white">
                    {t('changePassword')}
                  </h3>

                  <div className="max-w-sm">
                    <div className="my-1 text-xs font-semibold dark:text-gray-200">
                      {t('newPassword')}
                    </div>
                    <Input.Password
                      placeholder={t('enterNewPassword')}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPasswordError(false);
                        setNewPassword(e.currentTarget.value);
                      }}
                      status={newPasswordError ? 'error' : undefined}
                      iconRender={(visible) =>
                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                      }
                      visibilityToggle={{
                        visible: newPasswordVisible,
                        onVisibleChange: setNewPasswordVisible,
                      }}
                      autoComplete="new-password"
                    />

                    <div className="mt-2 mb-1 text-xs font-semibold dark:text-gray-200">
                      {t('confirmNewPassword')}
                    </div>
                    <Input.Password
                      placeholder={t('confirmNewPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPasswordError(false);
                        setConfirmPassword(e.currentTarget.value);
                      }}
                      status={confirmPasswordError ? 'error' : undefined}
                      iconRender={(visible) =>
                        visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
                      }
                      autoComplete="new-password"
                      visibilityToggle={{
                        visible: confirmPasswordVisible,
                        onVisibleChange: setConfirmPasswordVisible,
                      }}
                    />

                    <div className="mt-3" />

                    {(newPassword || confirmPassword) && (
                      <Button
                        type="primary"
                        onClick={handlePasswordChange}
                        loading={isChangingPassword}
                        disabled={isChangingPassword}
                        className="border-blue-600 bg-blue-600 hover:border-blue-700 hover:bg-blue-700"
                      >
                        {isChangingPassword ? t('changingPassword') : t('changePassword')}
                      </Button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div>
                <Spin indicator={<LoadingOutlined spin />} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
