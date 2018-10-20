import {AfterContentInit, AfterViewInit, Component, Input, OnChanges, OnInit, ViewChild} from '@angular/core';

@Component({
    selector: 'app-govmap-placing',
    templateUrl: './govmap-placing.component.html',
    styleUrls: ['./govmap-placing.component.scss']
})
export class GovmapPlacingComponent implements OnInit, AfterViewInit, OnChanges {
@ViewChild('pin') pin;

    constructor() {

    }

    ngAfterViewInit() {
    }

    ngOnChanges(change) {
    }


    ngOnInit() {

        window['govmap'].createMap('map', {

            token: '1f3f77a5-064f-46f6-941e-f9eb8a3c09b2',
            showXY: true,
            bgButton: 1,
            zoomButtons: 1,
            identifyOnClick: 1,
            layersMode: 4,
            onLoad: this.startMap.bind(this)
        });


    }

    startMap() {
        const options = {
            enableHighAccuracy: true,
            timeout: 50000000,
            maximumAge: 0
        };


        navigator.geolocation.getCurrentPosition((pos) => {
            const crd = pos.coords;
            const israelCoords = this.WgsToIsrael(crd.latitude, crd.longitude);
            const params = {
                x: israelCoords[0],
                y: israelCoords[1],
                level: 10
            };
            window['govmap'].zoomToXY(params);
            window['govmap'].setBackground(2);
            // document.getElementById('pin').classList.remove('hide');
        }, (err) => {
            console.warn(`ERROR(${err.code}): ${err.message}`);
        }, options);
        window['govmap'].setBackground(2);

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

}
