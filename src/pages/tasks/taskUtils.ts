import type { Task } from "../../types/task.types";
import type { Project } from "../../types/project.types";

export function isPopulatedProject(p: Task["project"]): p is Project {
  return typeof p === "object" && p !== null && "projectName" in p;
}

export function taskProjectName(task: Task): string {
  return isPopulatedProject(task.project) ? task.project.projectName : "Project";
}

export function taskAssigneeName(task: Task, currentUserId?: string): string {
  if (
    task.assignedTo &&
    typeof task.assignedTo === "object" &&
    "name" in task.assignedTo
  ) {
    if (
      currentUserId &&
      "_id" in task.assignedTo &&
      String((task.assignedTo as { _id?: string })._id) === String(currentUserId)
    ) {
      return "You";
    }
    return task.assignedTo.name;
  }
  return "Unassigned";
}

export function formatDue(d?: string | null) {
  if (!d) return "—";
  try {
    return new Intl.DateTimeFormat(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(d));
  } catch {
    return "—";
  }
}
