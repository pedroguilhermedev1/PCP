"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { FileText, Briefcase, Box, Menu, X, DollarSign, Database, Bell, ChevronDown, ChevronRight, LayoutDashboard, PanelLeftClose, PanelLeftOpen, LogOut, Calendar, Building, MessageCircle, Package, Handshake, MessageSquare, BarChart2, ShoppingCart, Target } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useLembretes } from "@/components/lembretes/LembretesContext"
import { useCronogramaNotification } from "@/components/cronograma/CronogramaNotificationContext"
import { motion, AnimatePresence } from "motion/react"

const sidebarItems = [
  {
    type: 'link',
    title: "Dashboard",
    href: "/compras/dashboard",
    icon: <BarChart2 className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
  },
  /* OCULTADO A PEDIDO - FATURAS 1.0
  {
    type: 'group',
    title: "Faturas 1.0",
    icon: <DollarSign className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
    items: [
      {
        title: "Materiais",
        href: "/compras/faturas/materiais",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "Serviços",
        href: "/compras/faturas/servicos",
        icon: <Handshake className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      }
    ]
  },
  */
  {
    type: 'group',
    title: "Faturas 2.0",
    icon: <DollarSign className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
    items: [
      {
        title: "Materiais",
        href: "/compras/faturas-sap/materiais",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "Serviços",
        href: "/compras/faturas-sap/servicos",
        icon: <Handshake className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      }
    ]
  },
  {
    type: 'group',
    title: "Insumos",
    icon: <Package className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
    items: [
      {
        title: "Fortaleza",
        href: "/compras/insumos/fortaleza",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "Jundiaí",
        href: "/compras/insumos/jundiai",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "NSE",
        href: "/compras/insumos/nse",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "COC",
        href: "/compras/insumos/coc",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "PSD",
        href: "/compras/insumos/psd",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
    ]
  },
  {
    type: 'group',
    title: "Fornecedores",
    icon: <Handshake className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
    items: [
      {
        title: "Materiais",
        href: "/compras/fornecedores/materiais",
        icon: <Package className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "Serviços",
        href: "/compras/fornecedores/servicos",
        icon: <Handshake className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      }
    ]
  },
  {
    type: 'group',
    title: "Solicitações",
    icon: <MessageSquare className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
    items: [
      {
        title: "Fortaleza",
        href: "/compras/formularios/fortaleza",
        icon: <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "Jundiaí",
        href: "/compras/formularios/jundiai",
        icon: <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "NSE",
        href: "/compras/formularios/nse",
        icon: <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "COC",
        href: "/compras/formularios/coc",
        icon: <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
      {
        title: "PSD",
        href: "/compras/formularios/psd",
        icon: <MessageSquare className="w-4 h-4 flex-shrink-0" strokeWidth={2.5} />,
      },
    ]
  },
  {
    type: 'link',
    title: "Cronograma",
    href: "/compras/cronograma",
    icon: <Calendar className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
  },
  {
    type: 'link',
    title: "Relatórios",
    href: "/compras/relatorios",
    icon: <FileText className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
  },
  {
    type: 'link',
    title: "Apresentação Semanal",
    href: "/compras/apresentacao-semanal",
    icon: <Target className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
  },
  {
    type: 'link',
    title: "Lembretes",
    href: "/compras/lembretes",
    icon: <Bell className="w-5 h-5 flex-shrink-0" strokeWidth={2.5} />,
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
  "Faturas 1.0": false,
  "Faturas 2.0": false,
  "Insumos": false,
  "Solicitações": false,
  "Fornecedores": false,
})

  useEffect(() => {
  setExpandedGroups({
    "Faturas 1.0": pathname?.startsWith('/compras/faturas') && !pathname?.startsWith('/compras/faturas-sap'),
    "Faturas 2.0": pathname?.startsWith('/compras/faturas-sap') ?? false,
    "Insumos": pathname?.startsWith('/compras/insumos') ?? false,
    "Solicitações": pathname?.startsWith('/compras/formularios') ?? false,
    "Fornecedores": pathname?.startsWith('/compras/fornecedores') ?? false,
  });
  
  if (pathname === '/compras/cronograma') {
    markAllAsSeen();
  }
}, [pathname]);

  const isReportsOnly = currentUser === 'ivna.teixeira';

  const visibleItems = (isAdmin
  ? sidebarItems.filter(item => item.title !== 'Solicitações')
  : isReportsOnly 
    ? sidebarItems.filter(item => item.title === 'Relatórios')
    : sidebarItems.filter(item =>
        item.title === 'Dashboard' || item.title === 'Solicitações' || item.title === 'Cronograma' || item.title === 'Relatórios' || item.title === 'Insumos' || item.title === 'Apresentação Semanal'
      )).map(item => {
        if (!isAdmin && currentUser?.endsWith('.arco') && item.type === 'group' && item.items) {
           const userCd = currentUser.split('.')[0].toLowerCase();
           const filteredItems = item.items.filter(subItem => {
              const subTitleNormalized = subItem.title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
              return subTitleNormalized === userCd;
           });
           return { ...item, items: filteredItems };
        }
        return item;
      });

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
          <ShoppingCart className="w-6 h-6 text-purple-800 flex-shrink-0" strokeWidth={2.5} />
          <span>PCP Hub</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="p-2 -mr-2 text-zinc-600">
          <Menu className="w-6 h-6" />
        </button>
      </div>

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 border-r border-zinc-200 bg-white flex-shrink-0 flex flex-col transition-all duration-300 md:relative md:translate-x-0 hidden md:flex",
        isOpen ? "translate-x-0 !flex w-64" : "-translate-x-full",
        !isOpen && isCollapsed ? "md:w-20" : (!isOpen ? "md:w-64" : "")
      )}>
        <div className="h-16 flex items-center justify-between px-6 border-b border-zinc-100 overflow-hidden">
          {!isCollapsed && (
            <Link href="/" className="flex items-center gap-2 font-bold text-purple-900 overflow-hidden transition-all justify-start">
              <ShoppingCart className="w-6 h-6 text-purple-800 flex-shrink-0" strokeWidth={2.5} />
              <span className="whitespace-nowrap text-sm">PCP Hub</span>
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
                      "w-full flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium tracking-wide transition-all overflow-hidden",
                      isCollapsed ? "justify-center" : "justify-between",
                      isActive
                        ? "text-purple-700 bg-purple-50/80 font-semibold shadow-sm border border-purple-100/50"
                        : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      {group.icon}
                      {!isCollapsed && <span className="whitespace-nowrap">{group.title}</span>}
                    </div>
                    {group.title === 'Lembretes' && badgeCount > 0 && (
                      <div className={cn("bg-red-500 text-white font-bold rounded-full flex items-center justify-center flex-shrink-0 text-[10px]", isCollapsed ? "absolute top-1 right-2 w-4 h-4" : "px-2 py-0.5")}>
                        {badgeCount}
                      </div>
                    )}
                    {group.title === 'Cronograma' && unseenCount > 0 && (
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
                  className={cn("w-full flex items-center px-3 py-2.5 rounded-lg text-[13px] font-medium text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50 transition-all tracking-wide overflow-hidden", isCollapsed ? "justify-center" : "justify-between")}
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
                                "flex items-center px-3 py-2 rounded-lg text-[13px] font-medium transition-all overflow-hidden",
                                isCollapsed ? "justify-center pl-0 ml-[-20px]" : "justify-start gap-2.5",
                                isActive
                                  ? "bg-purple-50/80 text-purple-700 font-semibold shadow-sm border border-purple-100/50"
                                  : "text-zinc-500 hover:bg-zinc-50 hover:text-zinc-900"
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

        <div className="p-4 border-t border-zinc-100 flex flex-col gap-2">
          <button 
            onClick={() => {
              localStorage.removeItem('pcp_user');
              router.push('/login');
            }}
            title={isCollapsed ? "Sair" : undefined}
            className={cn("w-full flex items-center px-3 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-zinc-600 rounded-lg text-[13px] font-medium transition-all cursor-pointer border border-zinc-200/50", isCollapsed ? "justify-center" : "justify-center gap-2")}
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
