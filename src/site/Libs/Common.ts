class Common
{
	public static addClick( element: HTMLElement, callback: ( event: MouseEvent ) => any )
	{
		element.addEventListener( 'click', ( event ) =>
		{
			event.stopPropagation();
			callback( event );
		}, false );
	}

	public static addTap( element: HTMLElement, time: number, ontap: ( event: Event ) => any, onlongtap: ( event: Event ) => any )
	{
		let begin: number = 0;
		let timer: number;

		element.addEventListener( 'touchstart', ( event ) =>
		{
			if ( 0 < begin ) { return; }
			begin = Date.now();
			timer = setTimeout( () => { if ( 0 < begin ) { begin = 0; onlongtap( event ); } timer = 0; }, time );
		}, false );

		element.addEventListener( 'touchend', ( event ) =>
		{
			event.preventDefault();
			if ( begin <= 0 ) { return; }
			const t = Date.now() - begin;
			begin = 0;
			clearTimeout( timer );
			if ( time <= t )
			{
				// Long tap
				onlongtap( event );
			} else
			{
				ontap( event );
			}
		} );

		element.addEventListener( 'mousedown', ( event ) =>
		{
			if ( 0 < begin ) { return; }
			begin = Date.now();
			timer = setTimeout( () => { if ( 0 < begin ) { begin = 0; onlongtap( event ); } timer = 0; }, time );
		}, false );

		element.addEventListener( 'mouseup', ( event ) =>
		{
			if ( begin <= 0 ) { return; }
			const t = Date.now() - begin;
			begin = 0;
			clearTimeout( timer );
			if ( time <= t )
			{
				// Long tap
				onlongtap( event );
			} else
			{
				ontap( event );
			}
		} );
	}

	public static shuffle<T>( list: T[] )
	{
		let n = list.length;
		while ( n )
		{
			const i = Math.floor( Math.random() * n-- );
			const t = list[ n ];
			list[ n ] = list[ i ];
			list[ i ] = t;
		}

		return list;
	}

}