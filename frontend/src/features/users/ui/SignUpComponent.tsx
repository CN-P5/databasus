import { EyeInvisibleOutlined, EyeTwoTone } from '@ant-design/icons';
import { App, Button, Input } from 'antd';
import { type JSX, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useCloudflareTurnstile } from '../../../shared/hooks/useCloudflareTurnstile';

import { GITHUB_CLIENT_ID, GOOGLE_CLIENT_ID } from '../../../constants';
import { userApi } from '../../../entity/users';
import { StringUtils } from '../../../shared/lib';
import { FormValidator } from '../../../shared/lib/FormValidator';
import { CloudflareTurnstileWidget } from '../../../shared/ui/CloudflareTurnstileWidget';
import { GithubOAuthComponent } from './oauth/GithubOAuthComponent';
import { GoogleOAuthComponent } from './oauth/GoogleOAuthComponent';

interface SignUpComponentProps {
  onSwitchToSignIn?: () => void;
}

export function SignUpComponent({ onSwitchToSignIn }: SignUpComponentProps): JSX.Element {
  const { t } = useTranslation('auth');
  const { message } = App.useApp();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);

  const [isLoading, setLoading] = useState(false);

  const [nameError, setNameError] = useState(false);
  const [isEmailError, setEmailError] = useState(false);
  const [passwordError, setPasswordError] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState(false);

  const [signUpError, setSignUpError] = useState('');

  const { token, containerRef, resetCloudflareTurnstile } = useCloudflareTurnstile();

  const validateFieldsForSignUp = (): boolean => {
    if (!name || name.trim() === '') {
      setNameError(true);
      message.error(t('nameIsRequired'));
      return false;
    }
    setNameError(false);

    if (!email) {
      setEmailError(true);
      return false;
    }

    if (!FormValidator.isValidEmail(email)) {
      setEmailError(true);
      return false;
    }

    if (!password) {
      setPasswordError(true);
      return false;
    }

    if (password.length < 8) {
      setPasswordError(true);
      message.error(t('passwordMustBeAtLeast8CharactersLong'));
      return false;
    }
    setPasswordError(false);

    if (!confirmPassword) {
      setConfirmPasswordError(true);
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError(true);
      return false;
    }
    setConfirmPasswordError(false);

    return true;
  };

  const onSignUp = async () => {
    setSignUpError('');

    if (validateFieldsForSignUp()) {
      setLoading(true);

      try {
        await userApi.signUp({
          email,
          password,
          name,
          cloudflareTurnstileToken: token,
        });
      } catch (e) {
        setSignUpError(StringUtils.capitalizeFirstLetter((e as Error).message));
        resetCloudflareTurnstile();
      }
    }

    setLoading(false);
  };

  return (
    <div className="w-full max-w-[300px]">
      <div className="mb-5 text-center text-2xl font-bold">{t('signUp')}</div>

      <div className="mt-4">
        <div className="space-y-2">
          <GithubOAuthComponent />
          <GoogleOAuthComponent />
        </div>
      </div>

      {(GOOGLE_CLIENT_ID || GITHUB_CLIENT_ID) && (
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-white px-2 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
              {t('continueWithEmail')}
            </span>
          </div>
        </div>
      )}

      <div className="my-1 text-xs font-semibold">{t('fullName')}</div>
      <Input
        placeholder={t('fullNamePlaceholder')}
        value={name}
        onChange={(e) => {
          setNameError(false);
          setName(e.currentTarget.value);
        }}
        status={nameError ? 'error' : undefined}
      />

      <div className="my-1 text-xs font-semibold">{t('yourEmail')}</div>
      <Input
        placeholder={t('emailPlaceholder')}
        value={email}
        onChange={(e) => {
          setEmailError(false);
          setEmail(e.currentTarget.value.trim().toLowerCase());
        }}
        status={isEmailError ? 'error' : undefined}
        type="email"
      />

      <div className="my-1 text-xs font-semibold">{t('password')}</div>
      <Input.Password
        placeholder={t('passwordPlaceholder')}
        value={password}
        onChange={(e) => {
          setPasswordError(false);
          setPassword(e.currentTarget.value);
        }}
        status={passwordError ? 'error' : undefined}
        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        visibilityToggle={{ visible: passwordVisible, onVisibleChange: setPasswordVisible }}
      />

      <div className="my-1 text-xs font-semibold">{t('confirmPassword')}</div>
      <Input.Password
        placeholder={t('passwordPlaceholder')}
        value={confirmPassword}
        status={confirmPasswordError ? 'error' : undefined}
        onChange={(e) => {
          setConfirmPasswordError(false);
          setConfirmPassword(e.currentTarget.value);
        }}
        iconRender={(visible) => (visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />)}
        visibilityToggle={{
          visible: confirmPasswordVisible,
          onVisibleChange: setConfirmPasswordVisible,
        }}
      />

      <div className="mt-3" />

      <CloudflareTurnstileWidget containerRef={containerRef} />

      <Button
        disabled={isLoading}
        loading={isLoading}
        className="w-full"
        onClick={() => {
          onSignUp();
        }}
        type="primary"
      >
        {t('signUp')}
      </Button>

      {signUpError && (
        <div className="mt-3 flex justify-center text-center text-sm text-red-600">
          {signUpError}
        </div>
      )}

      {onSwitchToSignIn && (
        <div className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
          {t('alreadyHaveAccount')}{' '}
          <button
            type="button"
            onClick={onSwitchToSignIn}
            className="cursor-pointer font-medium text-blue-600 hover:text-blue-700 dark:!text-blue-500"
          >
            {t('signIn')}
          </button>
        </div>
      )}
    </div>
  );
}
