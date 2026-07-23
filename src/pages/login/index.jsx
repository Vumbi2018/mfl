import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "components/ui/Button";
import Input from "components/ui/Input";
import api from "utils/api";
import { Loader2, ShieldCheck, Mail, Lock } from "lucide-react";

const LoginPage = () => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            // Using the /api/auth/login endpoint
            const response = await api.post("/auth/login", { email, password });

            if (response.data && response.data.token) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data));
                // Redirect to dashboard
                navigate("/");
            } else {
                setError("Login failed. No token received.");
            }
        } catch (err) {
            console.error("Login error:", err);
            setError(err.response?.data || "Invalid credentials or server error.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f2a58] p-4 relative overflow-hidden">
            {/* Background pattern similar to the bird of paradise wings or abstract waves could be added here */}
            <div className="absolute inset-0 z-0 opacity-10 pointer-events-none">
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                            <path d="M0 40L40 0H20L0 20M40 40V20L20 40" stroke="white" strokeWidth="1" fill="none" />
                        </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
            </div>

            <div className="relative z-10 w-full max-w-md bg-white rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                <div className="p-8 space-y-6">
                    {/* Header */}
                    <div className="text-center space-y-2">
                        {/* Bird of Paradise Emblem */}
                        <div className="flex justify-center mb-4">
                            <img
                                src="/assets/images/emblem.png"
                                alt="Papua New Guinea Emblem"
                                className="w-32 h-auto object-contain drop-shadow-md"
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-[#0f2a58] tracking-tight">
                            National Health Facility Registry
                        </h1>
                        <p className="text-sm text-gray-500 font-medium uppercase tracking-wider">
                            National Department of Health
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-[#0f2a58]" htmlFor="email">
                                Username / Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="email"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-11 border-gray-300 focus:border-[#0f2a58] focus:ring-[#0f2a58]"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-semibold text-[#0f2a58]" htmlFor="password">
                                    Password
                                </label>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 h-11 border-gray-300 focus:border-[#0f2a58] focus:ring-[#0f2a58]"
                                    required
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="text-red-500 text-sm font-medium text-center bg-red-50 p-2 rounded">
                                {typeof error === 'string' ? error : 'Login failed'}
                            </div>
                        )}

                        <Button
                            type="submit"
                            className="w-full h-11 bg-[#0f2a58] hover:bg-[#1a3b75] text-white font-bold text-base shadow-lg transition-all duration-200"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Signing In...</>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>

                    {/* Footer */}
                    <div className="text-center pt-4 border-t border-gray-100">
                        <p className="text-xs text-gray-500 mb-2">
                            Forgot your password? Contact your system administrator at
                        </p>
                        <a href="mailto:ict@health.gov.pg" className="text-xs font-bold text-[#0f2a58] hover:underline">
                            ict@health.gov.pg
                        </a>
                    </div>
                </div>

                {/* Decorative bottom bar */}
                <div className="h-2 bg-gradient-to-r from-yellow-500 via-red-500 to-black"></div>
            </div>
        </div>
    );
};

export default LoginPage;
