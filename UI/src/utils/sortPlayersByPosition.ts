const POSITION_ORDER = ['QB', 'RB', 'WR', 'TE', 'K', 'DEF'];

function positionRank(position: string | null): number {
    const index = POSITION_ORDER.indexOf(position ?? '');
    return index === -1 ? POSITION_ORDER.length : index;
}

// Unknown positions sort to the end.
export function sortPlayersByPosition<T extends { position: string | null }>(players: T[]): T[] {
    return [...players].sort((a, b) => positionRank(a.position) - positionRank(b.position));
}
