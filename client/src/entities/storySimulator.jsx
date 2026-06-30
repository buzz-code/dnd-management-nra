import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Title, Form, SaveButton, TextInput, required, maxLength } from 'react-admin';
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
import { useStoryLoader } from './storySimulatorLoader';

// ─── Start stage ──────────────────────────────────────────────────────────────

function SimulatorStart({ onFileLoaded, onPlay, loading, error }) {
    const [fileLoading, setFileLoading] = useState(false);
    const [fileError, setFileError] = useState(null);

    async function handleFile(e) {
        const file = e.target.files[0];
        if (!file) return;
        setFileLoading(true);
        setFileError(null);
        try {
            onFileLoaded(await parseStoryExcel(file));
        } catch (err) {
            setFileError(err.message || 'שגיאה בפענוח הקובץ');
        } finally {
            setFileLoading(false);
        }
    }

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" dir="rtl">
            <Card sx={{ maxWidth: 480, width: '100%', textAlign: 'center', p: 4 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>סימולטור סיפור</Typography>

                    <Form onSubmit={values => onPlay(values.gameId)} defaultValues={{ gameId: null }}>
                        <CommonReferenceInput
                            source="gameId"
                            reference="game"
                            label="בחר משחק שמור"
                            validate={required()}
                            disabled={loading}
                            fullWidth
                        />
                        <SaveButton
                            label="שחק"
                            icon={loading ? <CircularProgress size={18} /> : <PlayArrowIcon />}
                            disabled={loading}
                            variant="contained"
                            size="large"
                            sx={{ width: '100%' }}
                        />
                        {error && <Alert severity="error" sx={{ mt: 2 }}>{error}</Alert>}
                    </Form>

                    <Divider sx={{ my: 3 }}>או</Divider>

                    <Typography variant="body2" color="text.secondary" mb={2}>
                        בחר קובץ Excel של מפת הסיפור (.xlsx) כדי להעלות סיפור חדש
                    </Typography>
                    {fileLoading ? (
                        <CircularProgress />
                    ) : (
                        <Button variant="outlined" size="large" component="label" startIcon={<UploadFileIcon />}>
                            בחר קובץ
                            <input type="file" accept=".xlsx,.xls" hidden onChange={handleFile} />
                        </Button>
                    )}
                    {fileError && <Typography color="error" mt={2} variant="body2">{fileError}</Typography>}
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
            gameName: values.name,
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

                    <Form onSubmit={handleUploadSubmit} defaultValues={{ name: storyTitle, gameId: null, userId: null }}>
                        <TextInput
                            source="name"
                            label="שם המשחק"
                            validate={[required(), maxLength(255)]}
                            disabled={uploading}
                            fullWidth
                        />
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
    const [stage, setStage] = useState('start'); // 'start' | 'loaded' | 'playing'
    const [data, setData] = useState(null);
    const [searchParams] = useSearchParams();
    const { load, status: loadStatus, error: loadError } = useStoryLoader();

    function handleFileLoaded(parsed) {
        setData(parsed);
        setStage('loaded');
    }

    async function handlePlay(gameId) {
        if (!gameId) return;
        const loaded = await load(gameId).catch(() => null);
        if (loaded) {
            setData(loaded);
            setStage('playing');
        }
    }

    function handleReset() {
        setData(null);
        setStage('start');
    }

    useEffect(() => {
        const gameId = searchParams.get('gameId');
        if (gameId) handlePlay(gameId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <Box>
            <Title title="סימולטור סיפור" />
            {stage === 'start' && (
                <SimulatorStart
                    onFileLoaded={handleFileLoaded}
                    onPlay={handlePlay}
                    loading={loadStatus === 'loading'}
                    error={loadStatus === 'error' ? loadError : null}
                />
            )}
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
