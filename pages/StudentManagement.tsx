
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storageService';

interface StudentManagementProps {
  user: User;
}

const StudentManagement: React.FC<StudentManagementProps> = ({ user }) => {
  const [students, setStudents] = useState<User[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState<User | null>(null);
  
  useEffect(() => {
    setStudents(storageService.getStudents());
  }, []);

  // Form state
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    mobile: '',
    batch: '',
    class: '',
    section: '',
    role: UserRole.STUDENT
  });

  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({ name: '', mobile: '', batch: '', class: '', section: '', role: UserRole.STUDENT });
    setShowModal(true);
  };

  const openEditModal = (student: User) => {
    setEditingStudent(student);
    setFormData(student);
    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    let updatedStudents: User[];
    if (editingStudent) {
      updatedStudents = students.map(s => s.id === editingStudent.id ? { ...s, ...formData } as User : s);
    } else {
      const newStudent: User = {
        ...formData,
        id: `s-${Date.now()}`,
        role: UserRole.STUDENT
      } as User;
      updatedStudents = [...students, newStudent];
    }
    setStudents(updatedStudents);
    storageService.saveStudents(updatedStudents);
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to remove this student?")) {
      const updated = students.filter(s => s.id !== id);
      setStudents(updated);
      storageService.saveStudents(updated);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Student Management</h1>
          <p className="text-slate-500">Add, edit, or remove student records from RCC.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg"
        >
          + Add New Student
        </button>
      </header>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Name</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Class</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Batch</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Mobile</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{student.name}</div>
                    <div className="text-xs text-slate-400">{student.section || 'No Section'}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.class || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-xs font-bold">Batch {student.batch}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{student.mobile}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button 
                      onClick={() => openEditModal(student)}
                      className="text-indigo-600 hover:text-indigo-800 font-bold text-sm"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(student.id)}
                      className="text-red-600 hover:text-red-800 font-bold text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">{editingStudent ? 'Edit Student' : 'Add New Student'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Full Name</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Class</label>
                  <input 
                    type="text" 
                    value={formData.class}
                    onChange={(e) => setFormData({...formData, class: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Section</label>
                  <input 
                    type="text" 
                    value={formData.section}
                    onChange={(e) => setFormData({...formData, section: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Batch</label>
                  <input 
                    type="text" 
                    value={formData.batch}
                    onChange={(e) => setFormData({...formData, batch: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Mobile</label>
                  <input 
                    type="text" 
                    required
                    value={formData.mobile}
                    onChange={(e) => setFormData({...formData, mobile: e.target.value})}
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl outline-none" 
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-slate-100 text-slate-600 font-bold rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManagement;
