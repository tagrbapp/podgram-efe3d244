import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@3.5.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ApprovalEmailRequest {
  email: string;
  fullName: string;
  approved: boolean;
  rejectionReason?: string;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, fullName, approved, rejectionReason }: ApprovalEmailRequest = await req.json();

    console.log(`Sending ${approved ? 'approval' : 'rejection'} email to: ${email}`);

    // Fetch email settings from database
    const { data: emailSettings, error: settingsError } = await supabase
      .from('email_settings')
      .select('*')
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      throw new Error('Failed to fetch email settings');
    }

    const emailResponse = await resend.emails.send({
      from: `${emailSettings.sender_name} <${emailSettings.sender_email}>`,
      to: [email],
      subject: approved ? emailSettings.approval_subject : emailSettings.rejection_subject,
      html: approved 
        ? `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb; margin-bottom: 20px;">${emailSettings.approval_title.replace('{name}', fullName)}</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ${emailSettings.approval_message}
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 10px;">المزايا الجديدة:</h2>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>إمكانية إضافة عدد غير محدود من الإعلانات</li>
                <li>إنشاء مزادات خاصة</li>
                <li>أولوية في الظهور</li>
                <li>إحصائيات متقدمة</li>
              </ul>
            </div>
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
              يمكنك الآن تسجيل الدخول والبدء في الاستفادة من حسابك الجديد.
            </p>
            <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://podgram.com'}" 
               style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 20px 0;">
              ${emailSettings.approval_button_text}
            </a>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              ${emailSettings.footer_text}<br>
              فريق ${emailSettings.sender_name}
            </p>
          </div>
        `
        : `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #dc2626; margin-bottom: 20px;">${emailSettings.rejection_title} ${fullName}</h1>
            <p style="font-size: 16px; line-height: 1.6; color: #333;">
              ${emailSettings.rejection_message}
            </p>
            ${rejectionReason ? `
              <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-right: 4px solid #dc2626; margin: 20px 0;">
                <p style="color: #991b1b; font-weight: bold; margin-bottom: 10px;">السبب:</p>
                <p style="color: #7f1d1d;">${rejectionReason}</p>
              </div>
            ` : ''}
            <p style="font-size: 16px; color: #333; margin: 20px 0;">
              ${emailSettings.rejection_footer}
            </p>
            <p style="font-size: 14px; color: #6b7280; margin-top: 30px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
              ${emailSettings.footer_text}<br>
              فريق ${emailSettings.sender_name}
            </p>
          </div>
        `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-approval-email function:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
