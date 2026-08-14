export interface WorkspaceInvitation {
  id: number;
  workspaceId: number;
  email: string;
  token: string;
  status: number;
  expireDate: string;
  createdDate: string;

  workspace: {
    id: number;
    name: string;
  };
}