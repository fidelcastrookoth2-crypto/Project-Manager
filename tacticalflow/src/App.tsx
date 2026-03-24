import React, { useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  query, 
  where, 
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { auth, db } from './firebase';
import { Project, Task, UserProfile } from './types';
import { PerformanceChart } from './components/PerformanceChart';
import { 
  LayoutDashboard, 
  Plus, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  LogOut, 
  ChevronRight,
  Target,
  Users,
  Calendar,
  BarChart3,
  Search
} from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeProject, setActiveProject] = useState<string | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [showNewProjectModal, setShowNewProjectModal] = useState(false);
  const [showNewTaskModal, setShowNewTaskModal] = useState(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userDoc = await getDoc(doc(db, 'users', u.uid));
        if (userDoc.exists()) {
          setProfile(userDoc.data() as UserProfile);
        } else {
          const newProfile: UserProfile = {
            uid: u.uid,
            email: u.email || '',
            displayName: u.displayName || 'User',
            photoURL: u.photoURL || '',
            role: 'manager'
          };
          await setDoc(doc(db, 'users', u.uid), newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setIsAuthReady(true);
    });
    return unsubscribe;
  }, []);

  // Data Listeners
  useEffect(() => {
    if (!user) return;

    const projectsUnsubscribe = onSnapshot(collection(db, 'projects'), (snapshot) => {
      const projs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      setProjects(projs);
    });

    const tasksUnsubscribe = onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Task));
      setTasks(tks);
    });

    return () => {
      projectsUnsubscribe();
      tasksUnsubscribe();
    };
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = () => signOut(auth);

  const createProject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;
    const description = formData.get('description') as string;

    if (!user) return;

    await addDoc(collection(db, 'projects'), {
      name,
      description,
      ownerId: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp()
    });
    setShowNewProjectModal(false);
  };

  const createTask = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!activeProject || !user) return;

    const formData = new FormData(e.currentTarget);
    await addDoc(collection(db, 'tasks'), {
      projectId: activeProject,
      title: formData.get('title'),
      description: formData.get('description'),
      status: 'todo',
      deadline: formData.get('deadline'),
      assignedTo: user.uid,
      desiredResult: Number(formData.get('desiredResult')),
      actualResult: 0,
      metricName: formData.get('metricName'),
      createdAt: serverTimestamp()
    });
    setShowNewTaskModal(false);
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    await updateDoc(doc(db, 'tasks', taskId), { status });
  };

  const updateTaskResult = async (taskId: string, actualResult: number) => {
    await updateDoc(doc(db, 'tasks', taskId), { actualResult });
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-600 rounded-xl mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-8 text-center border border-gray-100">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-200">
            <LayoutDashboard className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">TacticalFlow</h1>
          <p className="text-gray-500 mb-8">Streamline your project management and tactical collaboration.</p>
          <button 
            onClick={handleLogin}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl transition-all flex items-center justify-center gap-3 shadow-lg shadow-blue-100 active:scale-[0.98]"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            Sign in with Google
          </button>
        </div>
      </div>
    );
  }

  const filteredTasks = activeProject 
    ? tasks.filter(t => t.projectId === activeProject)
    : tasks;

  const stats = {
    total: filteredTasks.length,
    completed: filteredTasks.filter(t => t.status === 'completed').length,
    inProgress: filteredTasks.filter(t => t.status === 'in-progress').length,
    todo: filteredTasks.filter(t => t.status === 'todo').length,
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex">
      {/* Sidebar */}
      <aside className="w-72 bg-white border-r border-gray-100 flex flex-col sticky top-0 h-screen">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
              <LayoutDashboard className="text-white w-6 h-6" />
            </div>
            <span className="font-bold text-xl text-gray-900 tracking-tight">TacticalFlow</span>
          </div>

          <nav className="space-y-1">
            <button 
              onClick={() => setActiveProject(null)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors",
                !activeProject ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <BarChart3 size={18} />
              Overview
            </button>
            <div className="pt-4 pb-2 px-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Projects</div>
            {projects.map(p => (
              <button 
                key={p.id}
                onClick={() => setActiveProject(p.id)}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-colors group",
                  activeProject === p.id ? "bg-blue-50 text-blue-600" : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <span className="truncate">{p.name}</span>
                <ChevronRight size={14} className={cn("opacity-0 group-hover:opacity-100 transition-opacity", activeProject === p.id && "opacity-100")} />
              </button>
            ))}
            <button 
              onClick={() => setShowNewProjectModal(true)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-600 hover:bg-blue-50 transition-colors mt-2"
            >
              <Plus size={18} />
              New Project
            </button>
          </nav>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <img src={profile?.photoURL} className="w-10 h-10 rounded-full border-2 border-white shadow-sm" alt="Profile" referrerPolicy="no-referrer" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{profile?.displayName}</p>
              <p className="text-xs text-gray-500 truncate capitalize">{profile?.role}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
          >
            <LogOut size={18} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 max-w-7xl mx-auto w-full">
        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-1">
              {activeProject ? projects.find(p => p.id === activeProject)?.name : "Organization Dashboard"}
            </h2>
            <p className="text-gray-500">
              {activeProject ? projects.find(p => p.id === activeProject)?.description : "Monitor tactical performance across all projects."}
            </p>
          </div>
          {activeProject && (
            <button 
              onClick={() => setShowNewTaskModal(true)}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-all flex items-center gap-2 shadow-lg shadow-blue-100 active:scale-[0.98]"
            >
              <Plus size={20} />
              Add Task
            </button>
          )}
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[
            { label: 'Total Tasks', value: stats.total, icon: LayoutDashboard, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Pending', value: stats.todo, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50' },
          ].map((stat, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Performance Chart */}
        <div className="mb-8">
          <PerformanceChart tasks={filteredTasks} />
        </div>

        {/* Task List */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-800">Tactical Tasks</h3>
            <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              <Search size={16} className="text-gray-400" />
              <input type="text" placeholder="Search tasks..." className="bg-transparent border-none focus:ring-0 text-sm w-48" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50/50 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  <th className="px-6 py-4">Task</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Deadline</th>
                  <th className="px-6 py-4">Metric Comparison</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500 italic">
                      No tasks found. Create a task to get started.
                    </td>
                  </tr>
                ) : (
                  filteredTasks.map(task => (
                    <tr key={task.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-gray-900">{task.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{task.description}</p>
                      </td>
                      <td className="px-6 py-4">
                        <select 
                          value={task.status}
                          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                          className={cn(
                            "text-xs font-bold px-3 py-1 rounded-full border-none focus:ring-2",
                            task.status === 'completed' ? "bg-green-100 text-green-700" :
                            task.status === 'in-progress' ? "bg-amber-100 text-amber-700" :
                            "bg-gray-100 text-gray-700"
                          )}
                        >
                          <option value="todo">Todo</option>
                          <option value="in-progress">In Progress</option>
                          <option value="completed">Completed</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Calendar size={14} />
                          {format(new Date(task.deadline), 'MMM d, yyyy')}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                            <span>{task.metricName}</span>
                            <span>{Math.round((task.actualResult / task.desiredResult) * 100)}%</span>
                          </div>
                          <div className="w-48 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-600 transition-all duration-500" 
                              style={{ width: `${Math.min(100, (task.actualResult / task.desiredResult) * 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number" 
                              defaultValue={task.actualResult}
                              onBlur={(e) => updateTaskResult(task.id, Number(e.target.value))}
                              className="w-16 text-xs border-gray-200 rounded p-1 focus:ring-blue-500"
                            />
                            <span className="text-xs text-gray-400">/ {task.desiredResult}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals */}
      {showNewProjectModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Project</h3>
            <form onSubmit={createProject} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Project Name</label>
                <input name="name" required className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Q2 Tactical Expansion" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea name="description" rows={3} className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="What is this project about?" />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewProjectModal(false)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-100">Create</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showNewTaskModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-lg p-8 shadow-2xl animate-in fade-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Add Tactical Task</h3>
            <form onSubmit={createTask} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Task Title</label>
                  <input name="title" required className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Regional Sales Target" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                  <textarea name="description" rows={2} className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="Task details..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Deadline</label>
                  <input name="deadline" type="date" required className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Metric Name</label>
                  <input name="metricName" required className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g., Units Sold" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Desired Result</label>
                  <input name="desiredResult" type="number" required className="w-full px-4 py-3 rounded-xl border-gray-200 focus:border-blue-500 focus:ring-blue-500" placeholder="Target value" />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowNewTaskModal(false)} className="flex-1 py-3 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-lg shadow-blue-100">Add Task</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
