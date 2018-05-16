import { Server } from './libs/Server';
import * as fs from './libs/pfs';

fs.readFile( 'config.json' ).then( ( data ) =>
{
	return JSON.parse( <string>data );
} ).catch( ( error ) =>
{
	return { port: 8010, debug: true };
} ).then( ( config ) =>
{
	const server = new Server( typeof config === 'object' ? config : undefined );

	server.addStatic( '/', './docs' );

	server.start();
} );
