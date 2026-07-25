import { useState } from 'react';
import { useApp, useFilteredPosts } from '@/context/AppContext';
import { DashboardHeader } from '@/components/DashboardHeader';
import { GridView } from '@/components/GridView';
import { CalendarView } from '@/components/CalendarView';
import { KanbanView } from '@/components/KanbanView';
import { PostDetailModal } from '@/components/PostDetailModal';
import { NewPostModal } from '@/components/NewPostModal';
import { GeneratePresentationPanel } from '@/components/GeneratePresentationPanel';
import { AppSidebar } from '@/components/AppSidebar';
import { Link } from 'react-router-dom';
import { Building2 } from 'lucide-react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

const Dashboard = () => {
  const { viewMode, visibleClients: clients } = useApp();
  const [newPostOpen, setNewPostOpen] = useState(false);
  const [defaultDate, setDefaultDate] = useState<string | undefined>();
  const [presentationOpen, setPresentationOpen] = useState(false);

  const handleNewPost = () => {
    setDefaultDate(undefined);
    setNewPostOpen(true);
  };

  const handleNewPostFromCalendar = (date: string) => {
    setDefaultDate(date);
    setNewPostOpen(true);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar onOpenPresentation={() => setPresentationOpen(true)} />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center border-b border-border px-4">
            <SidebarTrigger />
          </header>

          <main className="flex-1 overflow-auto">
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 py-6 space-y-6">
              <DashboardHeader onNewPost={handleNewPost} />

              {/* Clients quick nav */}
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {clients.map(c => (
                  <Link
                    key={c.id}
                    to={`/cliente/${c.id}`}
                    className="flex items-center gap-2 px-3 py-1.5 bg-secondary hover:bg-accent rounded-lg text-sm text-secondary-foreground hover:text-foreground transition-colors shrink-0"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {c.nome}
                  </Link>
                ))}
              </div>

              {/* View */}
              {viewMode === 'grade' && <GridView />}
              {viewMode === 'calendario' && <CalendarView onNewPost={handleNewPostFromCalendar} />}
              {viewMode === 'kanban' && <KanbanView />}
            </div>
          </main>
        </div>
      </div>

      <PostDetailModal />
      <NewPostModal open={newPostOpen} onClose={() => setNewPostOpen(false)} defaultDate={defaultDate} />
      <GeneratePresentationPanel open={presentationOpen} onClose={() => setPresentationOpen(false)} />
    </SidebarProvider>
  );
};

export default Dashboard;
