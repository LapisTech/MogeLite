interface DungeonConfig
{
	dungeon: HTMLElement,
}

class DrawCard
{
	private element: HTMLElement;
	private endanimes: ( ( value?: {} ) => void )[];

	constructor( element: HTMLElement )
	{
		this.element = element;
		this.unset();
		this.endanimes = [];
		element.addEventListener( 'transitionend', ( event ) =>
		{
			new Promise((resolve)=>{});
			while ( 0 < this.endanimes.length )
			{
				const f = this.endanimes.shift();
				if ( f ) { f( event ); }
			}
		}, false );
	}

	public set( card: number ) { this.element.dataset.card = card + ''; }

	public unset() { this.element.dataset.card = ''; this.element.dataset.select = ''; }

	public exist() { return !!this.element.dataset.card; }

	public card() { return this.element.dataset.card ? parseInt( this.element.dataset.card ) : -1; }

	public select( order: number ) { this.element.dataset.select = order + ''; }

	public deselect() { this.element.dataset.select = ''; }

	public selected() { return !!this.element.dataset.select; }

	public order() { return this.element.dataset.select ? parseInt( this.element.dataset.select ) : -1; }

	public swap( target: DrawCard )
	{
		[ this.element.dataset.card, target.element.dataset.card ] = [ target.element.dataset.card, this.element.dataset.card ];
		[ this.element.dataset.select, target.element.dataset.select ] = [ target.element.dataset.select, this.element.dataset.select ];
	}

	public backup() { return { card: this.element.dataset.card || '', select: this.element.dataset.select || '' }; }
	public restore( data: { card: string, select: string } )
	{
		this.element.dataset.card = data.card;
		this.element.dataset.select = data.select;
	}
}

class CardManager
{
	private deck: CARD_JSON[];
	public static HAND_MAX = 4;
	private stack: number[];
	private hand: DrawCard[];

	constructor( deck: CARD_JSON[] )
	{
		this.deck = deck;
		this.stack = [];
		this.hand = [];
	}

	public addCard( card: CARD_JSON )
	{
		this.deck.push( card );
		this.stack.push( this.deck.length - 1 );
		Common.shuffle( this.stack );
	}

	public init( hand: HTMLElement[] )
	{
		this.hand = hand.map( ( element ) => { return new DrawCard( element ); } );

		CardManager.HAND_MAX = this.hand.length;
	}

	public reload()
	{
		this.stack = this.deck.map( ( c, index ) => { return index; } );
		Common.shuffle( this.stack );

		this.hand.forEach( ( c ) => { c.unset(); } );

		for ( let i = 0 ; i < CardManager.HAND_MAX ; ++i ) { this.draw(); }
	}

	public draw()
	{
		this.arrange();
		let i: number;
		for ( i = 0 ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].exist() ) { continue; }
			break;
		}
		if ( this.hand.length <= i ) { return false; }

		// データを見ていてもいいように引く直前にシャッフル
		Common.shuffle( this.stack );
		const card = this.stack.shift();

		if ( card === undefined ) { return false; }

		this.hand[ i ].set( card );

		return true;
	}

	public drawFull()
	{
		this.arrange();
		for ( let i = 0 ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].exist() ) { continue; }
			this.draw();
		}
	}

	public useFirst()
	{
		let index = -1;
		for ( let i = 0 ; i < this.hand.length ; ++i )
		{
			if ( !this.hand[ i ].selected() ) { continue; }
			if ( index < 0 || this.hand[ i ].order() < index )
			{
				index = i;
			}
		}
		if ( index < 0 ) { return Promise.reject( '' ); }
		return this.use( index );
	}

	public use( index: number )
	{
		const card = this._get( index );
		if ( !card ) { return Promise.reject( 'Invalid index.' ); }
		const cardnum = card.order();
		if ( cardnum < 0 ) { return Promise.reject( 'Notfound.' ); }

		return new Promise<CARD_JSON>( ( resolve, reject ) =>
		{
			// TODO: transitionend
			card.unset();
			resolve( this.deck[ cardnum ] );
		} );
	}

	public arrange()
	{
		for ( let i = 0 ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].exist() ) { continue; }
			for ( let j = i + 1 ; j < this.hand.length ; ++j )
			{
				if ( !this.hand[ j ].exist() ) { continue; }
				//this.hand[ i ].set( this.hand[ j ].card() );
				//this.hand[ j ].unset();
				this.hand[ i ].swap( this.hand[ j ] );
				break;
			}
		}
	}

	public behind( index: number )
	{
		// Del first and add last.

		const card = this._get( index );
		if ( !card ) { return false; }
		if ( !card.exist() ) { return false; }

		const backup = card.backup();
		card.unset();
		this.arrange();
		for ( let i = index ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].exist() ) { continue; }
			this.hand[ i ].restore( backup );
			break;
		}
	}

	public select( index: number, select: boolean )
	{
		const card = this._get( index );
		if ( !card ) { return false; }
		if ( !card.exist() ) { return false; }

console.log('select:',index,select);
		if ( select )
		{
			let count: number = 0;
			for ( let i = 0 ; i < this.hand.length ; ++i )
			{
				if ( this.hand[ i ].selected() ) { ++count; }
			}
			if ( card.selected() || 3 <= count ) { return false; }
			card.select( count );
		} else if( card.selected() )
		{
			const count = card.order();

			for ( let i = 0 ; i < this.hand.length ; ++i )
			{
				if ( !this.hand[ i ].selected() ){ continue; }
				const n = this.hand[ i ].order();
				if ( count <= n ) { this.hand[ i ].select( n - 1 ); }
			}
			card.deselect();
		}

		return true;
	}

	private _get( index: number )
	{
		if ( index < 0 || this.hand.length <= index ) { return null; }
		return this.hand[ index ];
	}

	public size() { return this.stack.length; }

	public selected()
	{
		let count = 0;
		for ( let i = 0 ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].selected() ) { ++count; }
		}
		return count;
	}

	public hands()
	{
		let count = 0;
		for ( let i = 0 ; i < this.hand.length ; ++i )
		{
			if ( this.hand[ i ].exist() ) { ++count; }
		}
		return count;
	}

	public empty()
	{
		return this.size() <= 0 && this.hands() <= 0;
	}
}

