export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: 'manager' | 'employee';
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  members: string[];
  createdAt: any;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in-progress' | 'completed';
  deadline: string;
  assignedTo: string;
  desiredResult: number;
  actualResult: number;
  metricName: string;
  createdAt: any;
}
