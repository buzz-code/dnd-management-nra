import { Autocomplete, Box, TextField as MuiTextField, Typography } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import { useInput, useRecordContext } from 'react-admin';

export function useElevenLabsVoices() {
    return useQuery({
        queryKey: ['elevenlabs-voices'],
        queryFn: () =>
            fetch('https://api.elevenlabs.io/v1/voices')
                .then(r => r.json())
                .then(({ voices = [] }) => voices.map(({ voice_id, name, labels = {}, preview_url }) => ({
                    id: voice_id,
                    name: [name, labels.gender, labels.accent].filter(Boolean).join(' · '),
                    previewUrl: preview_url,
                }))),
        staleTime: Infinity,
    });
}

export function VoiceInput({ source, label, validate, renderExtra }) {
    const { field } = useInput({ source, validate });
    const { data: voices = [], isLoading } = useElevenLabsVoices();
    const selected = voices.find(v => v.id === field.value) || null;

    return (
        <Box mb={2}>
            <Box display="flex" gap={1} alignItems="center">
                <Autocomplete
                    sx={{ flex: 1 }}
                    options={voices}
                    loading={isLoading}
                    getOptionLabel={o => o.name || ''}
                    isOptionEqualToValue={(o, v) => o.id === v.id}
                    value={selected}
                    onChange={(_, val) => field.onChange(val ? val.id : null)}
                    renderInput={params => <MuiTextField {...params} label={label} />}
                />
                {renderExtra && renderExtra(field.value)}
            </Box>
            {selected?.previewUrl && (
                <audio controls src={selected.previewUrl} style={{ marginTop: 8, width: '100%', height: 32 }} />
            )}
        </Box>
    );
}

export function VoicePreviewField({ source = 'voiceId' }) {
    const record = useRecordContext();
    const { data: voices = [] } = useElevenLabsVoices();
    const voice = voices.find(v => v.id === record?.[source]);
    if (!voice) return null;
    return (
        <Box>
            <Typography variant="body2">{voice.name}</Typography>
            {voice.previewUrl && <audio controls src={voice.previewUrl} style={{ height: 32 }} />}
        </Box>
    );
}
