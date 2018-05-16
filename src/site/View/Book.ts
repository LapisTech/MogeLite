interface BookConfig
{
	book: HTMLElement,
	template:
	{
		card_item: HTMLTemplateElement,
	};
}

class Book
{
	private book: HTMLElement;
	private list: HTMLElement;
	private detail: HTMLElement;
	private cards: CARD_JSON[];
	private config: BookConfig;

	constructor( config: BookConfig, app: App )
	{
		this.config = config;
		this.cards = [];
		this.book = <HTMLElement>config.book.querySelector( '.book' );
		this.list = <HTMLElement>config.book.querySelector( '.list' );
		this.detail = <HTMLElement>config.book.querySelector( '.card_detail' );

		this.load();
		this.initTabs( config.book );
		this.initDetail();
	}

	private initTabs( book: HTMLElement )
	{
		const tabs = (<HTMLElement>book.querySelector( '.tabs' )).children;

		for ( let i = 0 ; i < tabs.length ; ++i )
		{
			this.initTabEvent( <HTMLElement>tabs[ i ] );
		}

		const prev = book.querySelector( '.prev' );
		const next = book.querySelector( '.next' );
	}

	private initTabEvent( tab: HTMLElement )
	{
		if ( !tab.dataset || !tab.dataset.cate ) { return; }

		// Init selected tab.
		if ( !this.book.dataset.cate ) { this.book.dataset.cate = tab.dataset.cate; }

		tab.addEventListener( 'click', ( event ) =>
		{
			this.defaultEvent( event );
			this.changeTab( <string>tab.dataset.cate );
		} );
	}

	private initDetail(){}

	private closeDetail()
	{
		this.detail.classList.remove( 'show' );
	}

	private changeTab( tab: string )
	{
		if ( tab === this.book.dataset.cate ) { return; }
		// TODO:
		this.book.dataset.cate = tab;
	}

	private defaultEvent( event: Event )
	{
		event.stopPropagation();
	}

	private load()
	{
		return API.user.cards().then( ( data ) =>
		{
			this.cards = data.cards;
		} );
	}

	private getCategoryNum( cate: string )
	{
		const c = <(keyof CardCategory)[]>Object.keys( CardCate );
		for ( let i = 0 ; i < c.length ; ++i )
		{
			if ( CardCate[ c[ i ] ] === cate ) { return parseInt( c[ i ] ); }
		}
		return 0;
	}

	private renderBook( force = false )
	{
		const cate = this.book.dataset.cate || 'all';
		const cateNum = this.getCategoryNum( cate );

		const p = this.cards.length <= 0 || force ? this.load() : Promise.resolve();

		return p.then( () => { return this.cards.filter( ( card ) => { return card.cate === cateNum; } ) } ).then( ( cards ) =>
		{
			this.list.innerHTML = '';

			const template = this.config.template.card_item;

			cards.forEach( ( card ) =>
			{
				const item = document.importNode( template.content, true );
				// TODO: write data.

				item.addEventListener( 'click', ( event ) =>
				{
					this.defaultEvent( event );
					this.renderDetail( card );
				}, false );
				this.list.appendChild( item );
			} );
		} );
	}

	private renderDetail( card: CARD_JSON )
	{
		this.detail.classList.add( 'show' );

		//this.list.dataset.card = card.id + '';

		const title = <HTMLElement>this.detail.querySelector( 'card_title' );
		title.textContent = card.name;

		
	}
}