class ActionButtons
{
	private dungeon: Dungeon;
	private buttons: HTMLElement;
	private quantity: HTMLElement;

	constructor( dungeon: Dungeon, buttons: HTMLElement )
	{
		this.dungeon = dungeon;
		this.buttons = buttons;

		this.quantity = <HTMLElement>buttons.querySelector( '.quantity' );

		const l = <HTMLElement>buttons.querySelector( '.crosskey .l' );
		const r = <HTMLElement>buttons.querySelector( '.crosskey .r' );
		const u = <HTMLElement>buttons.querySelector( '.crosskey .u' );
		const d = <HTMLElement>buttons.querySelector( '.crosskey .d' );
		const w = <HTMLElement>buttons.querySelector( '.crosskey .w' );

		Common.addClick( l, () => { this.move( 8 ); } );
		Common.addClick( r, () => { this.move( 2 ); } );
		Common.addClick( u, () => { this.move( 1 ); } );
		Common.addClick( d, () => { this.move( 4 ); } );
		Common.addClick( w, () => { dungeon.nextTurn(); } );

		const reload = <HTMLElement>buttons.querySelector( '.reload' );
		Common.addClick( reload, () => { dungeon.reload(); } );
	}

	public update( cm: CardManager )
	{
		this.quantity.textContent = cm.size() + '';
		if ( cm.empty() )
		{
			this.buttons.classList.remove( 'move' );
		} else
		{
			this.buttons.classList.add( 'move' );
		}
	}

	private move( direction: number )
	{
		if ( !this.buttons.classList.contains( 'move' ) ) { return; }
		this.dungeon.move( direction );
	}
}

class Dungeon
{
	private map: HTMLElement;
	private hand: HTMLElement;
	private cards: HTMLElement[];
	private cm: CardManager;
	private buttons: ActionButtons;
	private dungeon: MogeDungeon;

	constructor( config: DungeonConfig )
	{
		this.map = <HTMLElement>config.dungeon.querySelector( '.map' );

		this.hand = <HTMLElement>config.dungeon.querySelector( '.hand' );
		this.buttons = new ActionButtons( this, <HTMLElement>config.dungeon.querySelector( '.buttons' ) );

		this.cards = [];
		const cards = config.dungeon.querySelectorAll( '.card' );
		for ( let i = 0 ; i < cards.length ; ++i ) { this.initCardAction( <HTMLElement>cards[ i ], i ); }

	}

	private isFlick( begin: Event, end: Event )
	{
		const flick = Common.flick( begin, end );// TODO: distance
console.log(flick,flick.direction,Number.isNaN( flick.direction ));
		return !Number.isNaN( flick.direction );
	}

	public initCardAction( element: HTMLElement, index: number )
	{
		this.cards.push( element );
		Common.addTap( element, 500, ( data ) =>
		{
			if ( this.isFlick( data.begin, data.end ) )
			{
console.log('Flick');
				this.cm.behind( index );
			} else
			{
console.log('Select');
				this.selectCard( index );
			}
		}, () =>
		{
			if ( element.dataset.select )
			{
				this.deselectCard( index );
			} else
			{
				this.showCard( index );
			}
		} );
	}

	public init( cm: CardManager )
	{
		this.cm = cm;
		cm.init( this.cards );
	}

	private selectCard( index: number )
	{
		if ( index < 0 || this.cards.length <= index || !this.cards[ index ].dataset.card ) { return; }
		let i: number;
		if ( !this.cm.select( index, true ) ) { return; }
		this.buttons.update( this.cm );
if ( 3 <= this.cm.selected() ) { this.action(); }
	}

	private deselectCard( index: number )
	{
		if ( index < 0 || this.cards.length <= index ) { return; }
		if ( !this.cm.select( index, false ) ) { return; }
		this.buttons.update( this.cm );
	}

	private action()
	{
		this.hand.classList.add( 'hide' );
	}

	public nextTurn()
	{
		if ( !this.cm.draw() ) { this.reload(); }
		this.dungeon.update();
this.dungeon._render( this.map );
	}

	public reload()
	{
		this.cm.reload();
		this.buttons.update( this.cm );
	}

	public draw()
	{
		if ( this.cm.size() <= 0 )
		{
			this.cm.drawFull();
		} else
		{
			this.cm.draw();
		}
		this.buttons.update( this.cm );
this.hand.classList.remove( 'hide' );
	}

	public move( direction: number )
	{
console.log( 'move:', direction );


		if ( this.cm.selected() <= 0 ) { this.cm.select( 0, true ); }


		this.cm.useFirst().then( ( card ) =>
		{
console.log(card);
this.dungeon.action( direction, card );
if(this.cm.selected() <= 0 ){this.draw();}
this.dungeon._render( this.map );
		} ).catch( ( error ) =>
		{
console.log(error);
this.draw();
this.dungeon._render( this.map );
		} );
	}

	private showCard( index: number )
	{
		if ( index < 0 || this.cards.length <= index || !this.cards[ index ].dataset.card ) { return; }
console.log('show:',index,this.cards[ index ].dataset.card);
	}

	public render( dungeon: MogeDungeon )
	{
		this.dungeon = dungeon;

this.dungeon._render( this.map );
	}
}

