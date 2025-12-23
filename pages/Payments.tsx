
import React, { useState, useEffect, useRef } from 'react';
import { User, UserRole, PaymentRecord } from '../types';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

interface PaymentsProps {
  user: User;
}

const Payments: React.FC<PaymentsProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [filterStudentId, setFilterStudentId] = useState<string>('all');
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [viewingProof, setViewingProof] = useState<string | null>(null);
  const [sendingReminder, setSendingReminder] = useState<string | null>(null);

  const currentMonthName = new Date().toLocaleString('default', { month: 'long' });
  const currentMonthKey = new Date().toISOString().slice(0, 7); 

  useEffect(() => {
    setPayments(storageService.getPayments());
    setStudents(storageService.getStudents());
  }, []);

  const studentPayments = payments.filter(p => {
    if (isTeacher) {
      return filterStudentId === 'all' ? true : p.studentId === filterStudentId;
    }
    return p.studentId === user.id;
  });

  const totalPaid = studentPayments.filter(p => p.status === 'SUCCESS').reduce((acc, p) => acc + p.amount, 0);
  const targetFees = isTeacher ? 180000 : 60000;
  const progressPercent = Math.min(100, (totalPaid / targetFees) * 100);

  const delinquentStudents = students.filter(s => {
    const hasPaidThisMonth = payments.some(p => p.studentId === s.id && p.status === 'SUCCESS' && p.date.startsWith(currentMonthKey));
    const hasPending = payments.some(p => p.studentId === s.id && p.status === 'PENDING');
    return !hasPaidThisMonth && !hasPending;
  });

  const isStudentDelinquent = !payments.some(p => p.studentId === user.id && p.status === 'SUCCESS' && p.date.startsWith(currentMonthKey));
  const hasStudentPendingApproval = payments.some(p => p.studentId === user.id && p.status === 'PENDING');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendReminder = (studentId: string) => {
    setSendingReminder(studentId);
    storageService.sendAutomatedReminder(studentId, currentMonthName);
    setTimeout(() => {
      setSendingReminder(null);
      alert("Reminder sent to student's inbox.");
    }, 800);
  };

  const handleUploadProof = () => {
    if (!proofImage) {
      alert("Please select a screenshot first.");
      return;
    }

    setPaying(true);
    setTimeout(() => {
      const newPayment: PaymentRecord = {
        id: `p-${Date.now()}`,
        studentId: user.id,
        amount: 5000,
        date: new Date().toISOString().split('T')[0],
        status: 'PENDING',
        description: `Monthly Fees - ${currentMonthName}`,
        transactionId: `TXN${Math.floor(Math.random() * 90000000 + 10000000)}`,
        paymentMethod: 'UPI / Screenshot Upload',
        proofImage: proofImage
      };
      const updated = [newPayment, ...payments];
      setPayments(updated);
      storageService.savePayments(updated);
      setPaying(false);
      setShowUploadModal(false);
      setProofImage(null);
    }, 1500);
  };

  const handleApprove = (id: string) => {
    const updated = payments.map(p => p.id === id ? { ...p, status: 'SUCCESS' as const } : p);
    setPayments(updated);
    storageService.savePayments(updated);
  };

  const exportTransactions = () => {
    const headers = ['Student', 'Date', 'Description', 'Amount', 'Status', 'Transaction ID', 'Method'];
    const rows = studentPayments.map(p => {
      const student = students.find(s => s.id === p.studentId);
      return [
        student?.name || 'Unknown',
        p.date,
        p.description,
        p.amount,
        p.status,
        p.transactionId || 'N/A',
        p.paymentMethod || 'Manual'
      ];
    });

    const csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `RCC_Transactions.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Fees & Billing</h1>
          <p className="text-slate-500 font-medium">
            {isTeacher ? 'Manage student finances and verify payments.' : 'Track your tuition fees and payment history.'}
          </p>
        </div>
      </header>

      {/* Main Stats and Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Progress Card */}
        <section className="lg:col-span-2 bg-white p-10 rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-10">
              <div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {isTeacher ? 'Annual Collection' : 'Personal Fee Progress'}
                </h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Session 2023-24</p>
              </div>
              <div className="text-right">
                <span className="text-4xl font-black text-indigo-600 tracking-tighter">₹{totalPaid.toLocaleString()}</span>
                <span className="text-slate-300 font-bold ml-2">/ ₹{targetFees.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="relative w-full h-6 bg-slate-100 rounded-full overflow-hidden mb-6">
              <div 
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 transition-all duration-1000 ease-out rounded-full shadow-lg"
                style={{ width: `${progressPercent}%` }}
              ></div>
            </div>
            
            <div className="flex justify-between text-xs font-black text-slate-400 uppercase tracking-widest">
              <span>Goal Progress</span>
              <span className="text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full">{Math.round(progressPercent)}% Cleared</span>
            </div>
          </div>
        </section>

        {/* Dynamic Status / Reminder Card */}
        <section className={`p-10 rounded-[3rem] shadow-2xl flex flex-col justify-between relative overflow-hidden transition-all duration-500 ${
          isTeacher ? 'bg-indigo-900 text-white' : 
          isStudentDelinquent ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
        }`}>
          <div className="relative z-10">
            <p className="text-white/60 font-black uppercase text-[10px] tracking-[0.3em] mb-3">
              {isTeacher ? 'System Revenue' : 'Billing Status'}
            </p>
            <h2 className="text-4xl font-black mb-4 tracking-tighter">
              {isTeacher ? `₹${payments.filter(p => p.status === 'SUCCESS').reduce((a,c) => a+c.amount,0).toLocaleString()}` : 
               isStudentDelinquent ? 'Dues Pending' : 'Account Current'}
            </h2>
            <p className="text-white/80 text-sm font-medium leading-relaxed">
              {isTeacher 
                ? `${payments.filter(p => p.status === 'PENDING').length} payments waiting for your verification.` 
                : isStudentDelinquent 
                    ? `Please complete your ₹5,000 fee for ${currentMonthName}.` 
                    : `Your ${currentMonthName} fees are paid. Thank you!`}
            </p>
          </div>
          
          <div className="mt-8 relative z-10">
             {isTeacher ? (
               <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10">
                 <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-1">Unpaid Students</p>
                 <p className="text-2xl font-black">{delinquentStudents.length}</p>
               </div>
             ) : (
               !isStudentDelinquent ? (
                 <div className="bg-white/20 p-4 rounded-2xl border border-white/10 text-center font-black uppercase tracking-widest text-xs">
                   Verified ✓
                 </div>
               ) : (
                 <button 
                  onClick={() => setShowUploadModal(true)}
                  className="w-full py-4 bg-white text-red-600 font-black rounded-2xl shadow-xl hover:scale-105 transition-transform active:scale-95"
                 >
                   Action Required
                 </button>
               )
             )}
          </div>
          <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-40 h-40 bg-white/10 rounded-full blur-3xl"></div>
        </section>
      </div>

      {/* Split Sections for Students */}
      {!isTeacher && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Section 1: Online Payment Info */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 animate-fade-in">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black">1</div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Online Payment</h3>
                <p className="text-sm font-medium text-slate-400">Scan QR or use UPI to pay</p>
              </div>
            </div>

            <div className="p-8 bg-slate-900 rounded-[2rem] text-center space-y-6 relative overflow-hidden group">
               <div className="relative z-10">
                 <div className="bg-white p-4 rounded-3xl w-40 h-40 mx-auto shadow-2xl mb-6 flex items-center justify-center">
                    <div className="text-slate-200 text-xs font-black uppercase tracking-tighter opacity-20">RCC QR CODE</div>
                    {/* Placeholder for real QR */}
                    <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-10">📱</div>
                 </div>
                 <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-1">Official UPI ID</p>
                 <p className="text-2xl font-black text-white tracking-tighter">raghubir.classes@ybl</p>
                 <p className="text-xs text-slate-500 font-bold mt-2">Mobile: +91 93043 04189</p>
               </div>
               <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl"></div>
            </div>
            
            <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 flex gap-4">
               <span className="text-2xl">⚠️</span>
               <p className="text-xs text-amber-800 font-medium leading-relaxed">
                 After successful payment, please note your <strong>Transaction ID</strong> and take a <strong>Screenshot</strong> for Step 2.
               </p>
            </div>
          </div>

          {/* Section 2: Upload Proof */}
          <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-slate-100 space-y-8 animate-fade-in">
             <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black">2</div>
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Upload Proof</h3>
                <p className="text-sm font-medium text-slate-400">Submit receipt for verification</p>
              </div>
            </div>

            <div 
              onClick={() => setShowUploadModal(true)}
              className="group h-64 border-4 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center hover:border-indigo-200 hover:bg-indigo-50/30 transition-all cursor-pointer relative overflow-hidden"
            >
               <div className="text-6xl mb-4 group-hover:scale-110 transition-transform">📄</div>
               <p className="text-xl font-black text-slate-800 tracking-tight">Click to Upload Receipt</p>
               <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Screenshot / PDF</p>
               
               {hasStudentPendingApproval && (
                 <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8">
                   <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-2xl mb-4 animate-bounce">⏳</div>
                   <p className="text-lg font-black text-slate-900 tracking-tight">Verification in Progress</p>
                   <p className="text-xs text-slate-400 font-bold mt-1">Admin will approve shortly</p>
                 </div>
               )}
            </div>

            <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100 flex gap-4">
               <span className="text-2xl">💡</span>
               <p className="text-xs text-indigo-800 font-medium leading-relaxed">
                 Verification usually takes 2-4 hours. You will receive an automated message once approved.
               </p>
            </div>
          </div>
        </div>
      )}

      {/* Delinquent Students List for Teacher */}
      {isTeacher && delinquentStudents.length > 0 && (
        <section className="bg-white rounded-[3rem] shadow-xl border border-slate-100 overflow-hidden animate-fade-in">
          <div className="p-10 border-b border-slate-50 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Unpaid Students</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{currentMonthName} Billing Cycle</p>
            </div>
            <button 
              onClick={() => delinquentStudents.forEach(s => handleSendReminder(s.id))}
              className="px-8 py-4 bg-red-600 text-white font-black rounded-2xl shadow-xl shadow-red-100 hover:bg-red-700 active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              Remind All ( {delinquentStudents.length} )
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {delinquentStudents.map(student => (
              <div key={student.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:shadow-lg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center font-black text-slate-400 text-lg">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-800 tracking-tight">{student.name}</h4>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Batch {student.batch}</p>
                  </div>
                </div>
                <button 
                  onClick={() => handleSendReminder(student.id)}
                  disabled={sendingReminder === student.id}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl transition-all ${
                    sendingReminder === student.id ? 'bg-indigo-100 text-indigo-600' : 'bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white shadow-sm'
                  }`}
                >
                  {sendingReminder === student.id ? '...' : '✉️'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* History Table */}
      <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <div className="p-10 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Transaction History</h2>
          <div className="flex items-center gap-4">
            {isTeacher && (
              <select 
                value={filterStudentId}
                onChange={(e) => setFilterStudentId(e.target.value)}
                className="px-6 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all uppercase tracking-widest"
              >
                <option value="all">Global View</option>
                {students.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
            <button 
              onClick={exportTransactions}
              className="px-6 py-3 bg-indigo-50 text-indigo-600 text-xs font-black rounded-2xl hover:bg-indigo-100 transition-colors flex items-center border border-indigo-100 uppercase tracking-widest"
            >
              📥 Export Data
            </button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50/50">
              <tr>
                {isTeacher && <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Student</th>}
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Details</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Amount</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {studentPayments.length === 0 ? (
                <tr>
                  <td colSpan={isTeacher ? 4 : 3} className="px-10 py-20 text-center text-slate-400 italic">No records matching your search.</td>
                </tr>
              ) : studentPayments.map((pay) => {
                const student = students.find(s => s.id === pay.studentId);
                return (
                  <tr key={pay.id} className="group hover:bg-slate-50/80 transition-all">
                    {isTeacher && (
                      <td className="px-10 py-8">
                        <div className="flex flex-col">
                          <span className="font-black text-slate-800 text-lg tracking-tight leading-none mb-1">{student?.name || 'Unknown'}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Batch {student?.batch || 'N/A'}</span>
                        </div>
                      </td>
                    )}
                    <td className="px-10 py-8">
                      <div className="flex flex-col">
                        <span className="text-lg font-bold text-slate-700 tracking-tight leading-none mb-2">{pay.description}</span>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">📅 {pay.date}</span>
                          {pay.proofImage && (
                            <button 
                              onClick={() => setViewingProof(pay.proofImage!)}
                              className="text-[10px] text-indigo-600 font-black uppercase tracking-widest hover:underline flex items-center gap-2"
                            >
                              🖼️ Show Receipt
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <span className="font-black text-slate-900 text-xl tracking-tighter">₹{pay.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-10 py-8 text-right">
                      {isTeacher && pay.status === 'PENDING' ? (
                        <button 
                          onClick={() => handleApprove(pay.id)}
                          className="text-xs bg-emerald-600 text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest hover:bg-emerald-700 shadow-xl shadow-emerald-100 transition-all active:scale-95"
                        >
                          Approve
                        </button>
                      ) : (
                        <div className="flex items-center justify-end">
                          <span className={`w-3 h-3 rounded-full mr-3 ${
                            pay.status === 'SUCCESS' ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]' : 'bg-orange-500'
                          }`}></span>
                          <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                            pay.status === 'SUCCESS' ? 'text-emerald-700' : 'text-orange-700'
                          }`}>
                            {pay.status}
                          </span>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upload Modal (Action Area) */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-2xl z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-xl rounded-[4rem] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-10 bg-slate-50/50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none">Submit Proof</h2>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-2">Final Step for {currentMonthName}</p>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-lg hover:bg-slate-100 transition-all"
              >✕</button>
            </div>
            
            <div className="p-10 space-y-8">
              <div className="bg-slate-900 rounded-[2.5rem] p-8 space-y-3 text-center text-white relative overflow-hidden">
                <div className="text-4xl font-black tracking-tighter">₹5,000.00</div>
                <div className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em]">Current Installment</div>
                <div className="absolute top-0 left-0 w-20 h-20 bg-indigo-500/10 blur-2xl rounded-full"></div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.4em] px-6 mb-2">Transaction Screenshot</label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative cursor-pointer group border-4 border-dashed rounded-[3rem] p-12 text-center transition-all ${
                    proofImage ? 'border-emerald-500 bg-emerald-50/30' : 'border-slate-100 hover:border-indigo-400 hover:bg-indigo-50/30'
                  }`}
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*" 
                    onChange={handleFileChange} 
                  />
                  {proofImage ? (
                    <div className="flex flex-col items-center">
                      <div className="relative group/img">
                        <img src={proofImage} className="w-32 h-32 object-cover rounded-[2rem] mb-4 shadow-2xl" alt="Proof" />
                        <div className="absolute inset-0 bg-red-600/0 group-hover/img:bg-red-600/40 rounded-[2rem] flex items-center justify-center transition-all opacity-0 group-hover/img:opacity-100">
                           <span className="text-white font-black text-xs uppercase tracking-widest">Change</span>
                        </div>
                      </div>
                      <span className="text-sm font-black text-emerald-700 tracking-tight">Receipt Attached ✓</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center">
                      <div className="text-6xl mb-4 grayscale opacity-20 group-hover:grayscale-0 group-hover:opacity-100 transition-all">📸</div>
                      <span className="text-xl font-black text-slate-800 tracking-tight">Tap to Choose File</span>
                      <span className="text-[10px] text-slate-400 mt-2 uppercase font-black tracking-widest">JPEG or PNG format</span>
                    </div>
                  )}
                </div>
              </div>

              <button 
                onClick={handleUploadProof}
                disabled={paying || !proofImage}
                className="w-full py-6 rounded-[2rem] font-black text-xl bg-indigo-600 text-white hover:bg-indigo-700 shadow-2xl shadow-indigo-200 disabled:opacity-20 disabled:grayscale transition-all active:scale-[0.98] flex items-center justify-center gap-4"
              >
                {paying ? (
                  <>
                    <span className="animate-spin text-3xl">⚙️</span>
                    <span>Submitting...</span>
                  </>
                ) : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      {viewingProof && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-3xl z-[200] flex items-center justify-center p-4 animate-fade-in" onClick={() => setViewingProof(null)}>
          <div className="max-w-4xl w-full bg-white rounded-[4rem] overflow-hidden shadow-2xl animate-scale-up border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-[0.3em] text-xs">Verified Document Receipt</h3>
              <button onClick={() => setViewingProof(null)} className="w-14 h-14 flex items-center justify-center rounded-full bg-white shadow-xl text-2xl">✕</button>
            </div>
            <div className="p-4 bg-slate-100 flex items-center justify-center min-h-[500px]">
              <img src={viewingProof} className="max-w-full max-h-[75vh] rounded-[2.5rem] shadow-2xl border-[10px] border-white" alt="Payment Proof" />
            </div>
            <div className="p-10 flex justify-center">
              <button 
                onClick={() => setViewingProof(null)}
                className="px-16 py-5 bg-slate-900 text-white font-black uppercase tracking-[0.3em] rounded-[2rem] shadow-2xl active:scale-95 transition-all text-sm"
              > Close Preview </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
