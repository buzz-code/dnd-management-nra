import { useState } from 'react';
import { useDataProvider } from 'react-admin';
import { fetchGameChildRows } from './storySimulatorGameData';

function groupBy(rows, keyField, map) {
    const result = {};
    rows.forEach(row => {
        const key = row[keyField];
        (result[key] ??= []).push(map(row));
    });
    return result;
}

/**
 * Loads an already-saved Game from the server into the same
 * { nodes, segments, startNodeId } shape that parseStoryExcel produces,
 * so it can be played directly by StorySimulatorGame.
 */
export function useStoryLoader() {
    const dataProvider = useDataProvider();
    const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
    const [error, setError] = useState(null);
    const [data, setData] = useState(null);

    async function load(gameId) {
        setStatus('loading');
        setError(null);
        try {
            const { nodes: nodeRows, segments: segmentRows, choices: choiceRows, routingRules: ruleRows } =
                await fetchGameChildRows(dataProvider, gameId);

            const segments = Object.fromEntries(
                segmentRows.map(s => [s.id, { id: s.id, title: s.title, text: s.value }])
            );

            const choicesById = Object.fromEntries(choiceRows.map(c => [c.id, c]));
            const choicesByNode = groupBy(choiceRows, 'nodeId', c => ({ key: c.inputKey, text: c.description }));
            const rulesByNode = groupBy(ruleRows, 'sourceNodeId', r => ({
                key: r.choiceId ? choicesById[r.choiceId]?.inputKey ?? null : null,
                diceOptions: r.diceOptions ?? 'NULL',
                targetNodeId: r.targetNodeId,
            }));

            const nodes = Object.fromEntries(nodeRows.map(n => [n.id, {
                id: n.id,
                segmentId: n.segmentId,
                level: 0,
                type: n.nodeType === 'system' ? 'SYSTEM_NODE' : 'REGULAR_NODE',
                title: segments[n.segmentId]?.title || n.name,
                choices: choicesByNode[n.id] || [],
                routingRules: rulesByNode[n.id] || [],
            }]));

            const startNodeId = nodeRows.find(n => n.nodeType === 'start')?.id ?? nodeRows[0]?.id;

            const result = { nodes, segments, startNodeId };
            setData(result);
            setStatus('done');
            return result;
        } catch (err) {
            setError(err.message || 'שגיאה בטעינת המשחק');
            setStatus('error');
            throw err;
        }
    }

    return { load, status, error, data };
}
