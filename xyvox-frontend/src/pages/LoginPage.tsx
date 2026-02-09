import { useState } from 'react';
import {Link, useNavigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/axios';
import {Lock, Mail, Loader2, Terminal} from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/login', { email, password });

            login(response.data.token);

            navigate('/');
        } catch (err: any) {
            console.error(err);
            setError('Invalid email or password');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#0b1120] p-4">
            <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-8">

                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-blue-500 tracking-wider">XYVOX</h1>
                    <p className="text-slate-500 text-sm mt-2">Arbitrage Terminal Access</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* EMAIL INPUT */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">EMAIL</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                                placeholder="name@company.com"
                                required
                            />
                        </div>
                    </div>

                    {/* PASSWORD INPUT */}
                    <div>
                        <label className="block text-xs font-medium text-slate-400 mb-1">PASSWORD</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-5 w-5 text-slate-500" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder-slate-600"
                                placeholder="••••••••"
                                required
                            />
                        </div>
                    </div>

                    {/* ERROR MESSAGE */}
                    {error && (
                        <div className="text-red-400 text-xs text-center bg-red-900/20 py-2 rounded border border-red-900/50">
                            {error}
                        </div>
                    )}

                    {/* SUBMIT BUTTON */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-all flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Sign In'}
                    </button>
                </form>

                <div className="mt-6 text-center text-xs text-slate-500">
                    Don't have an account?
                    <Link to="/register" className="text-blue-400 cursor-pointer hover:underline ml-1">
                        Create Account
                    </Link>
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