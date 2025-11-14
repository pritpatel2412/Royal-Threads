
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

    const { phone_number, country_code, otp_code, first_name, last_name } = await req.json();

    if (!phone_number || !country_code || !otp_code) {
      throw new Error('Phone number, country code, and OTP are required');
    }

    console.log(`Verifying OTP: ${otp_code} for phone: ${country_code}${phone_number}`);

    // Clean up expired OTPs first
    await supabase.rpc('cleanup_expired_otps');

    // Verify OTP
    const { data: phoneAuth, error: phoneAuthError } = await supabase
      .from('phone_auth')
      .select('*')
      .eq('phone_number', phone_number)
      .eq('country_code', country_code)
      .eq('otp_code', otp_code)
      .gt('otp_expires_at', new Date().toISOString())
      .single();

    if (phoneAuthError || !phoneAuth) {
      console.error('OTP verification failed:', phoneAuthError);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid or expired OTP' 
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

    // Check if user already exists
    let userId = phoneAuth.user_id;
    let authUser = null;
    
    if (!userId) {
      // Create a new user account with phone authentication
      const userMetadata = {
        phone_number: phone_number,
        country_code: country_code,
        phone_verified: true,
        first_name: first_name || '',
        last_name: last_name || '',
      };

      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        phone: `${country_code}${phone_number}`,
        phone_confirm: true,
        user_metadata: userMetadata
      });

      if (authError || !authData.user) {
        console.error('User creation failed:', authError);
        throw new Error('Failed to create user account');
      }

      userId = authData.user.id;
      authUser = authData.user;

      // Update phone_auth record with user_id
      await supabase
        .from('phone_auth')
        .update({ user_id: userId })
        .eq('id', phoneAuth.id);

      // The handle_new_user trigger should automatically create the profile,
      // but let's ensure it exists with a proper upsert operation
      const { error: profileError } = await supabase
        .from('customer_profiles')
        .upsert({
          id: userId,
          phone: phone_number,
          phone_verified: true,
          first_name: first_name || '',
          last_name: last_name || '',
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('Failed to create/update customer profile:', profileError);
        // Don't throw here, as the user account was created successfully
        // The profile might have been created by the trigger
      }

      console.log(`New user created with ID: ${userId} and profile updated`);
    } else {
      // Get existing user data
      const { data: userData, error: userError } = await supabase.auth.admin.getUserById(userId);
      if (userError) {
        console.error('Failed to get user data:', userError);
        throw new Error('Failed to get user data');
      }
      authUser = userData.user;

      // Ensure profile exists for existing user
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('customer_profiles')
        .select('id')
        .eq('id', userId)
        .single();

      if (profileCheckError || !existingProfile) {
        console.log(`Creating missing profile for existing user: ${userId}`);
        const { error: profileCreateError } = await supabase
          .from('customer_profiles')
          .upsert({
            id: userId,
            phone: phone_number,
            phone_verified: true,
            first_name: authUser.user_metadata?.first_name || '',
            last_name: authUser.user_metadata?.last_name || '',
          }, {
            onConflict: 'id'
          });

        if (profileCreateError) {
          console.error('Failed to create profile for existing user:', profileCreateError);
        }
      }
    }

    // Mark OTP as verified and clear the OTP
    const { error: updateError } = await supabase
      .from('phone_auth')
      .update({
        is_verified: true,
        otp_code: null,
        otp_expires_at: null,
      })
      .eq('id', phoneAuth.id);

    if (updateError) {
      console.error('Failed to update phone auth:', updateError);
      throw updateError;
    }

    // Generate a magic link for the user to establish session
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: authUser.email || `${userId}@phone.temp`,
      options: {
        redirectTo: `${Deno.env.get('SUPABASE_URL')}`,
      }
    });

    if (linkError) {
      console.error('Failed to generate magic link:', linkError);
      // Return success without session - frontend will handle auth state
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'OTP verified successfully',
          user_id: userId,
          phone_verified: true,
          user: authUser
        }),
        { 
          headers: { 
            ...corsHeaders,
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    console.log(`Phone verification successful for user: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'OTP verified successfully',
        user_id: userId,
        phone_verified: true,
        user: authUser,
        session_url: linkData?.properties?.action_link || null
      }),
      { 
        headers: { 
          ...corsHeaders,
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Failed to verify OTP' 
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
