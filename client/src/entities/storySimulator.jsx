import { useState } from 'react';
import { Title, Form, SaveButton } from 'react-admin';
import {
    Alert, Box, Button, Card, CardActions, CardContent, Chip,
    CircularProgress, Divider, LinearProgress, Stack, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { useIsAdmin } from '@shared/utils/permissionsUtil';
import CommonReferenceInput from '@shared/components/fields/CommonReferenceInput';
import { parseStoryExcel } from './storySimulatorParser';
import StorySimulatorGame from './StorySimulatorGame';
import { useStoryUploader } from './storySimulatorUploader';

// ─── Upload stage ─────────────────────────────────────────────────────────────

function SimulatorUpload({ onLoaded }) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setLoading(true);
        setError(null);
        try {
            onLoaded(await parseStoryExcel(file));
        } catch (err) {
            setError(err.message || 'שגיאה בפענוח הקובץ');
        } finally {
            setLoading(false);
        }
    }

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" dir="rtl">
            <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center', p: 4 }}>
                <CardContent>
                    <UploadFileIcon sx={{ fontSize: 64, color: 'primary.main', mb: 2 }} />
                    <Typography variant="h5" gutterBottom>סימולטור סיפור</Typography>
                    <Typography variant="body2" color="text.secondary" mb={3}>
                        בחר קובץ Excel של מפת הסיפור (.xlsx) כדי להתחיל
                    </Typography>
                    {loading ? (
                        <CircularProgress />
                    ) : (
                        <Button variant="contained" size="large" component="label" startIcon={<UploadFileIcon />}>
                            בחר קובץ
                            <input type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
                        </Button>
                    )}
                    {error && <Typography color="error" mt={2} variant="body2">{error}</Typography>}
                </CardContent>
            </Card>
        </Box>
    );
}

// ─── Loaded stage ─────────────────────────────────────────────────────────────

function SimulatorLoaded({ data, onStart, onReset }) {
    const { nodes, segments, startNodeId } = data;
    const startNode = nodes[startNodeId];
    const startSegment = startNode ? segments[startNode.segmentId] : null;
    const storyTitle = startSegment?.title || startNodeId || 'סיפור ללא שם';

    const isAdmin = useIsAdmin();
    const { upload, status, progress, result, error } = useStoryUploader({ nodes, segments, startNodeId });

    function handleUploadSubmit(values) {
        upload({
            storyTitle,
            existingGameId: values.gameId ?? null,
            assignUserId: values.userId ?? null,
        });
    }

    const uploading = status === 'uploading';

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" dir="rtl">
            <Card sx={{ maxWidth: 520, width: '100%', p: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>הקובץ נטען בהצלחה</Typography>
                    {storyTitle && (
                        <Typography variant="h6" color="primary" gutterBottom>{storyTitle}</Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} mb={2}>
                        <Chip label={`${Object.keys(nodes).length} צמתים`} color="primary" />
                        <Chip label={`${Object.keys(segments).length} מקטעים`} color="secondary" />
                    </Stack>
                    {startNodeId && (
                        <Typography variant="body2" color="text.secondary" mb={2}>
                            נקודת כניסה: <strong>{startNodeId}</strong>
                        </Typography>
                    )}

                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>העלאה לשרת</Typography>

                    <Form onSubmit={handleUploadSubmit} defaultValues={{ gameId: null, userId: null }}>
                        <CommonReferenceInput
                            source="gameId"
                            reference="game"
                            label="דרוס משחק קיים (אופציונלי)"
                            helperText="אם תבחר משחק קיים, הנתונים הקיימים שלו יימחקו ויוחלפו"
                            disabled={uploading}
                            fullWidth
                        />
                        {isAdmin && (
                            <CommonReferenceInput
                                source="userId"
                                reference="user"
                                label="שייך למשתמש (מנהל בלבד)"
                                disabled={uploading}
                                fullWidth
                            />
                        )}

                        {uploading && (
                            <Box mt={2}>
                                <Typography variant="body2" gutterBottom>{progress.step}</Typography>
                                <LinearProgress variant="determinate" value={(progress.stepIndex / progress.total) * 100} />
                            </Box>
                        )}
                        {status === 'done' && result && (
                            <Alert severity="success" sx={{ mt: 2 }}>
                                הועלה בהצלחה — {result.counts.nodes} צמתים, {result.counts.segments} מקטעים,{' '}
                                {result.counts.choices} בחירות, {result.counts.rules} חוקי ניתוב (משחק #{result.gameId})
                            </Alert>
                        )}
                        {status === 'error' && (
                            <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>
                        )}

                        <SaveButton
                            label="העלה לשרת"
                            icon={uploading ? <CircularProgress size={18} /> : <CloudUploadIcon />}
                            alwaysEnable
                            disabled={uploading}
                            variant="outlined"
                            color="secondary"
                            sx={{ width: '100%', mt: 2 }}
                        />
                    </Form>
                </CardContent>
                <CardActions sx={{ flexDirection: 'column', gap: 1, px: 2, pb: 2 }}>
                    <Button
                        variant="contained"
                        size="large"
                        fullWidth
                        startIcon={<PlayArrowIcon />}
                        onClick={onStart}
                        disabled={!startNodeId}
                    >
                        התחל משחק
                    </Button>
                    <Button variant="text" fullWidth onClick={onReset} startIcon={<UploadFileIcon />}>
                        טען קובץ אחר
                    </Button>
                </CardActions>
            </Card>
        </Box>
    );
}

// ─── Page root ────────────────────────────────────────────────────────────────

export default function StorySimulatorPage() {
    const [stage, setStage] = useState('upload'); // 'upload' | 'loaded' | 'playing'
    const [data, setData] = useState(null);

    function handleLoaded(parsed) {
        setData(parsed);
        setStage('loaded');
    }

    function handleReset() {
        setData(null);
        setStage('upload');
    }

    return (
        <Box>
            <Title title="סימולטור סיפור" />
            {stage === 'upload' && <SimulatorUpload onLoaded={handleLoaded} />}
            {stage === 'loaded' && <SimulatorLoaded data={data} onStart={() => setStage('playing')} onReset={handleReset} />}
            {stage === 'playing' && (
                <StorySimulatorGame
                    nodes={data.nodes}
                    segments={data.segments}
                    startNodeId={data.startNodeId}
                    onReset={handleReset}
                />
            )}
        </Box>
    );
}
