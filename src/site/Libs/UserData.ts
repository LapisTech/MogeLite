/// <reference path="./API.ts" />

class UserData
{
	private data: HOME_DATA_JSON;
	private app: App;
	private reload: boolean;

	constructor( app: App )
	{
		this.app = app;
		this.nextReload();
	}

	public init()
	{
		return this.reloadMypage();
	}

	public nextReload() { this.reload = true; }

	public reloadMypage( force = false )
	{
		return ( ( this.reload || force ) ? API.user.data() : Promise.resolve( this.data ) ).then( ( data ) =>
		{
			this.data = data;
			this.app.updateHomeData( data );
		} );
	}

	public getUserData() { return this.data.user; }
}
