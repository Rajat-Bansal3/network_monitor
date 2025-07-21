import { useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/components/providers/auth-provider";
import { register as registerUser } from "@/api/auth";

type RegisterFormData = {
  username: string;
  email: string;
  password: string;
};

const Register = () => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>();

  const { refreshAuth } = useAuth();
  const navigate = useNavigate();

  const onSubmit = async (data: RegisterFormData) => {
    try {
      const res = await registerUser(data);
      if (res.data.success) {
        await refreshAuth();
        navigate("/scan");
      } else {
        throw new Error("Registration failed");
      }
    } catch (err) {
      console.error("Registration error:", err);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4 m-auto'>
      <div className='w-full max-w-md space-y-6 p-8 rounded-lg border shadow-sm bg-card'>
        <h1 className='text-2xl font-semibold text-center text-primary'>
          Register
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          <div>
            <Label htmlFor='username'>Username</Label>
            <Input
              id='username'
              placeholder='yourusername'
              {...register("username", {
                required: "Username is required",
                minLength: {
                  value: 3,
                  message: "Username must be at least 3 characters",
                },
              })}
            />
            {errors.username && (
              <p className='text-sm text-red-500 mt-1'>
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='email'>Email</Label>
            <Input
              id='email'
              type='email'
              placeholder='you@example.com'
              {...register("email", {
                required: "Email is required",
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: "Invalid email format",
                },
              })}
            />
            {errors.email && (
              <p className='text-sm text-red-500 mt-1'>
                {errors.email.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor='password'>Password</Label>
            <Input
              id='password'
              type='password'
              placeholder='••••••••'
              {...register("password", {
                required: "Password is required",
                minLength: {
                  value: 6,
                  message: "Password must be at least 6 characters",
                },
              })}
            />
            {errors.password && (
              <p className='text-sm text-red-500 mt-1'>
                {errors.password.message}
              </p>
            )}
          </div>

          <Button type='submit' className='w-full' disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Register"}
          </Button>
        </form>

        <p className='text-sm text-muted-foreground text-center'>
          Already have an account?{" "}
          <a href='/login' className='underline text-primary'>
            Login
          </a>
        </p>
      </div>
    </div>
  );
};

export default Register;
