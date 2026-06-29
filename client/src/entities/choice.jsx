import { TextField, TextInput, NumberInput, NumberField, ReferenceField, required, number } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';

const filters = [
    <TextInput source="description:$cont" alwaysOn />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <ReferenceField source="gameId" reference="game" />
        <ReferenceField source="nodeId" reference="node" />
        <NumberField source="inputKey" />
        <TextField source="description" />
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <CommonReferenceInput source="gameId" reference="game" />
        <CommonReferenceInput source="nodeId" reference="node" validate={required()} />
        <NumberInput source="inputKey" validate={[required(), number()]} />
        <TextInput source="description" />
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
