import { TextField, TextInput, ReferenceField, DateField, DateTimeInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { adminUserFilter } from '@shared/components/fields/PermissionFilter';
import { CommonReferenceInputFilter } from '@shared/components/fields/CommonReferenceInputFilter';

const filters = [
    adminUserFilter,
    <CommonReferenceInputFilter source="gameId" reference="game" />,
    <TextInput source="diceOptions:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        {isAdmin && <ReferenceField source="userId" reference="user" />}
        <ReferenceField source="gameId" reference="game" />
        <ReferenceField source="sourceNodeId" reference="node" />
        <ReferenceField source="choiceId" reference="choice" />
        <TextField source="diceOptions" />
        <ReferenceField source="targetNodeId" reference="node" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        {isAdmin && <CommonReferenceInput source="userId" reference="user" />}
        <CommonReferenceInput source="gameId" reference="game" />
        <CommonReferenceInput source="sourceNodeId" reference="node" validate={required()} />
        <CommonReferenceInput source="choiceId" reference="choice" />
        <TextInput source="diceOptions" validate={[maxLength(255)]} />
        <CommonReferenceInput source="targetNodeId" reference="node" validate={required()} />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

const Representation = (record) => String(record.id);

export default getResourceComponents({ Datagrid, Inputs, Representation, filters });
