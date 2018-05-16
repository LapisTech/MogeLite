interface CardCategory
{
	0: 'all',
	1: 'common',
	2: 'special',
	3: 'equip',
}

interface USER_CARD_JSON
{
	lv: number[]; // LV + count. Lv1x3, Lv2x1 -> [ 3, 1 ]
}

interface CARD_JSON
{
	id: number;
	name: string;
	cate: number;
	data: USER_CARD_JSON;
}

interface USER_INFO_JSON
{
	id_str: string;
	name: string;
}

interface HOME_DATA_JSON
{
	user: USER_INFO_JSON;

}
