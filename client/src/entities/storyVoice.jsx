import { useState } from 'react';
import { TextField, DateField, ChipField, useDataProvider, useNotify, Button } from 'react-admin';
import DownloadIcon from '@mui/icons-material/Download';
import { CommonDatagrid } from '@shared/components/crudContainers/CommonList';
import { getResourceComponents } from '@shared/components/crudContainers/CommonEntity';
import { handleError } from '@shared/utils/notifyUtil';

const statusColorMap = {
    pending: 'default',
    completed: 'success',
    failed: 'error',
};

const StatusChip = ({ record }) => (
    <ChipField source="status" color={statusColorMap[record?.status] || 'default'} />
);

const DownloadButton = ({ record }) => {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const [loading, setLoading] = useState(false);

    if (!record || record.status !== 'completed') return null;

    const handleClick = (e) => {
        e.stopPropagation();
        setLoading(true);
        dataProvider.actionAndDownload('story_voice', 'download', { id: record.id }, {})
            .catch(handleError(notify))
            .finally(() => setLoading(false));
    };

    return <Button label="הורד" disabled={loading} onClick={handleClick} startIcon={<DownloadIcon />} />;
};

const Datagrid = ({ isAdmin, children, ...props }) => (
    <CommonDatagrid {...props} readonly hasDelete>
        {children}
        {isAdmin && <TextField source="id" />}
        {isAdmin && <TextField source="userId" />}
        <TextField source="name" />
        <StatusChip />
        <TextField source="modelId" />
        <TextField source="errorMessage" />
        <DateField showDate showTime source="createdAt" />
        <DownloadButton />
    </CommonDatagrid>
);

const Representation = (record) => record?.name ?? `#${record?.id}`;

export default getResourceComponents({
    Datagrid,
    Representation,
    exporter: false,
    sort: { field: 'createdAt', order: 'DESC' },
});
