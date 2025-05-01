// src/tools/index.ts - No changes needed here if you already have this structure
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { getCurrentGameweek } from './fpl/gameweek';
import { getTeam } from './fpl/team';
import { getPlayer } from './fpl/player';
import { getGameweekFixtures } from './fpl/fixtures';
import { echoMessage } from './echo';

export function registerTools(server: McpServer) {
    // Echo tool for testing
    server.tool('echo', { message: z.string() }, echoMessage);

    // FPL tools
    server.tool('get-current-gameweek', {}, getCurrentGameweek);
    server.tool('get-team', { teamId: z.number() }, getTeam);
    server.tool('get-player', { playerId: z.number() }, getPlayer);
    server.tool(
        'get-gameweek-fixtures',
        { gameweekId: z.number() },
        getGameweekFixtures
    );
}
