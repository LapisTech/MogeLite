/// <reference path="./WLib.ts" />
/// <reference path="./Common.ts" />
/// <reference path="./UserData.ts" />
/// <reference path="./MogeDungeon.ts" />


/// <reference path="../View/Top.ts" />
/// <reference path="../View/Home.ts" />
/// <reference path="../View/Bar.ts" />
/// <reference path="../View/Dungeon.ts" />
/// <reference path="../View/Book.ts" />


interface AppConfig
{
	loading: HTMLElement,
	contents: HTMLElement,
	top: TopConfig,
	home: HomeConfig,
	bar: HTMLElement,//TODO:del
	dungeon: DungeonConfig,
}


class App
{
	private config: AppConfig;
	private user: UserData;

	private home: Home;
	private dungeon: Dungeon;

	constructor( config: AppConfig )
	{
		this.config = config;

		this.user = new UserData( this );

		config.loading.addEventListener( 'click', ( event ) =>
		{
			event.stopPropagation();
		}, false );

		const top = new Top( config.top, this );

		this.home = new Home( this, config.home );
		this.dungeon = new Dungeon( config.dungeon );
	}

	public init()
	{
		const p: Promise<any>[] = [];

		p.push( LoadWLib().then( ( wlib ) =>
		{
			(<any>window).WLib = wlib;
		} ) );

		p.push( this.user.init() );

		return Promise.all( p ).then( () =>
		{
			this.config.loading.classList.remove( 'show' );
		} );
	}

	// Page ==================================================

	private hidePage( hide: HTMLElement )
	{
		hide.classList.remove( 'show' );
	}

	public nextHome( hide: HTMLElement )
	{
		this.user.reloadMypage().then( () =>
		{
			this.config.home.home.classList.add( 'show' );
			this.hidePage( hide );
		} );
	}

	public nextChara( hide: HTMLElement ){}

	public nextBook( hide: HTMLElement ){}

	public nextDungeon( hide: HTMLElement )
	{
		this.config.dungeon.dungeon.classList.add( 'show' );
		this.hidePage( hide );

		const deck: CARD_JSON[] = [];
		// TODO: DECK_CARD { id: number, lv: number, ...params  }
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );
		deck.push( { id: 0, cate: 0, name: 'a', data: { lv: [ 1 ] } } );

		const cm = new CardManager( deck );

		this.dungeon.init( cm );

		setTimeout( () => { cm.reload(); }, 1000 );

		this.dungeon.render( new MogeDungeon().init() );
	}

	public nextBar( hide: HTMLElement )
	{
		this.hidePage( hide );
		this.config.bar.classList.add( 'show' );
	}

	public nextMenu( hide: HTMLElement ){}

	// Home ==================================================

	public updateHomeData( data: HOME_DATA_JSON )
	{
		this.home.update( data );
	}
}
