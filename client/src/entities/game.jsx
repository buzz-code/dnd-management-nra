import { TextField, TextInput, BooleanField, BooleanInput, DateField, DateTimeInput, ReferenceField, Button, useRecordContext, required, maxLength } from 'react-admin';
import { Link } from 'react-router-dom';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { adminUserFilter } from '@shared/components/fields/PermissionFilter';

const filters = [
    adminUserFilter,
    <TextInput source="name:$cont" alwaysOn />,
];

const PlayGameButton = () => {
    const record = useRecordContext();
    if (!record) return null;
    return (
        <Button
            label="שחק"
            startIcon={<PlayArrowIcon />}
            component={Link}
            to={{ pathname: '/story-simulator', search: `gameId=${record.id}` }}
            onClick={e => e.stopPropagation()}
        />
    );
};

const Datagrid = ({ isAdmin, ...props }) => (
    <CommonDatagrid {...props}>
        {isAdmin && <TextField source="id" />}
        {isAdmin && <ReferenceField source="userId" reference="user" />}
        <TextField source="name" />
        <BooleanField source="isActive" />
        {isAdmin && <DateField showDate showTime source="createdAt" />}
        {isAdmin && <DateField showDate showTime source="updatedAt" />}
        <PlayGameButton />
    </CommonDatagrid>
);

const Inputs = ({ isCreate, isAdmin }) => (
    <>
        {isAdmin && <CommonReferenceInput source="userId" reference="user" />}
        <TextInput source="name" validate={[required(), maxLength(255)]} />
        <BooleanInput source="isActive" />
        {!isCreate && isAdmin && <DateTimeInput source="createdAt" disabled />}
        {!isCreate && isAdmin && <DateTimeInput source="updatedAt" disabled />}
    </>
);

export default getResourceComponents({ Datagrid, Inputs, Representation: 'name', filters });
