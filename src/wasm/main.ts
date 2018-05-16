/// <reference path="../../node_modules/assemblyscript/assembly.d.ts" />

export const X: u32 = 123456789;
export const Y: u32 = 362436069;
export const Z: u32 = 521288629;
export const W: u32 = 88675123;
let x: u32 = X;
let y: u32 = Y;
let z: u32 = Z;
let w: u32 = W;

export function seed( a: u32 = 0, b: u32 = 0, c: u32 = 0, d: u32 = 0 ): void
{
	if ( !a && !b && !c && !d )
	{
		a = X;
		b = Y;
		c = Z;
		d = W;
	}
	x = a;
	y = b;
	z = c;
	w = d;
}

export function nextInt(): u32
{
	const t: u32 = ( x ^ ( x << 11 ) );
	x = y;
	y = z;
	z = w;
	w = ( w ^ ( w >> 19 ) ^ ( t ^ ( t >> 8 ) ) );

	return w;
}

export function next(): f64
{
	return <f64>nextInt() / 0xffffffff;
}

