// src/lib/cache-warmer.ts
import redis from './redis-client';
import { fplApi } from '../fpl-api/client'; // Import the raw API client
import { Gameweek } from '../../types/fpl';

/**
 * Cache warming function for the MCP Express server
 */
async function warmCache() {
    console.log('Starting MCP server cache warming process...');

    try {
        // Fetch bootstrap data
        console.log('Fetching bootstrap static data...');
        const bootstrapData = await fplApi.getBootstrapStatic();

        // Store data in Redis with appropriate TTLs
        const ttl = 4 * 60 * 60; // 4 hours TTL for bootstrap data
        await redis.set(
            'fpl:bootstrap-static',
            JSON.stringify(bootstrapData),
            'EX',
            ttl
        );

        // Extract and cache core components
        await Promise.all([
            redis.set(
                'fpl:teams',
                JSON.stringify(bootstrapData.teams),
                'EX',
                ttl
            ),
            redis.set(
                'fpl:players',
                JSON.stringify(bootstrapData.elements),
                'EX',
                ttl
            ),
            redis.set(
                'fpl:gameweeks',
                JSON.stringify(bootstrapData.events),
                'EX',
                ttl
            ),
        ]);

        // Get fixtures data
        console.log('Fetching fixtures data...');
        const fixturesData = await fplApi.getFixtures();
        await redis.set(
            'fpl:fixtures',
            JSON.stringify(fixturesData),
            'EX',
            ttl
        );

        // Identify current gameweek
        const currentGameweek = bootstrapData.events.find(
            (gw: Gameweek) => gw.is_current
        );
        if (currentGameweek) {
            console.log(`Current gameweek is ${currentGameweek.id}`);
            // Cache live data for current gameweek
            const liveData = await fplApi.getGameweekLive(currentGameweek.id);
            await redis.set(
                `fpl:gameweek:${currentGameweek.id}:live`,
                JSON.stringify(liveData),
                'EX',
                15 * 60
            );
        }

        // Clean up past gameweek live data
        await cleanupPastGameweekData(bootstrapData.events);

        console.log('Cache warming completed successfully');
    } catch (error) {
        console.error('Cache warming failed:', error);
    }
}

/**
 * Clean up unnecessary past gameweek live data
 */
async function cleanupPastGameweekData(gameweeks: Gameweek[]) {
    try {
        const currentGameweek = gameweeks.find((gw: Gameweek) => gw.is_current);
        if (!currentGameweek) return;

        // Get all gameweek live cache keys
        const liveKeys = await redis.keys('fpl:gameweek:*:live');

        // Identify keys for past gameweeks
        const pastGameweekKeys = liveKeys.filter((key) => {
            const match = key.match(/fpl:gameweek:(\d+):live/);
            if (!match) return false;

            const gwId = parseInt(match[1]);
            return gwId < currentGameweek.id;
        });

        // Remove past gameweek live data
        if (pastGameweekKeys.length > 0) {
            await redis.del(...pastGameweekKeys);
            console.log(
                `Removed ${pastGameweekKeys.length} unnecessary past gameweek live cache entries`
            );
        }
    } catch (error) {
        console.error('Error cleaning up past gameweek data:', error);
    }
}

// Export the warming function
export { warmCache };
