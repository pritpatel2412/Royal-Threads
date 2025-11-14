
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { ArrowLeft, Phone } from 'lucide-react';

interface PhoneAuthProps {
  onSuccess: () => void;
  onBack: () => void;
}

const PhoneAuth = ({ onSuccess, onBack }: PhoneAuthProps) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-otp', {
        body: {
          phone_number: phoneNumber,
          country_code: countryCode,
        },
      });

      if (error) throw error;

      setIsOtpSent(true);
      setResendTimer(30);
      toast({
        title: 'OTP Sent',
        description: 'Please check your phone for the verification code',
      });

      // In development, show the OTP in the toast for testing
      if (data.otp) {
        toast({
          title: 'Development Mode',
          description: `Your OTP is: ${data.otp}`,
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const verifyOTP = async () => {
    if (otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('verify-otp', {
        body: {
          phone_number: phoneNumber,
          country_code: countryCode,
          otp_code: otp,
        },
      });

      if (error) throw error;

      if (data.success) {
        // If we have a session URL, use it to establish the session
        if (data.session_url) {
          // Extract the access token from the magic link
          const url = new URL(data.session_url);
          const token = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (token && refreshToken) {
            // Set the session using the tokens
            const { error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refreshToken,
            });
            
            if (sessionError) {
              console.error('Session error:', sessionError);
            }
          }
        }
        
        toast({
          title: 'Success',
          description: 'Phone number verified successfully! Welcome!',
        });
        
        // Wait for the auth state to update, then redirect
        setTimeout(() => {
          onSuccess();
        }, 1000);
      } else {
        toast({
          title: 'Invalid OTP',
          description: 'The OTP you entered is incorrect or has expired',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to verify OTP',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const resendOTP = async () => {
    if (resendTimer > 0) return;
    await sendOTP();
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="absolute left-4 top-4"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Phone className="h-6 w-6 text-royal-navy" />
        </div>
        <CardTitle className="text-2xl font-serif text-royal-navy">
          {isOtpSent ? 'Verify Phone Number' : 'Phone Login'}
        </CardTitle>
        <CardDescription>
          {isOtpSent 
            ? `Enter the 6-digit code sent to ${countryCode} ${phoneNumber}`
            : 'Enter your phone number to receive an OTP'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!isOtpSent ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="countryCode">Country Code</Label>
              <Input
                id="countryCode"
                type="text"
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value)}
                placeholder="+91"
                className="w-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Enter your phone number"
                required
              />
            </div>
            <Button
              onClick={sendOTP}
              className="w-full bg-royal-navy hover:bg-royal-blue"
              disabled={loading}
            >
              {loading ? 'Sending...' : 'Send OTP'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <div className="flex justify-center">
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>
            </div>
            <Button
              onClick={verifyOTP}
              className="w-full bg-royal-navy hover:bg-royal-blue"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </Button>
            <div className="text-center">
              <Button
                variant="link"
                onClick={resendOTP}
                disabled={resendTimer > 0 || loading}
                className="text-royal-navy"
              >
                {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PhoneAuth;
