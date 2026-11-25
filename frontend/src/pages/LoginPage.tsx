import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { roleHomePath } from "@/components/auth/RequireAuth";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores/auth-store";
import loginBackground from "@/assets/login-background.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

type LoginForm = z.infer<typeof loginSchema>;

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginForm) {
    setError(null);
    try {
      await login(values.username, values.password, rememberMe);
      const role = useAuthStore.getState().user?.role ?? "SALESPERSON";
      navigate(roleHomePath(role), { replace: true });
    } catch {
      setError("Invalid username or password.");
    }
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: `url(${loginBackground})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/70 to-black/80" />

      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/15 bg-white/10 p-8 shadow-2xl backdrop-blur-xl sm:p-10">
        <p className="text-xs font-semibold tracking-[0.3em] text-blue-200 uppercase">Welcome</p>
        <h1 className="mt-1 text-3xl font-bold text-white">Thread IMS</h1>
        <p className="mt-2 text-sm text-blue-100/90">
          Sign in to manage inventory, sales, and daily reconciliation.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-1.5">
            <Label htmlFor="username" className="text-blue-50">
              Username
            </Label>
            <div className="relative">
              <User className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-100/70" />
              <Input
                id="username"
                autoComplete="username"
                className="h-11 border-white/25 bg-white/10 pl-10 text-white placeholder:text-blue-100/50 focus-visible:ring-white/40"
                {...register("username")}
              />
            </div>
            {errors.username && <p className="text-sm text-red-300">{errors.username.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-blue-50">
              Password
            </Label>
            <div className="relative">
              <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-blue-100/70" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                className="h-11 border-white/25 bg-white/10 pr-10 pl-10 text-white placeholder:text-blue-100/50 focus-visible:ring-white/40"
                {...register("password")}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute top-1/2 right-3 -translate-y-1/2 text-blue-100/70 hover:text-white"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-red-300">{errors.password.message}</p>}
          </div>

          <label className="flex items-center gap-2 text-sm text-blue-100/90">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(event) => setRememberMe(event.target.checked)}
              className={cn("h-4 w-4 rounded border-white/40 bg-white/10 text-blue-600 focus-visible:ring-2 focus-visible:ring-white/40")}
            />
            Remember me on this device
          </label>

          {error && <p className="text-sm text-red-300">{error}</p>}

          <Button type="submit" className="h-11 w-full bg-blue-600 hover:bg-blue-500" disabled={isSubmitting}>
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-blue-100/70">
          Accounts aren't self-registered — an administrator creates every login and assigns its
          role.
        </p>
      </div>
    </div>
  );
}
