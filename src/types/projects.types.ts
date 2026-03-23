export interface Project {
    _id: string;
    user?: string; // optional (because last object doesn't have it)
    projectName?: string; // optional (last object uses "name")
    name?: string; // optional fallback
    description: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  }
  
  export interface GetProjectsResponse {
    success: boolean;
    message: string;
    projects: Project[];
    totalProjects: number;
    totalPages: number;
    currentPage: number;
    nextPage: number | null;
    previousPage: number | null;
  }