/**
 * Resend Email Service for DexRais.funds
 * Handles transactional emails for registration, payments, DAOs, and contributions
 */

import { Resend } from 'resend';

const resendApiKey = import.meta.env.VITE_RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('VITE_RESEND_API_KEY is not set - email notifications will be disabled');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

const FROM_EMAIL = 'DexRais.funds <noreply@dexrais.funds>';
const PLATFORM_NAME = 'DexRais.funds';

/**
 * Send registration confirmation email
 */
export async function sendRegistrationConfirmation(
  email: string,
  username: string,
  walletAddress: string
) {
  if (!resend) {
    console.log('[Email] Registration confirmation skipped - Resend not configured');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Welcome to ${PLATFORM_NAME}!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #111827 0%, #374151 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .wallet { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 12px; word-break: break-all; margin: 15px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">Welcome to ${PLATFORM_NAME}!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                <p>Thank you for joining ${PLATFORM_NAME} - the decentralized fundraising platform powered by Gnosis Safe and Aragon DAO.</p>

                <p><strong>Your Account Details:</strong></p>
                <div class="wallet">
                  <strong>Wallet:</strong> ${walletAddress}
                </div>

                <p>You can now:</p>
                <ul>
                  <li>Launch fundraising campaigns with all-or-nothing funding</li>
                  <li>Create DAOs with Aragon governance</li>
                  <li>Back projects with USDC on Base Chain</li>
                  <li>Participate in decentralized governance</li>
                </ul>

                <a href="${window.location.origin}/dashboard" class="button">Go to Dashboard</a>

                <p>All funds are secured in Gnosis Safe multisig wallets with automatic refunds if campaigns don't reach 100% of their goal.</p>
              </div>
              <div class="footer">
                <p>${PLATFORM_NAME} - 100% On-Chain Fundraising</p>
                <p>This email was sent to ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Registration confirmation error:', error);
      return null;
    }

    console.log('[Email] Registration confirmation sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] Registration confirmation failed:', error);
    return null;
  }
}

/**
 * Send payment confirmation email (299 USDC launch fee)
 */
export async function sendPaymentConfirmation(
  email: string,
  username: string,
  campaignTitle: string,
  amount: number,
  txHash: string
) {
  if (!resend) {
    console.log('[Email] Payment confirmation skipped - Resend not configured');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `Payment Confirmed - ${campaignTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .tx-hash { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; word-break: break-all; margin: 15px 0; }
              .amount { font-size: 32px; font-weight: bold; color: #059669; margin: 20px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">✓ Payment Confirmed</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                <p>Your payment has been successfully confirmed!</p>

                <div class="amount">${amount} USDC</div>

                <p><strong>Campaign:</strong> ${campaignTitle}</p>

                <p><strong>Transaction Hash:</strong></p>
                <div class="tx-hash">${txHash}</div>

                <a href="https://basescan.org/tx/${txHash}" class="button" target="_blank">View on BaseScan</a>

                <p>Your campaign is now live and visible on the Launchpad. Start sharing it with your community!</p>
              </div>
              <div class="footer">
                <p>${PLATFORM_NAME} - Secure & Transparent</p>
                <p>This email was sent to ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] Payment confirmation error:', error);
      return null;
    }

    console.log('[Email] Payment confirmation sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] Payment confirmation failed:', error);
    return null;
  }
}

/**
 * Send DAO successfully listed notification
 */
export async function sendDAOListedNotification(
  email: string,
  username: string,
  campaignTitle: string,
  daoAddress: string,
  safeAddress: string,
  campaignUrl: string
) {
  if (!resend) {
    console.log('[Email] DAO listed notification skipped - Resend not configured');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `DAO Successfully Created - ${campaignTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .address { background: #f3f4f6; padding: 12px; border-radius: 6px; font-family: monospace; font-size: 11px; word-break: break-all; margin: 10px 0; }
              .badge { display: inline-block; background: #ddd6fe; color: #5b21b6; padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 600; margin: 5px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 Your DAO is Live!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${username}</strong>,</p>
                <p>Congratulations! Your campaign with Aragon DAO governance has been successfully created and is now live on ${PLATFORM_NAME}.</p>

                <p><strong>Campaign:</strong> ${campaignTitle}</p>

                <div class="badge">Aragon DAO</div>
                <div class="badge">Gnosis Safe Escrow</div>

                <p><strong>DAO Address:</strong></p>
                <div class="address">${daoAddress}</div>

                <p><strong>Safe Escrow Address:</strong></p>
                <div class="address">${safeAddress}</div>

                <a href="${campaignUrl}" class="button">View Campaign</a>

                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Share your campaign with your community</li>
                  <li>Contributors will receive governance tokens automatically</li>
                  <li>Token holders can vote on proposals</li>
                  <li>Funds unlock automatically at 100% goal</li>
                </ul>

                <p>All contributions are secured in a Gnosis Safe multisig wallet with automatic refunds if the campaign doesn't reach 100% of its goal.</p>
              </div>
              <div class="footer">
                <p>${PLATFORM_NAME} - Decentralized Governance</p>
                <p>This email was sent to ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] DAO listed notification error:', error);
      return null;
    }

    console.log('[Email] DAO listed notification sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] DAO listed notification failed:', error);
    return null;
  }
}

/**
 * Send first contribution notification to campaign creator
 */
export async function sendFirstContributionNotification(
  email: string,
  creatorUsername: string,
  campaignTitle: string,
  contributorAddress: string,
  amount: number,
  campaignUrl: string
) {
  if (!resend) {
    console.log('[Email] First contribution notification skipped - Resend not configured');
    return null;
  }

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: email,
      subject: `First Contribution Received - ${campaignTitle}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; line-height: 1.6; color: #1f2937; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: linear-gradient(135deg, #0891b2 0%, #06b6d4 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
              .content { background: white; padding: 30px; border: 2px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px; }
              .button { display: inline-block; background: #111827; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 20px 0; }
              .amount { font-size: 36px; font-weight: bold; color: #0891b2; margin: 20px 0; }
              .contributor { background: #f0fdfa; padding: 15px; border-radius: 6px; border-left: 4px solid #0891b2; margin: 15px 0; }
              .footer { text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1 style="margin: 0; font-size: 28px;">🎉 First Contribution!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${creatorUsername}</strong>,</p>
                <p>Great news! Your campaign has received its first contribution!</p>

                <div class="amount">${amount} USDC</div>

                <p><strong>Campaign:</strong> ${campaignTitle}</p>

                <div class="contributor">
                  <p style="margin: 0;"><strong>From:</strong></p>
                  <p style="margin: 5px 0 0 0; font-family: monospace; font-size: 11px; word-break: break-all;">${contributorAddress}</p>
                </div>

                <a href="${campaignUrl}" class="button">View Campaign Dashboard</a>

                <p>The funds are securely held in your campaign's Gnosis Safe escrow. Keep the momentum going by:</p>
                <ul>
                  <li>Sharing this milestone with your community</li>
                  <li>Posting campaign updates</li>
                  <li>Engaging with your backers</li>
                  <li>Reaching 100% of your goal to unlock the funds</li>
                </ul>

                <p><em>Remember: This is an all-or-nothing campaign. Funds unlock only at 100% goal achievement.</em></p>
              </div>
              <div class="footer">
                <p>${PLATFORM_NAME} - Your Journey Begins</p>
                <p>This email was sent to ${email}</p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('[Email] First contribution notification error:', error);
      return null;
    }

    console.log('[Email] First contribution notification sent:', data?.id);
    return data;
  } catch (error) {
    console.error('[Email] First contribution notification failed:', error);
    return null;
  }
}
