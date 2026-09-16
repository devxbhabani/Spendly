package com.yourname.expensetracker;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;
import android.telephony.SmsMessage;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Automatically intercepts incoming SMS in the background (even when the app is closed)
 * and posts verified bank/UPI transactions directly to your MongoDB Atlas backend.
 */
public class SmsReceiver extends BroadcastReceiver {
    private static final String TAG = "SpendlySmsReceiver";
    private static final String API_URL = "https://spendly-9qw5.onrender.com/api/transactions";

    @Override
    public void onReceive(Context context, Intent intent) {
        if (intent == null || !"android.provider.Telephony.SMS_RECEIVED".equals(intent.getAction())) {
            return;
        }

        Bundle bundle = intent.getExtras();
        if (bundle == null) return;

        Object[] pdus = (Object[]) bundle.get("pdus");
        if (pdus == null || pdus.length == 0) return;

        String format = bundle.getString("format");
        StringBuilder fullMessage = new StringBuilder();
        String sender = "";

        for (Object pdu : pdus) {
            SmsMessage sms;
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.M) {
                sms = SmsMessage.createFromPdu((byte[]) pdu, format);
            } else {
                sms = SmsMessage.createFromPdu((byte[]) pdu);
            }
            if (sms != null) {
                sender = sms.getDisplayOriginatingAddress();
                fullMessage.append(sms.getMessageBody());
            }
        }

        String smsBody = fullMessage.toString().trim();
        Log.d(TAG, "Incoming SMS from " + sender + ": " + smsBody);

        // Ignore promotional messages
        boolean isPromo = Pattern.compile("(?i)(cashback\\s+waiting|claim\\s+your|use\\s+code|coupon|flat\\s+\\d+%|%\\s*off|hurry|offer\\s+is\\s+valid|reward\\s+points)").matcher(smsBody).find();
        if (isPromo) return;

        // Verify if it's a transaction SMS (Credit phrases take precedence over "sent to your account")
        boolean isExplicitCredit = Pattern.compile("(?i)(money\\s+received|received\\s+from|has\\s+sent.*to\\s+your|credited|deposited|refund)").matcher(smsBody).find();
        boolean isDebit = !isExplicitCredit && Pattern.compile("(?i)(debited|paid|spent|transferred to|purchase|txn of|sent.*to)").matcher(smsBody).find();
        boolean isCredit = isExplicitCredit || Pattern.compile("(?i)(received|added)").matcher(smsBody).find();

        if (!isDebit && !isCredit) {
            return; // Ignore non-transactional messages
        }

        // Extract Amount
        Matcher amountMatcher = Pattern.compile("(?i)(?:RS|INR|₹|Rs\\.?)\\s*([\\d,]+(?:\\.\\d{1,2})?)").matcher(smsBody);
        if (!amountMatcher.find()) return;

        String amountStr = amountMatcher.group(1).replace(",", "");
        double amount;
        try {
            amount = Double.parseDouble(amountStr);
        } catch (NumberFormatException e) {
            return;
        }

        // Extract Merchant / Beneficiary
        String merchant = "Unknown";
        Matcher merchantMatcher = Pattern.compile("(?i)(?:to\\s+(?:vpa\\s+)?|at\\s+|info[\\s*:]+|beneficiary\\s+|for\\s+|by\\s+)([a-zA-Z0-9.\\-_@ ]{2,30}?)(?:\\.|\\s+on|\\s+ref|\\s+via|\\s+avl|\\s+bal|\\s+upi|\\s+report|$)").matcher(smsBody);
        if (merchantMatcher.find()) {
            merchant = merchantMatcher.group(1).trim();
        } else if (smsBody.toLowerCase().contains("uco-upi") || smsBody.toLowerCase().contains("uco")) {
            merchant = "UCO-UPI";
        } else if (smsBody.toLowerCase().contains("phonepe")) {
            merchant = "PhonePe UPI";
        }

        // Extract Account ending digits
        String account = null;
        Matcher accMatcher = Pattern.compile("(?i)(?:a/c|acct|account|card)\\s*(?:no\\.?)?\\s*(?:ending\\s+|xx+|\\*+)?([0-9]{3,6})").matcher(smsBody);
        if (accMatcher.find()) {
            account = "**" + accMatcher.group(1).substring(Math.max(0, accMatcher.group(1).length() - 4));
        }

        // Determine Source Bank / App
        String source = "Bank SMS";
        if (smsBody.toLowerCase().contains("uco")) source = "UCO Bank";
        else if (smsBody.toLowerCase().contains("phonepe")) source = "PhonePe";
        else if (smsBody.toLowerCase().contains("sbi")) source = "SBI";
        else if (smsBody.toLowerCase().contains("hdfc")) source = "HDFC Bank";
        else if (smsBody.toLowerCase().contains("icici")) source = "ICICI Bank";

        // Categorize
        String category = "Other Payment";
        String lowerBody = smsBody.toLowerCase();
        if (lowerBody.contains("swiggy") || lowerBody.contains("zomato") || lowerBody.contains("restaurant") || lowerBody.contains("food") || lowerBody.contains("starbucks")) {
            category = "Food & Dining";
        } else if (lowerBody.contains("amazon") || lowerBody.contains("flipkart") || lowerBody.contains("myntra") || lowerBody.contains("retail") || lowerBody.contains("store")) {
            category = "Shopping & Retail";
        } else if (lowerBody.contains("uber") || lowerBody.contains("ola") || lowerBody.contains("petrol") || lowerBody.contains("fuel") || lowerBody.contains("fastag")) {
            category = "Transportation";
        } else if (lowerBody.contains("airtel") || lowerBody.contains("jio") || lowerBody.contains("electricity") || lowerBody.contains("water") || lowerBody.contains("billdesk")) {
            category = "Bills & Utilities";
        } else if (lowerBody.contains("salary") || lowerBody.contains("payroll") || lowerBody.contains("allowance")) {
            category = "Salary & Income";
        } else if (lowerBody.contains("uco") || lowerBody.contains("upi")) {
            category = "UPI & Bank Transfer";
        }

        // Asynchronously post to backend MongoDB Atlas API
        final String fType = isDebit ? "EXPENSE" : "INCOME";
        final double fAmount = amount;
        final String fMerchant = merchant;
        final String fCategory = category;
        final String fSource = source;
        final String fAccount = account;
        final String fRawSms = smsBody;

        new Thread(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("type", fType);
                json.put("amount", fAmount);
                json.put("merchant", fMerchant);
                json.put("category", fCategory);
                json.put("source", fSource);
                json.put("account", fAccount);
                json.put("rawSms", fRawSms);

                URL url = new URL(API_URL);
                HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                conn.setRequestMethod("POST");
                conn.setRequestProperty("Content-Type", "application/json; utf-8");
                conn.setRequestProperty("Accept", "application/json");
                conn.setDoOutput(true);
                conn.setConnectTimeout(15000);
                conn.setReadTimeout(15000);

                try (OutputStream os = conn.getOutputStream()) {
                    byte[] input = json.toString().getBytes(StandardCharsets.UTF_8);
                    os.write(input, 0, input.length);
                }

                int code = conn.getResponseCode();
                Log.d(TAG, "✓ SMS transaction posted to backend with response code: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to post SMS transaction to backend", e);
            }
        }).start();
    }
}
