import { TextField, TextInput, NumberInput, NumberField, ReferenceField, DateField, DateTimeInput, required, number } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { adminUserFilter } from '@shared/components/fields/PermissionFilter';
import { CommonReferenceInputFilter } from '@shared/components/fields/CommonReferenceInputFilter';

const filters = [
    adminUserFilter,
    <CommonReferenceInputFilter source="gameId" reference="game" />,
    <TextInput source="description:$cont" alwaysOn />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        {isAdmin && <ReferenceField source="userId" reference="user" />}
        <ReferenceField source="gameId" reference="game" />
        <ReferenceField source="nodeId" reference="node" />
        <NumberField source="inputKey" />
        <TextField source="description" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        {isAdmin && <CommonReferenceInput source="userId" reference="user" />}
        <CommonReferenceInput source="gameId" reference="game" />
        <CommonReferenceInput source="nodeId" reference="node" validate={required()} />
        <NumberInput source="inputKey" validate={[required(), number()]} />
        <TextInput source="description" />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

const Representation = (record) => `${record.inputKey} - ${record.description || ''}`;

export default getResourceComponents({ Datagrid, Inputs, Representation, filters });
