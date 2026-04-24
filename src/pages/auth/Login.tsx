import { Lock, Mail, MoveRight } from "lucide-react";
import Button from "../../components/UI/Button";
import Input from "../../components/UI/Input";
import { Link, useNavigate } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";
import { useEffect, useState } from "react";
import { ApiError } from "../../apis/apiService";
import { login } from "../../apis/api/auth";
import { getToken, setToken, setUserId, setStoredRoles } from "../../utils/auth";
import toast from "react-hot-toast";
import { API_BASE_URL } from "../../apis/apiPath";
import { jwtDecode } from "jwt-decode";

type JwtPayload = {
  id?: string;
  role?: string[] | string;
};

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({
    email: "",
    password: "",
  });

  const loginMutation = login();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors({ email: "", password: "" });
    try {
      const res = await loginMutation.mutateAsync({
        email: formData.email,
        password: formData.password,
      });
      if (res?.token) setToken(res.token);
      if (res?.user?._id) setUserId(res.user._id);
      setStoredRoles(res?.user?.role);
      toast.success("Login successful");
      navigate("/");
    } catch (error) {
      const err = error as ApiError;
      const code = (err?.data as { code?: string })?.code;
      const message = err?.message || "Invalid email or password";
      if (code === "ACCOUNT_INACTIVE") {
        toast.error(message, { duration: 6000 });
      } else {
        toast.error(message);
      }
      setErrors({ email: message, password: "" });
    }
  };

  useEffect(() => {
    if (getToken()) {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const provider = params.get("provider");
    if (token) {
      setToken(token);
      try {
        const decoded = jwtDecode<JwtPayload>(token);
        if (decoded?.id) setUserId(decoded.id);
        const rolesRaw = decoded?.role;
        const roles = Array.isArray(rolesRaw) ? rolesRaw : rolesRaw ? [rolesRaw] : undefined;
        setStoredRoles(roles);
      } catch {
        // ignore decode errors; token will still be used for API calls
      }
      toast.success(provider === "google" ? "Logged in with Google" : "Login successful");
      window.history.replaceState({}, "", window.location.pathname);
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verified = params.get("verified");
    const reason = params.get("reason");
    const inactiveMsg = params.get("message");

    if (reason === "account_inactive") {
      const text =
        inactiveMsg && inactiveMsg.trim()
          ? decodeURIComponent(inactiveMsg)
          : "Your account has been deactivated. Please contact an administrator to restore access.";
      toast.error(text, { duration: 6000 });
      window.history.replaceState({}, "", window.location.pathname);
    }

    if (verified === "true") {
      toast.success("Email verified successfully. You can now login.");
    } else if (verified === "false") {
      if (reason === "missing_token") {
        toast.error("Verification link is invalid.");
      } else if (reason === "invalid_or_expired") {
        toast.error("Verification link is expired or invalid. Please register again.");
      } else if (reason !== "account_inactive") {
        toast.error("Email verification failed. Please try again.");
      }
    }
  }, []);

  const handleGoogleLogin = () => {
    // full page redirect to backend OAuth start
    window.location.href = `${API_BASE_URL.replace(/\/$/, "")}/auth/google`;
  };
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
      <h1 className="text-2xl font-bold">EMS Pro</h1>
      <p className="text-sm text-gray-500">Manage your workforce with efficiency</p>
      <div className="bg-white p-6 rounded-xl shadow-md shadow-gray-200 w-full max-w-md mt-8">
        <h2 className="text-lg font-bold">Welcome Back</h2>
        <p className="text-sm text-gray-500">Please enter your details to sign in</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 my-10">
          <Input
            label="Email"
            name="email"
            type="email"
            placeholder="Enter your email"
            error={errors.email}
            value={formData.email}
            onChange={handleChange}
            className="w-full"
            icon={<Mail size={18} />}
            required
          />

          <Input
            rightLabel={
              <Link to={"/forgot-password"} className="hover:text-blue-600 hover:underline">
                Forgot password?
              </Link>
            }
            label="Password"
            name="password"
            type="password"
            placeholder="Enter your password"
            error={errors.password}
            icon={<Lock size={18} />}
            value={formData.password}
            onChange={handleChange}
            className="w-full"
          />

          {loginMutation.isError && (
            <div className="text-sm text-red-600">
              {(loginMutation.error as ApiError)?.message || "Login failed"}
            </div>
          )}
          <div className="flex items-center gap-2">
            <input type="checkbox" id="remember" />
            <label htmlFor="remember" className="text-sm text-gray-500">
              Remember me
            </label>
          </div>
          <Button variant="primary" type="submit" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? "Signing in..." : "Sign In"}
            <MoveRight size={18} />
          </Button>

          <div>
            <Button variant="outline" type="button" className="w-full" onClick={handleGoogleLogin}>
              <FcGoogle size={24} /> Continue with Google
            </Button>
          </div>
        </form>
      </div>
      <p className="text-sm text-gray-500 mt-8">
        Don't have an account?{" "}
        <Link to={"/signup"} className="text-blue-600 underline font-bold">
          Sign up
        </Link>
      </p>
    </div>
  );
};

export default Login;
