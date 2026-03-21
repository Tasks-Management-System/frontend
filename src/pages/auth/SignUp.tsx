import React, { useState } from "react";
import Input from "../../components/UI/Input";
import Button from "../../components/UI/Button";
import { Lock, Mail, MoveRight, User, Shield, Zap, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { FcGoogle } from "react-icons/fc";

const SignUp = () => {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        console.log("Form submitted");
    };

    return (
            <div className="min-h-screen flex bg-[#f8fafc]">
          

              <div className="hidden lg:flex w-full lg:w-1/2 px-20 lg:px-16 py-20 flex-col justify-center bg-[#f9fafb]">
          
                <span className="bg-indigo-100 text-indigo-600 text-xs px-4 py-1 rounded-full w-fit mb-6">
                  Version 2.0 is live
                </span>
          
                <h1 className="text-5xl font-bold leading-tight text-gray-900">
                  Build your team's <br />
                  <span className="text-indigo-600">future today.</span>
                </h1>
          
                <p className="text-gray-500 mt-6 max-w-lg text-lg">
                  Join over 2,000+ companies managing their workforce with EMS Cloud.
                  Automated payroll, performance tracking, and HR simplified.
                </p>
          
                <div className="mt-10 space-y-6">
                  <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <ShieldCheck className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Enterprise Security</p>
                      <p className="text-sm text-gray-500">
                        SOC2 Type II compliant data management.
                      </p>
                    </div>
                  </div>
          
                  <div className="flex gap-4">
                    <div className="bg-white p-3 rounded-xl shadow-sm">
                      <Zap className="text-indigo-600" size={20} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Instant Onboarding</p>
                      <p className="text-sm text-gray-500">
                        Import your data and go live in minutes.
                      </p>
                    </div>
                  </div>
                </div>
          
                <div className="flex items-center mt-12 gap-4">
                  <div className="flex -space-x-2">
                    <img src="https://i.pravatar.cc/40?img=1" className="w-9 h-9 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/40?img=2" className="w-9 h-9 rounded-full border-2 border-white" />
                    <img src="https://i.pravatar.cc/40?img=3" className="w-9 h-9 rounded-full border-2 border-white" />
                  </div>
                  <p className="text-sm text-gray-500">
                    Trusted by founders and HR teams worldwide.
                  </p>
                </div>
              </div>
        
              <div className="flex w-full lg:w-1/2 items-center justify-center px-6">
          
                <div className="bg-white w-full max-w-md p-10 rounded-2xl shadow-xl border border-gray-100">
          
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Create Account</h2>
                    <p className="text-gray-500 text-sm mt-1">
                      Join the community of modern leaders.
                    </p>
                  </div>
          
                  <form className="space-y-4" onSubmit={handleSubmit}>
          
                    <Input
                      label="Full Name"
                      name="name"
                      placeholder="John Doe"
                      icon={<User size={18} />}
                      value={formData.name}
                      onChange={handleChange}
                    />
          
                    <Input
                      label="Work Email"
                      name="email"
                      placeholder="john@company.com"
                      icon={<Mail size={18} />}
                      value={formData.email}
                      onChange={handleChange}
                    />
          
                    <div className="grid grid-cols-2 gap-4">
                      <Input
                        label="Password"
                        name="password"
                        type="password"
                        placeholder="••••••••"
                        icon={<Lock size={18} />}
                        value={formData.password}
                        onChange={handleChange}
                      />
          
                      <Input
                        label="Confirm"
                        name="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        icon={<Shield size={18} />}
                        value={formData.confirmPassword}
                        onChange={handleChange}
                      />
                    </div>
          
          
                    <div className="flex items-start gap-2 text-sm text-gray-500">
                      <input type="checkbox" className="mt-1 accent-indigo-600" />
                      <p>
                        I agree to the{" "}
                        <Link to="/terms" className="text-indigo-600 hover:underline">
                          Terms of Service
                        </Link>{" "}
                        and{" "}
                        <Link to="/privacy" className="text-indigo-600 hover:underline">
                          Privacy Policy
                        </Link>
                      </p>
                    </div>
          
          
                    <button
                      type="submit"
                      className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 hover:opacity-90 transition"
                    >
                      Create Account <MoveRight size={18} />
                    </button>
          
                    <div className="flex items-center gap-3 my-4">
                      <div className="flex-1 h-px bg-gray-200"></div>
                      <p className="text-xs text-gray-400 uppercase">
                        Or sign up with
                      </p>
                      <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
          

                      <Button variant="outline" type="button" className="w-full" >
                        <FcGoogle size={20} /> Continue with Google
                      </Button>
          
          
                    <p className="text-center text-sm text-gray-500 mt-4">
                      Already have an account?{" "}
                      <Link to="/login" className="text-indigo-600 font-medium hover:underline">
                        Sign in
                      </Link>
                    </p>
          
                  </form>
                </div>
              </div>
            </div>
          );
};

export default SignUp;