import { useMemo, useState } from 'react';
import { AutocompleteInput, Form, SaveButton, TextInput, Title, required, useDataProvider, useNotify } from 'react-admin';
import {
    Alert, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack, TextField, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DownloadIcon from '@mui/icons-material/Download';
import { useQuery } from '@tanstack/react-query';
import { handleError } from '@shared/utils/notifyUtil';

function InstructionsBox() {
    return (
        <Box mb={2}>
            <Typography variant='body1'>
                יש להזין מערך JSON של מקטעי טקסט, כאשר כל מקטע במערך מייצג קטע דיבור אחד. שדות המקטע:
                <ul>
                    <li><code>character</code> - <strong>שדה חובה.</strong> מי "אומר" את המקטע: <code>narrator</code> עבור טקסט קריינות, או שם הדמות עבור דיאלוג.</li>
                    <li><code>text</code> - <strong>שדה חובה.</strong> הטקסט המדויק שיוקרא במקטע זה.</li>
                </ul>
                <strong>הנחיית הגשה/טון (לחישה, התרגשות וכדומה):</strong>
                <br />
                אין שדה נפרד לכך - יש לשלב הנחיה כזו ישירות בתוך הטקסט של <code>text</code>, בסוגריים מרובעים,
                במקום שבו רוצים שההגשה תשתנה. לדוגמה:
                <pre dir='ltr'>
{`"text": "[בלחישה] מישהו היה כאן."`}
                </pre>
                <ul>
                    <li>אפשר להוסיף כמה תגיות כאלה באותו מקטע, כל אחת במקום שבו רוצים שהיא תשפיע.</li>
                    <li>יש לשמור על התגית קצרה - מילה או שתיים, לא משפט שלם.</li>
                    <li>יש להשתמש בכך רק כשיש צורך מיוחד בהנחיית הגשה - ברירת המחדל של הקריין מתאימה לרוב המקטעים.</li>
                </ul>
                <strong>לתשומת לב:</strong>
                <ul>
                    <li>סדר המקטעים במערך הוא סדר ההקראה בפועל.</li>
                    <li>יש להשתמש בשם עקבי לכל דמות לאורך כל הסיפור.</li>
                    <li>ניתן לפצל טקסט קריינות ארוך למספר מקטעים בכל מקום שיש מעבר בין דמויות.</li>
                </ul>
                <br />
                דוגמה למבנה הנדרש:
                <pre dir='ltr'>
{`[
  { "character": "narrator", "text": "..." },
  { "character": "narrator", "text": "[בלחישה] מישהו היה כאן." },
  { "character": "שם הדמות", "text": "[מהוסס ומודאג] מה שמעת?" }
]`}
                </pre>
            </Typography>
        </Box>
    );
}

function useVoiceChoices() {
    return useQuery({
        queryKey: ['elevenlabs-voices'],
        queryFn: () =>
            fetch('https://api.elevenlabs.io/v1/voices')
                .then(r => r.json())
                .then(({ voices = [] }) => voices.map(({ voice_id, name, labels = {} }) => ({
                    id: voice_id,
                    name: [name, labels.gender, labels.accent].filter(Boolean).join(' · '),
                }))),
        staleTime: Infinity,
    });
}

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

function JsonInputStage({ jsonText, onParse, parseError }) {
    return (
        <>
            <TextField
                label="JSON של מקטעים"
                value={jsonText}
                onChange={e => onParse(e.target.value)}
                multiline
                minRows={8}
                fullWidth
                placeholder='[{"character": "narrator", "text": "..."}]'
                sx={{ mb: 1, direction: 'ltr' }}
            />
            <Button startIcon={<UploadFileIcon />} component="label" size="small">
                טען קובץ JSON
                <input type="file" accept=".json" hidden onChange={e => {
                    const file = e.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => onParse(String(reader.result));
                    reader.readAsText(file);
                    e.target.value = null;
                }} />
            </Button>
            {parseError && <Alert severity="error" sx={{ mt: 2 }}>{parseError}</Alert>}
        </>
    );
}

function GenerateForm({ segments, characters, onSubmit, generating }) {
    const { data: voiceChoices = [] } = useVoiceChoices();

    const defaultValues = useMemo(() => ({
        name: '',
        characterVoices: Object.fromEntries(characters.map(c => [c, ''])),
    }), [characters]);

    return (
        <Form key={characters.join(',')} onSubmit={onSubmit} defaultValues={defaultValues}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} mb={2}>
                <Chip label={`${segments.length} מקטעים`} color="primary" />
                <Chip label={`${characters.length} דמויות`} color="secondary" />
            </Stack>

            <TextInput source="name" label="שם ההקראה" validate={required()} fullWidth />

            <Typography variant="subtitle2" gutterBottom>בחירת קול לכל דמות</Typography>
            {characters.map(character => (
                <AutocompleteInput
                    key={character}
                    source={`characterVoices.${character}`}
                    label={`קול עבור "${character}"`}
                    validate={required()}
                    choices={voiceChoices}
                    fullWidth
                />
            ))}

            <SaveButton
                label="צור הקראה קולית"
                icon={generating ? <CircularProgress size={18} /> : <GraphicEqIcon />}
                alwaysEnable
                disabled={generating}
                variant="contained"
                size="large"
                fullWidth
            />
        </Form>
    );
}

function GenerationResult({ result, downloading, onDownload }) {
    if (!result) return null;
    return (
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
                    onClick={onDownload}
                >
                    הורד קובץ שמע
                </Button>
            )}
        </Box>
    );
}

export default function StoryVoiceGenerator() {
    const dataProvider = useDataProvider();
    const notify = useNotify();

    const [jsonText, setJsonText] = useState('');
    const [parseError, setParseError] = useState(null);
    const [segments, setSegments] = useState(null);
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
            setSegments(parseSegments(text));
            setParseError(null);
        } catch (err) {
            setSegments(null);
            setParseError(err.message || 'שגיאה בפענוח ה-JSON');
        }
    }

    async function handleGenerate({ name, characterVoices }) {
        setGenerating(true);
        setResult(null);
        try {
            const { data: created } = await dataProvider.create('story_voice', {
                data: { name, segments, characterVoices },
            });
            // dataProvider.create() only echoes back the request body + id, not the
            // server-computed status/filePath/errorMessage - re-fetch the real record.
            const { data } = await dataProvider.getOne('story_voice', { id: created.id });
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
            await dataProvider.actionAndDownload('story_voice', 'download', { 'extra.id': result.id }, {});
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

                    <InstructionsBox />

                    <JsonInputStage jsonText={jsonText} onParse={handleParse} parseError={parseError} />

                    {segments && (
                        <GenerateForm
                            segments={segments}
                            characters={characters}
                            onSubmit={handleGenerate}
                            generating={generating}
                        />
                    )}

                    <GenerationResult result={result} downloading={downloading} onDownload={handleDownload} />
                </CardContent>
            </Card>
        </Box>
    );
}
