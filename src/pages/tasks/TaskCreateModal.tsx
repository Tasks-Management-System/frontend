import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import { ApiError } from "../../apis/apiService";
import { useCreateTask, useTaskTemplates } from "../../apis/api/tasks";
import type { TaskStatus } from "../../types/task.types";
import Modal from "../../components/UI/Model";
import Dropdown from "../../components/UI/Dropdown";

const taskSchema = z.object({
  project: z.string().min(1, "Project is required"),
  taskName: z.string().min(1, "Task title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  dueDate: z.string().optional(),
  priority: z.enum(["low", "medium", "urgent"]),
  assignedTo: z.string().optional(),
  timeEstimate: z.string().optional(),
  templateName: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;

const PRIORITY_OPTIONS = [
  { label: "Low", value: "low" },
  { label: "Medium", value: "medium" },
  { label: "Urgent", value: "urgent" },
];

interface TaskCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectOptions: { label: string; value: string }[];
  assigneeOptions: { label: string; value: string }[];
  canAssignOthers: boolean;
  defaultProjectId?: string;
  defaultAssigneeId?: string;
  defaultStatus?: TaskStatus;
}

export function TaskCreateModal({
  isOpen,
  onClose,
  projectOptions,
  assigneeOptions,
  canAssignOthers,
  defaultProjectId,
  defaultAssigneeId,
  defaultStatus = "pending",
}: TaskCreateModalProps) {
  const createMut = useCreateTask();
  const { data: templatesRes } = useTaskTemplates();
  const templates = templatesRes?.templates || [];

  const [subtasks, setSubtasks] = useState<string[]>([]);
  const [newSubtask, setNewSubtask] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      project: defaultProjectId ?? "",
      taskName: "",
      description: "",
      dueDate: "",
      priority: "medium",
      assignedTo: defaultAssigneeId ?? "",
      timeEstimate: "",
      templateName: "",
    },
  });

  useEffect(() => {
    if (isOpen) {
      reset({
        project: defaultProjectId ?? projectOptions[0]?.value ?? "",
        taskName: "",
        description: "",
        dueDate: "",
        priority: "medium",
        assignedTo: defaultAssigneeId ?? "",
        timeEstimate: "",
        templateName: "",
      });
      setSubtasks([]);
      setNewSubtask("");
    }
  }, [isOpen, defaultProjectId, defaultAssigneeId, projectOptions, reset]);

  const handleApplyTemplate = (templateName: string) => {
    const tpl = templates.find((t) => t.templateName === templateName);
    if (!tpl) return;
    setValue("taskName", tpl.taskName);
    setValue("description", tpl.description || "");
    setValue("priority", tpl.priority);
    if (tpl.timeEstimate) setValue("timeEstimate", String(tpl.timeEstimate));
    if (tpl.subtasks) setSubtasks(tpl.subtasks.map((s) => s.title));
    setValue("templateName", templateName);
  };

  const onSubmit = async (values: TaskFormValues) => {
    try {
      await createMut.mutateAsync({
        project: values.project,
        taskName: values.taskName.trim(),
        description: values.description?.trim() || undefined,
        dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
        priority: values.priority,
        ...(canAssignOthers ? { assignedTo: values.assignedTo || undefined } : {}),
        status: defaultStatus,
        subtasks: subtasks.filter(Boolean).map((title, i) => ({
          title,
          completed: false,
          order: i,
        })),
        timeEstimate: values.timeEstimate ? Number(values.timeEstimate) : undefined,
        templateName: values.templateName || undefined,
      });
      toast.success("Task created");
      onClose();
    } catch (e) {
      toast.error((e as ApiError)?.message ?? "Could not create task");
    }
  };

  // eslint-disable-next-line react-hooks/incompatible-library -- react-hook-form watch()
  const selectedProject = watch("project");
  const selectedPriority = watch("priority");
  const selectedAssignee = watch("assignedTo");

  const addSubtask = () => {
    const trimmed = newSubtask.trim();
    if (!trimmed) return;
    setSubtasks((prev) => [...prev, trimmed]);
    setNewSubtask("");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create task"
      panelClassName="max-w-2xl w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {/* Template selector */}
        {templates.length > 0 && (
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Template</label>
            <select
              {...register("templateName")}
              onChange={(e) => {
                setValue("templateName", e.target.value);
                if (e.target.value) handleApplyTemplate(e.target.value);
              }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            >
              <option value="">No template</option>
              {templates.map((t) => (
                <option key={t._id} value={t.templateName}>
                  {t.templateName}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Dropdown
              label="Project"
              placeholder="Select project"
              options={projectOptions}
              value={selectedProject}
              onChange={(v) => setValue("project", v, { shouldValidate: true })}
            />
            {errors.project && (
              <p className="mt-1 text-xs text-red-600">{errors.project.message}</p>
            )}
          </div>
          <Dropdown
            label="Priority"
            options={PRIORITY_OPTIONS}
            value={selectedPriority}
            onChange={(v) => setValue("priority", v as TaskFormValues["priority"])}
          />
        </div>

        {canAssignOthers && assigneeOptions.length > 0 ? (
          <Dropdown
            label="Assign to"
            placeholder="Select assignee"
            options={assigneeOptions}
            value={selectedAssignee ?? ""}
            onChange={(v) => setValue("assignedTo", v)}
          />
        ) : null}
        {!canAssignOthers ? (
          <p className="text-xs text-gray-500">This task will be assigned to you.</p>
        ) : null}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Title <span className="text-red-500">*</span>
          </label>
          <input
            {...register("taskName")}
            placeholder="What needs to be done?"
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20 ${
              errors.taskName ? "border-red-400" : "border-gray-300"
            }`}
          />
          {errors.taskName && (
            <p className="mt-1 text-xs text-red-600">{errors.taskName.message}</p>
          )}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register("description")}
            rows={3}
            placeholder="Add context, links, or acceptance criteria"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          />
          {errors.description && (
            <p className="mt-1 text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Due date</label>
            <input
              type="date"
              {...register("dueDate")}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Time estimate (min)
            </label>
            <input
              type="number"
              {...register("timeEstimate")}
              placeholder="e.g. 120"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            />
          </div>
        </div>

        {/* Subtasks */}
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Subtasks</label>
          <div className="space-y-2">
            {subtasks.map((st, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="flex-1 text-sm text-gray-700 bg-gray-50 rounded-lg px-3 py-1.5 border border-gray-200">
                  {st}
                </span>
                <button
                  type="button"
                  onClick={() => setSubtasks((prev) => prev.filter((_, i) => i !== idx))}
                  className="text-gray-400 hover:text-red-500"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              />
              <button
                type="button"
                onClick={addSubtask}
                disabled={!newSubtask.trim()}
                className="rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-50 disabled:opacity-40"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMut.isPending}
            className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-violet-700 disabled:opacity-60"
          >
            {isSubmitting || createMut.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : null}
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}
