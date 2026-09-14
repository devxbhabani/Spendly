package com.yourname.expensetracker;

import android.app.Notification;
import android.os.Bundle;
import android.service.notification.NotificationListenerService;
import android.service.notification.StatusBarNotification;
import android.util.Log;

import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Android NotificationListenerService that automatically captures transaction
 * push notifications from PhonePe, Google Pay, Paytm, and Indian Banking apps
 * and stores them in your database in real time.
 */
public class PaymentNotificationListener extends NotificationListenerService {
    private static final String TAG = "SpendlyNotifListener";
    private static final String API_URL = "https://spendly-9qw5.onrender.com/api/transactions";

    @Override
    public void onNotificationPosted(StatusBarNotification sbn) {
        if (sbn == null) return;

        String packageName = sbn.getPackageName();
        if (packageName == null) return;

        // Check for PhonePe, Google Pay, Paytm, or banking apps
        boolean isPhonePe = packageName.contains("com.phonepe.app");
        boolean isGPay = packageName.contains("com.google.android.apps.nbu.paisa.user");
        boolean isPaytm = packageName.contains("net.one97.paytm");
        boolean isBank = packageName.contains("bank") || packageName.contains("uco") || packageName.contains("sbi") || packageName.contains("hdfc") || packageName.contains("icici");

        if (!isPhonePe && !isGPay && !isPaytm && !isBank) {
            return; // Ignore other app notifications
        }

        Notification notification = sbn.getNotification();
        if (notification == null) return;

        Bundle extras = notification.extras;
        if (extras == null) return;

        CharSequence titleCS = extras.getCharSequence(Notification.EXTRA_TITLE);
        CharSequence textCS = extras.getCharSequence(Notification.EXTRA_TEXT);
        CharSequence bigTextCS = extras.getCharSequence(Notification.EXTRA_BIG_TEXT);

        String title = titleCS != null ? titleCS.toString() : "";
        String text = textCS != null ? textCS.toString() : "";
        String bigText = bigTextCS != null ? bigTextCS.toString() : "";

        String combined = (title + " " + text + " " + bigText).trim();
        Log.d(TAG, "Intercepted payment notification from " + packageName + ": " + combined);

        // Check if debit or credit
        boolean isDebit = Pattern.compile("(?i)(paid|debited|sent|spent|transferred to|payment of|txn of)").matcher(combined).find();
        boolean isCredit = Pattern.compile("(?i)(received|credited|deposited|added|refunded|cashback)").matcher(combined).find();

        if (!isDebit && !isCredit) {
            return; // Ignore promotional notifications
        }

        // Extract Amount
        Matcher amountMatcher = Pattern.compile("(?i)(?:RS|INR|₹|Rs\\.?)\\s*([\\d,]+(?:\\.\\d{1,2})?)").matcher(combined);
        if (!amountMatcher.find()) return;

        String amountStr = amountMatcher.group(1).replace(",", "");
        double amount;
        try {
            amount = Double.parseDouble(amountStr);
        } catch (NumberFormatException e) {
            return;
        }

        // Determine Source
        String source = "PhonePe";
        if (isGPay) source = "Google Pay";
        else if (isPaytm) source = "Paytm";
        else if (isBank) source = "Bank Alert";

        // Extract Merchant / Payee
        String merchant = "Unknown";
        Matcher merchantMatcher = Pattern.compile("(?i)(?:to\\s+|at\\s+|from\\s+|for\\s+)([a-zA-Z0-9.\\-_@ ]{2,30}?)(?:\\.|\\s+via|\\s+on|\\s+using|$)").matcher(combined);
        if (merchantMatcher.find()) {
            merchant = merchantMatcher.group(1).trim();
        } else {
            merchant = isDebit ? (source + " Transfer") : (source + " Credit");
        }

        // Categorize
        String category = "Other Payment";
        String lower = combined.toLowerCase();
        if (lower.contains("swiggy") || lower.contains("zomato") || lower.contains("food") || lower.contains("starbucks") || lower.contains("cafe")) {
            category = "Food & Dining";
        } else if (lower.contains("amazon") || lower.contains("flipkart") || lower.contains("myntra") || lower.contains("store") || lower.contains("shopping")) {
            category = "Shopping & Retail";
        } else if (lower.contains("uber") || lower.contains("ola") || lower.contains("rapido") || lower.contains("petrol") || lower.contains("fuel")) {
            category = "Transportation";
        } else if (lower.contains("airtel") || lower.contains("jio") || lower.contains("recharge") || lower.contains("billdesk") || lower.contains("electricity")) {
            category = "Bills & Utilities";
        } else if (lower.contains("salary") || lower.contains("payroll")) {
            category = "Salary & Income";
        } else {
            category = "UPI & Bank Transfer";
        }

        final String fType = isDebit ? "EXPENSE" : "INCOME";
        final double fAmount = amount;
        final String fMerchant = merchant;
        final String fCategory = category;
        final String fSource = source;
        final String fRaw = combined;

        // Post to MongoDB API asynchronously
        new Thread(() -> {
            try {
                JSONObject json = new JSONObject();
                json.put("type", fType);
                json.put("amount", fAmount);
                json.put("merchant", fMerchant);
                json.put("category", fCategory);
                json.put("source", fSource);
                json.put("rawSms", fRaw);

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
                Log.d(TAG, "✓ Notification transaction posted with code: " + code);
                conn.disconnect();
            } catch (Exception e) {
                Log.e(TAG, "Failed to post notification transaction", e);
            }
        }).start();
    }
}
