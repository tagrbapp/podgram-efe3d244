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
      .select(`
        *,
        approval_template:approval_template_id(
          primary_color,
          header_style,
          show_features_box,
          button_style
        ),
        rejection_template:rejection_template_id(
          primary_color,
          header_style,
          button_style
        )
      `)
      .single();

    if (settingsError) {
      console.error('Error fetching email settings:', settingsError);
      throw new Error('Failed to fetch email settings');
    }

    const template = approved ? emailSettings.approval_template : emailSettings.rejection_template;
    const primaryColor = template?.primary_color || (approved ? '#2563eb' : '#dc2626');
    const headerStyle = template?.header_style || 'classic';
    const buttonStyle = template?.button_style || 'solid';

    // Dynamic styles based on template
    const headerPadding = headerStyle === 'luxury' ? '40px' : '20px';
    const titleSize = headerStyle === 'modern' ? '28px' : '24px';
    const buttonBg = buttonStyle === 'outline' ? 'transparent' : primaryColor;
    const buttonBorder = buttonStyle === 'outline' ? `2px solid ${primaryColor}` : 'none';
    const buttonColor = buttonStyle === 'outline' ? primaryColor : 'white';

    const emailResponse = await resend.emails.send({
      from: `${emailSettings.sender_name} <${emailSettings.sender_email}>`,
      to: [email],
      subject: approved ? emailSettings.approval_subject : emailSettings.rejection_subject,
      html: approved 
        ? `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: ${headerPadding}; background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05);">
            <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              <div style="background: ${primaryColor}; padding: ${headerPadding}; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: ${titleSize};">${emailSettings.approval_title.replace('{name}', fullName)}</h1>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 20px;">
                  ${emailSettings.approval_message}
                </p>
                ${template?.show_features_box ? `
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; border-right: 4px solid ${primaryColor};">
                  <h2 style="color: #1f2937; font-size: 18px; margin-bottom: 15px;">المزايا الجديدة:</h2>
                  <ul style="color: #4b5563; line-height: 2;">
                    <li>إمكانية إضافة عدد غير محدود من الإعلانات</li>
                    <li>إنشاء مزادات خاصة</li>
                    <li>أولوية في الظهور</li>
                    <li>إحصائيات متقدمة</li>
                  </ul>
                </div>
                ` : ''}
                <p style="font-size: 16px; color: #333; margin: 20px 0;">
                  يمكنك الآن تسجيل الدخول والبدء في الاستفادة من حسابك الجديد.
                </p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovableproject.com') || 'https://podgram.com'}" 
                     style="display: inline-block; background: ${buttonBg}; color: ${buttonColor}; border: ${buttonBorder}; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; transition: all 0.3s;">
                    ${emailSettings.approval_button_text}
                  </a>
                </div>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                  ${emailSettings.footer_text}<br>
                  <strong>${emailSettings.sender_name}</strong>
                </p>
              </div>
            </div>
          </div>
        `
        : `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: ${headerPadding}; background: linear-gradient(135deg, ${primaryColor}10, ${primaryColor}05);">
            <div style="background: white; border-radius: 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); overflow: hidden;">
              <div style="background: ${primaryColor}; padding: ${headerPadding}; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: ${titleSize};">${emailSettings.rejection_title} ${fullName}</h1>
              </div>
              <div style="padding: 30px;">
                <p style="font-size: 16px; line-height: 1.8; color: #333; margin-bottom: 20px;">
                  ${emailSettings.rejection_message}
                </p>
                ${rejectionReason ? `
                  <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; border-right: 4px solid ${primaryColor}; margin: 20px 0;">
                    <p style="color: #991b1b; font-weight: bold; margin-bottom: 10px;">السبب:</p>
                    <p style="color: #7f1d1d;">${rejectionReason}</p>
                  </div>
                ` : ''}
                <p style="font-size: 16px; color: #333; margin: 20px 0;">
                  ${emailSettings.rejection_footer}
                </p>
              </div>
              <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
                <p style="font-size: 14px; color: #6b7280; margin: 0;">
                  ${emailSettings.footer_text}<br>
                  <strong>${emailSettings.sender_name}</strong>
                </p>
              </div>
            </div>
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
