"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Briefcase, Box, Menu, X, DollarSign, Database, Bell, ChevronDown, ChevronRight, LayoutDashboard, PanelLeftClose, PanelLeftOpen, LogOut, Calendar, Building } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLembretes } from "@/components/lembretes/LembretesContext"
import { useCronogramaNotification } from "@/components/cronograma/CronogramaNotificationContext"
import { motion, AnimatePresence } from "motion/react"

const sidebarItems = [
  {
    type: 'link',
    title: "DASHBOARD",
    href: "/compras/dashboard",
    icon: <LayoutDashboard className="w-5 h-5 flex-shrink-0" />,
  },
  {
    type: 'group',
    title: "FATURAS",
    icon: <DollarSign className="w-5 h-5 flex-shrink-0" />,
    items: [
      {
        title: "Materiais",
        href: "/compras/faturas/materiais",
        icon: <Box className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "Serviços",
        href: "/compras/faturas/servicos",
        icon: <Briefcase className="w-4 h-4 flex-shrink-0" />,
      }
    ]
  },
  {
    type: 'group',
    title: "INSUMOS",
    icon: <Box className="w-5 h-5 flex-shrink-0" />,
    items: [
      {
        title: "Fortaleza",
        href: "/compras/insumos/fortaleza",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "Jundiaí",
        href: "/compras/insumos/jundiai",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "NSE",
        href: "/compras/insumos/nse",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
    ]
  },
  {
    type: 'group',
    title: "FORNECEDORES",
    icon: <Briefcase className="w-5 h-5 flex-shrink-0" />,
    items: [
      {
        title: "Materiais",
        href: "/compras/fornecedores/materiais",
        icon: <Box className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "Serviços",
        href: "/compras/fornecedores/servicos",
        icon: <Briefcase className="w-4 h-4 flex-shrink-0" />,
      }
    ]
  },
  {
    type: 'group',
    title: "FORMULÁRIOS",
    icon: <FileText className="w-5 h-5 flex-shrink-0" />,
    items: [
      {
        title: "Fortaleza",
        href: "/compras/formularios/fortaleza",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "Jundiaí",
        href: "/compras/formularios/jundiai",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
      {
        title: "NSE",
        href: "/compras/formularios/nse",
        icon: <FileText className="w-4 h-4 flex-shrink-0" />,
      },
    ]
  },
  {
    type: 'link',
    title: "CRONOGRAMA",
    href: "/compras/cronograma",
    icon: <Calendar className="w-5 h-5 flex-shrink-0" />,
  },
  {
    type: 'link',
    title: "RELATÓRIOS",
    href: "/compras/relatorios",
    icon: <Database className="w-5 h-5 flex-shrink-0" />,
  },
  {
    type: 'link',
    title: "LEMBRETES",
    href: "/compras/lembretes",
    icon: <Bell className="w-5 h-5 flex-shrink-0" />,
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const { pendingNotifiedLembretes, forceRender } = useLembretes()
  const badgeCount = pendingNotifiedLembretes.length
  const { unseenCount, markAllAsSeen } = useCronogramaNotification()

  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    setCurrentUser(localStorage.getItem('pcp_user'));
  }, []);

  const isAdmin = [
    'pedro.queiroz',
    'debora.mota',
    'francisco.edson'
  ].includes(currentUser || '')

  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
  FATURAS: false,
  INSUMOS: false,
  FORMULÁRIOS: false,
  FORNECEDORES: false,
})

  useEffect(() => {
  setExpandedGroups({
    FATURAS: pathname?.startsWith('/compras/faturas') ?? false,
    INSUMOS: pathname?.startsWith('/compras/insumos') ?? false,
    FORMULÁRIOS: pathname?.startsWith('/compras/formularios') ?? false,
    FORNECEDORES: pathname?.startsWith('/compras/fornecedores') ?? false,
  });
  
  if (pathname === '/compras/cronograma') {
    markAllAsSeen();
  }
}, [pathname]);

  const visibleItems = isAdmin
  ? sidebarItems
  : sidebarItems.filter(item =>
      item.title === 'DASHBOARD' || item.title === 'FORMULÁRIOS' || item.title === 'CRONOGRAMA'
    )

  useEffect(() => {
    const saved = localStorage.getItem('sidebar_collapsed');
    if (saved === 'true') {
      setIsCollapsed(true);
    }
  }, []);

  const toggleSidebarCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem('sidebar_collapsed', next.toString());
  };

  const toggleGroup = (title: string) => {
    if (isCollapsed) {
      // Auto expand if user interacts with group icon while collapsed
      setIsCollapsed(false);
      localStorage.setItem('sidebar_collapsed', 'false');
      setExpandedGroups(prev => ({ ...prev, [title]: true }));
    } else {
      setExpandedGroups(prev => ({ ...prev, [title]: !prev[title] }));
    }
  }

  // Add dummy effect just to ensure re-render occurs when forceRender changes
  useEffect(() => {}, [forceRender])

  return (
    <>
      <div className="md:hidden flex flex-row items-center justify-between p-4 border-b border-zinc-200 bg-zinc-50 flex-shrink-0">
        <Link href="/" className="flex items-center gap-2 font-bold text-purple-900">
          <Building className="w-5 h-5 text-purple-800 flex-shrink-0" />
          <span>PCP Compras</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-zinc-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 border-r border-zinc-200 bg-zinc-50 flex-shrink-0 flex flex-col transition-all duration-300 md:relative md:translate-x-0 hidden md:flex",
        isOpen ? "translate-x-0 !flex w-64" : "-translate-x-full",
        !isOpen && isCollapsed ? "md:w-20" : (!isOpen ? "md:w-64" : "")
      )}>
        <div className="h-14 flex items-center justify-between px-4 border-b border-zinc-200 overflow-hidden">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-bold text-purple-900 overflow-hidden transition-all justify-start">
              <Building className="w-5 h-5 text-purple-800 flex-shrink-0" />
              <span className="whitespace-nowrap text-sm">PCP Compras</span>
            </Link>
          )}
          
          <button 
            onClick={toggleSidebarCollapse}
            title={isCollapsed ? "Expandir menu" : "Recolher menu"}
            className={cn(
              "hidden md:flex p-1.5 rounded-md transition-colors hover:bg-purple-100 text-purple-700 items-center justify-center",
              isCollapsed ? "w-full" : ""
            )}
          >
            {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <X className="w-5 h-5" />}
          </button>

          <button className="md:hidden p-2 -mr-2 text-zinc-600" onClick={() => setIsOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-3 flex-1 overflow-y-auto overflow-x-hidden">
          {visibleItems.map((group, i) => {
            if (group.type === 'link') {
              const isActive = pathname === group.href;
              return (
                <div key={i} className="mb-4">
                  <Link
                    href={group.href!}
                    onClick={() => setIsOpen(false)}
                    title={isCollapsed ? group.title : undefined}
                    className={cn(
                      "w-full flex items-center px-2 py-2 rounded-md text-sm font-medium tracking-wide uppercase transition-colors overflow-hidden",
                      isCollapsed ? "justify-center" : "justify-between",
                      isActive
                        ? "text-purple-900 bg-purple-200"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {group.icon}
                      {!isCollapsed && <span className="whitespace-nowrap">{group.title}</span>}
                    </div>
                    {group.title === 'LEMBRETES' && badgeCount > 0 && (
                      <div className={cn("bg-red-500 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[10px]", isCollapsed ? "absolute top-1 right-2 w-4 h-4" : "px-2 py-0.5")}>
                        {badgeCount}
                      </div>
                    )}
                    {group.title === 'CRONOGRAMA' && unseenCount > 0 && (
                      <div className={cn("bg-red-500 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[10px]", isCollapsed ? "absolute top-1 right-2 w-4 h-4" : "px-2 py-0.5")}>
                        {unseenCount}
                      </div>
                    )}
                  </Link>
                </div>
              );
            }

            const isExpanded = !!expandedGroups[group.title] && !isCollapsed;
            return (
              <div key={i} className="mb-4">
                <button 
                  onClick={() => toggleGroup(group.title)}
                  title={isCollapsed ? group.title : undefined}
                  className={cn("w-full flex items-center px-2 py-2 rounded-md text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100/50 transition-colors tracking-wide uppercase overflow-hidden", isCollapsed ? "justify-center" : "justify-between")}
                >
                  <div className="flex items-center gap-3">
                    {group.icon}
                    {!isCollapsed && <span className="whitespace-nowrap">{group.title}</span>}
                  </div>
                  {!isCollapsed && (
                    isExpanded ? <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" /> : <ChevronRight className="w-4 h-4 opacity-50 flex-shrink-0" />
                  )}
                </button>
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-1 pl-6 mt-1 border-l-2 border-zinc-100 ml-4">
                        {group.items?.map((item, j) => {
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={j}
                              href={item.href}
                              onClick={() => setIsOpen(false)}
                              title={item.title}
                              className={cn(
                                "flex items-center px-2 py-1.5 rounded-md text-sm font-medium transition-colors overflow-hidden",
                                isCollapsed ? "justify-center pl-0 ml-[-20px]" : "justify-start gap-2",
                                isActive
                                  ? "bg-purple-200 text-purple-900 font-semibold"
                                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                              )}
                            >
                              <div className="flex items-center gap-2">
                                {isCollapsed ? <span className="font-bold text-[10px]">{item.title.substring(0,2)}</span> : item.icon}
                                {!isCollapsed && <span className="whitespace-nowrap">{item.title}</span>}
                              </div>
                            </Link>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="p-3 border-t border-zinc-200 flex flex-col gap-2">
          <button 
            onClick={() => {
              localStorage.removeItem('pcp_user');
              router.push('/login');
            }}
            title={isCollapsed ? "Sair" : undefined}
            className={cn("w-full flex items-center px-2 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-md text-sm font-medium transition-colors cursor-pointer", isCollapsed ? "justify-center" : "justify-center gap-2")}
          >
            {isCollapsed ? <LogOut className="w-5 h-5 text-zinc-600 flex-shrink-0" /> : <div className="flex items-center gap-2 w-full justify-center"><LogOut className="w-4 h-4 flex-shrink-0" /> <span>Sair</span></div>}
          </button>
        </div>
      </aside>
      
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden" 
          onClick={() => setIsOpen(false)} 
        />
      )}
    </>
  )
}
