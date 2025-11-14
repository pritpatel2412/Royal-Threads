
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { phone_number, country_code } = await req.json();

    if (!phone_number || !country_code) {
      throw new Error('Phone number and country code are required');
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    console.log(`Generated OTP: ${otp} for phone: ${country_code}${phone_number}`);

    // Clean up expired OTPs
    await supabase.rpc('cleanup_expired_otps');

    // Store OTP in database
    const { data, error } = await supabase
      .from('phone_auth')
      .upsert({
        phone_number,
        country_code,
        otp_code: otp,
        otp_expires_at: expiresAt.toISOString(),
        is_verified: false,
      }, {
        onConflict: 'phone_number',
      });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // In a real application, you would send the OTP via SMS here
    // For now, we'll just log it (you can integrate with Twilio, AWS SNS, etc.)
    console.log(`SMS would be sent to ${country_code}${phone_number}: Your OTP is ${otp}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP sent successfully',
        // In development, return the OTP for testing
        otp: Deno.env.get('DENO_DEPLOYMENT_ID') ? undefined : otp
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error sending OTP:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to send OTP' 
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});
