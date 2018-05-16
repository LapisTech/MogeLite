interface TopConfig
{
	top: HTMLElement,
	login: HTMLButtonElement,
	nora: HTMLButtonElement,
}

class Top
{
	constructor( config: TopConfig, app: App )
	{
		config.login.addEventListener( 'click', () => { app.nextBar( config.top ); }, false );
		config.nora.addEventListener( 'click', () => { app.nextBar( config.top ); }, false );
	}

}
