import { TextField, TextInput, BooleanField, BooleanInput, required, maxLength } from 'react-admin';
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
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <TextInput source="title" validate={[required(), maxLength(255)]} />
        <BooleanInput source="isActive" />
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
