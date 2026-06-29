import { useState } from 'react';
import { Title } from 'react-admin';
import {
    Box, Button, Card, CardActions, CardContent, Chip, CircularProgress,
    Divider, Stack, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { parseStoryExcel } from './storySimulatorParser';
import StorySimulatorGame from './StorySimulatorGame';

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

    return (
        <Box display="flex" alignItems="center" justifyContent="center" minHeight="60vh" dir="rtl">
            <Card sx={{ maxWidth: 480, width: '100%', p: 3 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>הקובץ נטען בהצלחה</Typography>
                    {startSegment?.title && (
                        <Typography variant="h6" color="primary" gutterBottom>{startSegment.title}</Typography>
                    )}
                    <Divider sx={{ my: 2 }} />
                    <Stack direction="row" spacing={1} mb={2}>
                        <Chip label={`${Object.keys(nodes).length} צמתים`} color="primary" />
                        <Chip label={`${Object.keys(segments).length} מקטעים`} color="secondary" />
                    </Stack>
                    {startNodeId && (
                        <Typography variant="body2" color="text.secondary">
                            נקודת כניסה: <strong>{startNodeId}</strong>
                        </Typography>
                    )}
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
