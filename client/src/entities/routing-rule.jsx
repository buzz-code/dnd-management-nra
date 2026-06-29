import { TextField, TextInput, ReferenceField, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';

const filters = [
    <TextInput source="diceOptions:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <ReferenceField source="gameId" reference="game" />
        <ReferenceField source="sourceNodeId" reference="node" />
        <ReferenceField source="choiceId" reference="choice" />
        <TextField source="diceOptions" />
        <ReferenceField source="targetNodeId" reference="node" />
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <CommonReferenceInput source="gameId" reference="game" />
        <CommonReferenceInput source="sourceNodeId" reference="node" validate={required()} />
        <CommonReferenceInput source="choiceId" reference="choice" />
        <TextInput source="diceOptions" validate={[maxLength(255)]} />
        <CommonReferenceInput source="targetNodeId" reference="node" validate={required()} />
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
