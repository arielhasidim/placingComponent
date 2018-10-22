import {AfterContentInit, AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';

@Component({
    selector: 'app-govmap-placing',
    templateUrl: './govmap-placing.component.html',
    styleUrls: ['./govmap-placing.component.scss']
})
export class GovmapPlacingComponent implements OnInit, AfterViewInit, OnChanges {
    @ViewChild('pin') pin;
    @Input() lat = '32.5';
    @Input() lng = '35';

    DatumList = {
        WGS84: {a: 6378137.0, b: 6356752.3142, f: 0.00335281066474748, esq: 0.006694380004260807, e: 0.0818191909289062,
            dX: 0, dY: 0, dZ: 0},
        GRS80: {a: 6378137.0, b: 6356752.3141, f: 0.0033528106811823, esq: 0.00669438002290272, e: 0.0818191910428276,
            dX: -48, dY: 55, dZ: 52},
        Clark1880: {a: 6378300.789, b: 6356566.4116309, f: 0.003407549767264, esq: 0.006803488139112318, e: 0.08248325975076590,
            dX: 0, dY: 0, dZ: 0}
    };

    GridList = {
        ICS: {lon0: 0.6145667421719, lat0: 0.55386447682762762, k0: 1.00000, false_e: 170251.555, false_n: 2385259.0},
        ITM: {lon0: 0.61443473225468920, lat0: 0.55386965463774187, k0: 1.0000067, false_e: 219529.584, false_n: 2885516.9488}
    };
    myMap;
    
    constructor() {

    }

    ngAfterViewInit() {}

    ngOnChanges(change) {}


    ngOnInit() {
        this.myMap = window['govmap'].createMap('map', {
            token: '1f3f77a5-064f-46f6-941e-f9eb8a3c09b2',
            showXY: true,
            bgButton: 0,
            zoomButtons: 1,
            identifyOnClick: 0,
            layersMode: 4,
            scroll: 1,
            onLoad: this.startMap.bind(this)
        });


    }

    startMap() {
        console.log([this.lat, this.lng]);
        
        const israelCoords = this.WgsToIsrael(this.lat, this.lng);
        console.log(israelCoords);

        const wgsCoords = this.IsraelToWgs(israelCoords[1], israelCoords[0]);
        console.log(wgsCoords);

        const params = {
            x: israelCoords[0],
            y: israelCoords[1],
            level: 10
        };
        window['govmap'].zoomToXY(params);
        window['govmap'].setBackground(2);
        this.pin.nativeElement.classList.remove('hide');
    }


    //////////////////////////////////////////
    // convert wgs84 to israel tm grid...
    //////////////////////////////////////////


    degreesToRadians(degrees) {
        return degrees * Math.PI / 180;
    }


    pow2(x) {
        return x * x;
    }


    pow3(x) {
        return x * x * x;
    }


    pow4(x) {
        return x * x * x * x;
    }

    pi() { return 3.141592653589793; }


    WgsToIsrael(latitude, longitude) {
        longitude = this.degreesToRadians(longitude);
        latitude = this.degreesToRadians(latitude);
        // Projection parameters
        const centralMeridian = this.degreesToRadians(35.2045169444444); // central meridian of ITM projection
        const k0 = 1.0000067; // scale factor

        // Ellipsoid constants (WGS 80 datum)
        const a = 6378137; // equatorial radius
        const b = 6356752.3141; // polar radius
        const e = Math.sqrt(1 - b * b / a / a); // eccentricity
        const e1sq = e * e / (1 - e * e);
        const n = (a - b) / (a + b);

        // Curvature at specified location
        const tmp = e * Math.sin(latitude);
        const nu = a / Math.sqrt(1 - tmp * tmp);

        // Meridional arc length
        const n3 = this.pow3(n);
        const n4 = this.pow4(n);
        const A0 = a * (1 - n + (5 * n * n / 4) * (1 - n) + (81 * n4 / 64) * (1 - n));
        const B0 = (3 * a * n / 2) * (1 - n - (7 * n * n / 8) * (1 - n) + 55 * n4 / 64);
        const C0 = (15 * a * n * n / 16) * (1 - n + (3 * n * n / 4) * (1 - n));
        const D0 = (35 * a * n3 / 48) * (1 - n + 11 * n * n / 16);
        const E0 = (315 * a * n4 / 51) * (1 - n);
        const S = A0 * latitude - B0 * Math.sin(2 * latitude) + C0 * Math.sin(4 * latitude) - D0 * Math.sin(6 * latitude) + E0 * Math.sin(8 * latitude);

        // Coefficients for ITM coordinates
        const p = longitude - centralMeridian;
        const Ki = S * k0;
        const Kii = nu * Math.sin(latitude) * Math.cos(latitude) * k0 / 2;
        const Kiii = ((nu * Math.sin(latitude) * this.pow3(Math.cos(latitude))) / 24) * (5 - this.pow2(Math.tan(latitude)) + 9 * e1sq * this.pow2(Math.cos(latitude)) + 4 * e1sq * e1sq * this.pow4(Math.cos(latitude))) * k0;
        const Kiv = nu * Math.cos(latitude) * k0;
        const Kv = this.pow3(Math.cos(latitude)) * (nu / 6) * (1 - this.pow2(Math.tan(latitude)) + e1sq * this.pow2(Math.cos(latitude))) * k0;

        const easting = Math.round(219529.58 + Kiv * p + Kv * this.pow3(p) - 60);
        const northing = Math.round(Ki + Kii * p * p + Kiii * this.pow4(p) - 3512424.41 + 626907.39 - 45);
        return [easting, northing];
    }

    ///////////////NEW ITM TO WGS FUNCTION//////////////

    IsraelToWgs(N, E)  {
        // 1. Local Grid (ITM) -&gt; GRS80
        const latlon80array = this.Grid2LatLon(N, E, 'ITM', 'GRS80');
        const lat80 = latlon80array[0];
        const lon80 = latlon80array[1];

        // 2. Molodensky GRS80-&gt;WGS84
        const latlon84array = this.Molodensky(lat80, lon80, 'GRS80', 'WGS84');
        const lat84 = latlon84array[0];
        const lon84 = latlon84array[1];

        // final results
        const lat = lat84 * 180 / this.pi();
        const lon = lon84 * 180 / this.pi();

        return [lat, lon];
    }

    Grid2LatLon(N, E, from, to) {
        //================
        // GRID -&gt; Lat/Lon
        //================

        const y = N + this.GridList[from].false_n;
        const x = E - this.GridList[from].false_e;
        const M = y / this.GridList[from].k0;

        const a = this.DatumList[to].a;
        const b = this.DatumList[to].b;
        const e = this.DatumList[to].e;
        const esq = this.DatumList[to].esq;

        const mu = M / (a * (1 - e * e / 4 - 3 * Math.pow(e, 4) / 64 - 5 * Math.pow(e, 6) / 256));

        const ee = Math.sqrt(1 - esq);
        const e1 = (1 - ee) / (1 + ee);
        const j1 = 3 * e1 / 2 - 27 * e1 * e1 * e1 / 32;
        const j2 = 21 * e1 * e1 / 16 - 55 * e1 * e1 * e1 * e1 / 32;
        const j3 = 151 * e1 * e1 * e1 / 96;
        const j4 = 1097 * e1 * e1 * e1 * e1 / 512;

        // Footprint Latitude
        const fp = mu + j1 * Math.sin(2 * mu) + j2 * Math.sin(4 * mu) + j3 * Math.sin(6 * mu) + j4 * Math.sin(8 * mu);

        const sinfp = Math.sin(fp);
        const cosfp = Math.cos(fp);
        const tanfp = sinfp / cosfp;
        const eg = (e * a / b);
        const eg2 = eg * eg;
        const C1 = eg2 * cosfp * cosfp;
        const T1 = tanfp * tanfp;
        const R1 = a * (1 - e * e) / Math.pow(1 - (e * sinfp) * (e * sinfp), 1.5);
        const N1 = a / Math.sqrt(1 - (e * sinfp) * (e * sinfp));
        const D = x / (N1 * this.GridList[from].k0);

        const Q1 = N1 * tanfp / R1;
        const Q2 = D * D / 2;
        const Q3 = (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eg2 * eg2) * (D * D * D * D) / 24;
        const Q4 = (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 3 * C1 * C1 - 252 * eg2 * eg2) * (D * D * D * D * D * D) / 720;
        // result lat
        const lat = fp - Q1 * (Q2 - Q3 + Q4);

        const Q5 = D;
        const Q6 = (1 + 2 * T1 + C1) * (D * D * D) / 6;
        const Q7 = (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * eg2 * eg2 + 24 * T1 * T1) * (D * D * D * D * D) / 120;
        // result lon
        const lon = this.GridList[from].lon0 + (Q5 - Q6 + Q7) / cosfp;

        return [lat, lon];
    }

    Molodensky(ilat, ilon, from, to) {
        // from-&gt;WGS84 - to-&gt;WGS84 = from-&gt;WGS84 + WGS84-&gt;to = from-&gt;to
        const dX = this.DatumList[from].dX - this.DatumList[to].dX;
        const dY = this.DatumList[from].dY - this.DatumList[to].dY;
        const dZ = this.DatumList[from].dZ - this.DatumList[to].dZ;

        const slat = Math.sin(ilat);
        const clat = Math.cos(ilat);
        const slon = Math.sin(ilon);
        const clon = Math.cos(ilon);
        const ssqlat = slat * slat;

        //dlat = ((-dx * slat * clon - dy * slat * slon + dz * clat)
        //        + (da * rn * from_esq * slat * clat / from_a)
        //        + (df * (rm * adb + rn / adb )* slat * clat))
        //       / (rm + from.h);

        const from_f = this.DatumList[from].f;
        const df = this.DatumList[to].f - from_f;
        const from_a = this.DatumList[from].a;
        const da = this.DatumList[to].a - from_a;
        const from_esq = this.DatumList[from].esq;
        const adb = 1.0 / (1.0 - from_f);
        const rn = from_a / Math.sqrt(1 - from_esq * ssqlat);
        const rm = from_a * (1 - from_esq) / Math.pow((1 - from_esq * ssqlat), 1.5);
        const from_h = 0.0; // we're flat!

        const dlat = (-dX * slat * clon - dY * slat * slon + dZ * clat
                        + da * rn * from_esq * slat * clat / from_a +
                        +df * (rm * adb + rn / adb) * slat * clat) / (rm + from_h);

        // result lat (radians)
        const olat = ilat + dlat;

        // dlon = (-dx * slon + dy * clon) / ((rn + from.h) * clat);
        const dlon = (-dX * slon + dY * clon) / ((rn + from_h) * clat);
        // result lon (radians)
        const olon = ilon + dlon;
        
        return [olat, olon];
    }

    
}
