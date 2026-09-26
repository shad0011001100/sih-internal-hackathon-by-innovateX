import re

file_path = r'D:\Shlok\sih-hackathon-project\frontend\src\features\citizen\DashboardScreen.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Upgrade Hero Banner
content = content.replace(
    'bg-gradient-to-r from-primary/10 via-emerald-500/5 to-primary/5 rounded-3xl p-5 sm:p-6 border border-primary/15 shadow-xs',
    'bg-surface-container-lowest/60 backdrop-blur-2xl rounded-[32px] p-6 sm:p-10 border border-outline-variant/30 shadow-[0_8px_32px_rgba(0,0,0,0.06)]'
)

# 2. Upgrade Top Header (Liquid Glass)
content = content.replace(
    'bg-surface-container-lowest/95 backdrop-blur-md border-b border-outline-variant/30 shadow-xs',
    'bg-surface-container-lowest/70 backdrop-blur-2xl border-b border-outline-variant/20 shadow-sm'
)

# 3. Upgrade Mobile Bottom Nav (Liquid Glass + iOS style)
content = content.replace(
    'bg-surface-container-lowest/95 backdrop-blur-md border-t border-outline-variant/30 px-2 py-1',
    'bg-surface-container-lowest/80 backdrop-blur-2xl border-t border-outline-variant/20 px-4 py-2 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]'
)

# 4. Hide desktop Report CTA on mobile (since we'll add a FAB)
content = content.replace(
    'className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-primary hover:bg-[#294e36] text-on-primary text-xs sm:text-sm font-bold shadow-sm hover:shadow active:scale-95 transition-all cursor-pointer whitespace-nowrap"',
    'className="hidden md:inline-flex items-center gap-1.5 px-5 py-2.5 rounded-2xl bg-primary hover:bg-[#294e36] text-on-primary text-sm font-bold shadow-md hover:shadow-lg active:scale-95 transition-all cursor-pointer whitespace-nowrap"'
)

# 5. Insert Mobile FAB just before the bottom nav
fab_code = '''
            {/* MOBILE FLOATING ACTION BUTTON (FAB) */}
            <button
                onClick={() => navigate('/report')}
                className="md:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-primary text-on-primary rounded-[20px] shadow-[0_8px_24px_rgba(0,100,0,0.25)] flex flex-col items-center justify-center active:scale-90 transition-all cursor-pointer border border-white/10"
            >
                <span className="material-symbols-outlined text-2xl mb-0.5">add</span>
            </button>
'''
if 'MOBILE FLOATING ACTION BUTTON' not in content:
    content = content.replace('{/* 3. MOBILE BOTTOM NAVIGATION (4 Clean Categories) */}', fab_code + '\n            {/* 3. MOBILE BOTTOM NAVIGATION (4 Clean Categories) */}')

# 6. Upgrade Cards
content = content.replace(
    'bg-surface-container-lowest rounded-2xl p-4 sm:p-5 border border-outline-variant/30 shadow-xs',
    'bg-surface-container-lowest/80 backdrop-blur-xl rounded-[24px] p-5 sm:p-6 border border-outline-variant/20 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all'
)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Dashboard UI upgraded.')
