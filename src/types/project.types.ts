export interface Project {
  _id: string;
  projectName: string;
  description?: string;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectsListResponse {
  success: boolean;
  message: string;
  projects: Project[];
  totalProjects: number;
  totalPages: number;
  currentPage: number;
  nextPage: number | null;
  previousPage: number | null;
}
