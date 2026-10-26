const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
console.log('RESEND_API_KEY present:', !!apiKey, apiKey?.slice(0, 8) + '...');

const resend = new Resend(apiKey);

async function testEmail() {
  const targetEmail = 'officialseyven@gmail.com';
  console.log(`Sending luxury branded test email to: ${targetEmail}`);

  // Branded HTML email for SEYVEN
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F9F6F0; margin: 0; padding: 24px; }
          .container { max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border: 1px solid #E6DFD5; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.04); }
          .header { background-color: #1C1917; padding: 32px 24px; text-align: center; }
          .logo { font-size: 26px; font-weight: 300; letter-spacing: 0.35em; color: #FFFFFF; text-transform: uppercase; margin: 0; font-family: 'Times New Roman', serif; }
          .tagline { color: #C7A97B; font-size: 10px; letter-spacing: 0.25em; text-transform: uppercase; margin-top: 6px; font-weight: 600; }
          .body-content { padding: 36px 32px; color: #1C1917; }
          h2 { font-size: 20px; font-weight: 400; margin-top: 0; color: #1C1917; letter-spacing: 0.02em; }
          p { font-size: 14px; line-height: 1.6; color: #44403C; margin: 12px 0; }
          .badge-box { background-color: #F5EFEB; border: 1px solid #C7A97B; border-radius: 8px; padding: 18px 20px; margin: 24px 0; }
          .badge-title { font-size: 11px; text-transform: uppercase; letter-spacing: 0.15em; color: #8A6E3D; font-weight: 700; margin-bottom: 6px; }
          .badge-val { font-size: 15px; font-weight: 600; color: #1C1917; }
          .footer { background-color: #F9F6F0; padding: 24px; text-align: center; font-size: 11px; color: #78716C; border-top: 1px solid #E6DFD5; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 class="logo">S E Y V E N</h1>
            <div class="tagline">Clinical Dermal Formulations — Dhaka</div>
          </div>
          <div class="body-content">
            <h2>Welcome to SEYVEN Privileges ✦</h2>
            <p>Dear Client,</p>
            <p>আপনার <strong>SEYVEN</strong> ডার্মাল একাউন্টের লাইভ ইমেইল সার্ভিস এবং প্রিভিলেজ মেম্বারশিপ নোটিফিকেশন সিস্টেম সফলভাবে সংযুক্ত করা হয়েছে।</p>
            
            <div class="badge-box">
              <div class="badge-title">VIP Membership Status</div>
              <div class="badge-val">✦ SEYVEN Gold Tier — Active</div>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #57534E;">
                আপনার প্রতিটি অর্ডারে অটোমেটিক রিওয়ার্ড পয়েন্ট যোগ হবে এবং বিশেষ প্রি-লঞ্চ অফার নোটিফিকেশন এই ইমেইলে সরাসরি পৌঁছাবে।
              </p>
            </div>

            <p>আপনার স্কিনকেয়ার সলিউশন ও অর্ডারের যেকোনো প্রয়োজনে আমাদের হেল্পলাইন ২৪/৭ আপনার পাশে রয়েছে।</p>
            
            <p style="margin-top: 24px; font-size: 13px; color: #78716C;">
              Warm regards,<br>
              <strong>Farah Rahman</strong><br>
              Head of Client Experience, SEYVEN Dhaka
            </p>
          </div>
          <div class="footer">
            &copy; 2026 SEYVEN Skincare Bangladesh. All rights reserved.<br>
            House 42, Road 11, Banani, Dhaka, Bangladesh | helpline@seyven.com
          </div>
        </div>
      </body>
    </html>
  `;

  // Try 1: with Resend sandbox domain onboarding@resend.dev
  console.log('--- Attempt 1: from SEYVEN <onboarding@resend.dev> ---');
  try {
    const res1 = await resend.emails.send({
      from: 'SEYVEN <onboarding@resend.dev>',
      to: [targetEmail],
      subject: '✦ Welcome to SEYVEN Dermal Privileges — System Live Test',
      html: htmlContent,
    });
    console.log('Attempt 1 Result:', res1);
    if (!res1.error) {
      console.log('✅ Email delivered successfully with ID:', res1.data?.id);
      return;
    }
  } catch (err) {
    console.warn('Attempt 1 Error:', err.message);
  }

  // Try 2: with officialseyven@gmail.com
  console.log('--- Attempt 2: from SEYVEN <officialseyven@gmail.com> ---');
  try {
    const res2 = await resend.emails.send({
      from: 'SEYVEN <officialseyven@gmail.com>',
      to: [targetEmail],
      subject: '✦ Welcome to SEYVEN Dermal Privileges — System Live Test',
      html: htmlContent,
    });
    console.log('Attempt 2 Result:', res2);
  } catch (err) {
    console.warn('Attempt 2 Error:', err.message);
  }
}

testEmail();
