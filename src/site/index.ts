/// <reference path="./type.d.ts" />
/// <reference path="./Libs/App.ts" />

function BrowserCheck()
{
	// fetch, Promise
	if ( typeof fetch !== 'function' ) { return false; }

	// <template>
	if ( !( 'content' in document.createElement( 'template' ) ) ) { return false; }

	// <dialog>
	var dialog = <HTMLDialogElement>document.createElement( 'dialog' );
	if ( typeof dialog.showModal !== 'function' || typeof dialog.close !== 'function' ) { return false; }

	// Custom Elements.
	if ( !( 'customElements' in window ) || typeof customElements.define !== 'function' ) { return false; }

	// Custom Elements v1.
	/*customElements.define( 'ce-test', class extends HTMLButtonElement{}, { extends: 'button' } );
	var e = <HTMLButtonElement>document.createElement( 'ce-test' );
	if ( e.type !== 'button' ) { return false; }
	customElements.define( 'ce-test', class extends HTMLInputElement{}, { extends: 'input' } );
	var e = <HTMLInputElement>document.createElement( 'ce-test' );
	if ( typeof e.value !== 'string' ) { return false; }
	customElements.define( 'ce-test', class extends HTMLInputElement{ set value( v ) {} get value() { return ''; } }, { extends: 'input' } );
	var e = <HTMLInputElement>document.createElement( 'ce-test' );
	if ( typeof e.value !== 'string' ) { return false; }*/

	// CSS Custom properties
	var style = document.createElement('style').style;
	style.setProperty( '--test', '0' );
	if ( style.getPropertyValue( '--test' ) !== '0' ){ return false; }

	// ServiceWorker?
	if ( !( 'serviceWorker' in navigator ) ) { return false; }

	// imageSmoothingEnabled check.
	var context = <any>document.createElement( 'canvas' ).getContext( '2d' );
	if ( context.imageSmoothingEnabled === undefined && context.webkitImageSmoothingEnabled === undefined && context.mozImageSmoothingEnabled === undefined && context.msImageSmoothingEnabled === undefined ) { return false; }

	// This browser is modern.
	return true;
}

function Localize( lang?: string )
{
	if ( !lang ) { lang = navigator.language; }

	const children = document.head.children;
	let def = "./localize/default.css?0";
	for ( let i = 0 ; i < children.length ; ++i )
	{
		if ( children[ i ].tagName !== 'link' ) { continue; }
		const link = <HTMLLinkElement>children[ i ];
		if ( link.rel !== 'stylesheet' ) { continue; }
		const l = link.href.replace( /^.*localize\/([a-zA-Z\-\_]+)\.css.*$/, '$1' );
		if ( l === 'default' ) { def = link.href; }
		if ( l === lang ) { return; }
	}

	const cls = document.body.classList;
	for ( let i = 0 ; i < cls.length ; ++i )
	{
		if( cls[ i ] === lang ) { continue; }
		document.body.classList.remove( cls[ i ] );
	}

	document.body.classList.add( lang );

	// New load.
	const link = document.createElement( 'link' );
	link.rel = 'stylesheet';
	link.type = 'text/css';
	link.href = def.replace( 'default', lang );
	document.head.appendChild( link );
}

document.addEventListener( 'DOMContentLoaded', () =>
{
	Localize();

	if ( !BrowserCheck() ) { return; }

	(<HTMLElement>document.getElementById( 'legacy' )).classList.remove( 'show' );

	/*if ( location.protocol === 'https' )
	{
		navigator.serviceWorker.register( '/sw.js?1', { scope: '/' } );
	}*/

	const cate: CardCategory =
	{
		0: 'all',
		1: 'common',
		2: 'special',
		3: 'equip',
	};
	(<any>window).CardCate = cate;

	const app = new App(
	{
		loading: <HTMLElement>document.getElementById( 'loading' ),
		contents: <HTMLElement>document.getElementById('contents'),
		top:
		{
			top: <HTMLElement>document.getElementById('top'),
			login: <HTMLButtonElement>document.getElementById('login'),
			nora: <HTMLButtonElement>document.getElementById('nora'),
		},
		home:
		{
			home: <HTMLElement>document.getElementById('home'),
		},
		bar: <HTMLElement>document.getElementById('bar'),
		dungeon:
		{
			dungeon: <HTMLElement>document.getElementById( 'dungeon' ),
		},
	} );

	app.init().then( () =>
	{

		// Start.
console.log( 'start' );
	} );
} );
