/**
 * Platform Adapters Factory & Registry for Dairy Farm ERP
 * Automatically selects the appropriate adapter (Web vs Android) at runtime.
 */

import { Capacitor } from '@capacitor/core';
import { PlatformAdapters } from './interfaces.ts';
import {
  WebDatabaseAdapter,
  WebNotificationAdapter,
  WebFileStorageAdapter,
  WebCameraAdapter,
  WebBackupAdapter,
  WebShareAdapter,
} from './web/WebAdapters.ts';
import {
  AndroidDatabaseAdapter,
  AndroidNotificationAdapter,
  AndroidFileStorageAdapter,
  AndroidCameraAdapter,
  AndroidBackupAdapter,
  AndroidShareAdapter,
} from './android/AndroidAdapters.ts';

let activeAdapters: PlatformAdapters | null = null;

export function getPlatformAdapters(): PlatformAdapters {
  if (activeAdapters) {
    return activeAdapters;
  }

  const isNative = Capacitor.isNativePlatform();
  const platform = Capacitor.getPlatform() as 'web' | 'android' | 'ios';

  if (isNative && platform === 'android') {
    activeAdapters = {
      db: new AndroidDatabaseAdapter(),
      notifications: new AndroidNotificationAdapter(),
      storage: new AndroidFileStorageAdapter(),
      camera: new AndroidCameraAdapter(),
      backup: new AndroidBackupAdapter(),
      share: new AndroidShareAdapter(),
      isNative: true,
      platform: 'android',
    };
  } else {
    activeAdapters = {
      db: new WebDatabaseAdapter(),
      notifications: new WebNotificationAdapter(),
      storage: new WebFileStorageAdapter(),
      camera: new WebCameraAdapter(),
      backup: new WebBackupAdapter(),
      share: new WebShareAdapter(),
      isNative: false,
      platform: 'web',
    };
  }

  return activeAdapters;
}
