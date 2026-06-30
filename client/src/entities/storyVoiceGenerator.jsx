import { useEffect, useMemo, useState } from 'react';
import { Form, SaveButton, SelectInput, TextInput, Title, required, useDataProvider, useInput, useNotify } from 'react-admin';
import {
    Alert, Autocomplete, Box, Button, Card, CardContent, Chip, CircularProgress, Divider, Stack, TextField, Typography,
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
                placeholder='[{"segment_id": 1, "character": "narrator", "text": "..."}]'
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

function VoiceAutocomplete({ source, label, validate }) {
    const { field, fieldState } = useInput({ source, validate });
    const [options, setOptions] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const timer = setTimeout(() => {
            setLoading(true);
            const params = new URLSearchParams({ page_size: '20' });
            if (inputValue) params.set('search', inputValue);
            else params.set('sort', 'usage_character_count_1y');
            fetch(`https://api.elevenlabs.io/v1/shared-voices?${params}`)
                .then(r => r.json())
                .then(data => { if (!cancelled) setOptions(data.voices ?? []); })
                .catch(() => {})
                .finally(() => { if (!cancelled) setLoading(false); });
        }, inputValue ? 400 : 0);
        return () => { cancelled = true; clearTimeout(timer); };
    }, [inputValue]);

    return (
        <Autocomplete
            options={options}
            getOptionLabel={v => v.name ?? ''}
            isOptionEqualToValue={(opt, val) => opt.voice_id === val?.voice_id}
            value={options.find(v => v.voice_id === field.value) ?? null}
            onChange={(_, v) => field.onChange(v?.voice_id ?? '')}
            inputValue={inputValue}
            onInputChange={(_, v, reason) => {
                setInputValue(v);
                if (reason === 'clear') field.onChange('');
            }}
            loading={loading}
            noOptionsText="לא נמצאו קולות"
            loadingText="טוען..."
            renderInput={params => (
                <TextField
                    {...params}
                    label={label}
                    fullWidth
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <>
                                {loading && <CircularProgress size={16} />}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => {
                const { key, ...optProps } = props;
                const meta = [option.gender, option.accent, option.descriptive].filter(Boolean).join(' · ');
                return (
                    <li key={option.voice_id} {...optProps}>
                        <Box>
                            <Typography variant="body2">{option.name}</Typography>
                            {meta && <Typography variant="caption" color="text.secondary">{meta}</Typography>}
                        </Box>
                    </li>
                );
            }}
            sx={{ mb: 2 }}
        />
    );
}

function GenerateForm({ segments, characters, onSubmit, generating }) {
    const defaultValues = useMemo(() => ({
        name: '',
        modelId: DEFAULT_ELEVEN_LABS_MODEL,
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

            <SelectInput
                source="modelId"
                label="מודל ElevenLabs"
                choices={ELEVEN_LABS_MODELS}
                validate={required()}
                fullWidth
            />

            <Typography variant="subtitle2" gutterBottom>בחירת קול לכל דמות</Typography>
            {characters.map(character => (
                <VoiceAutocomplete
                    key={character}
                    source={`characterVoices.${character}`}
                    label={`קול עבור "${character}"`}
                    validate={required()}
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

    async function handleGenerate({ name, modelId, characterVoices }) {
        setGenerating(true);
        setResult(null);
        try {
            const { data: created } = await dataProvider.create('story_voice', {
                data: { name, segments, characterVoices, modelId },
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
