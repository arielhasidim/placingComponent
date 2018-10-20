import {AfterContentInit, AfterViewInit, Component, Input, OnChanges, OnInit} from '@angular/core';
import {FeatureCollection, GeoJson} from '../../../model/map';

@Component({
  selector: 'app-govmap-placing',
  templateUrl: './govmap-placing.component.html',
  styleUrls: ['./govmap-placing.component.scss']
})
export class GovmapPlacingComponent implements OnInit, AfterViewInit, OnChanges {


  constructor() {

  }

  ngOnInit() {

      }
    
    ngAfterViewInit() {

    }
    ngOnChanges (change) {

    }
    

  ngOnInit() {
    var DocumentReady = function(){
    var govmap = window.govmap
    govmap.createMap('map', {

        token: "1f3f77a5-064f-46f6-941e-f9eb8a3c09b2",
        showXY: true,
        identifyOnClick: true,
        bgButton: 0,
        zoomButtons: 0,
        identifyOnClick: 0,
        layersMode: 4,
        onLoad: startMap
    });

    function startMap() {
        var options = {
            enableHighAccuracy: true,
            timeout: 50000000,
            maximumAge: 0
        };

        ///get first location
        function success(pos) {
            var crd = pos.coords;
            var israelCoords = WgsToIsrael(crd.latitude, crd.longitude);
            var params = {
                x: israelCoords[0],
                y: israelCoords[1],
                level: 10
            };
            govmap.zoomToXY(params);
            govmap.setBackground(2);
            document.getElementById("pin").classList.remove('hide');
        }

        function error(err) {
            console.warn(`ERROR(${err.code}): ${err.message}`);
        }

        navigator.geolocation.getCurrentPosition(success, error, options);
        govmap.setBackground(2);
    }
};

if (
    document.readyState === "complete" ||
    (document.readyState !== "loading" && !document.documentElement.doScroll)
) {
  DocumentReady();
} else {
  document.addEventListener("DOMContentLoaded", DocumentReady);
}


//////////////////////////////////////////
// convert wgs84 to israel tm grid...
//////////////////////////////////////////

function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

function pow2(x) {
    return x * x;
}

function pow3(x) {
    return x * x * x;
}

function pow4(x) {
    return x * x * x * x;
}

function ITMLocation(easting, northing) {
    this.easting = easting;
    this.northing = northing;
    this.eastingInOldGrid = function() {
        return easting - 50000;
    }
    this.northingInOldGrid = function() {
        var retval = northing - 500000;
        if (retval < 0) {
            retval += 1000000;
        }
        return retval;
    }
}

//////////////
//// Main Function…
//////////////
function WgsToIsrael(latitude, longitude) {
    longitude = degreesToRadians(longitude);
    latitude = degreesToRadians(latitude);
    //LatLongToITM(latitude, longitud);
    // Projection parameters
    var centralMeridian = degreesToRadians(35.2045169444444); // central meridian of ITM projection
    var k0 = 1.0000067; // scale factor

    // Ellipsoid constants (WGS 80 datum)
    var a = 6378137; // equatorial radius
    var b = 6356752.3141; // polar radius
    var e = Math.sqrt(1 - b * b / a / a); // eccentricity
    var e1sq = e * e / (1 - e * e);
    var n = (a - b) / (a + b);

    // Curvature at specified location
    var tmp = e * Math.sin(latitude);
    var nu = a / Math.sqrt(1 - tmp * tmp);

    // Meridional arc length
    var n3 = pow3(n);
    var n4 = pow4(n);
    var A0 = a * (1 - n + (5 * n * n / 4) * (1 - n) + (81 * n4 / 64) * (1 - n));
    var B0 = (3 * a * n / 2) * (1 - n - (7 * n * n / 8) * (1 - n) + 55 * n4 / 64);
    var C0 = (15 * a * n * n / 16) * (1 - n + (3 * n * n / 4) * (1 - n));
    var D0 = (35 * a * n3 / 48) * (1 - n + 11 * n * n / 16);
    var E0 = (315 * a * n4 / 51) * (1 - n);
    var S = A0 * latitude - B0 * Math.sin(2 * latitude) + C0 * Math.sin(4 * latitude) - D0 * Math.sin(6 * latitude) + E0 * Math.sin(8 * latitude);

    // Coefficients for ITM coordinates
    var p = longitude - centralMeridian;
    var Ki = S * k0;
    var Kii = nu * Math.sin(latitude) * Math.cos(latitude) * k0 / 2;
    var Kiii = ((nu * Math.sin(latitude) * pow3(Math.cos(latitude))) / 24) * (5 - pow2(Math.tan(latitude)) + 9 * e1sq * pow2(Math.cos(latitude)) + 4 * e1sq * e1sq * pow4(Math.cos(latitude))) * k0;
    var Kiv = nu * Math.cos(latitude) * k0;
    var Kv = pow3(Math.cos(latitude)) * (nu / 6) * (1 - pow2(Math.tan(latitude)) + e1sq * pow2(Math.cos(latitude))) * k0;

    var easting = Math.round(219529.58 + Kiv * p + Kv * pow3(p) - 60);
    var northing = Math.round(Ki + Kii * p * p + Kiii * pow4(p) - 3512424.41 + 626907.39 - 45);
    return [easting, northing];
}
///////////////////
// end convert
///////////////////

  }

}
