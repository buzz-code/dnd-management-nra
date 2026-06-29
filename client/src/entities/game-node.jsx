import { TextField, TextInput, ReferenceField, DateField, DateTimeInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { adminUserFilter } from '@shared/components/fields/PermissionFilter';
import { CommonReferenceInputFilter } from '@shared/components/fields/CommonReferenceInputFilter';

const filters = [
    adminUserFilter,
    <CommonReferenceInputFilter source="gameId" reference="game" />,
    <TextInput source="name:$cont" alwaysOn />,
    <TextInput source="nodeType:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        {isAdmin && <ReferenceField source="userId" reference="user" />}
        <ReferenceField source="gameId" reference="game" />
        <TextField source="name" />
        <TextField source="nodeType" />
        <ReferenceField source="layerId" reference="layer" />
        <ReferenceField source="segmentId" reference="segment" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        {isAdmin && <CommonReferenceInput source="userId" reference="user" />}
        <CommonReferenceInput source="gameId" reference="game" />
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <TextInput source="nodeType" validate={[maxLength(255)]} />
        <CommonReferenceInput source="layerId" reference="layer" />
        <CommonReferenceInput source="segmentId" reference="segment" />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
