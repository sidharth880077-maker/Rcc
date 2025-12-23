
import React, { useState, useEffect } from 'react';
import { User, UserRole, TestRecord } from '../types';
import { storageService } from '../services/storageService';
import { getStudentPerformanceInsights } from '../services/geminiService';

interface TestsProps {
  user: User;
}

const Tests: React.FC<TestsProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const [tests, setTests] = useState<TestRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [isLoadingInsight, setIsLoadingInsight] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // Add Test Form
  const [testForm, setTestForm] = useState<Partial<TestRecord>>({
    subject: '',
    date: new Date().toISOString().split('T')[0],
    marksObtained: 0,
    totalMarks: 100,
    grade: 'A'
  });

  useEffect(() => {
    const storedTests = storageService.getTests();
    const storedStudents = storageService.getStudents();
    setTests(storedTests);
    setStudents(storedStudents);
    if (storedStudents.length > 0) setSelectedStudentId(storedStudents[0].id);
  }, []);

  const displayTests = isTeacher 
    ? tests.filter(t => t.studentId === selectedStudentId)
    : tests.filter(t => t.studentId === user.id);

  const handleGenerateInsight = async () => {
    const studentId = isTeacher ? selectedStudentId : user.id;
    const student = students.find(s => s.id === studentId) || user;
    const studentTests = tests.filter(t => t.studentId === studentId);
    const attendance = storageService.getAttendance();
    const studentAttendance = attendance.filter(a => a.studentId === studentId);

    setIsLoadingInsight(true);
    setAiInsight(null);
    const result = await getStudentPerformanceInsights(student.name, studentTests, studentAttendance);
    setAiInsight(result);
    setIsLoadingInsight(false);
  };

  const handleAddTest = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: TestRecord = {
      ...testForm,
      id: `test-${Date.now()}`,
      studentId: selectedStudentId
    } as TestRecord;

    const updated = [newRecord, ...tests];
    setTests(updated);
    storageService.saveTests(updated);
    setShowAddModal(false);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weekly Test Records</h1>
          <p className="text-slate-500">Track and analyze performance across subjects.</p>
        </div>
        <div className="flex items-center gap-3">
          {isTeacher && (
            <>
              <select 
                className="px-4 py-2 border rounded-xl bg-white shadow-sm outline-none"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                {students.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <button 
                onClick={() => setShowAddModal(true)}
                className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg"
              >
                + Add Result
              </button>
            </>
          )}
        </div>
      </header>

      {/* AI Insight Section */}
      <div className="bg-indigo-900 rounded-2xl shadow-lg p-6 text-white overflow-hidden relative">
        <div className="relative z-10">
          <div className="flex items-center space-x-2 mb-4">
            <span className="text-2xl">🤖</span>
            <h2 className="text-lg font-bold">AI Performance Insight</h2>
          </div>
          {aiInsight ? (
            <div className="bg-indigo-800/50 p-4 rounded-xl border border-indigo-700 animate-fade-in">
              <p className="text-indigo-100 italic leading-relaxed">"{aiInsight}"</p>
              <button onClick={() => setAiInsight(null)} className="mt-4 text-xs text-indigo-300 hover:text-white underline">Clear Analysis</button>
            </div>
          ) : (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-indigo-200">
                Let Gemini analyze {isTeacher ? 'this student\'s' : 'your'} performance trends and attendance data.
              </p>
              <button 
                onClick={handleGenerateInsight}
                disabled={isLoadingInsight}
                className="px-6 py-2 bg-white text-indigo-900 font-bold rounded-xl hover:bg-indigo-50 transition-colors disabled:opacity-50"
              >
                {isLoadingInsight ? 'Analyzing...' : 'Generate Analysis'}
              </button>
            </div>
          )}
        </div>
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 font-semibold text-slate-700">Date</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Subject</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Marks</th>
                <th className="px-6 py-4 font-semibold text-slate-700">Percentage</th>
                <th className="px-6 py-4 font-semibold text-slate-700 text-center">Grade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {displayTests.length > 0 ? displayTests.map((test) => {
                const perc = Math.round((test.marksObtained / test.totalMarks) * 100);
                return (
                  <tr key={test.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">{test.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{test.subject}</td>
                    <td className="px-6 py-4 text-slate-600">{test.marksObtained} / {test.totalMarks}</td>
                    <td className="px-6 py-4">
                      <div className="w-full bg-slate-100 rounded-full h-2 max-w-xs">
                        <div 
                          className={`h-2 rounded-full ${perc > 80 ? 'bg-green-500' : perc > 60 ? 'bg-blue-500' : 'bg-red-500'}`}
                          style={{ width: `${perc}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-slate-400 mt-1 block">{perc}%</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-indigo-600">{test.grade}</span>
                    </td>
                  </tr>
                )
              }) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No test records found for this selection.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-up">
            <div className="p-6 bg-slate-50 border-b flex justify-between items-center">
              <h2 className="font-bold text-slate-800">Add Weekly Test Result</h2>
              <button onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleAddTest} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Date</label>
                <input 
                  type="date"
                  required
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl"
                  value={testForm.date}
                  onChange={e => setTestForm({...testForm, date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Subject</label>
                <input 
                  type="text"
                  required
                  placeholder="e.g. Mathematics"
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl"
                  value={testForm.subject}
                  onChange={e => setTestForm({...testForm, subject: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Marks Obtained</label>
                  <input 
                    type="number"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl"
                    value={testForm.marksObtained}
                    onChange={e => setTestForm({...testForm, marksObtained: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Total Marks</label>
                  <input 
                    type="number"
                    required
                    className="w-full px-4 py-2 bg-slate-50 border rounded-xl"
                    value={testForm.totalMarks}
                    onChange={e => setTestForm({...testForm, totalMarks: parseInt(e.target.value)})}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Grade</label>
                <select 
                  className="w-full px-4 py-2 bg-slate-50 border rounded-xl"
                  value={testForm.grade}
                  onChange={e => setTestForm({...testForm, grade: e.target.value})}
                >
                  <option value="A+">A+</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="C">C</option>
                  <option value="D">D</option>
                  <option value="F">F</option>
                </select>
              </div>
              <button className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-colors">
                Save Record
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tests;
