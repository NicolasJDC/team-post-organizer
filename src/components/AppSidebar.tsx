import { Presentation, Settings, LogOut, LayoutDashboard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { NavLink } from '@/components/NavLink';
import { useLocation } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';

interface AppSidebarProps {
  onOpenPresentation?: () => void;
}

export function AppSidebar({ onOpenPresentation }: AppSidebarProps) {
  const { isAdmin, userRole, signOut } = useAuth();
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarContent className="pt-4">
        <div className={`px-4 mb-6 ${collapsed ? 'px-2 text-center' : ''}`}>
          <h1 className="font-display font-bold text-sidebar-primary text-lg leading-tight">
            {collapsed ? 'V' : <>VOID<span className="text-sidebar-foreground"> de Conteúdo</span></>}
          </h1>
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <NavLink to="/" end className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Dashboard</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>

              {onOpenPresentation && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={onOpenPresentation} className="hover:bg-sidebar-accent cursor-pointer">
                    <Presentation className="mr-2 h-4 w-4" />
                    {!collapsed && <span>Apresentação</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isAdmin && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <NavLink to="/configuracoes" className="hover:bg-sidebar-accent" activeClassName="bg-sidebar-accent text-sidebar-primary font-medium">
                      <Settings className="mr-2 h-4 w-4" />
                      {!collapsed && <span>Configurações</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button
          variant="ghost"
          onClick={signOut}
          className={`w-full text-sidebar-foreground hover:text-destructive hover:bg-sidebar-accent ${collapsed ? 'px-2' : 'justify-start'}`}
        >
          <LogOut className="h-4 w-4" />
          {!collapsed && <span className="ml-2">Sair</span>}
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
