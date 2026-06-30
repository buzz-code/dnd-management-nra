import { Resource, CustomRoutes } from 'react-admin';
import { Route } from 'react-router-dom';
import { teal, orange } from '@mui/material/colors';

import domainTranslations from 'src/domainTranslations';
import roadmapFeatures from 'src/roadmapFeatures';
import AdminAppShell from '@shared/components/app/AdminAppShell';
import CommonRoutes from '@shared/components/app/CommonRoutes';
import CommonAdminResources from '@shared/components/app/CommonAdminResources';
import CommonSettingsResources from '@shared/components/app/CommonSettingsResources';

import { Dashboard, Layout } from 'src/GeneralLayout';

import { resourceEntityGuesser } from '@shared/components/crudContainers/EntityGuesser';

import game from 'src/entities/game';
import segment from 'src/entities/segment';
import layer from 'src/entities/layer';
import gameNode from 'src/entities/game-node';
import choice from 'src/entities/choice';
import routingRule from 'src/entities/routing-rule';
import storyVoice from 'src/entities/storyVoice';
import StorySimulator from 'src/entities/storySimulator';
import StoryVoiceGenerator from 'src/entities/storyVoiceGenerator';

import phoneCampaign from '@shared/components/common-entities/phone-campaign';
import phoneTemplate from '@shared/components/common-entities/phone-template';

import Settings from 'src/settings/Settings';
import { isPhoneCampaign } from '@shared/utils/permissionsUtil';

import LayersIcon from '@mui/icons-material/Layers';
import AccountTreeIcon from '@mui/icons-material/AccountTree';
import TouchAppIcon from '@mui/icons-material/TouchApp';
import AltRouteIcon from '@mui/icons-material/AltRoute';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import PhoneIcon from '@mui/icons-material/Phone';
import SportsEsportsIcon from '@mui/icons-material/SportsEsports';

const themeOptions = { primary: teal[700], secondary: orange[600] };

const App = () => (
    <AdminAppShell
        title="DnD Management"
        themeOptions={themeOptions}
        domainTranslations={domainTranslations}
        dashboard={Dashboard}
        layout={Layout}
    >
        {(permissions) => (
            <>
                <Resource name="game" {...game} options={{ menuGroup: 'content' }} icon={SportsEsportsIcon} />
                <Resource name="segment" {...segment} options={{ menuGroup: 'content' }} icon={VolumeUpIcon} />
                <Resource name="layer" {...layer} options={{ menuGroup: 'structure' }} icon={LayersIcon} />
                <Resource name="game_node" {...gameNode} options={{ menuGroup: 'structure' }} icon={AccountTreeIcon} />
                <Resource name="choice" {...choice} options={{ menuGroup: 'structure' }} icon={TouchAppIcon} />
                <Resource
                    name="routing_rule"
                    {...routingRule}
                    options={{ menuGroup: 'structure' }}
                    icon={AltRouteIcon}
                />
                <Resource name="story_voice" {...storyVoice} options={{ menuGroup: 'content' }} icon={GraphicEqIcon} />

                {CommonSettingsResources()}
                {isPhoneCampaign(permissions) && (
                    <>
                        <Resource
                            name="phone_template"
                            {...phoneTemplate}
                            options={{ menuGroup: 'phone' }}
                            icon={PhoneIcon}
                        />
                        <Resource
                            name="phone_campaign"
                            {...phoneCampaign}
                            options={{ menuGroup: 'phone' }}
                            icon={PhoneIcon}
                        />
                    </>
                )}
                {CommonAdminResources({ permissions })}

                <CustomRoutes>
                    <Route path="/story-simulator" element={<StorySimulator />} />
                    <Route path="/story-voice" element={<StoryVoiceGenerator />} />
                </CustomRoutes>

                {CommonRoutes({ permissions, roadmapFeatures, settingsPage: <Settings /> })}
            </>
        )}
    </AdminAppShell>
);

export default App;
