import { TextField, TextInput, ReferenceField, required, maxLength } from 'react-admin';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { CommonRepresentation } from '@shared/components/CommonRepresentation';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';

const filters = [
    <TextInput source="name:$cont" alwaysOn />,
    <TextInput source="nodeType:$cont" />,
];

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        <ReferenceField source="gameId" reference="game" />
        <TextField source="name" />
        <TextField source="nodeType" />
        <ReferenceField source="layerId" reference="layer" />
        <ReferenceField source="segmentId" reference="segment" />
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        <CommonReferenceInput source="gameId" reference="game" />
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <TextInput source="nodeType" validate={[maxLength(255)]} />
        <CommonReferenceInput source="layerId" reference="layer" />
        <CommonReferenceInput source="segmentId" reference="segment" />
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: CommonRepresentation, filters });
