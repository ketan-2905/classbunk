import React from 'react';
import Link from 'next/link';
import {
    CheckCircle,
    XCircle,
    AlertTriangle,
    BarChart3,
    Calendar,
    Clock,
    ShieldCheck,
    ChevronRight,
    TrendingUp,
    GraduationCap,
    BookOpen
} from 'lucide-react';

const LandingPage = () => {
    return (
        <div className="min-h-screen bg-void text-foreground selection:bg-accent-sky/30 overflow-x-hidden">

            {/* --- Orbiting/Background Gradients --- */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
                <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-accent-sky/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] bg-accent-blue/10 blur-[140px] rounded-full" />
            </div>

            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24 pb-24">

                {/* --- Hero Section --- */}
                <section className="pt-32 pb-16 flex flex-col items-center text-center space-y-8">
                    <div className="glass-panel px-4 py-1.5 rounded-full text-xs font-medium tracking-widest uppercase text-muted-dim animate-fade-in-up">
                        Deep Glass System v1.0
                    </div>

                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-white max-w-4xl">
                        Never Guess Your <br />
                        <span className="bg-gradient-to-r from-accent-sky to-accent-blue bg-clip-text text-transparent">
                            Attendance Again
                        </span>
                    </h1>

                    <p className="text-lg md:text-xl text-muted-dim max-w-2xl leading-relaxed">
                        Track your lectures, stay above the <span className="text-accent-sky font-semibold">75% rule</span>, and know exactly when it’s safe to bunk — without stress.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 pt-4 w-full sm:w-auto">
                        <Link href="/auth/signup" className="group relative px-8 py-4 bg-white text-black font-semibold rounded-lg hover:bg-gray-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                            Get Started
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        <Link href="/auth/login" className="px-8 py-4 glass-panel text-white font-medium rounded-lg hover:bg-white/10 transition-all active:scale-95 flex items-center justify-center">
                            Check My Attendance
                        </Link>
                    </div>
                </section>

                {/* --- What This App Does --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="space-y-6">
                        <h2 className="text-3xl font-bold text-white">
                            No confusion. <br />
                            <span className="text-muted-dim">No last-minute panic.</span> <br />
                            Just clarity.
                        </h2>
                        <p className="text-muted-dim leading-relaxed">
                            This app helps students track attendance subject-wise, understand their real attendance status, and make smarter decisions about attending or skipping lectures.
                        </p>
                    </div>
                    <div className="glass-panel p-8 rounded-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-accent-sky/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <div className="relative z-10 flex flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <span className="text-muted-dim text-sm uppercase tracking-wider">Advanced Mathematics</span>
                                <span className="text-accent-sky font-bold text-xl">82%</span>
                            </div>
                            <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                                <div className="h-full bg-accent-sky w-[82%]" />
                            </div>
                            <p className="text-xs text-muted-dim">Safe to bunk 2 more lectures</p>
                        </div>
                    </div>
                </section>

                {/* --- Why You Need This --- */}
                <section>
                    <h2 className="text-3xl font-bold text-center mb-12">Why You Need This</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {[
                            { icon: AlertTriangle, color: "text-accent-error", title: "Manual Tracking is Hard", desc: "Attendance rules are strict, but tracking is manual." },
                            { icon: TrendingUp, color: "text-accent-sky", title: "The 75% Trap", desc: "One missed lecture can silently push you below 75%." },
                            { icon: XCircle, color: "text-accent-critical", title: "Hidden Risks", desc: "College portals don't show future risk." },
                            { icon: ShieldCheck, color: "text-accent-blue", title: "Impact Awareness", desc: "Students often bunk without knowing the impact." }
                        ].map((item, i) => (
                            <div key={i} className="glass-panel p-6 rounded-xl hover:bg-white/5 transition-colors duration-300">
                                <item.icon className={`w-8 h-8 ${item.color} mb-4`} />
                                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                                <p className="text-sm text-muted-dim">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- How It Works --- */}
                <section className="relative">
                    <div className="absolute left-4 top-0 bottom-0 w-px bg-border-glass md:left-1/2 md:-ml-px" />
                    <div className="space-y-12">
                        {[
                            { step: "01", title: "Select your branch & division", desc: "Configuration in seconds." },
                            { step: "02", title: "View today's lectures", desc: "Automatically fetched for you." },
                            { step: "03", title: "Mark attended or bunked", desc: "One tap updates everything." },
                            { step: "04", title: "Get real-time insights", desc: "See suggestions before you skip." }
                        ].map((item, i) => (
                            <div key={i} className={`relative flex items-center ${i % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                                <div className="flex-1 hidden md:block" />
                                <div className="absolute left-0 md:left-1/2 md:-ml-4 flex items-center justify-center w-8 h-8 rounded-full bg-bg-void border border-accent-sky text-accent-sky text-xs font-bold z-10">
                                    {item.step}
                                </div>
                                <div className="flex-1 ml-12 md:ml-0 md:px-12">
                                    <div className="glass-panel p-6 rounded-xl hover:border-accent-sky/30 transition-colors">
                                        <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                                        <p className="text-muted-dim">{item.desc}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- Smart Attendance Insights --- */}
                <section className="bg-gradient-to-b from-transparent to-zinc-900/20 rounded-3xl p-8 md:p-16 border border-white/5">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl font-bold mb-4">Smart Attendance Insights</h2>
                        <p className="text-muted-dim">More than just a counter.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { title: "Subject-wise tracking", desc: "Granular control over every course." },
                            { title: "Holiday Handling", desc: "Automatic holiday & exam adjustments." },
                            { title: "Future Prediction", desc: "Coming soon: Predict impact of future leaves." }
                        ].map((card, i) => (
                            <div key={i} className="bg-zinc-900/40 backdrop-blur-md border border-white/5 p-6 rounded-xl text-center">
                                <div className="w-12 h-12 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 text-accent-sky">
                                    <BarChart3 className="w-6 h-6" />
                                </div>
                                <h3 className="text-white font-medium mb-2">{card.title}</h3>
                                <p className="text-sm text-muted-dim">{card.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* --- Built for Real College Life --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div className="order-2 md:order-1 glass-panel p-8 rounded-2xl border-l-4 border-l-accent-blue">
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <Calendar className="text-accent-blue w-6 h-6" />
                                <div>
                                    <h4 className="text-white font-semibold">Matches Your Timetable</h4>
                                    <p className="text-xs text-muted-dim">Syncs with your actual college schedule.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <Clock className="text-accent-blue w-6 h-6" />
                                <div>
                                    <h4 className="text-white font-semibold">Daily Use Design</h4>
                                    <p className="text-xs text-muted-dim">Fast, responsive, and ready for daily check-ins.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2 space-y-6">
                        <h2 className="text-3xl font-bold">Built for Real College Life</h2>
                        <ul className="space-y-3 text-muted-dim">
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-sky" /> Adapts to holidays and changes</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-sky" /> Works for different branches</li>
                            <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-accent-sky" /> Designed for students, by students</li>
                        </ul>
                    </div>
                </section>

                {/* --- What This Is (And Isn't) --- */}
                <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-accent-sky">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <CheckCircle className="text-accent-sky" /> What it is
                        </h3>
                        <ul className="space-y-4 text-muted-dim">
                            <li>A personal attendance tracker</li>
                            <li>A decision-support tool for students</li>
                            <li>A way to reduce academic stress</li>
                        </ul>
                    </div>
                    <div className="glass-panel p-8 rounded-2xl border-t-4 border-t-accent-critical">
                        <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                            <XCircle className="text-accent-critical" /> What it isn't
                        </h3>
                        <ul className="space-y-4 text-muted-dim">
                            <li>Not an official college system</li>
                            <li>Not linked to faculty records</li>
                            <li>Not a magic wand (you still have to attend!)</li>
                        </ul>
                    </div>
                </section>

                {/* --- Final CTA --- */}
                <section className="text-center py-20 relative overflow-hidden rounded-3xl">
                    <div className="absolute inset-0 bg-gradient-to-r from-accent-sky/10 to-accent-blue/10 blur-3xl" />
                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Stop guessing. <br /> Start managing.</h2>
                        <Link href="/auth/signup" className="px-10 py-5 bg-white text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] inline-block">
                            Start Tracking Attendance
                        </Link>
                    </div>
                </section>

                {/* --- Footer --- */}
                <footer className="text-center border-t border-white/5 pt-12">
                    <div className="flex items-center justify-center gap-2 mb-4 text-white font-medium">
                        <GraduationCap className="w-5 h-5" />
                        <span>ClassBunk</span>
                    </div>
                    <p className="text-muted-dim text-sm">
                        Built by students, for students — because attendance shouldn’t be a surprise.
                    </p>
                </footer>

            </main>
        </div>
    );
};

export default LandingPage;
