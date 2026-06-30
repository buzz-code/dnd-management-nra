import { MenuItemLink } from 'react-admin';
import HelpIcon from '@mui/icons-material/Help';
import ImportContactsIcon from '@mui/icons-material/ImportContacts';
import CallIcon from '@mui/icons-material/Call';
import MapIcon from '@mui/icons-material/Map';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import SettingsIcon from '@mui/icons-material/Settings';
import LayersIcon from '@mui/icons-material/Layers';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

import BaseLayout from '@shared/components/layout/Layout';
import BaseDashboard from '@shared/components/views/Dashboard';
import { useDashboardItems } from './settings/settingsUtil';

const customMenuItems = [
    <MenuItemLink key="story-simulator" to="/story-simulator" primaryText="סימולטור סיפור" leftIcon={<AutoStoriesIcon />} />,
    <MenuItemLink key="story-voice" to="/story-voice" primaryText="הקראה קולית" leftIcon={<GraphicEqIcon />} />,
    <MenuItemLink key="tutorial" to="/tutorial" primaryText="מדריך למשתמש" leftIcon={<HelpIcon />} />,
    <MenuItemLink key="pages-view" to="/pages-view" primaryText="הסברים נוספים" leftIcon={<ImportContactsIcon />} />,
    <MenuItemLink key="roadmap" to="/roadmap" primaryText="פיתוחים עתידיים" leftIcon={<MapIcon />} />,
    ({ isAdmin }) =>
        isAdmin && (
            <MenuItemLink key="yemot-simulator" to="/yemot-simulator" primaryText="סימולטור" leftIcon={<CallIcon />} />
        ),
    <MenuItemLink key="settings" to="/settings" primaryText="הגדרות משתמש" leftIcon={<SettingsIcon />} />,
];

const menuGroups = [
    { name: 'content', icon: <LayersIcon /> },
    { name: 'structure', icon: <AccountTreeIcon /> },
    { name: 'settings', icon: <SettingsIcon /> },
    { name: 'admin', icon: <AdminPanelSettingsIcon /> },
];

export const Layout = ({ children }) => (
    <BaseLayout customMenuItems={customMenuItems} menuGroups={menuGroups}>
        {children}
    </BaseLayout>
);

export const Dashboard = () => {
    const dashboardItems = useDashboardItems();
    return <BaseDashboard dashboardItems={dashboardItems} />;
};
