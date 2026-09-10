import { Link, usePage } from '@inertiajs/react';
import {
    ClipboardList,
    Cog,
    Inbox,
    LayoutGrid,
    Map,
    Package2,
    RadioTower,
    Users,
    Wrench,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { index as usersIndex } from '@/routes/admin/users';
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
        title: 'Gestión de Reclamos',
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
        title: 'Usuarios',
        href: usersIndex(),
        icon: Users,
    },
    {
        title: 'Planificación',
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

export function AppSidebar() {
    const { auth } = usePage().props;
    const features = usePage().props.features as
        { routePlanning?: boolean } | undefined;
    const canUseComplaintManagement =
        canUseModule(auth.user, 'complaints_management') ||
        auth.user?.role === 'admin' ||
        auth.user?.role === 'operator';
    const canPlanRoutes =
        Boolean(features?.routePlanning) &&
        (canUseModule(auth.user, 'route_planning') ||
            auth.user?.role === 'admin' ||
            auth.user?.role === 'crew');
    const canViewCrewWork =
        canUseModule(auth.user, 'crew_work') ||
        canUseModule(auth.user, 'complaint_operations') ||
        canUseComplaintManagement ||
        auth.user?.role === 'crew';
    const canUseIntakeManagement =
        canUseModule(auth.user, 'intake_management') ||
        auth.user?.role === 'admin' ||
        auth.user?.role === 'operator';
    const canViewIntakeDerivations =
        canUseModule(auth.user, 'intake_department') ||
        auth.user?.role === 'intake_department' ||
        auth.user?.role === 'admin';
    const canConfigureIntakeDerivations =
        canUseModule(auth.user, 'intake_configuration') ||
        auth.user?.role === 'admin';
    const canManageInventory =
        canUseModule(auth.user, 'inventory_management') ||
        auth.user?.role === 'admin';
    const canManageUsers = canUseModule(auth.user, 'user_management');
    const visibleMainNavItems = mainNavItems.filter(
        (item) =>
            (item.title !== 'Gestión de Reclamos' ||
                canUseComplaintManagement) &&
            (item.title !== 'Mesa de Entrada' || canUseIntakeManagement) &&
            (item.title !== 'Config. derivaciones' ||
                canConfigureIntakeDerivations) &&
            (item.title !== 'Inventario' || canManageInventory) &&
            (item.title !== 'Usuarios' || canManageUsers) &&
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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function canUseModule(
    user:
        | {
              role?: string | null;
              module_permissions?: Record<string, boolean> | null;
          }
        | null
        | undefined,
    permission: string,
) {
    return (
        user?.role === 'superadmin' ||
        user?.module_permissions?.[permission] === true
    );
}
