import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, Mail, KeyRound } from "lucide-react";

export default function Login() {
  const { login, setPassword } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPasswordVal] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [setupMode, setSetupMode] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [setupEmail, setSetupEmail] = useState("");
  const [setupToken, setSetupToken] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.requiresSetup) {
        setSetupMode(true);
        setSetupEmail(result.email || email);
        setSetupToken(result.setupToken || "");
        toast({
          title: "Password Setup Required",
          description: "Please set a new password for your account.",
        });
      } else {
        navigate("/");
      }
    } catch (error: any) {
      const msg = error.message || "Login failed";
      const cleanMsg = msg.replace(/^\d+:\s*/, "");
      toast({ title: "Login Failed", description: cleanMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      await setPassword(setupEmail, newPassword, setupToken);
      toast({ title: "Password set successfully" });
      navigate("/");
    } catch (error: any) {
      const msg = error.message || "Failed to set password";
      const cleanMsg = msg.replace(/^\d+:\s*/, "");
      toast({ title: "Error", description: cleanMsg, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  if (setupMode) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-set-password">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <KeyRound className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl" data-testid="text-setup-title">Set Your Password</CardTitle>
            <CardDescription>
              This is your first login. Please create a password for <strong>{setupEmail}</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSetPassword} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                  data-testid="input-new-password"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  data-testid="input-confirm-password"
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-set-password">
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Set Password & Continue
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                onClick={() => { setSetupMode(false); setSetupEmail(""); setSetupToken(""); }}
                data-testid="button-back-to-login"
              >
                Back to Login
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background" data-testid="page-login">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl" data-testid="text-login-title">Foundry Management System</CardTitle>
          <CardDescription>Sign in to your account to continue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="pl-10"
                  data-testid="input-email"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPasswordVal(e.target.value)}
                  required
                  className="pl-10"
                  data-testid="input-password"
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} data-testid="button-login">
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Sign In
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
