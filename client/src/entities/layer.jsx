import { TextField, TextInput, DateField, DateTimeInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';

const filters = [
    <TextInput source="name:$cont" alwaysOn />,
    <TextInput source="layerType:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <TextField source="name" />
        <TextField source="layerType" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <TextInput source="layerType" validate={[maxLength(255)]} />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
