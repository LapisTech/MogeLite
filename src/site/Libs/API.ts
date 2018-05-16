class API
{
	public static get<T>( url: string )
	{
		return fetch( url ).then( ( response ) =>
		{
			if ( !response.ok ) { throw 'Error'; }
			return response.json();
		} ).then( ( json ) => { return <T>json; } );
	}

	public static user =
	{
		data: () =>
		{
			return Promise.resolve( <HOME_DATA_JSON>{ user: {} } );
			//return API.get<HOME_DATA_JSON>( '/user/data' );
		},
		cards: () =>
		{
			return Promise.resolve( <{cards:CARD_JSON[]}>{ cards: [] } );
			//return API.get<{cards:CARD_JSON[]}>( '/user/cards' );
		},
	};
}