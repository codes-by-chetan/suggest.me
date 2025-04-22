import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { sidebarData } from './data/sidebar-data'
import { TeamSwitcher } from './team-switcher'
import { ThemeSwitch } from '../theme-switch'

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible='icon' variant='floating' {...props} >
      <SidebarHeader className=' '>
        {/* <SidebarTrigger> </SidebarTrigger>
         */}
        <TeamSwitcher teams={sidebarData.teams} />
        
      </SidebarHeader>
      <SidebarContent className=' '>
        {sidebarData.navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
        <div className='w-full flex items-center justify-center'><ThemeSwitch/></div>
      </SidebarContent>
      <SidebarFooter className=' '>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
