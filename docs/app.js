class WasmLib {
    constructor(bytes) {
        if (bytes) {
            const wasm = new WebAssembly.Instance(new WebAssembly.Module(bytes));
            this.rand =
                {
                    seed: wasm.exports.seed,
                    nextInt: wasm.exports.nextInt,
                    next: wasm.exports.next,
                    load: () => { return { x: wasm.exports.X, y: wasm.exports.Y, z: wasm.exports.Z, w: wasm.exports.W }; },
                };
        }
        else {
            this.rand =
                {
                    seed: () => { },
                    nextInt: () => { return Math.floor(Math.random() * 0xffffffff); },
                    next: () => { return Math.random(); },
                    load: () => { return { x: 0, y: 0, z: 0, w: 0 }; },
                };
        }
    }
}
function LoadWLib() {
    return fetch('./libs.wasm')
        .then((response) => { return response.arrayBuffer(); })
        .then((bytes) => { return new WasmLib(bytes); })
        .catch((error) => { return new WasmLib(); });
}
class Common {
    static addClick(element, callback) {
        element.addEventListener('click', (event) => {
            event.preventDefault();
            event.stopPropagation();
            callback(event);
        }, false);
    }
    static addTap(element, time, ontap, onlongtap) {
        let begin = 0;
        let prev;
        let timer;
        element.addEventListener('touchstart', (event) => {
            if (0 < begin) {
                return;
            }
            begin = Date.now();
            prev = event;
            timer = setTimeout(() => { if (0 < begin) {
                begin = 0;
                onlongtap({ begin: prev, end: event, touch: true });
            } timer = 0; }, time);
        }, false);
        element.addEventListener('touchend', (event) => {
            event.preventDefault();
            if (begin <= 0) {
                return;
            }
            const t = Date.now() - begin;
            begin = 0;
            clearTimeout(timer);
            if (time <= t) {
                onlongtap({ begin: prev, end: event, touch: true });
            }
            else {
                ontap({ begin: prev, end: event, touch: true });
            }
        });
        element.addEventListener('mousedown', (event) => {
            if (0 < begin) {
                return;
            }
            begin = Date.now();
            prev = event;
            timer = setTimeout(() => { if (0 < begin) {
                begin = 0;
                onlongtap({ begin: prev, end: event, touch: false });
            } timer = 0; }, time);
        }, false);
        element.addEventListener('mouseup', (event) => {
            if (begin <= 0) {
                return;
            }
            const t = Date.now() - begin;
            begin = 0;
            clearTimeout(timer);
            if (time <= t) {
                onlongtap({ begin: prev, end: event, touch: false });
            }
            else {
                ontap({ begin: prev, end: event, touch: false });
            }
        });
    }
    static getPoint(event, key) {
        if (key && event[key]) {
            return event[key][0];
        }
        return event;
    }
    static flick(begin, end, distance = 20) {
        const p0 = this.getPoint(begin, 'touches');
        const p1 = this.getPoint(end, 'changedTouches');
        const data = { begin: p0, end: p1, vec: { x: p1.pageX - p0.pageX, y: p1.pageY - p0.pageY }, direction: NaN };
        if (distance * distance <= data.vec.x * data.vec.x + data.vec.y * data.vec.y) {
            data.direction = Math.atan2(data.vec.y, data.vec.x);
        }
        return data;
    }
    static shuffle(list) {
        let n = list.length;
        while (n) {
            const i = Math.floor(Math.random() * n--);
            const t = list[n];
            list[n] = list[i];
            list[i] = t;
        }
        return list;
    }
}
class API {
    static get(url) {
        return fetch(url).then((response) => {
            if (!response.ok) {
                throw 'Error';
            }
            return response.json();
        }).then((json) => { return json; });
    }
}
API.user = {
    data: () => {
        return Promise.resolve({ user: {} });
    },
    cards: () => {
        return Promise.resolve({ cards: [] });
    },
};
class UserData {
    constructor(app) {
        this.app = app;
        this.nextReload();
    }
    init() {
        return this.reloadMypage();
    }
    nextReload() { this.reload = true; }
    reloadMypage(force = false) {
        return ((this.reload || force) ? API.user.data() : Promise.resolve(this.data)).then((data) => {
            this.data = data;
            this.app.updateHomeData(data);
        });
    }
    getUserData() { return this.data.user; }
}
var Rogue;
(function (Rogue) {
    class BitCanvas {
        constructor(width, height) {
            this.canvas = [];
            this.w = width;
            this.h = height;
            for (let i = width * height; 0 < i; --i) {
                this.canvas.push(false);
            }
        }
        width() { return this.w; }
        height() { return this.h; }
        inCanvas(x, y) { return !(x < 0 || this.w <= x || y < 0 || this.h <= y); }
        clear(x = 0, y = 0, w = this.w, h = this.h) {
            this.rect(x, y, w, h, false);
            return this;
        }
        get(x, y) {
            if (x < 0 || this.w <= x) {
                return false;
            }
            if (y < 0 || this.h <= y) {
                return false;
            }
            return this.canvas[y * this.w + x];
        }
        getBits() { return this.canvas; }
        pixel(x, y, bit = true) {
            if (x < 0 || this.w <= x) {
                return this;
            }
            if (y < 0 || this.h <= y) {
                return this;
            }
            x = Math.floor(x);
            y = Math.floor(y);
            this.canvas[y * this.w + x] = bit;
            return this;
        }
        line(x0, y0, x1, y1, bit = true) {
            const dx = Math.abs(x1 - x0);
            const dy = Math.abs(y1 - y0);
            const sx = x0 < x1 ? 1 : -1;
            const sy = y0 < y1 ? 1 : -1;
            let err = dx - dy;
            x1 = Math.floor(x1);
            y1 = Math.floor(y1);
            while (true) {
                this.pixel(x0, y0, bit);
                if (Math.floor(x0) === x1 && Math.floor(y0) === y1) {
                    break;
                }
                const e2 = 2 * err;
                if (-dy < e2) {
                    err = err - dy;
                    x0 = x0 + sx;
                }
                if (e2 < dx) {
                    err = err + dx;
                    y0 = y0 + sy;
                }
            }
            return this;
        }
        rect(x, y, w, h, bit = true) {
            w = Math.floor(w);
            h = Math.floor(h);
            if (w === 0 || h === 0) {
                return;
            }
            x = Math.floor(x);
            y = Math.floor(y);
            if (w < 0) {
                x += w;
                w = -w;
            }
            if (h < 0) {
                y += h;
                h = -h;
            }
            for (let b = 0; b < h; ++b) {
                for (let a = 0; a < w; ++a) {
                    this.pixel(x + a, y + b, bit);
                }
            }
            return this;
        }
        toString(f = ' ', t = '█') {
            return this.canvas.map((v, i) => { return (v ? t : f) + ((i + 1) % this.w === 0 ? '\n' : ''); }).join('');
        }
    }
    Rogue.BitCanvas = BitCanvas;
    class Dungeon {
        constructor() {
            this.x = 2;
            this.y = 3;
        }
        generate(random) {
            this.map = new Map(20, 20, this.x, this.y);
            this.map.init(3, 3);
            console.log(this.map.toStringRouteMap());
            const routes = this.map.getRoutes();
            let n = routes.length;
            while (n) {
                const i = Math.floor(random.next() * n--);
                const t = routes[n];
                routes[n] = routes[i];
                routes[i] = t;
            }
            for (let i = 0; i < routes.length; ++i) {
                this.map.disconnect(routes[i], this.map.generateRoom().getRooms());
            }
            console.log(this.map.toStringRouteMap());
            this.map.generateRoom().getRooms().forEach((room) => {
                const W = room.areaWidth();
                const H = room.areaHeight();
                let x = room.areaX();
                let y = room.areaY();
                if (x <= this.x && this.x < x + W && y <= this.y && this.y < y + H) {
                }
                let w = Math.floor(W * (random.next() / 2 + 0.5));
                let h = Math.floor(H * (random.next() / 2 + 0.5));
                if (1 < W && W <= w) {
                    --w;
                }
                if (1 < H && H <= h) {
                    --h;
                }
                x = Math.floor((W - w) * random.next());
                y = Math.floor((H - h) * random.next());
                if (W <= x + w) {
                    w = W - x - 1;
                    if (w <= 0) {
                        w = 1;
                    }
                }
                if (H <= y + h) {
                    h = H - y - 1;
                    if (y <= 0) {
                        y = 1;
                    }
                }
                room.setDrawArea(w, h, x, y);
            });
            this.map.render();
            console.log(this.map.toString());
            this.map.render(this.createRoute(random));
            console.log(this.map.toString());
            return this;
        }
        getCanvas() { return this.map.getCanvas(); }
        createRoute(random) {
            const ret = [];
            this.map.getRoutes().forEach((route) => {
                Array.prototype.push.apply(ret, this.prepareRoute(route, random));
            });
            return ret;
        }
        prepareRoute(route, random) {
            const r = this.map.connectedRooms(route);
            const type = r[0].neighboring(r[1]);
            switch (type) {
                case 1: return this.createRouteV(r[1], r[0], random);
                case 4: return this.createRouteV(r[0], r[1], random);
                case 2: return this.createRouteH(r[0], r[1], random);
                case 8: return this.createRouteH(r[1], r[0], random);
            }
            return [];
        }
        createRouteV(u, d, random) {
            const routes = [];
            let v = u.roomX() + Math.floor(u.roomWidth() * random.next());
            routes.push({
                x0: v, y0: u.roomY() + u.roomHeight(),
                x1: v, y1: u.areaY() + u.areaHeight(),
            });
            v = d.roomX() + Math.floor(d.roomWidth() * random.next());
            routes.push({
                x0: v, y0: routes[0].y1,
                x1: v, y1: d.roomY(),
            });
            v = routes[0].y1;
            routes.push({
                x0: Math.min(routes[0].x0, routes[1].x0), y0: v,
                x1: Math.max(routes[0].x0, routes[1].x0), y1: v,
            });
            return routes;
        }
        createRouteH(l, r, random) {
            const routes = [];
            let v = l.roomY() + Math.floor(l.roomHeight() * random.next());
            routes.push({
                x0: l.roomX() + l.roomWidth(), y0: v,
                x1: l.areaX() + l.areaWidth(), y1: v,
            });
            v = r.roomY() + Math.floor(r.roomHeight() * random.next());
            routes.push({
                x0: routes[0].x1, y0: v,
                x1: r.roomX(), y1: v,
            });
            v = routes[0].x1;
            routes.push({
                x0: v, y0: Math.min(routes[0].y0, routes[1].y0),
                x1: v, y1: Math.max(routes[0].y0, routes[1].y0),
            });
            return routes;
        }
    }
    Rogue.Dungeon = Dungeon;
    class Map {
        constructor(width, height, x, y) {
            this.w = Math.floor(width);
            this.h = Math.floor(height);
            this.map = new BitCanvas(this.w, this.h);
        }
        init(w, h) {
            this.c = w;
            this.r = h;
            this.route = new Route(w, h);
            this.rooms = [];
            for (let i = w * h; 0 < i; --i) {
                this.rooms.push(new Room());
            }
            return this;
        }
        getCanvas() { return this.map; }
        toStringRouteMap() {
            const R = [' ', '╹', '╺', '┗', '╻', '┃', '┏', '┣', '╸', '┛', '━', '┻', '┓', '┫', '┳', '╋'];
            let r = '';
            for (let y = 0; y < this.route.getHeight(); ++y) {
                for (let x = 0; x < this.route.getWidth(); ++x) {
                    r += R[this.route.routePattern(y * this.route.getHeight() + x)];
                }
                r += '\n';
            }
            return r;
        }
        toString(f, t) { return this.map.toString(f, t); }
        getRoutes() { return this.route.getRoutes(); }
        connectedRooms(route) {
            const rooms = this.route.getConnectedRoom(route);
            return [this.rooms[rooms.a], this.rooms[rooms.b]];
        }
        disconnect(route, rooms) {
            this.route.disconnect(route);
            if (this.route.checkRoute(rooms)) {
                return true;
            }
            this.route.connect(route);
            return false;
        }
        remove(room) { return this.route.remove(room); }
        fixSplit(list = [], split, max) {
            const nlist = [];
            let count = 0;
            for (let i = 0; i < split; ++i) {
                let value = Math.floor(i < list.length ? list[i] : 0);
                if (value <= 0) {
                    value = 1;
                }
                nlist.push(value);
                count += value;
            }
            if (count === max) {
                return nlist;
            }
            return nlist.map((v) => { return Math.floor(max * v / count); });
        }
        getRooms() { return this.rooms; }
        generateRoom(option) {
            if (!option) {
                option = {};
            }
            const cols = this.fixSplit(option.columns, this.c, this.w);
            const rows = this.fixSplit(option.rows, this.r, this.h);
            let y = 0;
            for (let r = 0; r < this.r; ++r) {
                let x = 0;
                for (let c = 0; c < this.c; ++c) {
                    if (0 < this.route.getConnectedRoute(this.route.calcRoomNumber(r, c)).length) {
                        this.rooms[r * this.c + c].setArea(x, y, cols[c], rows[r]);
                    }
                    else {
                        this.rooms[r * this.c + c].remove();
                    }
                    x += cols[c];
                }
                y += rows[r];
            }
            this.getRoutes().forEach((route) => {
                const r = this.route.getConnectedRoom(route);
                this.rooms[r.a].connect(this.rooms[r.b]);
            });
            return this;
        }
        render(routes = []) {
            this.map.clear();
            this.getRooms().forEach((room) => {
                room.draw(this.map);
            });
            routes.forEach((line) => {
                this.map.line(line.x0, line.y0, line.x1, line.y1);
            });
            return this;
        }
    }
    class Room {
        constructor() {
            this.route = [];
            this.area = { x: 0, y: 0, w: 0, h: 0, _x: 0, _y: 0, _w: 0, _h: 0 };
        }
        areaX() { return this.area.x; }
        areaY() { return this.area.y; }
        areaWidth() { return this.area.w; }
        areaHeight() { return this.area.h; }
        roomX() { return this.area._x; }
        roomY() { return this.area._y; }
        roomWidth() { return this.area._w; }
        roomHeight() { return this.area._h; }
        removed() { return this.area._w <= 0 && this.area._h <= 0; }
        remove() {
            this.area._w = 0;
            this.area._h = 0;
            return this;
        }
        setArea(x, y, w, h) {
            this.area = { x: x, y: y, w: w, h: h, _x: x, _y: y, _w: w, _h: h };
            return this;
        }
        connect(room) {
            if (0 <= this.route.indexOf(room)) {
                return this;
            }
            this.route.push(room);
            room.connect(this);
            return this;
        }
        neighboring(room) {
            if (this.area.x === room.area.x) {
                if (room.area.y + room.area.h === this.area.y) {
                    return 1;
                }
                if (this.area.y + this.area.h === room.area.y) {
                    return 4;
                }
            }
            if (this.area.y === room.area.y) {
                if (room.area.x + room.area.w === this.area.x) {
                    return 8;
                }
                if (this.area.x + this.area.w === room.area.x) {
                    return 2;
                }
            }
            return 0;
        }
        setDrawArea(w, h, x, y) {
            this.area._x = Math.floor(this.area.x + x);
            this.area._y = Math.floor(this.area.y + y);
            this.area._w = Math.floor(w);
            this.area._h = Math.floor(h);
            return this;
        }
        draw(canvas) {
            if (this.area._w <= 0 || this.area._h <= 0) {
                return;
            }
            canvas.rect(this.area._x, this.area._y, this.area._w, this.area._h);
        }
    }
    class Route {
        constructor(w, h) {
            w = Math.floor(w);
            h = Math.floor(h);
            this.routes = [];
            this.w = w;
            this.h = h;
            this.init();
        }
        getWidth() { return this.w; }
        getHeight() { return this.h; }
        init() {
            for (let i = (this.w * this.h) * (2 + (this.w * this.h - 1)) / 2; 0 < i; --i) {
                this.routes.push(false);
            }
            for (let y = 0; y < this.h; ++y) {
                for (let x = 0; x < this.w; ++x) {
                    if (0 < x) {
                        this.connect(this.calcRoomNumber(x - 1, y), this.calcRoomNumber(x, y));
                    }
                    if (0 < y) {
                        this.connect(this.calcRoomNumber(x, y - 1), this.calcRoomNumber(x, y));
                    }
                }
            }
        }
        calcRoomNumber(x, y) { return y * this.w + x; }
        calcRouteNumber(a, b) {
            if (b < a) {
                [a, b] = [b, a];
            }
            return (b * b + b) / 2 + a;
        }
        getConnectedRoom(route) {
            if (route < 0) {
                return { a: -1, b: -1 };
            }
            let prev = 0;
            let next = 0;
            let b = 0;
            while (next <= route) {
                prev = next;
                ++b;
                next = (b * b + b) / 2;
            }
            return { a: route - prev, b: b - 1 };
        }
        getConnectedRoute(room) {
            const x = room % this.w;
            const y = Math.floor(room / this.w);
            let r;
            const routes = [];
            r = this.calcRoomNumber(x - 1, y);
            if (0 < x && this.routes[this.calcRouteNumber(room, r)]) {
                routes.push(r);
            }
            r = this.calcRoomNumber(x + 1, y);
            if (x + 1 < this.w && this.routes[this.calcRouteNumber(room, r)]) {
                routes.push(r);
            }
            r = this.calcRoomNumber(x, y - 1);
            if (0 < y && this.routes[this.calcRouteNumber(room, r)]) {
                routes.push(r);
            }
            r = this.calcRoomNumber(x, y + 1);
            if (y + 1 < this.h && this.routes[this.calcRouteNumber(room, r)]) {
                routes.push(r);
            }
            return routes;
        }
        connect(a, b) {
            this.routes[b === undefined ? a : this.calcRouteNumber(a, b)] = true;
        }
        disconnect(a, b) {
            this.routes[b === undefined ? a : this.calcRouteNumber(a, b)] = false;
        }
        remove(room) {
            let count = 0;
            this.getConnectedRoute(room).forEach((r) => {
                this.disconnect(room, r);
                ++count;
            });
            return count;
        }
        through(a, b) {
            return this.routes[this.calcRouteNumber(a, b)];
        }
        getRoutes() {
            const routes = [];
            this.routes.forEach((t, index) => { if (t) {
                routes.push(index);
            } });
            return routes;
        }
        routePattern(room) {
            let i = 0;
            if (this.w <= room && this.through(room, room - this.w)) {
                i += 1;
            }
            if (room % this.w < this.w - 1 && this.through(room, room + 1)) {
                i += 2;
            }
            if (room + this.w < this.w * this.h && this.through(room, room + this.w)) {
                i += 4;
            }
            if (0 < room % this.w && this.through(room, room - 1)) {
                i += 8;
            }
            return i;
        }
        checkRoute(r) {
            const rooms = r.map((room) => { return room.removed(); });
            this.fillRooms(rooms, 0, 0);
            for (let i = 0; i < rooms.length; ++i) {
                if (!rooms[i]) {
                    return false;
                }
            }
            return true;
        }
        fillRooms(rooms, x, y) {
            const room = this.calcRoomNumber(x, y);
            if (rooms[room]) {
                return;
            }
            rooms[room] = true;
            let i;
            i = this.calcRoomNumber(x - 1, y);
            if (0 < x && !rooms[i] && this.through(room, i)) {
                this.fillRooms(rooms, x - 1, y);
            }
            i = this.calcRoomNumber(x + 1, y);
            if (x + 1 < this.w && !rooms[i] && this.through(room, i)) {
                this.fillRooms(rooms, x + 1, y);
            }
            i = this.calcRoomNumber(x, y - 1);
            if (0 < y && !rooms[i] && this.through(room, i)) {
                this.fillRooms(rooms, x, y - 1);
            }
            i = this.calcRoomNumber(x, y + 1);
            if (y + 1 < this.h && !rooms[i] && this.through(room, i)) {
                this.fillRooms(rooms, x, y + 1);
            }
        }
    }
})(Rogue || (Rogue = {}));
class MogeDungeon {
    constructor() {
        this.chara = new ActionChara();
    }
    init(dungeon) {
        if (!dungeon) {
            dungeon = new Rogue.Dungeon();
            dungeon.generate(WLib.rand);
        }
        this.setBitmap(dungeon.getCanvas());
        for (let y = 0; y < this.bitmap.height(); ++y) {
            for (let x = 0; x < this.bitmap.width(); ++x) {
                if (this.bitmap.get(x, y)) {
                    this.chara.setPosition(x, y);
                    break;
                }
            }
        }
        return this;
    }
    setBitmap(bitmap) { this.bitmap = bitmap; return this; }
    setMap(map) { this.map = map; return this; }
    convert(conv) {
        this.setMap(conv(this.bitmap));
        return this;
    }
    action(direction, card) {
        const sx = Math.floor(direction < 8 ? (direction % 4) / 2 : (direction % 4) / 2 - 1);
        const sy = (direction % 8) < 4 ? -(direction % 2) : (direction + 1) % 2;
        const x = this.chara.x();
        const y = this.chara.y();
        if (!this.bitmap.inCanvas(x + sx, y + sy)) {
            return;
        }
        if (this.bitmap.get(x + sx, y + sy)) {
            this.chara.move(sx, sy);
        }
    }
    update() {
    }
    _render(e) {
        const map = this.bitmap.getBits().map((b) => { return b ? '.' : ' '; });
        map[this.chara.y() * this.bitmap.width() + this.chara.x()] = 'c';
        for (let i = this.bitmap.width() - 1; i < map.length; i += this.bitmap.width()) {
            map[i] += '\n';
        }
        e.innerHTML = '<pre>' + map.join('') + '</pre>';
    }
}
class ActionChara {
    constructor() { }
    setPosition(x, y) {
        this._x = x;
        this._y = y;
    }
    x() { return this._x; }
    y() { return this._y; }
    move(x, y) {
        this._x += x;
        this._y += y;
    }
}
class Chip {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    render() {
        const chip = document.createElement('div');
        chip.style.left = (this.x * 10) + '%';
        chip.style.top = (this.y * 10) + '%';
    }
}
class Top {
    constructor(config, app) {
        config.login.addEventListener('click', () => { app.nextHome(config.top); }, false);
        config.nora.addEventListener('click', () => { app.nextHome(config.top); }, false);
    }
}
class Home {
    constructor(app, config) {
        this.config = config;
        this.addClick('chara', () => { app.nextChara(this.config.home); });
        this.addClick('book', () => { app.nextBook(this.config.home); });
        this.addClick('dungeon', () => { app.nextDungeon(this.config.home); });
        this.addClick('bar', () => { app.nextBar(this.config.home); });
        this.addClick('menu', () => { app.nextMenu(this.config.home); });
    }
    addClick(cls, callback) {
        Common.addClick(this.config.home.querySelector('.' + cls), callback);
    }
    update(data) {
    }
}
class DrawCard {
    constructor(element) {
        this.element = element;
        this.unset();
        this.endanimes = [];
        element.addEventListener('transitionend', (event) => {
            new Promise((resolve) => { });
            while (0 < this.endanimes.length) {
                const f = this.endanimes.shift();
                if (f) {
                    f(event);
                }
            }
        }, false);
    }
    set(card) { this.element.dataset.card = card + ''; }
    unset() { this.element.dataset.card = ''; this.element.dataset.select = ''; }
    exist() { return !!this.element.dataset.card; }
    card() { return this.element.dataset.card ? parseInt(this.element.dataset.card) : -1; }
    select(order) { this.element.dataset.select = order + ''; }
    deselect() { this.element.dataset.select = ''; }
    selected() { return !!this.element.dataset.select; }
    order() { return this.element.dataset.select ? parseInt(this.element.dataset.select) : -1; }
    swap(target) {
        [this.element.dataset.card, target.element.dataset.card] = [target.element.dataset.card, this.element.dataset.card];
        [this.element.dataset.select, target.element.dataset.select] = [target.element.dataset.select, this.element.dataset.select];
    }
    backup() { return { card: this.element.dataset.card || '', select: this.element.dataset.select || '' }; }
    restore(data) {
        this.element.dataset.card = data.card;
        this.element.dataset.select = data.select;
    }
}
class CardManager {
    constructor(deck) {
        this.deck = deck;
        this.stack = [];
        this.hand = [];
    }
    addCard(card) {
        this.deck.push(card);
        this.stack.push(this.deck.length - 1);
        Common.shuffle(this.stack);
    }
    init(hand) {
        this.hand = hand.map((element) => { return new DrawCard(element); });
        CardManager.HAND_MAX = this.hand.length;
    }
    reload() {
        this.stack = this.deck.map((c, index) => { return index; });
        Common.shuffle(this.stack);
        this.hand.forEach((c) => { c.unset(); });
        for (let i = 0; i < CardManager.HAND_MAX; ++i) {
            this.draw();
        }
    }
    draw() {
        this.arrange();
        let i;
        for (i = 0; i < this.hand.length; ++i) {
            if (this.hand[i].exist()) {
                continue;
            }
            break;
        }
        if (this.hand.length <= i) {
            return false;
        }
        Common.shuffle(this.stack);
        const card = this.stack.shift();
        if (card === undefined) {
            return false;
        }
        this.hand[i].set(card);
        return true;
    }
    drawFull() {
        this.arrange();
        for (let i = 0; i < this.hand.length; ++i) {
            if (this.hand[i].exist()) {
                continue;
            }
            this.draw();
        }
    }
    useFirst() {
        let index = -1;
        for (let i = 0; i < this.hand.length; ++i) {
            if (!this.hand[i].selected()) {
                continue;
            }
            if (index < 0 || this.hand[i].order() < index) {
                index = i;
            }
        }
        if (index < 0) {
            return Promise.reject('');
        }
        return this.use(index);
    }
    use(index) {
        const card = this._get(index);
        if (!card) {
            return Promise.reject('Invalid index.');
        }
        const cardnum = card.order();
        if (cardnum < 0) {
            return Promise.reject('Notfound.');
        }
        return new Promise((resolve, reject) => {
            card.unset();
            resolve(this.deck[cardnum]);
        });
    }
    arrange() {
        for (let i = 0; i < this.hand.length; ++i) {
            if (this.hand[i].exist()) {
                continue;
            }
            for (let j = i + 1; j < this.hand.length; ++j) {
                if (!this.hand[j].exist()) {
                    continue;
                }
                this.hand[i].swap(this.hand[j]);
                break;
            }
        }
    }
    behind(index) {
        const card = this._get(index);
        if (!card) {
            return false;
        }
        if (!card.exist()) {
            return false;
        }
        const backup = card.backup();
        card.unset();
        this.arrange();
        for (let i = index; i < this.hand.length; ++i) {
            if (this.hand[i].exist()) {
                continue;
            }
            this.hand[i].restore(backup);
            break;
        }
    }
    select(index, select) {
        const card = this._get(index);
        if (!card) {
            return false;
        }
        if (!card.exist()) {
            return false;
        }
        console.log('select:', index, select);
        if (select) {
            let count = 0;
            for (let i = 0; i < this.hand.length; ++i) {
                if (this.hand[i].selected()) {
                    ++count;
                }
            }
            if (card.selected() || 3 <= count) {
                return false;
            }
            card.select(count);
        }
        else if (card.selected()) {
            const count = card.order();
            for (let i = 0; i < this.hand.length; ++i) {
                if (!this.hand[i].selected()) {
                    continue;
                }
                const n = this.hand[i].order();
                if (count <= n) {
                    this.hand[i].select(n - 1);
                }
            }
            card.deselect();
        }
        return true;
    }
    _get(index) {
        if (index < 0 || this.hand.length <= index) {
            return null;
        }
        return this.hand[index];
    }
    size() { return this.stack.length; }
    selected() {
        let count = 0;
        for (let i = 0; i < this.hand.length; ++i) {
            if (this.hand[i].selected()) {
                ++count;
            }
        }
        return count;
    }
    hands() {
        let count = 0;
        for (let i = 0; i < this.hand.length; ++i) {
            if (this.hand[i].exist()) {
                ++count;
            }
        }
        return count;
    }
    empty() {
        return this.size() <= 0 && this.hands() <= 0;
    }
}
CardManager.HAND_MAX = 4;
class ActionButtons {
    constructor(dungeon, buttons) {
        this.dungeon = dungeon;
        this.buttons = buttons;
        this.quantity = buttons.querySelector('.quantity');
        const l = buttons.querySelector('.crosskey .l');
        const r = buttons.querySelector('.crosskey .r');
        const u = buttons.querySelector('.crosskey .u');
        const d = buttons.querySelector('.crosskey .d');
        const w = buttons.querySelector('.crosskey .w');
        Common.addClick(l, () => { this.move(8); });
        Common.addClick(r, () => { this.move(2); });
        Common.addClick(u, () => { this.move(1); });
        Common.addClick(d, () => { this.move(4); });
        Common.addClick(w, () => { dungeon.nextTurn(); });
        const reload = buttons.querySelector('.reload');
        Common.addClick(reload, () => { dungeon.reload(); });
    }
    update(cm) {
        this.quantity.textContent = cm.size() + '';
        if (cm.empty()) {
            this.buttons.classList.remove('move');
        }
        else {
            this.buttons.classList.add('move');
        }
    }
    move(direction) {
        if (!this.buttons.classList.contains('move')) {
            return;
        }
        this.dungeon.move(direction);
    }
}
class Dungeon {
    constructor(config) {
        this.map = config.dungeon.querySelector('.map');
        this.hand = config.dungeon.querySelector('.hand');
        this.buttons = new ActionButtons(this, config.dungeon.querySelector('.buttons'));
        this.cards = [];
        const cards = config.dungeon.querySelectorAll('.card');
        for (let i = 0; i < cards.length; ++i) {
            this.initCardAction(cards[i], i);
        }
    }
    isFlick(begin, end) {
        const flick = Common.flick(begin, end);
        console.log(flick, flick.direction, Number.isNaN(flick.direction));
        return !Number.isNaN(flick.direction);
    }
    initCardAction(element, index) {
        this.cards.push(element);
        Common.addTap(element, 500, (data) => {
            if (this.isFlick(data.begin, data.end)) {
                console.log('Flick');
                this.cm.behind(index);
            }
            else {
                console.log('Select');
                this.selectCard(index);
            }
        }, () => {
            if (element.dataset.select) {
                this.deselectCard(index);
            }
            else {
                this.showCard(index);
            }
        });
    }
    init(cm) {
        this.cm = cm;
        cm.init(this.cards);
    }
    selectCard(index) {
        if (index < 0 || this.cards.length <= index || !this.cards[index].dataset.card) {
            return;
        }
        let i;
        if (!this.cm.select(index, true)) {
            return;
        }
        this.buttons.update(this.cm);
        if (3 <= this.cm.selected()) {
            this.action();
        }
    }
    deselectCard(index) {
        if (index < 0 || this.cards.length <= index) {
            return;
        }
        if (!this.cm.select(index, false)) {
            return;
        }
        this.buttons.update(this.cm);
    }
    action() {
        this.hand.classList.add('hide');
    }
    nextTurn() {
        if (!this.cm.draw()) {
            this.reload();
        }
        this.dungeon.update();
        this.dungeon._render(this.map);
    }
    reload() {
        this.cm.reload();
        this.buttons.update(this.cm);
    }
    draw() {
        if (this.cm.size() <= 0) {
            this.cm.drawFull();
        }
        else {
            this.cm.draw();
        }
        this.buttons.update(this.cm);
        this.hand.classList.remove('hide');
    }
    move(direction) {
        console.log('move:', direction);
        if (this.cm.selected() <= 0) {
            this.cm.select(0, true);
        }
        this.cm.useFirst().then((card) => {
            console.log(card);
            this.dungeon.action(direction, card);
            if (this.cm.selected() <= 0) {
                this.draw();
            }
            this.dungeon._render(this.map);
        }).catch((error) => {
            console.log(error);
            this.draw();
            this.dungeon._render(this.map);
        });
    }
    showCard(index) {
        if (index < 0 || this.cards.length <= index || !this.cards[index].dataset.card) {
            return;
        }
        console.log('show:', index, this.cards[index].dataset.card);
    }
    render(dungeon) {
        this.dungeon = dungeon;
        this.dungeon._render(this.map);
    }
}
class Book {
    constructor(config, app) {
        this.config = config;
        this.cards = [];
        this.book = config.book.querySelector('.book');
        this.list = config.book.querySelector('.list');
        this.detail = config.book.querySelector('.card_detail');
        this.load();
        this.initTabs(config.book);
        this.initDetail();
    }
    initTabs(book) {
        const tabs = book.querySelector('.tabs').children;
        for (let i = 0; i < tabs.length; ++i) {
            this.initTabEvent(tabs[i]);
        }
        const prev = book.querySelector('.prev');
        const next = book.querySelector('.next');
    }
    initTabEvent(tab) {
        if (!tab.dataset || !tab.dataset.cate) {
            return;
        }
        if (!this.book.dataset.cate) {
            this.book.dataset.cate = tab.dataset.cate;
        }
        tab.addEventListener('click', (event) => {
            this.defaultEvent(event);
            this.changeTab(tab.dataset.cate);
        });
    }
    initDetail() { }
    closeDetail() {
        this.detail.classList.remove('show');
    }
    changeTab(tab) {
        if (tab === this.book.dataset.cate) {
            return;
        }
        this.book.dataset.cate = tab;
    }
    defaultEvent(event) {
        event.stopPropagation();
    }
    load() {
        return API.user.cards().then((data) => {
            this.cards = data.cards;
        });
    }
    getCategoryNum(cate) {
        const c = Object.keys(CardCate);
        for (let i = 0; i < c.length; ++i) {
            if (CardCate[c[i]] === cate) {
                return parseInt(c[i]);
            }
        }
        return 0;
    }
    renderBook(force = false) {
        const cate = this.book.dataset.cate || 'all';
        const cateNum = this.getCategoryNum(cate);
        const p = this.cards.length <= 0 || force ? this.load() : Promise.resolve();
        return p.then(() => { return this.cards.filter((card) => { return card.cate === cateNum; }); }).then((cards) => {
            this.list.innerHTML = '';
            const template = this.config.template.card_item;
            cards.forEach((card) => {
                const item = document.importNode(template.content, true);
                item.addEventListener('click', (event) => {
                    this.defaultEvent(event);
                    this.renderDetail(card);
                }, false);
                this.list.appendChild(item);
            });
        });
    }
    renderDetail(card) {
        this.detail.classList.add('show');
        const title = this.detail.querySelector('card_title');
        title.textContent = card.name;
    }
}
class App {
    constructor(config) {
        this.config = config;
        this.user = new UserData(this);
        config.loading.addEventListener('click', (event) => {
            event.stopPropagation();
        }, false);
        const top = new Top(config.top, this);
        this.home = new Home(this, config.home);
        this.dungeon = new Dungeon(config.dungeon);
    }
    init() {
        const p = [];
        p.push(LoadWLib().then((wlib) => {
            window.WLib = wlib;
        }));
        p.push(this.user.init());
        return Promise.all(p).then(() => {
            this.config.loading.classList.remove('show');
        });
    }
    hidePage(hide) {
        hide.classList.remove('show');
    }
    nextHome(hide) {
        this.user.reloadMypage().then(() => {
            this.config.home.home.classList.add('show');
            this.hidePage(hide);
        });
    }
    nextChara(hide) { }
    nextBook(hide) { }
    nextDungeon(hide) {
        this.config.dungeon.dungeon.classList.add('show');
        this.hidePage(hide);
        const deck = [];
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        deck.push({ id: 0, cate: 0, name: 'a', data: { lv: [1] } });
        const cm = new CardManager(deck);
        this.dungeon.init(cm);
        setTimeout(() => { cm.reload(); }, 1000);
        this.dungeon.render(new MogeDungeon().init());
    }
    nextBar(hide) {
        this.hidePage(hide);
        this.config.bar.classList.add('show');
    }
    nextMenu(hide) { }
    updateHomeData(data) {
        this.home.update(data);
    }
}
function BrowserCheck() {
    if (typeof fetch !== 'function') {
        return false;
    }
    if (!('content' in document.createElement('template'))) {
        return false;
    }
    if (!('customElements' in window) || typeof customElements.define !== 'function') {
        return false;
    }
    var style = document.createElement('style').style;
    style.setProperty('--test', '0');
    if (style.getPropertyValue('--test') !== '0') {
        return false;
    }
    if (!('serviceWorker' in navigator)) {
        return false;
    }
    var context = document.createElement('canvas').getContext('2d');
    if (context.imageSmoothingEnabled === undefined && context.webkitImageSmoothingEnabled === undefined && context.mozImageSmoothingEnabled === undefined && context.msImageSmoothingEnabled === undefined) {
        return false;
    }
    return true;
}
function DisableDoubleTapScaling() {
    let t = 0;
    document.body.addEventListener('touchend', (event) => {
        if (Date.now() - t < 100) {
            event.preventDefault();
            return;
        }
        t = Date.now();
    }, true);
}
function Localize(lang) {
    if (!lang) {
        lang = navigator.language;
    }
    const children = document.head.children;
    let def = "./localize/default.css?0";
    for (let i = 0; i < children.length; ++i) {
        if (children[i].tagName !== 'link') {
            continue;
        }
        const link = children[i];
        if (link.rel !== 'stylesheet') {
            continue;
        }
        const l = link.href.replace(/^.*localize\/([a-zA-Z\-\_]+)\.css.*$/, '$1');
        if (l === 'default') {
            def = link.href;
        }
        if (l === lang) {
            return;
        }
    }
    const cls = document.body.classList;
    for (let i = 0; i < cls.length; ++i) {
        if (cls[i] === lang) {
            continue;
        }
        document.body.classList.remove(cls[i]);
    }
    document.body.classList.add(lang);
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.type = 'text/css';
    link.href = def.replace('default', lang);
    document.head.appendChild(link);
}
document.addEventListener('DOMContentLoaded', () => {
    Localize();
    if (!BrowserCheck()) {
        return;
    }
    document.getElementById('legacy').classList.remove('show');
    DisableDoubleTapScaling();
    const cate = {
        0: 'all',
        1: 'common',
        2: 'special',
        3: 'equip',
    };
    window.CardCate = cate;
    const app = new App({
        loading: document.getElementById('loading'),
        contents: document.getElementById('contents'),
        top: {
            top: document.getElementById('top'),
            login: document.getElementById('login'),
            nora: document.getElementById('nora'),
        },
        home: {
            home: document.getElementById('home'),
        },
        bar: document.getElementById('bar'),
        dungeon: {
            dungeon: document.getElementById('dungeon'),
        },
    });
    app.init().then(() => {
        console.log('start');
    });
});
