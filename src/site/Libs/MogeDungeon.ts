/// <reference path="./Rogue.ts" />

class MogeDungeon
{
	private dungeon: Rogue.Dungeon;
	private bitmap: Rogue.BitCanvas;
	private chara: ActionChara;
	private map: Chip[];

	constructor()
	{
		this.chara = new ActionChara();
	}

	public init( dungeon?: Rogue.Dungeon )
	{
		if ( !dungeon )
		{
			dungeon = new Rogue.Dungeon();
			dungeon.generate( WLib.rand );
		}
		this.setBitmap( dungeon.getCanvas() );

//TODO:In convert
for ( let y = 0 ; y < this.bitmap.height() ; ++y )
{
	for( let x = 0 ; x < this.bitmap.width() ; ++x )
	{
		if ( this.bitmap.get( x, y ) )
		{
			this.chara.setPosition( x, y );
			break;
		}
	}
}

		return this;
	}

	public setBitmap( bitmap: Rogue.BitCanvas ) { this.bitmap = bitmap; return this; }

	public setMap( map: Chip[] ) { this.map = map; return this; }

	public convert( conv: ( bitmap: Rogue.BitCanvas ) => Chip[] )
	{
		this.setMap( conv( this.bitmap ) );

		return this;
	}

	public action( direction: number, card: CARD_JSON )
	{
		const sx = Math.floor( direction < 8 ? ( direction % 4 ) / 2 : ( direction % 4 ) / 2  - 1 );
		const sy = ( direction % 8 ) < 4 ? -( direction % 2 ) : ( direction + 1 ) % 2;

		const x = this.chara.x();
		const y = this.chara.y();

		// TODO: chip check.
		if ( !this.bitmap.inCanvas( x + sx, y + sy ) ) { return; }

		// TODO: Enemy

		if ( this.bitmap.get( x + sx, y + sy ) )
		{
			this.chara.move( sx, sy );
		}
	}

	public update()
	{

	}

	public _render( e: HTMLElement )
	{
		const map: string[] = this.bitmap.getBits().map( ( b ) => { return b ? '.' : ' '; } );
		map[ this.chara.y() * this.bitmap.width() + this.chara.x() ] = 'c';
		for ( let i = this.bitmap.width() - 1 ; i < map.length ; i += this.bitmap.width() ) { map[ i ] += '\n'; }
		e.innerHTML = '<pre>' + map.join( '' ) + '</pre>';
	}

}

class ActionChara
{
	private _x: number;
	private _y: number;
	constructor(){}

	public setPosition( x: number, y: number )
	{
		this._x = x;
		this._y = y;
	}

	public x() { return this._x; }
	public y() { return this._y; }

	public move( x: number, y: number )
	{
		this._x += x;
		this._y += y;
	}
}

class Chip
{
	protected x: number;
	protected y: number;

	constructor( x: number, y: number )
	{
		this.x = x;
		this.y = y;
	}

	public render()
	{
		const chip = document.createElement( 'div' );
		chip.style.left = ( this.x * 10 ) + '%';
		chip.style.top = ( this.y * 10 ) + '%';
	}
}
