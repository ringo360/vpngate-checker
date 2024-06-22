import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import consola from 'consola';
import { resourceUsage } from 'process';

const app = new Hono();
let vpngateList: string[];

//*Edit me
const checkIntervalSec = 60 * 10; //interval (sec)

consola.info(`Interval: ${checkIntervalSec}sec`);

async function main() {
	consola.log('Called');
	await fetchVpnGateList();
	setInterval(await fetchVpnGateList, 1000 * checkIntervalSec);
}

async function fetchVpnGateList() {
	consola.info('Fetching VPNGateList');
	const fetchms = performance.now(); //dev
	const res = await (
		await fetch('http://www.vpngate.net/api/iphone/')
	).text();
	consola.info(`Fetched in ${(performance.now() - fetchms).toFixed(2)}ms`);
	const checkms = performance.now();
	consola.info('Validating...');
	const lines = res.split('\n');
	const validIpRegex =
		/^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
	const results = lines
		.map((line) => {
			const parts = line.split(',');
			if (validIpRegex.test(parts[1])) {
				return parts[1];
			}
			return null;
		})
		.filter((result) => result !== null) as string[];
	// console.log(results);
	vpngateList = results;
	consola.info(`Validated in ${(performance.now() - checkms).toFixed(2)}ms`);
}

app.get('/', async (c) => {
	return c.text('VPNGate Checker');
});

app.get('/list', async (c) => {
	// const json = await JSON.stringify(vpngateList);
	return c.json(vpngateList);
});

app.get('/:ip', async (c) => {
	const ip = c.req.param('ip');
	if (vpngateList.includes(ip)) {
		return c.text('This is vpn');
	} else {
		return c.text('No');
	}
});

const port = 3000;
consola.info(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});

main();
