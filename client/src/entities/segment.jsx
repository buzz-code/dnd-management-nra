import { TextField, TextInput, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';

const filters = [
    <TextInput source="name:$cont" alwaysOn />,
    <TextInput source="title:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <TextField source="name" />
        <TextField source="title" />
        <TextField source="value" />
        <TextField source="filepath" />
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <TextInput source="title" validate={[maxLength(255)]} />
        <TextInput source="value" multiline />
        <TextInput source="filepath" validate={[maxLength(500)]} />
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
