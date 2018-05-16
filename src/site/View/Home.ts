interface HomeConfig
{
	home: HTMLElement,
}

class Home
{
	private config: HomeConfig;

	constructor( app: App, config: HomeConfig )
	{
		this.config = config;
		this.addClick( 'chara', () => { app.nextChara( this.config.home ); } );
		this.addClick( 'book', () => { app.nextBook( this.config.home ); } );
		this.addClick( 'dungeon', () => { app.nextDungeon( this.config.home ); } );
		this.addClick( 'bar', () => { app.nextBar( this.config.home ); } );
		this.addClick( 'menu', () => { app.nextMenu( this.config.home ); } );
	}

	private addClick( cls: string, callback: () => any )
	{
		Common.addClick( <HTMLButtonElement>this.config.home.querySelector( '.' + cls ), callback );
	}

	public update( data: HOME_DATA_JSON )
	{
	}

}
