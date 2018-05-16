class WasmLib implements WasmblyLib
{

	public rand: Random;

	constructor( bytes?: ArrayBuffer )
	{
		if ( bytes )
		{
			const wasm = new WebAssembly.Instance( new WebAssembly.Module( bytes ) );
			this.rand =
			{
				seed: wasm.exports.seed,
				nextInt: wasm.exports.nextInt,
				next: wasm.exports.next,
				load: () => { return { x: wasm.exports.X, y: wasm.exports.Y, z: wasm.exports.Z, w: wasm.exports.W } },
			};
		} else
		{
			this.rand =
			{
				seed: () => {},
				nextInt: () => { return Math.floor( Math.random() * 0xffffffff ); },
				next: () => { return Math.random(); },
				load: () => { return { x: 0, y: 0, z: 0, w: 0 } },
			};
		}
	}
}

function LoadWLib()
{
	return fetch( './libs.wasm' )
		.then( ( response ) => { return response.arrayBuffer(); } )
		.then( ( bytes ) => { return new WasmLib( bytes ); } )
		.catch( ( error ) => { return new WasmLib(); } );
}
