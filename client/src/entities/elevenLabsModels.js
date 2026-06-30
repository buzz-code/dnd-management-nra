// Source: https://elevenlabs.io/docs/overview/models
// Only eleven_v3 lists Hebrew among its supported languages - the other
// multilingual models (multilingual_v2, flash_v2_5) do not support Hebrew.
export const ELEVEN_LABS_MODELS = [
    { id: 'eleven_v3', name: 'Eleven v3 (תומך בעברית, 70+ שפות, איכות גבוהה)' },
    { id: 'eleven_multilingual_v2', name: 'Multilingual v2 (לא תומך בעברית, איכות גבוהה ל-29 שפות אחרות)' },
    { id: 'eleven_flash_v2_5', name: 'Flash v2.5 (לא תומך בעברית, מהיר במיוחד)' },
];

export const DEFAULT_ELEVEN_LABS_MODEL = 'eleven_v3';
