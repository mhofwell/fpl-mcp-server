// In src/lib/mcp-server.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { randomUUID } from 'crypto';
import redis from './redis/redis-client';
import { Team, Player, Gameweek, Fixture } from '../types/fpl';

// In-memory session storage (will be replaced with Redis later)
const sessions: Record<string, StreamableHTTPServerTransport> = {};

// Create MCP server
export const createMcpServer = () => {
    const server = new McpServer({
        name: 'FPL-MCP-Server',
        version: '1.0.0',
    });

    // Add a simple tool for testing
    server.tool('echo', { message: z.string() }, async ({ message }) => ({
        content: [{ type: 'text', text: `Echo: ${message}` }],
    }));

    // Get current gameweek info tool
    server.tool('get-current-gameweek', {}, async () => {
        try {
            const cachedData = await redis.get('fpl:gameweeks');
            if (!cachedData)
                return {
                    content: [
                        {
                            type: 'text',
                            text: 'Gameweek data not found in cache',
                        },
                    ],
                    isError: true,
                };

            const gameweeks: Gameweek[] = JSON.parse(cachedData);
            const currentGameweek = gameweeks.find((gw) => gw.is_current);

            if (!currentGameweek) {
                return {
                    content: [
                        { type: 'text', text: 'Current gameweek not found' },
                    ],
                    isError: true,
                };
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(currentGameweek, null, 2),
                    },
                ],
            };
        } catch (error) {
            console.error('Error getting current gameweek:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${
                            error instanceof Error
                                ? error.message
                                : 'Unknown error'
                        }`,
                    },
                ],
                isError: true,
            };
        }
    });

    // Get team info tool
    server.tool('get-team', { teamId: z.number() }, async ({ teamId }) => {
        try {
            const cachedData = await redis.get('fpl:teams');
            if (!cachedData)
                return {
                    content: [
                        { type: 'text', text: 'Teams data not found in cache' },
                    ],
                    isError: true,
                };

            const teams: Team[] = JSON.parse(cachedData);
            const team = teams.find((t) => t.id === teamId);

            if (!team) {
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Team with ID ${teamId} not found`,
                        },
                    ],
                    isError: true,
                };
            }

            return {
                content: [
                    { type: 'text', text: JSON.stringify(team, null, 2) },
                ],
            };
        } catch (error) {
            console.error('Error getting team:', error);
            return {
                content: [
                    {
                        type: 'text',
                        text: `Error: ${
                            error instanceof Error
                                ? error.message
                                : 'Unknown error'
                        }`,
                    },
                ],
                isError: true,
            };
        }
    });

    // Get player info tool
    server.tool(
        'get-player',
        { playerId: z.number() },
        async ({ playerId }) => {
            try {
                const cachedData = await redis.get('fpl:players');
                if (!cachedData)
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Players data not found in cache',
                            },
                        ],
                        isError: true,
                    };

                const players: Player[] = JSON.parse(cachedData);
                const player = players.find((p) => p.id === playerId);

                if (!player) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `Player with ID ${playerId} not found`,
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        { type: 'text', text: JSON.stringify(player, null, 2) },
                    ],
                };
            } catch (error) {
                console.error('Error getting player:', error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error'
                            }`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    // Get fixtures for a gameweek
    server.tool(
        'get-gameweek-fixtures',
        { gameweekId: z.number() },
        async ({ gameweekId }) => {
            try {
                const cachedData = await redis.get('fpl:fixtures');
                if (!cachedData)
                    return {
                        content: [
                            {
                                type: 'text',
                                text: 'Fixtures data not found in cache',
                            },
                        ],
                        isError: true,
                    };

                const fixtures: Fixture[] = JSON.parse(cachedData);
                const gameweekFixtures = fixtures.filter(
                    (f) => f.gameweek_id === gameweekId
                );

                if (gameweekFixtures.length === 0) {
                    return {
                        content: [
                            {
                                type: 'text',
                                text: `No fixtures found for gameweek ${gameweekId}`,
                            },
                        ],
                        isError: true,
                    };
                }

                return {
                    content: [
                        {
                            type: 'text',
                            text: JSON.stringify(gameweekFixtures, null, 2),
                        },
                    ],
                };
            } catch (error) {
                console.error('Error getting fixtures:', error);
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Error: ${
                                error instanceof Error
                                    ? error.message
                                    : 'Unknown error'
                            }`,
                        },
                    ],
                    isError: true,
                };
            }
        }
    );

    return server;
};

// Create a new transport for a session
export const createTransport = (
    sessionId: string = randomUUID()
): StreamableHTTPServerTransport => {
    const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => sessionId,
    });

    // Store transport in sessions object
    sessions[sessionId] = transport;

    // Setup cleanup when transport is closed
    transport.onclose = () => {
        delete sessions[sessionId];
        console.log(`Session ${sessionId} closed`);
    };

    return transport;
};

// Get transport by session ID
export const getTransport = (
    sessionId: string
): StreamableHTTPServerTransport | undefined => {
    return sessions[sessionId];
};

// Get all active session IDs
export const getActiveSessions = (): string[] => {
    return Object.keys(sessions);
};
