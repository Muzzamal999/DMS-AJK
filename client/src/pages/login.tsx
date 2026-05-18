import { useState } from "react";
import { useLocation, Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/hooks/useAuth";
import { authApi } from "@/lib/api";
import { DEMO_CREDENTIALS, ROUTES } from "@/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ShieldAlert, LogIn, Loader2 } from "lucide-react";
import { toast } from "sonner";

const loginSchema = z.object({
  email:    z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role:     z.enum(["citizen", "clerk", "admin"]),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", role: "citizen" },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const res = await authApi.login(data);
      login(res.user, res.token);
      toast.success(`Welcome back, ${res.user.name}!`);

      if (res.user.role === "admin") setLocation("/admin/dashboard");
      else if (res.user.role === "clerk") setLocation("/clerk/applications");
      else setLocation("/citizen/dashboard");
    } catch (err: any) {
      toast.error(err.message || "Invalid credentials. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemo = (email: string, role: LoginForm["role"]) => {
    form.setValue("email", email);
    form.setValue("password", "pass123");
    form.setValue("role", role);
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Left panel */}
      <div className="hidden md:flex w-1/2 bg-primary relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="/hero-mountain.png" alt="AJK Mountains" className="w-full h-full object-cover opacity-30" />
        </div>
        <div className="relative z-10 text-white max-w-md px-8 text-center space-y-6">
          <ShieldAlert className="w-20 h-20 text-secondary mx-auto" />
          <h1 className="text-4xl font-bold tracking-tight">Digital Citizen Verification</h1>
          <p className="text-primary-foreground/80 text-lg">
            Secure, transparent, and efficient access to official Domicile Certificates for the citizens of Azad Jammu & Kashmir.
          </p>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-8 md:px-16 lg:px-24">
        <div className="max-w-sm w-full mx-auto space-y-8">
          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold text-foreground">Welcome Back</h2>
            <p className="text-muted-foreground">Sign in to your official portal</p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portal Role</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="citizen">Citizen</SelectItem>
                        <SelectItem value="clerk">Government Clerk</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl><Input placeholder="name@ajk.gov.pk" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password</FormLabel>
                    <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90" disabled={isLoading}>
                {isLoading
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <LogIn className="mr-2 h-4 w-4" />}
                Sign In
              </Button>
            </form>
          </Form>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href={ROUTES.REGISTER} className="text-primary font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}