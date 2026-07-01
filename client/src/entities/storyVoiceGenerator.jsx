import { useMemo, useState } from 'react';
import { Form, SaveButton, TextInput, Title, required, useDataProvider, useNotify } from 'react-admin';
import {
    Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, IconButton, Stack,
    TextField, Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import GraphicEqIcon from '@mui/icons-material/GraphicEq';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import SyncIcon from '@mui/icons-material/Sync';
import { useQuery } from '@tanstack/react-query';
import { handleError } from '@shared/utils/notifyUtil';
import { VoiceInput } from './elevenLabsVoice';

function InstructionsBox() {
    return (
        <Box mb={2}>
            <Typography variant='body1'>
                יש להזין מערך JSON של מקטעים, כאשר כל מקטע מייצג קטע דיבור אחד ומכיל שני שדות:
                <code>character</code> - מי "אומר" את המקטע (<code>narrator</code> עבור קריינות, או שם הדמות עבור דיאלוג), ו-<code>text</code> - הטקסט המדויק שיוקרא.
                <br /><br />
                סדר המקטעים במערך הוא סדר ההקראה בפועל, ולכל דמות יש להשתמש בשם עקבי לאורך כל הסיפור. ניתן לפצל טקסט קריינות ארוך למספר מקטעים בכל מעבר בין דמויות.
                <br /><br />
                כדי להנחות טון או הגשה מיוחדת (לדוגמה לחישה או התרגשות), אפשר לשלב בתוך <code>text</code> תגית קצרה בסוגריים מרובעים במקום הרצוי, כמו <code>[בלחישה]</code>. מומלץ להשתמש בכך רק כשבאמת נדרש.
                <br /><br />
                דוגמה למבנה הנדרש:
                <pre dir='ltr'>
{`[
  { "character": "narrator", "text": "..." },
  { "character": "narrator", "text": "[בלחישה] קולות עמומים נשמעו מעבר לדלת." },
  { "character": "שם הדמות", "text": "עצרו! אני שומע צעדים מתקרבים." }
]`}
                </pre>
            </Typography>
        </Box>
    );
}

function useGamesList(dataProvider) {
    return useQuery({
        queryKey: ['games-list'],
        queryFn: () => dataProvider.getList('game', {
            pagination: { page: 1, perPage: 200 },
            sort: { field: 'name', order: 'ASC' },
            filter: {},
        }).then(({ data }) => data),
        staleTime: 60_000,
    });
}

function useGameCharacters(dataProvider, gameId) {
    return useQuery({
        queryKey: ['game-characters', gameId],
        queryFn: () => dataProvider.getList('character', {
            pagination: { page: 1, perPage: 200 },
            sort: { field: 'name', order: 'ASC' },
            filter: { gameId },
        }).then(({ data }) => data),
        enabled: !!gameId,
    });
}

function GameSelector({ dataProvider, gameId, onChange }) {
    const { data: games = [] } = useGamesList(dataProvider);
    const selected = games.find(g => g.id === gameId) || null;
    return (
        <Autocomplete
            options={games}
            getOptionLabel={g => g.name || ''}
            isOptionEqualToValue={(o, v) => o.id === v.id}
            value={selected}
            onChange={(_, val) => onChange(val ? val.id : null)}
            renderInput={params => <TextField {...params} label="שיוך למשחק (אופציונלי, לשימוש חוזר בקולות הדמויות)" />}
            sx={{ mb: 2 }}
        />
    );
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

function GenerateForm({
    segments, characters, onSubmit, generating, gameId, gameCharactersByName, onSaveCharacter, savingCharacter,
}) {
    const defaultValues = useMemo(() => ({
        name: '',
        characterVoices: Object.fromEntries(
            characters.map(c => [c, gameCharactersByName[c.toLowerCase()]?.voiceId || '']),
        ),
    }), [characters, gameCharactersByName]);

    return (
        <Form key={`${characters.join(',')}|${gameId || ''}`} onSubmit={onSubmit} defaultValues={defaultValues}>
            <Divider sx={{ my: 2 }} />
            <Stack direction="row" spacing={1} mb={2}>
                <Chip label={`${segments.length} מקטעים`} color="primary" />
                <Chip label={`${characters.length} דמויות`} color="secondary" />
            </Stack>

            <TextInput source="name" label="שם ההקראה" validate={required()} fullWidth />

            <Typography variant="subtitle2" gutterBottom>בחירת קול לכל דמות</Typography>
            {characters.map(character => {
                const matched = gameCharactersByName[character.toLowerCase()];
                return (
                    <VoiceInput
                        key={character}
                        source={`characterVoices.${character}`}
                        label={`קול עבור "${character}"`}
                        validate={required()}
                        renderExtra={gameId ? voiceId => (
                            <IconButton
                                size="small"
                                disabled={!voiceId || savingCharacter === character}
                                title={matched ? 'עדכן דמות במשחק' : 'שמור כדמות במשחק'}
                                onClick={() => onSaveCharacter(character, voiceId, matched?.id)}
                            >
                                {matched ? <SyncIcon fontSize="small" /> : <SaveIcon fontSize="small" />}
                            </IconButton>
                        ) : undefined}
                    />
                );
            })}

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
    const [gameId, setGameId] = useState(null);
    const [savingCharacter, setSavingCharacter] = useState(null);

    const characters = useMemo(
        () => (segments ? [...new Set(segments.map(s => s.character))] : []),
        [segments],
    );

    const {
        data: gameCharacters = [], isLoading: loadingGameCharacters, refetch: refetchGameCharacters,
    } = useGameCharacters(dataProvider, gameId);
    const gameCharactersByName = useMemo(
        () => Object.fromEntries(gameCharacters.map(c => [c.name.toLowerCase(), c])),
        [gameCharacters],
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

    async function handleSaveCharacter(characterName, voiceId, existingId) {
        if (!voiceId || !gameId) return;
        setSavingCharacter(characterName);
        try {
            if (existingId) {
                await dataProvider.update('character', { id: existingId, data: { voiceId }, previousData: { id: existingId } });
            } else {
                await dataProvider.create('character', { data: { gameId, name: characterName, voiceId } });
            }
            notify('הדמות נשמרה במשחק', { type: 'success' });
            await refetchGameCharacters();
        } catch (err) {
            handleError(notify)(err);
        } finally {
            setSavingCharacter(null);
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

                    <GameSelector dataProvider={dataProvider} gameId={gameId} onChange={setGameId} />

                    <JsonInputStage jsonText={jsonText} onParse={handleParse} parseError={parseError} />

                    {segments && (loadingGameCharacters
                        ? <Box textAlign="center" my={2}><CircularProgress size={24} /></Box>
                        : (
                            <GenerateForm
                                segments={segments}
                                characters={characters}
                                onSubmit={handleGenerate}
                                generating={generating}
                                gameId={gameId}
                                gameCharactersByName={gameCharactersByName}
                                onSaveCharacter={handleSaveCharacter}
                                savingCharacter={savingCharacter}
                            />
                        ))}

                    <GenerationResult result={result} downloading={downloading} onDownload={handleDownload} />
                </CardContent>
            </Card>
        </Box>
    );
}
