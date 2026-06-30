import { Accordion, AccordionDetails, AccordionSummary, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { TextInput, useGetIdentity } from 'react-admin';

/**
 * Settings accordion section for the ElevenLabs (text-to-speech) API key.
 *
 * Usage: render inside a react-admin SimpleForm on the user settings page.
 * The form field name is `elevenLabsApiKey` which maps to `additionalData.elevenLabsApiKey`.
 */
export const ElevenLabsSettingsInput = () => {
    const { identity } = useGetIdentity();
    return (
        <Accordion sx={{ width: '100%' }}>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">הגדרות ElevenLabs (הקראה קולית)</Typography>
            </AccordionSummary>
            <AccordionDetails>
                <TextInput
                    source="elevenLabsApiKey"
                    label="מפתח API של ElevenLabs"
                    helperText="הזן את מפתח ה-API שקיבלת מ-ElevenLabs ליצירת קבצי שמע"
                    fullWidth
                    type="password"
                    defaultValue={identity?.additionalData?.elevenLabsApiKey ?? ''}
                />
            </AccordionDetails>
        </Accordion>
    );
};
