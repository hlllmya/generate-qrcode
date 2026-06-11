import httpApp from './app/http';
import { APP_NAME, APP_PORT_HTTP, APP_VERSION } from './libs/config';

const port = Number(APP_PORT_HTTP);

httpApp.listen(port, () => {
	console.log(`${APP_NAME} v${APP_VERSION} berjalan di http://localhost:${port}`);
});
