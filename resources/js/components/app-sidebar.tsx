import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    ClipboardList,
    Cog,
    FolderGit2,
    Inbox,
    LayoutGrid,
    Map,
    Package2,
    RadioTower,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import {
    dashboard as complaintsDashboard,
    index as complaintsIndex,
} from '@/routes/admin/complaints';
import { planning } from '@/routes/admin/complaints';
import {
    configuration as intakeConfiguration,
    index as intakeIndex,
} from '@/routes/admin/intake';
import { index as inventoryIndex } from '@/routes/admin/inventory';
import { index as crewWorkIndex } from '@/routes/crew/work';
import { index as intakeDepartmentIndex } from '@/routes/intake/department';
import type { NavItem } from '@/types';

const mainNavItems: NavItem[] = [
    {
        title: 'Tablero',
        href: complaintsDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Gestion de Reclamos',
        href: complaintsIndex(),
        icon: ClipboardList,
    },
    {
        title: 'Mesa de Entrada',
        href: intakeIndex(),
        icon: Inbox,
    },
    {
        title: 'Config. derivaciones',
        href: intakeConfiguration(),
        icon: Cog,
    },
    {
        title: 'Inventario',
        href: inventoryIndex(),
        icon: Package2,
    },
    {
        title: 'Planificacion',
        href: planning(),
        icon: Map,
    },
    {
        title: 'Mis trabajos',
        href: crewWorkIndex(),
        icon: Wrench,
    },
    {
        title: 'Mis derivaciones',
        href: intakeDepartmentIndex(),
        icon: RadioTower,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth } = usePage().props;
    const canUseComplaintManagement =
        auth.user?.role === 'admin' || auth.user?.role === 'operator';
    const canPlanRoutes =
        auth.user?.role === 'admin' || auth.user?.role === 'crew';
    const canViewCrewWork = auth.user?.role === 'crew';
    const canViewIntakeDerivations =
        auth.user?.role === 'intake_department' || auth.user?.role === 'admin';
    const canConfigureIntakeDerivations = auth.user?.role === 'admin';
    const canManageInventory = auth.user?.role === 'admin';
    const visibleMainNavItems = mainNavItems.filter(
        (item) =>
            (item.title !== 'Gestion de Reclamos' ||
                canUseComplaintManagement) &&
            (item.title !== 'Mesa de Entrada' || canUseComplaintManagement) &&
            (item.title !== 'Config. derivaciones' ||
                canConfigureIntakeDerivations) &&
            (item.title !== 'Inventario' || canManageInventory) &&
            (item.title !== 'Planificacion' || canPlanRoutes) &&
            (item.title !== 'Mis trabajos' || canViewCrewWork) &&
            (item.title !== 'Mis derivaciones' || canViewIntakeDerivations),
    );

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={visibleMainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
