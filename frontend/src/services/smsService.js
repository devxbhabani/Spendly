import { Capacitor } from '@capacitor/core';
import { parseTransactionSMS } from './parser';

/**
 * Service to interface with native Android SMSInboxReader
 * when running inside Capacitor Android, or simulate in web browser.
 */

export const isNative = Capacitor.isNativePlatform();

export async function requestSmsPermission() {
  if (isNative) {
    try {
      const { SMSInboxReader } = await import('@solimanware/capacitor-sms-reader');
      const status = await SMSInboxReader.requestPermissions();
      return status.sms === 'granted';
    } catch (err) {
      console.warn('Native SMS permission request failed:', err);
      return false;
    }
  }
  return true;
}

export async function readDeviceSms(filterKeyword = null) {
  if (isNative) {
    try {
      const { SMSInboxReader } = await import('@solimanware/capacitor-sms-reader');
      
      // If keyword provided, filter; otherwise read recent inbox messages
      const options = filterKeyword ? { filter: { body: filterKeyword } } : {};
      const result = await SMSInboxReader.getSMSList(options);

      if (!result || !result.smsList) return [];

      // Parse every SMS with the regex engine and extract valid debits/credits
      const parsedTransactions = result.smsList
        .map(sms => parseTransactionSMS(sms.body))
        .filter(t => t !== null);

      return parsedTransactions;
    } catch (err) {
      console.error('Failed to read device SMS:', err);
      throw err;
    }
  } else {
    return null;
  }
}
