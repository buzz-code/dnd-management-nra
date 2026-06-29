import { TextField, TextInput, BooleanField, BooleanInput, DateField, DateTimeInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';

const filters = [
    <TextInput source="title:$cont" alwaysOn />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <TextField source="title" />
        <BooleanField source="isActive" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <TextInput source="title" validate={[required(), maxLength(255)]} />
        <BooleanInput source="isActive" />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
