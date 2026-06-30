import { generalResourceFieldsTranslation } from '@shared/providers/i18nProvider';
import { sharedEntityTranslations } from '@shared/entities/shared-entity.translations';

export default {
    menu_groups: {
        content: 'תוכן',
        structure: 'מבנה',
        phone: 'טלפון',
        settings: 'הגדרות',
        admin: 'ניהול',
    },
    resources: {
        ...sharedEntityTranslations,
        game: {
            name: 'משחק |||| משחקים',
            fields: {
                ...generalResourceFieldsTranslation,
                name: 'שם',
                isActive: 'פעיל',
            },
        },
        segment: {
            name: 'קטע |||| קטעים',
            fields: {
                ...generalResourceFieldsTranslation,
                gameId: 'משחק',
                name: 'שם',
                title: 'תווית',
                value: 'טקסט להקראה',
                filepath: 'נתיב קובץ שמע',
            },
        },
        layer: {
            name: 'שכבה |||| שכבות',
            fields: {
                ...generalResourceFieldsTranslation,
                name: 'שם',
                layerType: 'סוג שכבה',
            },
        },
        game_node: {
            name: 'צומת |||| צמתים',
            fields: {
                ...generalResourceFieldsTranslation,
                gameId: 'משחק',
                name: 'שם',
                nodeType: 'סוג צומת',
                layerId: 'שכבה',
                segmentId: 'קטע',
            },
        },
        choice: {
            name: 'בחירה |||| בחירות',
            fields: {
                ...generalResourceFieldsTranslation,
                gameId: 'משחק',
                nodeId: 'צומת',
                inputKey: 'מקש',
                description: 'תיאור',
            },
        },
        routing_rule: {
            name: 'כלל ניתוב |||| כללי ניתוב',
            fields: {
                ...generalResourceFieldsTranslation,
                gameId: 'משחק',
                sourceNodeId: 'צומת מקור',
                choiceId: 'בחירה',
                diceOptions: 'אפשרויות קובייה',
                targetNodeId: 'צומת יעד',
            },
        },
        story_voice: {
            name: 'הקראה קולית |||| הקראות קוליות',
            fields: {
                ...generalResourceFieldsTranslation,
                name: 'שם',
                modelId: 'מודל',
                status: 'סטטוס',
                errorMessage: 'שגיאה',
            },
        },
        settings: {
            name: 'הגדרות',
            fields: {
                defaultPageSize: 'מספר שורות בטבלה',
                dashboardItems: 'הגדרות לוח מחוונים',
                'dashboardItems.resource': 'מקור נתונים',
                'dashboardItems.resourceHelperText': 'בחר את מקור הנתונים שברצונך להציג',
                'dashboardItems.yearFilterType': 'סוג סינון שנה',
                'dashboardItems.filter': 'פילטר נוסף בפורמט JSON (אופציונלי)',
                'dashboardItems.title': 'כותרת',
                maintainanceMessage: 'הודעה לסגירת המערכת הטלפונית',
            },
        },
    },
};
