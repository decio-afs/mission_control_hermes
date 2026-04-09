import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Network, Plus, Clock, FolderKanban, ListTodo, Calendar as CalendarIcon, CheckCircle2, CircleDashed, AlertCircle, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useTaskStore } from '../stores/useTaskStore';
import { useProjectStore } from '../stores/useProjectStore';

const locales = {
  'en-US': enUS
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const myEventsList = [
  { title: 'Hourly Trend Scraping', start: new Date(new Date().setHours(9, 0, 0, 0)), end: new Date(new Date().setHours(9, 15, 0, 0)), type: 'trend_analysis' },
  { title: 'Content Gen: 2 TikToks', start: new Date(new Date().setHours(10, 0, 0, 0)), end: new Date(new Date().setHours(11, 0, 0, 0)), type: 'agent_task' },
  { title: 'Director Output Review', start: new Date(new Date().setHours(11, 15, 0, 0)), end: new Date(new Date().setHours(11, 45, 0, 0)), type: 'review_cycle' },
  { title: 'Publish: TikTok/IG Carousel', start: new Date(new Date().setHours(12, 0, 0, 0)), end: new Date(new Date().setHours(12, 10, 0, 0)), type: 'content_publish' },
  { title: 'Hourly Trend Scraping', start: new Date(new Date().setHours(13, 0, 0, 0)), end: new Date(new Date().setHours(13, 15, 0, 0)), type: 'trend_analysis' }
];

export default function OperationsCenter() {
  const [activeTab, setActiveTab] = useState<'calendar' | 'tasks' | 'projects'>('calendar');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<'select' | 'task_form' | 'project_form'>('select');
  
  const [taskForm, setTaskForm] = useState({ name: '', priority: 'normal', datetime: '' });
  const [projectForm, setProjectForm] = useState({ name: '', description: '', priority: 'medium', dueDate: '' });

  const { tasks, summary, fetchTasks, fetchSummary, addTask } = useTaskStore();
  const { projects, fetchProjects, addProject } = useProjectStore();

  const [taskPage, setTaskPage] = useState(1);
  const tasksPerPage = 10;
  const paginatedTasks = tasks.slice((taskPage - 1) * tasksPerPage, taskPage * tasksPerPage);
  const totalTaskPages = Math.max(1, Math.ceil(tasks.length / tasksPerPage));

  useEffect(() => {
    fetchTasks();
    fetchSummary();
    fetchProjects();

    // Auto-poll every 10 seconds
    const interval = setInterval(() => {
      fetchTasks();
      fetchSummary();
      fetchProjects();
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchTasks, fetchSummary, fetchProjects]);

  const handleCreateTask = () => {
    if (!taskForm.name) return;
    addTask({
      id: `task-${Date.now()}`,
      projectId: 'proj-auto',
      name: taskForm.name,
      agentId: 'auto-assigned',
      agentName: 'Auto-Assigned',
      status: 'pending',
      priority: taskForm.priority as any,
      createdAt: taskForm.datetime ? new Date(taskForm.datetime) : new Date()
    });
    setIsNewModalOpen(false);
    setTaskForm({ name: '', priority: 'normal', datetime: '' });
    setModalStep('select');
  };

  const handleCreateProject = () => {
    if (!projectForm.name) return;
    addProject({
      id: `proj-${Date.now()}`,
      name: projectForm.name,
      description: projectForm.description,
      status: 'planning',
      priority: projectForm.priority as any,
      tasksCompleted: 0,
      tasksTotal: 0,
      dueDate: projectForm.dueDate ? new Date(projectForm.dueDate) : new Date(new Date().setDate(new Date().getDate() + 30))
    });
    setIsNewModalOpen(false);
    setProjectForm({ name: '', description: '', priority: 'medium', dueDate: '' });
    setModalStep('select');
  };

  const openModal = () => {
    setModalStep('select');
    setIsNewModalOpen(true);
  };

  const eventStyleGetter = (event: any) => {
    let bg = '#334155'; let border = '#000000'; let text = '#ffffff';
    if (event.type === 'content_publish') { bg = '#f64e6e'; border = '#e11d48'; text = '#ffffff'; }
    if (event.type === 'trend_analysis') { bg = '#38bdf8'; border = '#0ea5e9'; }
    if (event.type === 'agent_task') { bg = '#8b5cf6'; border = '#7c3aed'; }
    if (event.type === 'review_cycle') { bg = '#f59e0b'; border = '#d97706'; }

    return {
      style: {
        backgroundColor: bg + '40',
        borderColor: border,
        borderWidth: '1px',
        color: text,
        borderRadius: '6px',
        fontSize: '11px',
        padding: '2px 6px',
        fontWeight: 'bold',
        textTransform: 'uppercase' as const,
        letterSpacing: '0.05em'
      }
    };
  };

  return (
    <div className="p-4 md:p-6 h-full flex flex-col min-w-0 overflow-y-auto w-full">
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tighter mb-1">Operations Center</h2>
          <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-text-tertiary">
            <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Celery Beat: Online</span>
            <span className="w-1 h-1 rounded-full bg-border-subtle"></span>
            <span className="text-emerald-400">12 Workers Active</span>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-bg-deep p-1 rounded-full border border-border-subtle w-full md:w-auto overflow-x-auto">
          {[
            { id: 'calendar', label: 'Timeline', icon: CalendarIcon },
            { id: 'tasks', label: 'Task Queue', icon: ListTodo },
            { id: 'projects', label: 'Projects', icon: FolderKanban }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'calendar' | 'tasks' | 'projects')}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all min-w-[130px] whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-white text-black shadow-lg scale-[1.02]' 
                  : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4 flex-shrink-0" /> {tab.label}
            </button>
          ))}
          <div className="w-px bg-border-subtle mx-2 my-2"></div>
          <Link 
            to="/builder" 
            className="flex items-center justify-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold uppercase tracking-wider text-text-secondary hover:text-white hover:bg-white/5 transition-all min-w-[170px] whitespace-nowrap"
          >
            <Network className="w-4 h-4 flex-shrink-0" /> Workflow Builder
          </Link>
        </div>

        <div className="flex gap-3 w-full xl:w-auto">
          <button 
            onClick={() => { fetchTasks(); fetchSummary(); fetchProjects(); }}
            className="rounded-full bg-bg-card border border-border-subtle p-2.5 hover:bg-white/5 text-text-secondary hover:text-white transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button 
            onClick={openModal}
            className="flex-1 md:flex-none rounded-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] text-white font-bold text-xs uppercase tracking-wider px-5 py-2.5 hover:shadow-[0_0_20px_-5px_#f64e6e] transition-shadow flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> New 
          </button>
        </div>
      </div>

      <div className="flex-1 bg-bg-card rounded-2xl md:rounded-3xl border border-border-subtle p-2 md:p-6 overflow-hidden flex flex-col">
        {activeTab === 'calendar' && (
          <div className="calendar-container h-full min-h-[500px]">
            <style dangerouslySetInnerHTML={{__html: `
              .calendar-container .rbc-month-view, .calendar-container .rbc-time-view, .calendar-container .rbc-header { border-color: rgba(255,255,255,0.05); }
              .calendar-container .rbc-day-bg + .rbc-day-bg, .calendar-container .rbc-month-row + .rbc-month-row, .calendar-container .rbc-time-content, .calendar-container .rbc-timeslot-group { border-color: rgba(255,255,255,0.05); }
              .calendar-container .rbc-off-range-bg { background: #050505; }
              .calendar-container .rbc-today { background-color: rgba(246, 78, 110, 0.05); border-radius: 8px; }
              .calendar-container button { color: #b8b8b8; transition: color 0.2s; }
              .calendar-container button:hover { color: #ffffff; }
              .calendar-container .rbc-toolbar { flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
              .calendar-container .rbc-toolbar button { background: #050505; border: 1px solid rgba(255,255,255,0.1); border-radius: 99px; padding: 6px 12px; margin: 0 4px; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }
              .calendar-container .rbc-toolbar button:hover { background: rgba(255,255,255,0.05); }
              .calendar-container .rbc-toolbar button.rbc-active { background: rgba(246, 78, 110, 0.1); color: #f64e6e; border-color: rgba(246, 78, 110, 0.4); }
              .calendar-container .rbc-time-slot { border-top: 1px solid rgba(255,255,255,0.03); }
              .calendar-container .rbc-allday-cell { display: none; }
              .calendar-container .rbc-time-view .rbc-header { border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 8px; }
            `}} />
            <Calendar
              localizer={localizer}
              events={myEventsList}
              startAccessor="start"
              endAccessor="end"
              style={{ height: '100%', color: '#f8fafc' }}
              eventPropGetter={eventStyleGetter}
              defaultView="week"
              views={['day', 'week', 'month']}
            />
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="h-full flex flex-col min-h-0">
            {/* Task Summary Widget */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 shrink-0">
              <div className="bg-bg-deep border border-border-subtle rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1">Total DB Tasks</div>
                <div className="text-2xl font-black text-white">{summary?.total ?? tasks.length}</div>
              </div>
              <div className="bg-bg-deep border border-border-subtle rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-widest mb-1 flex items-center gap-1.5"><CheckCircle2 className="w-3 h-3 text-indigo-400"/> Completed</div>
                <div className="text-2xl font-black text-indigo-400">{summary?.completed ?? tasks.filter(t => t.status === 'complete').length}</div>
              </div>
              <div className="bg-bg-deep border border-[#10b981]/30 rounded-xl p-4 flex flex-col justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-[#10b981]/5 blur-2xl rounded-full"></div>
                <div className="text-[10px] font-bold text-[#10b981] uppercase tracking-widest mb-1 flex items-center gap-1.5"><CircleDashed className="w-3 h-3 animate-spin-slow"/> Running</div>
                <div className="text-2xl font-black text-[#10b981]">{summary?.running ?? tasks.filter(t => t.status === 'running').length}</div>
              </div>
              <div className="bg-bg-deep border border-amber-500/30 rounded-xl p-4 flex flex-col justify-center">
                <div className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Pending</div>
                <div className="text-2xl font-black text-amber-500">{summary?.pending ?? tasks.filter(t => t.status === 'pending').length}</div>
              </div>
            </div>

            <div className="flex-1 overflow-auto bg-bg-deep rounded-xl border border-border-subtle">
              <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="border-b border-border-subtle text-text-tertiary uppercase text-[10px] font-bold tracking-widest">
                  <th className="p-4">Task Name</th>
                  <th className="p-4">Assigned Agent</th>
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Priority</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map(task => (
                  <tr key={task.id} className="border-b border-border-subtle/50 hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-white text-sm">{task.name}</td>
                    <td className="p-4">
                      <span className="bg-bg-deep border border-border-subtle px-2 py-1 rounded-md text-xs font-mono text-[#38bdf8]">{task.agentName}</span>
                    </td>
                    <td className="p-4 text-xs font-mono text-text-secondary">{task.projectId}</td>
                    <td className="p-4">
                      <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                        task.priority === 'critical' ? 'bg-[#f64e6e]/10 text-[#f64e6e] border border-[#f64e6e]/30' :
                        task.priority === 'high' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                        'bg-white/5 text-text-secondary border border-border-subtle'
                      }`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
                        {task.status === 'running' && <CircleDashed className="w-4 h-4 text-[#10b981] animate-spin-slow" />}
                        {task.status === 'pending' && <Clock className="w-4 h-4 text-amber-500" />}
                        {task.status === 'complete' && <CheckCircle2 className="w-4 h-4 text-indigo-400" />}
                        {task.status === 'failed' && <AlertCircle className="w-4 h-4 text-rose-500" />}
                        <span className={
                          task.status === 'running' ? 'text-[#10b981]' :
                          task.status === 'pending' ? 'text-amber-500' :
                          task.status === 'complete' ? 'text-indigo-400' :
                          'text-rose-500'
                        }>{task.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {tasks.length > tasksPerPage && (
              <div className="flex justify-between items-center px-4 py-4 border-t border-border-subtle sticky bottom-0 bg-bg-deep shrink-0 rounded-b-xl">
                <div className="text-xs text-text-secondary font-bold uppercase tracking-widest">
                  Showing {(taskPage - 1) * tasksPerPage + 1} to {Math.min(taskPage * tasksPerPage, tasks.length)} of {tasks.length}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setTaskPage(p => Math.max(1, p - 1))}
                    disabled={taskPage === 1}
                    className="p-2 rounded-lg bg-bg-deep border border-border-subtle text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-bg-deep transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-bold text-white px-2">
                    {taskPage} / {totalTaskPages}
                  </span>
                  <button 
                    onClick={() => setTaskPage(p => Math.min(totalTaskPages, p + 1))}
                    disabled={taskPage === totalTaskPages}
                    className="p-2 rounded-lg bg-bg-deep border border-border-subtle text-white hover:bg-white/5 disabled:opacity-50 disabled:hover:bg-bg-deep transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="h-full overflow-auto grid grid-cols-1 lg:grid-cols-2 gap-4 pb-10">
            {projects.map(project => (
              <div key={project.id} className="bg-bg-deep border border-border-subtle rounded-2xl p-5 flex flex-col justify-between hover:border-[#f64e6e]/50 transition-colors">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-white font-bold text-lg">{project.name}</h3>
                    <span className={`text-[10px] uppercase font-bold tracking-wider px-2 py-1 rounded-full ${
                        project.status === 'active' ? 'bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/30' :
                        project.status === 'planning' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/30' :
                        project.status === 'completed' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/30' :
                        'bg-white/5 text-text-secondary border border-border-subtle'
                      }`}>
                        {project.status}
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary mb-6">{project.description}</p>
                </div>
                
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider">Progress</div>
                    <div className="text-sm font-mono text-white">{project.tasksTotal === 0 ? 0 : Math.round((project.tasksCompleted / project.tasksTotal) * 100)}%</div>
                  </div>
                  <div className="w-full h-2 bg-black border border-border-subtle rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${project.status === 'active' ? 'bg-gradient-to-r from-[#f64e6e] to-[#ff795e]' : 'bg-text-tertiary'}`} 
                      style={{ width: `${project.tasksTotal === 0 ? 0 : (project.tasksCompleted / project.tasksTotal) * 100}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-border-subtle">
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      Tasks: <span className="text-white">{project.tasksCompleted} / {project.tasksTotal}</span>
                    </div>
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider">
                      Due: <span className="text-white">{project.dueDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Action Modal */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-bg-deep border border-border-subtle rounded-3xl p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            
            {modalStep === 'select' && (
              <>
                <h3 className="text-xl font-black text-white uppercase tracking-tighter mb-4">Create New Action</h3>
                <p className="text-sm text-text-secondary mb-6">Select the type of workload you want to deploy to the Ghost Legion.</p>
                
                <div className="flex flex-col gap-3">
                  <button onClick={() => setModalStep('task_form')} className="group bg-bg-card border border-border-subtle hover:border-[#f64e6e]/50 p-4 rounded-xl flex items-center gap-4 text-left transition-colors">
                    <div className="bg-[#f64e6e]/10 p-3 rounded-lg text-[#f64e6e] group-hover:scale-110 transition-transform">
                      <ListTodo className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold uppercase tracking-wider text-sm mb-1">Queue Single Task</div>
                      <div className="text-text-tertiary text-xs">Deploy a one-off execution to a specific agent.</div>
                    </div>
                  </button>
                  
                  <button onClick={() => setModalStep('project_form')} className="group bg-bg-card border border-border-subtle hover:border-[#38bdf8]/50 p-4 rounded-xl flex items-center gap-4 text-left transition-colors">
                    <div className="bg-[#38bdf8]/10 p-3 rounded-lg text-[#38bdf8] group-hover:scale-110 transition-transform">
                      <FolderKanban className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-white font-bold uppercase tracking-wider text-sm mb-1">Initialize Project</div>
                      <div className="text-text-tertiary text-xs">Create a strategic campaign to group multiple tasks.</div>
                    </div>
                  </button>
                </div>
              </>
            )}

            {modalStep === 'task_form' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex justify-between items-center">
                  Configure Task
                  <span className="bg-[#f64e6e]/10 text-[#f64e6e] text-[10px] px-2 py-1 rounded-sm tracking-widest">AGENT DEPLOYMENT</span>
                </h3>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Task Name</label>
                  <input autoFocus placeholder="e.g. Scrape /r/MachineLearning" className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f64e6e]" 
                    value={taskForm.name} onChange={e => setTaskForm({...taskForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Priority Level</label>
                  <select className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f64e6e] appearance-none"
                    value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                    <option value="critical">Critical</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Execution Date & Time</label>
                  <input type="datetime-local" className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#f64e6e] [color-scheme:dark]"
                    value={taskForm.datetime} onChange={e => setTaskForm({...taskForm, datetime: e.target.value})} />
                </div>
                <button onClick={handleCreateTask} disabled={!taskForm.name} className="mt-2 w-full rounded-full bg-gradient-to-r from-[#f64e6e] to-[#ff795e] disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 hover:shadow-[0_0_20px_-5px_#f64e6e] transition-all">
                  Queue Execution
                </button>
              </div>
            )}

            {modalStep === 'project_form' && (
              <div className="flex flex-col gap-4">
                <h3 className="text-xl font-black text-white uppercase tracking-tighter flex justify-between items-center">
                  Initialize Project
                  <span className="bg-[#38bdf8]/10 text-[#38bdf8] text-[10px] px-2 py-1 rounded-sm tracking-widest">STRATEGIC</span>
                </h3>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Project Name</label>
                  <input autoFocus placeholder="e.g. Operation Automata" className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38bdf8]" 
                    value={projectForm.name} onChange={e => setProjectForm({...projectForm, name: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Objective Summary</label>
                  <textarea placeholder="Describe the outcome..." className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38bdf8] min-h-[80px]"
                    value={projectForm.description} onChange={e => setProjectForm({...projectForm, description: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider mb-2 block">Target Due Date</label>
                  <input type="date" className="w-full bg-bg-card border border-border-subtle rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#38bdf8] [color-scheme:dark]"
                    value={projectForm.dueDate} onChange={e => setProjectForm({...projectForm, dueDate: e.target.value})} />
                </div>
                <button onClick={handleCreateProject} disabled={!projectForm.name || !projectForm.dueDate} className="mt-2 w-full rounded-full bg-[#38bdf8] hover:bg-[#38bdf8]/80 disabled:opacity-50 text-white font-bold text-xs uppercase tracking-wider px-5 py-3 hover:shadow-[0_0_20px_-5px_#38bdf8] transition-all">
                  Commence Planning
                </button>
              </div>
            )}
            
            <button onClick={() => setIsNewModalOpen(false)} className="mt-4 w-full rounded-full bg-transparent border border-border-subtle text-text-secondary font-bold text-xs uppercase tracking-wider px-5 py-3 hover:bg-white/5 hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
