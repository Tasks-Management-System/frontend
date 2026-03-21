import { Lock, Mail, MoveRight } from "lucide-react"
import Button from "../../components/UI/Button"
import Input from "../../components/UI/Input"
import { Link, useNavigate } from "react-router-dom"
import { FcGoogle } from "react-icons/fc"
import { useState } from "react"
import { ApiError } from "../../apis/apiService"
import { login } from "../../apis/api/auth"

const Login = () => {
    const navigate = useNavigate()
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [errors, setErrors] = useState({
        email: "",
        password: "",
    })

    const loginMutation = login()

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData((prev) => ({ ...prev, [name]: value }))
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        setErrors({ email: "", password: "" })
        try {
            const res = await loginMutation.mutateAsync({ email: formData.email, password: formData.password })
            if (res?.token) localStorage.setItem("token", res.token)
            navigate("/")
        } catch (error) {
            setErrors({ email: (error as ApiError)?.message || "Invalid email or password", password: "" })
        }
    }
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
                        rightLabel={<Link to={'/forgot-password'} className="hover:text-blue-600 hover:underline">Forgot password?</Link>}
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

                    <Button variant="primary" type="submit" disabled={loginMutation.isPending}>
                        {loginMutation.isPending ? "Signing in..." : "Sign In"}
                        <MoveRight size={18} />
                    </Button>
                    <div className="flex items-center gap-2">
                        <Input type="checkbox" id="remember" />
                        <label htmlFor="remember" className="text-sm text-gray-500">Remember me</label>
                    </div>
                    <div>
                        <Button variant="outline" type="button" className="w-full" >
                            <FcGoogle size={24} /> Continue with Google
                        </Button>
                    </div>
                </form>
            </div>
            <p className="text-sm text-gray-500 mt-8">Don't have an account? <Link to={'/signup'} className="text-blue-600 underline font-bold">Sign up</Link></p>
        </div>
    )
}

export default Login