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
      const { MessageReader } = await import('@solimanware/capacitor-sms-reader');
      const status = await MessageReader.checkPermissions();
      return status.messages === 'granted';
    } catch (err) {
      console.warn('Native SMS checkPermissions fallback:', err);
      return true;
    }
  }
  return true;
}

export async function readDeviceSms(filterKeyword = null) {
  if (isNative) {
    try {
      const { MessageReader } = await import('@solimanware/capacitor-sms-reader');
      
      const filter = { limit: 150 };
      if (filterKeyword) {
        filter.body = filterKeyword;
      }
      const result = await MessageReader.getMessages(filter);
      console.log('Native MessageReader result:', result);

      if (!result || !result.messages) return [];

      // Parse every SMS with the regex engine and extract valid debits/credits
      const parsedTransactions = result.messages
        .map(sms => parseTransactionSMS(sms.body))
        .filter(t => t !== null);

      console.log(`Parsed ${parsedTransactions.length} valid transactions from ${result.messages.length} SMS.`);
      return parsedTransactions;
    } catch (err) {
      console.error('Failed to read device SMS:', err);
      throw err;
    }
  } else {
    return null;
  }
}
