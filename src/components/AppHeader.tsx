import Link from 'next/link';

export default function AppHeader() {
  return (
    <header className="w-full py-4 px-8 bg-white border-b border-slate-200 flex justify-between items-center shadow-sm">
      <Link href="/" className="flex items-center space-x-2">
        <span className="text-2xl font-black text-blue-600 tracking-tight">Matkim</span>
        <span className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">REA AI Engine</span>
      </Link>
      <nav className="flex items-center gap-4">
        <Link href="/admin" className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          B2B 어드민
        </Link>
        <button className="text-sm font-medium text-slate-600 hover:text-slate-900 transition">
          로그인 / 회원가입
        </button>
      </nav>
    </header>
  );
}
