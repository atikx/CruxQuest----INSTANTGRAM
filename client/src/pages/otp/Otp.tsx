"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import api from "@/lib/axiosinstance";
import { useAuthStore } from "@/lib/store";

const FormSchema = z.object({
  pin: z.string().min(6, {
    message: "Your one-time password must be 6 characters.",
  }),
});

export default function Otp() {
  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      pin: "",
    },
  });

  const { setUser } = useAuthStore();
  const navigate = useNavigate();

  const verifyOtpMutation = useMutation({
    mutationFn: async (otp: number) => {
      const res = await api.post("/user/auth/verifyOtp", { otp });
      return res.data;
    },
    onSuccess: (data) => {
      toast.success("OTP verified successfully!");
      setUser(data.user);
      navigate("/");
    },
    onError: () => {
      toast.error("Failed to submit OTP. Please try again.");
    },
  });

  function onSubmit(data: z.infer<typeof FormSchema>) {
    verifyOtpMutation.mutate(parseInt(data.pin));
  }

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-xl bg-card shadow-lg p-8 border border-border">
        <h2 className="mb-6 text-2xl font-semibold text-center text-foreground">
          Verify OTP
        </h2>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="pin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base font-medium text-foreground">
                    One-Time Password
                  </FormLabel>
                  <FormControl>
                    <InputOTP maxLength={6} {...field}>
                      <InputOTPGroup>
                        {[...Array(6)].map((_, i) => (
                          <InputOTPSlot
                            key={i}
                            index={i}
                            className="mx-1 w-12 h-14 rounded-lg border border-input bg-background text-2xl text-center font-mono text-foreground focus:border-ring focus:ring-2 focus:ring-ring transition-all"
                          />
                        ))}
                      </InputOTPGroup>
                    </InputOTP>
                  </FormControl>
                  <FormDescription className="text-sm text-muted-foreground mt-2">
                    Please enter the one-time password sent to your phone.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={verifyOtpMutation.isPending}>
              {verifyOtpMutation.isPending ? "Verifying..." : "Submit"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
