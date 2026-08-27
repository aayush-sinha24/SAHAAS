/**
 * emailService.js — EMAIL FEATURE REMOVED
 *
 * The email feature has been fully removed from this app.
 * This file is a no-op stub kept only so imports don't break.
 * No email is sent. No external service is called.
 */

export const sendFIREmail = async (_fir) => {
    // Email feature removed — returns immediately, no network call, no errors
    return { success: true, message: 'Email feature disabled', disabled: true };
};
