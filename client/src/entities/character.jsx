import { TextField, TextInput, ReferenceField, DateField, DateTimeInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { adminUserFilter } from '@shared/components/fields/PermissionFilter';
import { CommonReferenceInputFilter } from '@shared/components/fields/CommonReferenceInputFilter';
import { VoiceInput, VoicePreviewField } from './elevenLabsVoice';

const filters = [
    adminUserFilter,
    <CommonReferenceInputFilter source="gameId" reference="game" />,
    <TextInput source="name:$cont" alwaysOn />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        {isAdmin && <ReferenceField source="userId" reference="user" />}
        <ReferenceField source="gameId" reference="game" />
        <TextField source="name" />
        <VoicePreviewField source="voiceId" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        {isAdmin && <CommonReferenceInput source="userId" reference="user" />}
        <CommonReferenceInput source="gameId" reference="game" validate={[required()]} />
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <VoiceInput source="voiceId" label="קול" validate={required()} />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: 'name', filters });
