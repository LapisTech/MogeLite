/// <reference path="../type.d.ts" />

// TODO: del
/// <reference path="wasm.d.ts" />

interface Random
{
	seed: ( a: number, b: number, c: number, d: number ) => void;
	nextInt: () => number;
	next: () => number;
	load: () => { x: number, y: number, z: number, w: number };
}

interface WasmblyLib
{
	rand: Random;
}

declare const WLib: WasmblyLib;

declare const CardCate: CardCategory;
