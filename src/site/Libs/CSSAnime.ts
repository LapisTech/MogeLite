class CSSAnime
{
	private element: HTMLElement;
	private endanimes: ( ( value?: {} ) => void )[];

	constructor( element: HTMLElement )
	{
		this.element = element;
		this.endanimes = [];
		element.addEventListener( 'transitionend', ( event: TransitionEvent ) =>
		{
			while ( 0 < this.endanimes.length )
			{
				const f = this.endanimes.shift();
				if ( f ) { f( event ); }
			}
		}, false );
	}

	public play( exec?: () => any ): Promise<TransitionEvent>
	{
		return new Promise( ( resolve, reject ) =>
		{
			this.endanimes.push( resolve );
			if ( exec ) { exec(); }
		} );
	}

	public continuouslyChangeClass( ... argv: { add?: string[], remove?: string[], time?: number }[] )
	{
		return argv.reduce( ( prev, current ) =>
		{
			return prev.then( () =>
			{
				if ( ( !current.add && !current.remove ) || current.time )
				{
console.log('change class(time):',current);
					if ( current.add ) { this.element.classList.add( ... current.add ); }
					if ( current.remove ) { this.element.classList.remove( ... current.remove ); }
					return Common.sleep( current.time || 100 ).then( () => { return <TransitionEvent>document.createEvent( 'transitionevent' ); } );
				}
				return this.play( () =>
				{
console.log('change class:',current);
					if ( current.add ) { this.element.classList.add( ... current.add ); }
					if ( current.remove ) { this.element.classList.remove( ... current.remove ); }
				} );
			} );
		}, Promise.resolve( <TransitionEvent>document.createEvent( 'transitionevent' ) ) );
	}
}
