import React, { useState } from 'react';
import {
  FolderKanban,
  X,
} from 'lucide-react';
import { type Project as ProjectType } from '../types';

export interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProject: (project: Omit<ProjectType, 'id'>) => void;
  onUpdateProject?: (project: ProjectType) => void;
  initialProject?: ProjectType | null;
}

export const ProjectModal: React.FC<ProjectModalProps> = ({
  isOpen,
  onClose,
  onAddProject,
  onUpdateProject,
  initialProject,
}) => {
  const [name, setName] = useState(initialProject?.name || '');
  const [code, setCode] = useState(initialProject?.code || `4ACE-${new Date().getFullYear()}-0${Math.floor(10 + Math.random() * 90)}`);
  const [client, setClient] = useState(initialProject?.client || '');
  const [location, setLocation] = useState(initialProject?.location || '');
  const [category, setCategory] = useState<ProjectType['category']>(initialProject?.category || 'Residential');
  const [budget, setBudget] = useState<number>(initialProject?.budget || 2800000);
  const [startDate, setStartDate] = useState(initialProject?.startDate || new Date().toISOString().split('T')[0]);
  const [targetDate, setTargetDate] = useState(initialProject?.targetDate || '2026-12-31');
  const [supervisor, setSupervisor] = useState(initialProject?.supervisor || 'Engr. Arriana Daoag');
  const [description, setDescription] = useState(initialProject?.description || '');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (initialProject && onUpdateProject) {
      onUpdateProject({
        ...initialProject,
        name: name.trim(),
        code: code.trim(),
        client: client.trim(),
        location: location.trim(),
        category,
        budget: Number(budget),
        startDate,
        targetDate,
        supervisor: supervisor.trim(),
        description: description.trim(),
      });
    } else {
      onAddProject({
        name: name.trim(),
        code: code.trim(),
        client: client.trim() || 'Private Client',
        location: location.trim() || 'Site Location TBD',
        category,
        status: 'In Progress',
        budget: Number(budget),
        spent: 0,
        startDate,
        targetDate,
        supervisor: supervisor.trim() || 'Site Engineer',
        progress: 0,
        description: description.trim() || 'Construction and architectural development site.',
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#123B5D] text-white">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FolderKanban className="w-4 h-4 text-[#18A999]" />
            <span>{initialProject ? 'Edit Construction Site' : 'Create New Project Site'}</span>
          </h3>
          <button onClick={onClose} className="text-white/70 hover:text-white cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto text-xs bg-white text-[#263238]">
          <div>
            <label className="block text-[#123B5D] font-bold mb-1">Project Site Name</label>
            <input
              type="text"
              required
              placeholder="e.g. Modern 2-Storey Villa"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Project Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] font-mono focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProjectType['category'])}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
              >
                <option value="Residential">Residential</option>
                <option value="Commercial">Commercial</option>
                <option value="Industrial">Industrial</option>
                <option value="Infrastructure">Infrastructure</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Client / Owner</label>
              <input
                type="text"
                placeholder="e.g. Atty. Roberto Valenzuela"
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Site Location</label>
              <input
                type="text"
                placeholder="e.g. Antipolo City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Total Budget (PHP)</label>
              <input
                type="number"
                min="10000"
                step="1000"
                required
                value={budget}
                onChange={(e) => setBudget(Number(e.target.value))}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] font-mono focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-[#123B5D] font-bold mb-1">Target End Date</label>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-[#123B5D] font-bold mb-1">Lead Supervisor / Foreman</label>
            <input
              type="text"
              value={supervisor}
              onChange={(e) => setSupervisor(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
            />
          </div>

          <div>
            <label className="block text-[#123B5D] font-bold mb-1">Scope &amp; Description</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-[#263238] focus:outline-none focus:border-[#18A999] focus:bg-white"
            />
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[#EAF7FA] text-[#123B5D] hover:bg-slate-200 font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-[#18A999] hover:bg-[#148f81] text-white font-bold cursor-pointer transition-colors shadow-xs"
            >
              {initialProject ? 'Update Site' : 'Create Site'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const Project = ProjectModal;
export default ProjectModal;
