
import React, { useState, useEffect } from 'react';
import { User, UserRole, PaymentRecord } from '../types';
import { storageService } from '../services/storageService';
import { useNavigate } from 'react-router-dom';

interface PaymentsProps {
  user: User;
}

const Payments: React.FC<PaymentsProps> = ({ user }) => {
  const isTeacher = user.role === UserRole.TEACHER;
  const navigate = useNavigate();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showDelinquentModal, setShowDelinquentModal] = useState(false);
  const [paying, setPaying] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'NET'>('UPI');
  const [filterStudentId, setFilterStudentId] = useState<string>('all');

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

  // Revenue calc
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const thisMonthRevenue = payments
    .filter(p => p.status === 'SUCCESS' && p.date.startsWith(currentMonth))
    .reduce((acc, p) => acc + p.amount, 0);

  const totalLifetimeRevenue = payments
    .filter(p => p.status === 'SUCCESS')
    .reduce((acc, p) => acc + p.amount, 0);

  // Delinquent logic
  const delinquentStudents = students.filter(s => {
    const hasPaidThisMonth = payments.some(p => p.studentId === s.id && p.status === 'SUCCESS' && p.date.startsWith(currentMonth));
    const hasPending = payments.some(p => p.studentId === s.id && p.status === 'PENDING');
    return !hasPaidThisMonth || hasPending;
  });

  // Individual student due status
  const isStudentDelinquent = !payments.some(p => p.studentId === user.id && p.status === 'SUCCESS' && p.date.startsWith(currentMonth));
  const hasStudentPendingApproval = payments.some(p => p.studentId === user.id && p.status === 'PENDING');

  const handlePay = () => {
    setPaying(true);
    setTimeout(() => {
      const newPayment: PaymentRecord = {
        id: `p-${Date.now()}`,
        studentId: user.id,
        amount: 5000,
        date: new Date().toISOString().split('T')[0],
        status: 'SUCCESS',
        description: `Monthly Fees - ${new Date().toLocaleString('default', { month: 'long' })}`,
        transactionId: `TXN${Math.floor(Math.random() * 90000000 + 10000000)}`,
        paymentMethod: paymentMethod === 'UPI' ? 'UPI / PhonePe' : 'Net Banking'
      };
      const updated = [newPayment, ...payments];
      setPayments(updated);
      storageService.savePayments(updated);
      setPaying(false);
      setShowCheckout(false);
    }, 2000);
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
    link.setAttribute("download", `RCC_Transactions_${isTeacher ? filterStudentId : user.name}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900">Fees & Payments</h1>
          <p className="text-slate-500">
            {isTeacher ? 'Manage student finances and track revenue.' : 'Manage your fee payments and track history.'}
          </p>
        </div>
        {!isTeacher && (
          <button 
            onClick={() => setShowCheckout(true)}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 transform active:scale-95"
          >
            Pay {new Date().toLocaleString('default', { month: 'long' })} Fees
          </button>
        )}
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Payment Progress Tracker */}
        <section className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">
                {isTeacher ? 'Overall Collection' : 'My Fee Progress'}
              </h2>
              <p className="text-sm text-slate-500">Academic Session 2023-24</p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">₹{totalPaid.toLocaleString()}</span>
              <span className="text-slate-400 font-medium"> / ₹{targetFees.toLocaleString()}</span>
            </div>
          </div>
          
          <div className="relative w-full h-4 bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-indigo-600 transition-all duration-1000 ease-out rounded-full"
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
          
          <div className="flex justify-between mt-3 text-xs font-bold text-slate-400">
            <span>Progress</span>
            <span className="text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{Math.round(progressPercent)}% Paid</span>
            <span>{isTeacher ? 'Total Goal' : 'Annual Fee'}</span>
          </div>
        </section>

        {isTeacher ? (
          <section className="bg-indigo-900 p-8 rounded-3xl shadow-xl text-white flex flex-col justify-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-indigo-300 font-bold uppercase text-xs tracking-widest mb-1">Monthly Revenue ({new Date().toLocaleString('default', { month: 'long' })})</p>
              <h2 className="text-4xl font-black mb-2">₹{thisMonthRevenue.toLocaleString()}</h2>
              <p className="text-indigo-400 text-sm font-medium">Total Lifetime: ₹{totalLifetimeRevenue.toLocaleString()}</p>
              
              <div className="mt-4 flex gap-4">
                <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-sm">
                  <p className="text-[10px] uppercase font-bold text-indigo-200">Awaiting Appr.</p>
                  <p className="text-lg font-bold">₹{payments.filter(p => p.status === 'PENDING').reduce((a,c) => a+c.amount,0).toLocaleString()}</p>
                </div>
                <div className="bg-white/10 p-3 rounded-xl flex-1 backdrop-blur-sm">
                  <p className="text-[10px] uppercase font-bold text-indigo-200">Transactions</p>
                  <p className="text-lg font-bold">{payments.filter(p => p.status === 'SUCCESS').length}</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </section>
        ) : (
          <section className={`p-8 rounded-3xl shadow-xl flex flex-col justify-center relative overflow-hidden transition-all ${isStudentDelinquent ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}>
             <div className="relative z-10">
               <p className="text-white/70 font-bold uppercase text-xs tracking-widest mb-1">Current Status</p>
               <h2 className="text-4xl font-black mb-2">
                 {isStudentDelinquent ? 'Dues Pending' : 'No Current Dues'}
               </h2>
               <p className="text-white/80 text-sm font-medium">
                 {isStudentDelinquent 
                    ? `Please clear ₹5,000 for ${new Date().toLocaleString('default', { month: 'long' })}.` 
                    : `You have cleared all payments for this month.`}
               </p>
               {hasStudentPendingApproval && (
                 <div className="mt-4 bg-white/20 p-4 rounded-2xl backdrop-blur-sm border border-white/10">
                   <p className="text-xs font-bold uppercase text-white/90 mb-1">Payment Under Verification</p>
                   <p className="text-sm font-medium">Your last transaction is being verified by RCC Admin.</p>
                 </div>
               )}
             </div>
             <div className="absolute bottom-0 right-0 w-48 h-48 bg-white/10 rounded-full -mb-24 -mr-24 blur-3xl"></div>
          </section>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Transaction History */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
            <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-800">Payment History</h2>
              
              <div className="flex items-center gap-3">
                {isTeacher && (
                  <select 
                    value={filterStudentId}
                    onChange={(e) => setFilterStudentId(e.target.value)}
                    className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                  >
                    <option value="all">All Students</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
                <button 
                  onClick={exportTransactions}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-xl hover:bg-indigo-100 transition-colors flex items-center border border-indigo-100"
                >
                  <span className="mr-2">📥</span> Download Statement
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50/50">
                  <tr>
                    {isTeacher && <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>}
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Details</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Amount</th>
                    <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {studentPayments.map((pay) => {
                    const student = students.find(s => s.id === pay.studentId);
                    return (
                      <tr key={pay.id} className="group hover:bg-indigo-50/30 transition-colors">
                        {isTeacher && (
                          <td className="px-6 py-5">
                            <div className="flex flex-col">
                              <span className="font-bold text-slate-800">{student?.name || 'Unknown'}</span>
                              <span className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Batch {student?.batch || 'N/A'}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-6 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{pay.description}</span>
                            <span className="text-xs text-slate-400 flex items-center mt-0.5">
                              <span className="mr-2">📅 {pay.date}</span>
                              <span className="hidden sm:inline">💳 {pay.paymentMethod || 'Manual'}</span>
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="font-bold text-slate-900">₹{pay.amount.toLocaleString()}</span>
                        </td>
                        <td className="px-6 py-5 text-right">
                          {isTeacher && pay.status === 'PENDING' ? (
                            <button 
                              onClick={() => handleApprove(pay.id)}
                              className="text-xs bg-green-600 text-white px-4 py-1.5 rounded-lg font-bold hover:bg-green-700 shadow-sm transition-all active:scale-95"
                            >
                              Approve
                            </button>
                          ) : (
                            <div className="flex items-center justify-end">
                              <span className={`w-2 h-2 rounded-full mr-2 ${
                                pay.status === 'SUCCESS' ? 'bg-green-500' : 'bg-orange-500'
                              }`}></span>
                              <span className={`text-xs font-bold uppercase tracking-wider ${
                                pay.status === 'SUCCESS' ? 'text-green-700' : 'text-orange-700'
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
            {studentPayments.length === 0 && (
              <div className="p-12 text-center text-slate-400 font-medium">
                <div className="text-4xl mb-2">💸</div>
                No payment records found.
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center">
              <span className="mr-2">💡</span> Official Payment Info
            </h3>
            <div className="space-y-4">
              <p className="text-xs text-slate-500 leading-relaxed">
                Parents are requested to pay fees online via UPI to the number below. Transaction details are updated within 24 hours of approval.
              </p>
              <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
                <div className="text-[10px] font-black text-indigo-400 uppercase mb-1 tracking-widest">Official UPI Phone</div>
                <div className="text-lg font-black text-indigo-900 tracking-tight">+91 93043 04189</div>
                <div className="text-[10px] text-indigo-500 mt-1 font-bold italic">Account: Raghubir Classes</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl text-xs font-bold text-slate-800 flex justify-between">
                <span className="text-slate-400 uppercase">Support:</span>
                <span>+91 84093 13191</span>
              </div>
            </div>
          </div>

          {/* Teacher-only summary, or student personal summary */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200">
            {isTeacher ? (
              <>
                <h3 className="text-sm font-bold text-slate-600 mb-3">Pending Dues Summary</h3>
                <div className="space-y-2">
                  {delinquentStudents.slice(0, 3).map(s => (
                    <div key={s.id} className="flex justify-between items-center text-xs">
                      <span className="text-slate-500 truncate mr-2">{s.name}</span>
                      <span className="text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded flex-shrink-0">₹5,000 Due</span>
                    </div>
                  ))}
                  {delinquentStudents.length === 0 && (
                    <p className="text-[10px] text-green-600 font-bold">All clear! No pending dues.</p>
                  )}
                  {delinquentStudents.length > 0 && (
                    <button 
                      onClick={() => setShowDelinquentModal(true)}
                      className="w-full mt-4 text-[10px] font-bold text-indigo-600 hover:underline uppercase tracking-widest"
                    >
                      View All {delinquentStudents.length} Delinquent Students
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h3 className="text-sm font-bold text-slate-600 mb-3">Next Due Date</h3>
                <div className="p-4 bg-white rounded-2xl border border-slate-100">
                   <p className="text-lg font-black text-slate-800">Dec 01, 2023</p>
                   <p className="text-xs text-slate-400 mt-1 font-medium">December Cycle Fees: ₹5,000</p>
                </div>
                <button 
                  onClick={() => setShowCheckout(true)}
                  className="w-full mt-4 py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-indigo-100 transform active:scale-95"
                >
                  Pay Now
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {showCheckout && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up">
            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-slate-900">Secure Checkout</h2>
                <p className="text-sm text-slate-500">Invoice #RCC-{Date.now().toString().slice(-6)}</p>
              </div>
              <button 
                onClick={() => setShowCheckout(false)}
                className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-200 transition-colors"
              >✕</button>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="bg-slate-50 rounded-2xl p-6 space-y-3 border border-slate-100">
                <div className="flex justify-between font-bold text-slate-800">
                  <span>Tuition Fees ({new Date().toLocaleString('default', { month: 'long' })})</span>
                  <span>₹5,000.00</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between text-xl font-black text-slate-900">
                  <span>Payable Total</span>
                  <span>₹5,000.00</span>
                </div>
              </div>
              
              <div className="space-y-4">
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Payment Method</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setPaymentMethod('UPI')}
                    className={`p-6 rounded-3xl border-2 transition-all ${paymentMethod === 'UPI' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl mb-1 block">📱</span>
                    <span className="text-sm font-bold">UPI</span>
                  </button>
                  <button 
                    onClick={() => setPaymentMethod('NET')}
                    className={`p-6 rounded-3xl border-2 transition-all ${paymentMethod === 'NET' ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-slate-100 hover:border-slate-200'}`}
                  >
                    <span className="text-2xl mb-1 block">🏦</span>
                    <span className="text-sm font-bold">Net Bank</span>
                  </button>
                </div>
              </div>

              {paymentMethod === 'UPI' && (
                <div className="bg-green-50 p-5 rounded-2xl border border-green-100 text-center animate-fade-in">
                  <p className="text-[10px] font-black text-green-700 mb-1 uppercase tracking-widest">Pay via PhonePe / GPay</p>
                  <p className="text-2xl font-black text-green-900 tracking-tight">+91 93043 04189</p>
                  <p className="text-[10px] text-green-600 mt-2 italic">Confirm after you complete the transfer</p>
                </div>
              )}

              <button 
                onClick={handlePay}
                disabled={paying}
                className="w-full py-5 rounded-2xl font-black text-lg bg-indigo-600 text-white hover:bg-indigo-700 shadow-xl disabled:bg-slate-100 transition-all active:scale-95 flex items-center justify-center"
              >
                {paying ? (
                   <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Authorizing...
                   </span>
                ) : 'Confirm Payment ✓'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delinquent Students Modal - Only for Teachers */}
      {isTeacher && showDelinquentModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-lg z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-slate-100 animate-scale-up flex flex-col h-[80vh]">
            <div className="p-8 bg-slate-50/50 border-b flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-black text-slate-900 tracking-tighter">Delinquent Students</h2>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mt-1">{delinquentStudents.length} Students Pending Fees</p>
              </div>
              <button 
                onClick={() => setShowDelinquentModal(false)}
                className="w-12 h-12 flex items-center justify-center rounded-full bg-white shadow-sm border border-slate-200 hover:bg-slate-50 transition-colors"
              >✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {delinquentStudents.map(student => (
                <div key={student.id} className="group bg-slate-50/50 hover:bg-white p-6 rounded-3xl border border-transparent hover:border-slate-200 transition-all flex items-center justify-between shadow-sm hover:shadow-xl">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-red-100 text-red-600 rounded-2xl flex items-center justify-center text-xl font-black">
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-black text-slate-800 text-lg">{student.name}</h4>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Batch {student.batch} • Class {student.class}</p>
                      <div className="mt-1 flex gap-2">
                        <span className="px-2 py-0.5 bg-red-50 text-red-600 text-[10px] font-black rounded-lg uppercase">₹5,000 Pending</span>
                        {payments.some(p => p.studentId === student.id && p.status === 'PENDING') && (
                          <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[10px] font-black rounded-lg uppercase">Waiting Approval</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <button 
                      onClick={() => navigate('/messages')}
                      className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-xl shadow-sm border border-slate-100 hover:bg-indigo-600 hover:text-white transition-all transform active:scale-90"
                      title="Send Reminder"
                    >💬</button>
                    <a 
                      href={`tel:${student.mobile}`}
                      className="w-12 h-12 flex items-center justify-center bg-white rounded-2xl text-xl shadow-sm border border-slate-100 hover:bg-green-600 hover:text-white transition-all transform active:scale-90"
                      title="Call Parent"
                    >📞</a>
                  </div>
                </div>
              ))}

              {delinquentStudents.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full py-12 text-center">
                  <div className="text-6xl mb-4">🏆</div>
                  <h3 className="text-xl font-black text-slate-800">Perfect Record!</h3>
                  <p className="text-slate-500 max-w-xs mx-auto">All students have cleared their dues for the current cycle.</p>
                </div>
              )}
            </div>

            <div className="p-8 bg-slate-50/50 border-t flex items-center justify-between">
              <p className="text-xs text-slate-400 font-bold italic">Total estimated pending: ₹{(delinquentStudents.length * 5000).toLocaleString()}</p>
              <button 
                className="px-6 py-2 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 transition-all shadow-lg"
                onClick={() => {
                  alert("Bulk SMS Reminders feature coming soon!");
                }}
              >
                Bulk Remind ⚡
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
