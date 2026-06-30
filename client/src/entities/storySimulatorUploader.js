import { useState } from 'react';
import { useDataProvider } from 'react-admin';
import { fetchGameChildRows } from './storySimulatorGameData';

function computeNodeType(node, startNodeId) {
    if (node.id === startNodeId) return 'start';
    if (node.type === 'SYSTEM_NODE') return 'system';
    if (node.routingRules.length === 0) return 'end';
    return null;
}

/**
 * Uploads a parsed story (nodes + segments) to the server as a Game graph.
 *
 * - If `existingGameId` is passed, the game's existing segments/nodes/choices/
 *   routing_rules are deleted first, then recreated under the same gameId;
 *   the game's `name` is also updated to `gameName`.
 * - `Layer` has no gameId column (it's a shared resource), so layers are
 *   found-or-created by name instead of being deleted/recreated.
 * - When `assignUserId` is passed (admin only), it's stamped on every created
 *   row; the server only fills in the caller's own id when userId is absent,
 *   so an explicit value here is respected.
 */
export function useStoryUploader({ nodes, segments, startNodeId }) {
    const dataProvider = useDataProvider();
    const [status, setStatus] = useState('idle'); // 'idle' | 'uploading' | 'done' | 'error'
    const [progress, setProgress] = useState({ step: '', stepIndex: 0, total: 6 });
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);

    async function deleteExistingGameData(gameId) {
        const { routingRules, choices, nodes: nodeRows, segments: segmentRows } = await fetchGameChildRows(dataProvider, gameId);
        // Delete in FK dependency order: routing_rules/choices reference game_node, which references segment.
        const deletions = [
            ['routing_rule', routingRules],
            ['choice', choices],
            ['game_node', nodeRows],
            ['segment', segmentRows],
        ];
        for (const [resource, rows] of deletions) {
            if (rows.length) {
                await dataProvider.deleteMany(resource, { ids: rows.map(r => r.id) });
            }
        }
    }

    async function findOrCreateLayers(levels, withUser) {
        if (!levels.length) return {};
        const names = levels.map(level => `רמה ${level}`);
        const { data: existing } = await dataProvider.getList('layer', {
            filter: { name: names },
            pagination: { page: 1, perPage: 1000 },
            sort: { field: 'id', order: 'ASC' },
        });
        const existingByName = Object.fromEntries(existing.map(l => [l.name, l.id]));
        const missingLevels = levels.filter(level => !existingByName[`רמה ${level}`]);
        let created = [];
        if (missingLevels.length) {
            const payloads = missingLevels.map(level => withUser({ name: `רמה ${level}`, layerType: `level_${level}` }));
            created = await dataProvider.createMany('layer', payloads);
        }
        const createdByName = Object.fromEntries(created.map(l => [l.name, l.id]));
        return Object.fromEntries(levels.map(level => [String(level), existingByName[`רמה ${level}`] ?? createdByName[`רמה ${level}`]]));
    }

    async function upload({ gameName, existingGameId, assignUserId }) {
        setStatus('uploading');
        setError(null);
        setResult(null);
        try {
            const withUser = obj => (assignUserId ? { ...obj, userId: assignUserId } : obj);

            let gameId = existingGameId;
            if (gameId) {
                setProgress({ step: 'מוחק נתונים קודמים של המשחק', stepIndex: 1, total: 6 });
                await deleteExistingGameData(gameId);
                await dataProvider.update('game', { id: gameId, data: { name: gameName }, previousData: { id: gameId } });
            } else {
                setProgress({ step: 'יוצר משחק', stepIndex: 1, total: 6 });
                const [game] = await dataProvider.createMany('game', [withUser({ name: gameName })]);
                gameId = game.id;
            }

            setProgress({ step: 'יוצר מקטעים', stepIndex: 2, total: 6 });
            const segPayloads = Object.values(segments).map(s => withUser({
                name: s.id, gameId, title: s.title, value: s.text,
            }));
            const createdSegs = segPayloads.length ? await dataProvider.createMany('segment', segPayloads) : [];
            const segIdMap = Object.fromEntries(createdSegs.map(s => [s.name, s.id]));

            setProgress({ step: 'מאתר/יוצר שכבות', stepIndex: 3, total: 6 });
            const uniqueLevels = [...new Set(Object.values(nodes).map(n => n.level).filter(Boolean))].sort((a, b) => a - b);
            const layerIdMap = await findOrCreateLayers(uniqueLevels, withUser);

            setProgress({ step: 'יוצר צמתים', stepIndex: 4, total: 6 });
            const nodeList = Object.values(nodes);
            const nodePayloads = nodeList.map(n => withUser({
                name: n.id,
                gameId,
                segmentId: segIdMap[n.segmentId] ?? null,
                layerId: layerIdMap[String(n.level)] ?? null,
                nodeType: computeNodeType(n, startNodeId),
            }));
            const createdNodes = nodePayloads.length ? await dataProvider.createMany('game_node', nodePayloads) : [];
            const nodeIdMap = Object.fromEntries(createdNodes.map(n => [n.name, n.id]));

            setProgress({ step: 'יוצר בחירות', stepIndex: 5, total: 6 });
            const choicePayloads = [];
            const choiceKeys = [];
            nodeList.forEach(n => {
                n.choices.forEach(c => {
                    choiceKeys.push(`${n.id}:${c.key}`);
                    choicePayloads.push(withUser({ nodeId: nodeIdMap[n.id], gameId, inputKey: c.key, description: c.text }));
                });
            });
            const createdChoices = choicePayloads.length ? await dataProvider.createMany('choice', choicePayloads) : [];
            const choiceIdMap = Object.fromEntries(createdChoices.map((ch, i) => [choiceKeys[i], ch.id]));

            setProgress({ step: 'יוצר חוקי ניתוב', stepIndex: 6, total: 6 });
            const rulePayloads = [];
            nodeList.forEach(n => {
                n.routingRules.forEach(r => {
                    const targetId = nodeIdMap[r.targetNodeId];
                    if (!targetId) return; // unresolved target — skip rather than insert an invalid row
                    rulePayloads.push(withUser({
                        sourceNodeId: nodeIdMap[n.id],
                        targetNodeId: targetId,
                        gameId,
                        choiceId: r.key != null ? (choiceIdMap[`${n.id}:${r.key}`] ?? null) : null,
                        diceOptions: r.diceOptions !== 'NULL' ? r.diceOptions : null,
                    }));
                });
            });
            if (rulePayloads.length) await dataProvider.createMany('routing_rule', rulePayloads);

            setResult({
                gameId,
                counts: {
                    segments: createdSegs.length,
                    nodes: createdNodes.length,
                    choices: createdChoices.length,
                    rules: rulePayloads.length,
                },
            });
            setStatus('done');
        } catch (err) {
            setError(err.message || 'שגיאה בהעלאה לשרת');
            setStatus('error');
        }
    }

    return { upload, status, progress, result, error };
}
