import { useMemo, useRef, useState } from 'react';
import { Title, useDataProvider, useNotify } from 'react-admin';
import {
    Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider,
    MenuItem, Stack, TextField, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DownloadIcon from '@mui/icons-material/Download';
import { handleError } from '@shared/utils/notifyUtil';
import { ELEVEN_LABS_MODELS, DEFAULT_ELEVEN_LABS_MODEL } from './elevenLabsModels';

function parseSegments(text) {
    const parsed = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.length) {
        throw new Error('הקובץ חייב להכיל מערך JSON לא ריק של מקטעים');
    }
    parsed.forEach((segment, index) => {
        if (!segment.character || !segment.text) {
            throw new Error(`מקטע מספר ${index + 1} חסר שדה character או text`);
        }
    });
    return parsed;
}

export default function StoryVoiceGenerator() {
    const dataProvider = useDataProvider();
    const notify = useNotify();
    const fileInputRef = useRef();

    const [name, setName] = useState('');
    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState(null);
    const [segments, setSegments] = useState(null);
    const [characterVoices, setCharacterVoices] = useState({});
    const [modelId, setModelId] = useState(DEFAULT_ELEVEN_LABS_MODEL);
    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState(null);
    const [downloading, setDownloading] = useState(false);

    const characters = useMemo(
        () => (segments ? [...new Set(segments.map(s => s.character))] : []),
        [segments],
    );

    function handleParse(text) {
        setJsonText(text);
        setResult(null);
        try {
            const parsed = parseSegments(text);
            setSegments(parsed);
            setParseError(null);
            const nextVoices = {};
            [...new Set(parsed.map(s => s.character))].forEach(c => {
                nextVoices[c] = characterVoices[c] ?? '';
            });
            setCharacterVoices(nextVoices);
        } catch (err) {
            setSegments(null);
            setParseError(err.message || 'שגיאה בפענוח ה-JSON');
        }
    }

    function handleFileSelect(e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => handleParse(String(reader.result));
        reader.readAsText(file);
        e.target.value = null;
    }

    const missingVoices = characters.filter(c => !characterVoices[c]);
    const canGenerate = !!name && !!segments && !missingVoices.length && !generating;

    async function handleGenerate() {
        setGenerating(true);
        setResult(null);
        try {
            const { data } = await dataProvider.create('story_voice', {
                data: { name, segments, characterVoices, modelId },
            });
            setResult(data);
            if (data.status !== 'completed') {
                notify(data.errorMessage || 'יצירת השמע נכשלה', { type: 'error' });
            }
        } catch (err) {
            handleError(notify)(err);
        } finally {
            setGenerating(false);
        }
    }

    async function handleDownload() {
        if (!result) return;
        setDownloading(true);
        try {
            await dataProvider.actionAndDownload('story_voice', 'download', { id: result.id }, {});
        } catch (err) {
            handleError(notify)(err);
        } finally {
            setDownloading(false);
        }
    }

    return (
        <Box dir="rtl">
            <Title title="הקראה קולית" />
            <Card sx={{ maxWidth: 720, mx: 'auto', mt: 2, p: 2 }}>
                <CardContent>
                    <Typography variant="h5" gutterBottom>יצירת הקראה קולית (ElevenLabs)</Typography>

                    <TextField
                        label="שם ההקראה"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        fullWidth
                        sx={{ mb: 2 }}
                    />

                    <TextField
                        label="JSON של מקטעים"
                        value={jsonText}
                        onChange={e => handleParse(e.target.value)}
                        multiline
                        minRows={8}
                        fullWidth
                        placeholder='[{"segment_id": 1, "character": "narrator", "text": "..."}]'
                        sx={{ mb: 1, direction: 'ltr' }}
                    />
                    <Button startIcon={<UploadFileIcon />} component="label" size="small">
                        טען קובץ JSON
                        <input type="file" accept=".json" hidden ref={fileInputRef} onChange={handleFileSelect} />
                    </Button>

                    {parseError && <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>}

                    {segments && (
                        <>
                            <Divider sx={{ my: 2 }} />
                            <Stack direction="row" spacing={1} mb={2}>
                                <Chip label={`${segments.length} מקטעים`} color="primary" />
                                <Chip label={`${characters.length} דמויות`} color="secondary" />
                            </Stack>

                            <TextField
                                select
                                label="מודל ElevenLabs"
                                value={modelId}
                                onChange={e => setModelId(e.target.value)}
                                fullWidth
                                sx={{ mb: 2 }}
                            >
                                {ELEVEN_LABS_MODELS.map(m => (
                                    <MenuItem key={m.id} value={m.id}>{m.name}</MenuItem>
                                ))}
                            </TextField>

                            <Typography variant="subtitle2" gutterBottom>בחירת קול לכל דמות</Typography>
                            <Stack spacing={2} mb={2}>
                                {characters.map(character => (
                                    <TextField
                                        key={character}
                                        label={`Voice ID עבור "${character}"`}
                                        value={characterVoices[character] || ''}
                                        onChange={e => setCharacterVoices(prev => ({ ...prev, [character]: e.target.value }))}
                                        fullWidth
                                        sx={{ direction: 'ltr' }}
                                    />
                                ))}
                            </Stack>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                disabled={!canGenerate}
                                startIcon={generating ? <CircularProgress size={18} /> : <GraphicEqIcon />}
                                onClick={handleGenerate}
                            >
                                צור הקראה קולית
                            </Button>
                        </>
                    )}

                    {result && (
                        <Box mt={2}>
                            {result.status === 'completed' && (
                                <Alert severity="success" sx={{ mb: 1 }}>ההקראה נוצרה בהצלחה</Alert>
                            )}
                            {result.status === 'failed' && (
                                <Alert severity="error" sx={{ mb: 1 }}>{result.errorMessage || 'יצירת השמע נכשלה'}</Alert>
                            )}
                            {result.status === 'completed' && (
                                <Button
                                    variant="outlined"
                                    fullWidth
                                    disabled={downloading}
                                    startIcon={downloading ? <CircularProgress size={18} /> : <DownloadIcon />}
                                    onClick={handleDownload}
                                >
                                    הורד קובץ שמע
                                </Button>
                            )}
                        </Box>
                    )}
                </CardContent>
            </Card>
        </Box>
    );
}
