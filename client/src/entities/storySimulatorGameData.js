const GAME_CHILD_RESOURCES = {
    nodes: 'game_node',
    segments: 'segment',
    choices: 'choice',
    routingRules: 'routing_rule',
};

/**
 * Fetches all rows of a Game's child resources (nodes, segments, choices, routing rules)
 * scoped to a single gameId. Shared by the uploader (to delete an existing game's data
 * before re-uploading) and the loader (to play an existing saved game).
 */
export async function fetchGameChildRows(dataProvider, gameId) {
    const entries = await Promise.all(
        Object.entries(GAME_CHILD_RESOURCES).map(async ([key, resource]) => {
            const { data } = await dataProvider.getList(resource, {
                filter: { gameId },
                pagination: { page: 1, perPage: 10000 },
                sort: { field: 'id', order: 'ASC' },
            });
            return [key, data];
        }),
    );
    return Object.fromEntries(entries);
}
