/**
 * SEYVEN - The Sanctuary of Beauty
 * Password Reset Verification Email Template
 */

export function generatePasswordResetHtml(code: string, recipientName: string = 'Valued Client'): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SEYVEN - Security Verification</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F9F6F0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1C1917;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F9F6F0; padding: 40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 520px; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 6px; overflow: hidden; box-shadow: 0 4px 20px rgba(28, 25, 23, 0.05);">
          <!-- Top Accent Gold Line -->
          <tr>
            <td style="height: 4px; background-color: #C7A97B;"></td>
          </tr>

          <!-- Header -->
          <tr>
            <td style="padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #E6DFD5;">
              <h1 style="margin: 0; font-family: Georgia, 'Times New Roman', serif; font-size: 26px; letter-spacing: 0.25em; color: #1C1917; font-weight: 500;">
                SEYVEN
              </h1>
              <p style="margin: 6px 0 0 0; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #C7A97B; font-weight: 600;">
                THE SANCTUARY OF BEAUTY
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              <h2 style="margin: 0 0 16px 0; font-family: Georgia, serif; font-size: 20px; font-weight: 500; color: #1C1917;">
                Reset Your Password
              </h2>
              <p style="margin: 0 0 20px 0; font-size: 13px; line-height: 1.6; color: #78716C;">
                Dear ${recipientName},<br>
                We received a request to access your SEYVEN account. Please use the following single-use verification code to complete your password update.
              </p>

              <!-- Code Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0;">
                <tr>
                  <td align="center" style="background-color: #F9F6F0; border: 1px solid #E6DFD5; border-radius: 4px; padding: 20px 0;">
                    <span style="font-family: 'Courier New', Courier, monospace; font-size: 32px; font-weight: 700; letter-spacing: 0.35em; color: #1C1917;">
                      ${code}
                    </span>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 12px 0; font-size: 12px; color: #A8A29E; line-height: 1.5; text-align: center;">
                This code expires in <strong>10 minutes</strong>. If you did not initiate this request, no action is required.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #F9F6F0; border-top: 1px solid #E6DFD5; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #A8A29E; letter-spacing: 0.05em;">
                SEYVEN Concierge Desk &bull; Secured with TLS 1.3
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

