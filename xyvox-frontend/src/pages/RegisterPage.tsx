import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../api/axios';
import { Lock, Mail, Loader2, UserPlus, Terminal } from 'lucide-react';

export const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPass, setConfirmPass] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (password !== confirmPass) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password is too short (min 6 chars)");
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
        if (!emailRegex.test(email)) {
            setError("Invalid email format (e.g. user@domain.com)");
            return;
        }

        setIsLoading(true);
        try {
            await api.post('/auth/register', { email, password });
            navigate('/login');
        } catch (err: any) {
            if (err.response && err.response.data) {
                const data = err.response.data;

                if (typeof data === 'string') {
                    setError(data);
                }
                else if (data.message) {
                    setError(data.message);
                }
                else {
                    const firstError = Object.values(data)[0];
                    setError(String(firstError));
                }
            } else {
                setError("Registration failed. Network error.");
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b1120] p-4 relative">

            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8 relative z-10">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-500 tracking-wider">XYVOX</h1>
                    <p className="text-slate-500 text-sm mt-2">Create New Account</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">EMAIL</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-all" placeholder="name@company.com" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">PASSWORD</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-all" placeholder="••••••••" required />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">CONFIRM PASSWORD</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input type="password" value={confirmPass} onChange={(e) => setConfirmPass(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 transition-all" placeholder="••••••••" required />
                        </div>
                    </div>

                    {error && <div className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/50">{error}</div>}

                    <button type="submit" disabled={isLoading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50">
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><UserPlus size={18}/> Register</>}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Already have an account? <Link to="/login" className="text-blue-400 hover:underline">Sign In</Link>
                </div>
            </div>

            <div className="absolute bottom-6 w-full text-center opacity-60 hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-slate-500 font-mono mb-1">
                    Not Financial Advice • Use at your own risk
                </p>
                <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-600">
                    <Terminal size={10} />
                    <span>Developed by</span>
                    <a href="https://t.me/novikdanik" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline font-bold">
                        @novikdanik
                    </a>
                </div>
            </div>

        </div>
    );
};