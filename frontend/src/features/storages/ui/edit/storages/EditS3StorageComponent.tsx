import { DownOutlined, InfoCircleOutlined, UpOutlined } from '@ant-design/icons';
import { Checkbox, Input, Tooltip } from 'antd';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import type { Storage } from '../../../../../entity/storages';

interface Props {
  storage: Storage;
  setStorage: (storage: Storage) => void;
  setUnsaved: () => void;
  connectionError?: string;
}

export function EditS3StorageComponent({
  storage,
  setStorage,
  setUnsaved,
  connectionError,
}: Props) {
  const { t } = useTranslation('storages');
  const hasAdvancedValues =
    !!storage?.s3Storage?.s3Prefix ||
    !!storage?.s3Storage?.s3UseVirtualHostedStyle ||
    !!storage?.s3Storage?.skipTLSVerify;
  const [showAdvanced, setShowAdvanced] = useState(hasAdvancedValues);

  useEffect(() => {
    if (connectionError?.includes('failed to verify certificate')) {
      setShowAdvanced(true);
    }
  }, [connectionError]);

  return (
    <>
      <div className="mb-2 flex items-center">
        <div className="hidden min-w-[110px] sm:block" />

        <div className="text-xs text-blue-600">
          <a href="https://databasus.com/storages/cloudflare-r2" target="_blank" rel="noreferrer">
            {t('howToUseWithCloudflareR2')}
          </a>
        </div>
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3Bucket')}</div>
        <Input
          value={storage?.s3Storage?.s3Bucket || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3Bucket: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="my-bucket-name"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3Region')}</div>
        <Input
          value={storage?.s3Storage?.s3Region || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3Region: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="us-east-1"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3AccessKey')}</div>
        <Input.Password
          value={storage?.s3Storage?.s3AccessKey || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3AccessKey: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          className="w-full max-w-[250px]"
          placeholder="AKIAIOSFODNN7EXAMPLE"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3SecretKey')}</div>
        <Input.Password
          value={storage?.s3Storage?.s3SecretKey || ''}
          onChange={(e) => {
            if (!storage?.s3Storage) return;

            setStorage({
              ...storage,
              s3Storage: {
                ...storage.s3Storage,
                s3SecretKey: e.target.value.trim(),
              },
            });
            setUnsaved();
          }}
          size="small"
          autoComplete="off"
          data-1p-ignore
          data-lpignore="true"
          data-form-type="other"
          className="w-full max-w-[250px]"
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
        />
      </div>

      <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
        <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3Endpoint')}</div>
        <div className="flex items-center">
          <Input
            value={storage?.s3Storage?.s3Endpoint || ''}
            onChange={(e) => {
              if (!storage?.s3Storage) return;

              setStorage({
                ...storage,
                s3Storage: {
                  ...storage.s3Storage,
                  s3Endpoint: e.target.value.trim(),
                },
              });
              setUnsaved();
            }}
            size="small"
            className="w-full max-w-[250px]"
            placeholder="https://s3.example.com (optional)"
          />

          <Tooltip
            className="cursor-pointer"
            title={t('customS3CompatibleEndpointUrlOptionalLeaveEmptyForAWSS3')}
          >
            <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
          </Tooltip>
        </div>
      </div>

      <div className="mt-4 mb-3 flex items-center">
        <div
          className="flex cursor-pointer items-center text-sm text-blue-600 hover:text-blue-800"
          onClick={() => setShowAdvanced(!showAdvanced)}
        >
          <span className="mr-2">{t('advancedSettings')}</span>

          {showAdvanced ? (
            <UpOutlined style={{ fontSize: '12px' }} />
          ) : (
            <DownOutlined style={{ fontSize: '12px' }} />
          )}
        </div>
      </div>

      {showAdvanced && (
        <>
          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('folderPrefix')}</div>
            <div className="flex items-center">
              <Input
                value={storage?.s3Storage?.s3Prefix || ''}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      s3Prefix: e.target.value.trim(),
                    },
                  });
                  setUnsaved();
                }}
                size="small"
                className="w-full max-w-[250px]"
                placeholder="my-prefix/ (optional)"
                // we do not allow to change the prefix after creation,
                // otherwise we will have to migrate all the data to the new prefix
                disabled={!!storage.id}
              />

              <Tooltip
                className="cursor-pointer"
                title={t('optionalPrefixForAllObjectKeys')}
              >
                <InfoCircleOutlined className="ml-4" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3VirtualHost')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={storage?.s3Storage?.s3UseVirtualHostedStyle || false}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      s3UseVirtualHostedStyle: e.target.checked,
                    },
                  });
                  setUnsaved();
                }}
              >
                {t('useVirtualStyledDomains')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('useVirtualHostedStyleUrls')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>

          <div className="mb-1 flex w-full flex-col items-start sm:flex-row sm:items-center">
            <div className="mb-1 min-w-[110px] sm:mb-0">{t('s3SkipTlsVerify')}</div>
            <div className="flex items-center">
              <Checkbox
                checked={storage?.s3Storage?.skipTLSVerify || false}
                onChange={(e) => {
                  if (!storage?.s3Storage) return;

                  setStorage({
                    ...storage,
                    s3Storage: {
                      ...storage.s3Storage,
                      skipTLSVerify: e.target.checked,
                    },
                  });
                  setUnsaved();
                }}
              >
                {t('skipTLS')}
              </Checkbox>

              <Tooltip
                className="cursor-pointer"
                title={t('skipTLSCertificateVerification')}
              >
                <InfoCircleOutlined className="ml-2" style={{ color: 'gray' }} />
              </Tooltip>
            </div>
          </div>
        </>
      )}

      <div className="mb-5" />
    </>
  );
}
