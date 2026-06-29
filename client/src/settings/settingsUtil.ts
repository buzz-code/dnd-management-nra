import { useGetIdentity } from 'react-admin';

export const useDashboardItems = () => {
    const { identity } = useGetIdentity();
    return getDashboardItems(identity);
};

export function getDashboardItems(identity) {
    return identity?.additionalData?.dashboardItems || getDefaultDashboardItems();
}

export function getDefaultDashboardItems() {
    return [
        {
            resource: 'game',
            icon: 'Assignment',
            title: 'משחקים',
            yearFilterType: 'none',
            filter: {},
        },
        {
            resource: 'segment',
            icon: 'List',
            title: 'קטעי תוכן',
            yearFilterType: 'none',
            filter: {},
        },
        {
            resource: 'layer',
            icon: 'List',
            title: 'שכבות',
            yearFilterType: 'none',
            filter: {},
        },
        {
            resource: 'node',
            icon: 'List',
            title: 'צמתים',
            yearFilterType: 'none',
            filter: {},
        },
        {
            resource: 'choice',
            icon: 'List',
            title: 'בחירות',
            yearFilterType: 'none',
            filter: {},
        },
        {
            resource: 'routing_rule',
            icon: 'List',
            title: 'כללי ניתוב',
            yearFilterType: 'none',
            filter: {},
        },
    ];
}

export const useMaintainanceMessage = () => {
    const { identity } = useGetIdentity();
    return getMaintainanceMessage(identity);
};

export function getMaintainanceMessage(identity) {
    return identity?.additionalData?.maintainanceMessage || '';
}
