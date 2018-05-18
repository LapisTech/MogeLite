class Common
{
	public static addClick( element: HTMLElement, callback: ( event: MouseEvent ) => any )
	{
		element.addEventListener( 'click', ( event ) =>
		{
			event.preventDefault();
			event.stopPropagation();
			callback( event );
		}, false );
	}

	public static addTap( element: HTMLElement, time: number, ontap: ( data: { begin: Event, end: Event, touch: boolean } ) => any, onlongtap: ( data: { begin: Event, end: Event, touch: boolean } ) => any )
	{
		let begin: number = 0;
		let prev: Event;
		let timer: number;

		element.addEventListener( 'touchstart', ( event: TouchEvent ) =>
		{
			if ( 0 < begin ) { return; }
			begin = Date.now();
			prev = event;
			timer = setTimeout( () => { if ( 0 < begin ) { begin = 0; onlongtap( { begin: prev, end: event, touch: true } ); } timer = 0; }, time );
		}, false );

		element.addEventListener( 'touchend', ( event: TouchEvent ) =>
		{
			// Cannot exec mouse event.
			event.preventDefault();

			if ( begin <= 0 ) { return; }
			const t = Date.now() - begin;
			begin = 0;
			clearTimeout( timer );
			if ( time <= t )
			{
				// Long tap
				onlongtap( { begin: prev, end: event, touch: true } );
			} else
			{
				ontap( { begin: prev, end: event, touch: true } );
			}
		} );

		element.addEventListener( 'mousedown', ( event ) =>
		{
			if ( 0 < begin ) { return; }
			begin = Date.now();
			prev = event;
			timer = setTimeout( () => { if ( 0 < begin ) { begin = 0; onlongtap( { begin: prev, end: event, touch: false } ); } timer = 0; }, time );
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
				onlongtap( { begin: prev, end: event, touch: false } );
			} else
			{
				ontap( { begin: prev, end: event, touch: false } );
			}
		} );
	}

	private static getPoint( event: Event, key?: 'touches' | 'changedTouches' ): { screenX: number, screenY: number, clientX: number, clientY: number, pageX: number, pageY: number }
	{
		if ( key && (<TouchEvent>event)[ key ] )
		{
			return (<TouchEvent>event)[ key ][ 0 ];
		}
		return (<MouseEvent>event);
	}

	public static flick( begin: Event, end: Event, distance: number = 20 )
	{
		const p0 = this.getPoint( begin, 'touches' );
		const p1 = this.getPoint( end, 'changedTouches');
		const data = { begin: p0, end: p1, vec: { x: p1.pageX - p0.pageX, y: p1.pageY - p0.pageY }, direction: NaN };

		if ( distance * distance <= data.vec.x * data.vec.x + data.vec.y * data.vec.y )
		{
			data.direction = Math.atan2( data.vec.y, data.vec.x );
		}

		return data;
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