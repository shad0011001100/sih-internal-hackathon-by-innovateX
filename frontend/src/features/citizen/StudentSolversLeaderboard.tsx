
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function StudentSolversLeaderboard() {
    const navigate = useNavigate();

    const leaderboard = [
        { id: 1, rank: 1, name: "BIT Mesra", points: 850, activeProjects: 12, resolved: 45, badge: "Gold Innovator" },
        { id: 2, rank: 2, name: "NIT Jamshedpur", points: 720, activeProjects: 8, resolved: 32, badge: "Silver Innovator" },
        { id: 3, rank: 3, name: "IIM Ranchi", points: 640, activeProjects: 5, resolved: 28, badge: "Bronze Innovator" },
        { id: 4, rank: 4, name: "Ranchi University", points: 410, activeProjects: 4, resolved: 15, badge: "Rising Star" },
        { id: 5, rank: 5, name: "IIT (ISM) Dhanbad", points: 390, activeProjects: 3, resolved: 12, badge: "Contributor" }
    ];

    const activeProjects = [
        { title: "IoT Handpump Telemetry", team: "Team AquaTech", uni: "BIT Mesra", status: "Prototype Deployed", icon: "water_drop" },
        { title: "AI Drainage Desiltation Route", team: "GreenCity", uni: "Ranchi Univ", status: "In Testing", icon: "cleaning_services" },
        { title: "Municipal SLA Bottleneck Audit", team: "Civic Lab", uni: "IIM Ranchi", status: "Policy Sign-off", icon: "policy" }
    ];

    return (
        <div className="min-h-screen bg-background font-sans flex flex-col">
            <header className="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30 px-4 sm:px-8 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface-variant cursor-pointer">
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-on-surface">Student Solvers Leaderboard</h1>
                        <p className="text-xs text-on-surface-variant">Top collegiate engineering teams solving Jharkhand's civic issues</p>
                    </div>
                </div>
                <button onClick={() => navigate('/dashboard')} className="px-4 py-2 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                    Dashboard
                </button>
            </header>

            <main className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-8 space-y-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-primary/10 via-surface-container-lowest to-secondary/10 rounded-3xl p-6 sm:p-10 border border-primary/20 flex flex-col sm:flex-row items-center gap-8 shadow-sm">
                    <div className="flex-1 space-y-4">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold uppercase tracking-wider">
                            <span className="material-symbols-outlined text-[16px]">school</span>
                            Jharkhand Civic Tech Fellowship
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-on-surface leading-tight">Empowering Youth to Build <span className="text-primary">Smarter Cities</span></h2>
                        <p className="text-on-surface-variant text-sm sm:text-base leading-relaxed max-w-xl">
                            University chapters adopt real civic grievances reported by citizens, building IoT, AI, and policy solutions directly for municipal deployment.
                        </p>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-4">
                        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-amber-500">trophy</span>
                            University Leaderboard
                        </h3>
                        
                        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 overflow-hidden shadow-xs">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-surface-container/50">
                                    <tr>
                                        <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">Rank</th>
                                        <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider">University</th>
                                        <th className="py-3 px-4 text-xs font-bold text-on-surface-variant uppercase tracking-wider text-right">Points</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leaderboard.map((item, i) => (
                                        <motion.tr initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} key={item.id} className="border-b border-outline-variant/20 hover:bg-surface-container-low transition-colors">
                                            <td className="py-4 px-4">
                                                <div className={"w-8 h-8 rounded-full flex items-center justify-center font-black text-sm " + (item.rank === 1 ? "bg-amber-100 text-amber-700" : "bg-surface-container")}>
                                                    {item.rank}
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-bold text-on-surface">{item.name}</p>
                                                <p className="text-[11px] text-primary">{item.badge}</p>
                                            </td>
                                            <td className="py-4 px-4 text-right">
                                                <p className="font-black text-on-surface text-lg">{item.points}</p>
                                                <p className="text-[10px] text-on-surface-variant uppercase">{item.resolved} solved</p>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-primary">rocket_launch</span>
                            Live Prototypes
                        </h3>
                        <div className="space-y-3">
                            {activeProjects.map((proj, idx) => (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: idx * 0.15 }} key={idx} className="bg-surface-container-lowest p-4 rounded-2xl border border-outline-variant/30">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                            <span className="material-symbols-outlined">{proj.icon}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-on-surface text-sm">{proj.title}</h4>
                                            <p className="text-xs text-on-surface-variant mt-1">{proj.team} • {proj.uni}</p>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
