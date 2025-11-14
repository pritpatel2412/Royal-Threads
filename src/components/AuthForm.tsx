import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import PhoneAuth from './PhoneAuth';

interface AuthFormProps {
  mode: 'login' | 'signup';
  onToggleMode: () => void;
  onSuccess: () => void;
}

type SignupMethod = 'email' | 'phone';

const AuthForm = ({ mode, onToggleMode, onSuccess }: AuthFormProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+91');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPhoneAuth, setShowPhoneAuth] = useState(false);
  const [signupMethod, setSignupMethod] = useState<SignupMethod>('email');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const { toast } = useToast();

  React.useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendTimer]);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              first_name: firstName,
              last_name: lastName,
            },
          },
        });

        if (error) throw error;

        toast({
          title: 'Account created successfully!',
          description: 'Please check your email to verify your account.',
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        toast({
          title: 'Welcome back!',
          description: 'You have been logged in successfully.',
        });
        onSuccess();
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'An error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const sendOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid phone number',
        variant: 'destructive',
      });
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast({
        title: 'Missing Information',
        description: 'First name and last name are required',
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
          const url = new URL(data.session_url);
          const token = url.searchParams.get('access_token');
          const refreshToken = url.searchParams.get('refresh_token');
          
          if (token && refreshToken) {
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

  if (showPhoneAuth) {
    return (
      <PhoneAuth
        onSuccess={onSuccess}
        onBack={() => setShowPhoneAuth(false)}
      />
    );
  }

  const isSignupWithPhone = mode === 'signup' && signupMethod === 'phone';
  const isSignupWithEmail = mode === 'signup' && signupMethod === 'email';
  const isEmailMethod = signupMethod === 'email';
  const isPhoneMethod = signupMethod === 'phone';

  return (
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-serif text-royal-navy">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </CardTitle>
        <CardDescription>
          {mode === 'login' 
            ? 'Sign in to your Royal Threads account'
            : 'Join Royal Threads today'
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isSignupWithPhone && !isOtpSent && (
          <div className="space-y-4">
            <div className="flex gap-2 mb-4">
              <Button
                type="button"
                variant={isEmailMethod ? 'default' : 'outline'}
                onClick={() => setSignupMethod('email')}
                className="flex-1"
              >
                <Mail className="h-4 w-4 mr-2" />
                Email
              </Button>
              <Button
                type="button"
                variant={isPhoneMethod ? 'default' : 'outline'}
                onClick={() => setSignupMethod('phone')}
                className="flex-1"
              >
                <Phone className="h-4 w-4 mr-2" />
                Phone
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </div>
            </div>

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
              <Label htmlFor="phoneNumber">Phone Number *</Label>
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
        )}

        {isSignupWithPhone && isOtpSent && (
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-4">
                Enter the 6-digit code sent to {countryCode} {phoneNumber}
              </p>
            </div>
            
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
              {loading ? 'Verifying...' : 'Verify & Create Account'}
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

        {(mode === 'login' || isSignupWithEmail) && (
          <form onSubmit={handleEmailSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="flex gap-2 mb-4">
                <Button
                  type="button"
                  variant={isEmailMethod ? 'default' : 'outline'}
                  onClick={() => setSignupMethod('email')}
                  className="flex-1"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
                <Button
                  type="button"
                  variant={isPhoneMethod ? 'default' : 'outline'}
                  onClick={() => setSignupMethod('phone')}
                  className="flex-1"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Phone
                </Button>
              </div>
            )}

            {mode === 'signup' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-royal-navy hover:bg-royal-blue"
              disabled={loading}
            >
              {loading ? 'Loading...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </Button>
          </form>
        )}

        {mode === 'login' && (
          <>
            <div className="my-4">
              <Separator />
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => setShowPhoneAuth(true)}
            >
              <Phone className="h-4 w-4 mr-2" />
              Login with Phone
            </Button>
          </>
        )}

        <div className="mt-4 text-center text-sm">
          <span className="text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          </span>
          <Button
            variant="link"
            className="p-0 h-auto font-normal text-royal-navy"
            onClick={onToggleMode}
          >
            {mode === 'login' ? 'Sign up' : 'Sign in'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AuthForm;
