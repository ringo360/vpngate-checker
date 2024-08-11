import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import consola from 'consola';
import fs from 'fs/promises';

const app = new Hono();

//EDIT ME
const ips_file = 'ips.json';
const checkIntervalSec = 60 * 10; //60sec * 10min
//===============
consola.info(`Interval: ${checkIntervalSec}sec`);

class IPsList {
	private ips: string[];

	constructor(initips: string[] = []) {
		this.ips = [...new Set(initips)];
	}

	async add(ip: string) {
		if (!this.ips.includes(ip)) {
			this.ips.push(ip);
			return true;
		}
		return false;
	}

	async addMultiple(ips: string[]): Promise<void> {
		ips.forEach(async (ip) => await this.add(ip));
	}

	getIPs(): string[] {
		return this.ips;
	}

	async saveToFile(): Promise<void> {
		const json = JSON.stringify(this.ips, null, 2);
		await fs.writeFile(ips_file, json, 'utf8');
	}

	async loadFromFile(): Promise<void> {
		try {
			const data = await fs.readFile(ips_file, 'utf8');
			const parsedIps = (await JSON.parse(data)) as string[];
			this.ips = [...new Set(parsedIps)];
			consola.success(`Successfully loaded ${ips_file}`);
		} catch (e: any) {
			if (e.code === 'ENOENT') return;
			consola.error('Failed to load IPs from file:', e);
		}
	}
}
const Manager = new IPsList();

async function main() {
	consola.log('Called');
	await Manager.loadFromFile();
	await fetchVpnGateList();
	setInterval(await fetchVpnGateList, 1000 * checkIntervalSec);
}

async function fetchVpnGateList() {
	consola.info('Fetching VPNGateList');
	consola.info(`Curr len: ${Manager.getIPs().length}`);
	const fetchms = performance.now(); //dev
	const res = await (await fetch('http://www.vpngate.net/api/iphone/')).text();
	consola.info(`Fetched in ${(performance.now() - fetchms).toFixed(2)}ms`);
	const checkms = performance.now();
	consola.info('Validating...');
	const lines = res.split('\n');
	const validIpRegex = /^(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])(\.(25[0-5]|2[0-4][0-9]|1[0-9]{2}|[1-9]?[0-9])){3}$/;
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
	await Manager.addMultiple(results);
	consola.info(`Validated in ${(performance.now() - checkms).toFixed(2)}ms`);
	consola.info(`len: ${Manager.getIPs().length}`);
	const savems = performance.now();
	await Manager.saveToFile();
	consola.info(`Saved in ${(performance.now() - savems).toFixed(2)}ms`);
}

app.get('/', async (c) => {
	return c.json('VPNGate Checker');
});

app.get('/list', async (c) => {
	// const json = await JSON.stringify(vpngateList);
	return c.json(Manager.getIPs());
});

app.get('/:ip', async (c) => {
	const ip = c.req.param('ip');
	if (Manager.getIPs().includes(ip)) {
		return c.json({
			result: 'OK',
			vpn: true,
		});
	} else {
		return c.json({
			result: 'OK',
			vpn: false,
		});
	}
});

app.notFound(async (c) => {
	return c.json(
		{
			result: 'Error',
			Message: '404 not found',
		},
		404
	);
});

const port = 3000;
consola.info(`Server is running on http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});

process.on('uncaughtException', (e) => {
	consola.error(e);
});

main();
