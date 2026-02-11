/** Espelha WorkspaceDto do backend .NET */
export interface Workspace {
  id: string
  nome: string
  ownerId: string
  createdAt: string
}

export interface CreateWorkspaceRequest {
  nome: string
  ownerId: string
}

export interface UpdateWorkspaceRequest {
  nome: string
}
