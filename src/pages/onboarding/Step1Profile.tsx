import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { ChevronRight } from "lucide-react";
import { useUserById, useUpdateUser } from "../../apis/api/auth";
import { ApiError } from "../../apis/apiService";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(["male", "female", ""]).optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

type Step1ProfileProps = {
  userId: string;
  onDone: () => void;
};

export function Step1Profile({ userId, onDone }: Step1ProfileProps) {
  const { data: user } = useUserById(userId);
  const updateUser = useUpdateUser();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: {
      name: user?.name ?? "",
      phone: user?.phone ?? "",
      dob: user?.dob ? user.dob.slice(0, 10) : "",
      gender: (user?.gender as "male" | "female" | "") ?? "",
    },
  });

  const onSubmit = async (values: ProfileForm) => {
    try {
      await updateUser.mutateAsync({
        id: userId,
        data: {
          name: values.name,
          ...(values.phone ? { phone: values.phone } : {}),
          ...(values.dob ? { dob: values.dob } : {}),
          ...(values.gender ? { gender: values.gender as "male" | "female" } : {}),
        },
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : "Failed to save profile.");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register("name")}
          placeholder="Your full name"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
        {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Phone Number</label>
        <input
          {...register("phone")}
          placeholder="+91 98765 43210"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Date of Birth</label>
        <input
          {...register("dob")}
          type="date"
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-1">Gender</label>
        <select
          {...register("gender")}
          className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
        >
          <option value="">Prefer not to say</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:opacity-60"
      >
        {isSubmitting ? "Saving…" : "Continue"}
        {!isSubmitting && <ChevronRight className="h-4 w-4" />}
      </button>
    </form>
  );
}
