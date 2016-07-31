(function () {
  'use strict';
  var worldDataLocal = '/Users/gregsmith/Dropbox/Public/world-50m.json',
      meteorDataLocal = '/Users/gregsmith/Dropbox/Public/meteorite-strike-data.json';

  describe('Map object gets created', function () {

    beforeEach(function(done) {
      this.height = 500;
      this.width = 500;
      this.margin = { top: 50, right: 60, bottom: 70, left: 80 };
      this.testMap = strikeMap();
      this.testMap.width(this.width).height(this.height).margin(this.margin);
      var mp = this.testMap;
      Promise.all([getJSON(worldDataLocal), getJSON(meteorDataLocal)])
        .then(function(data) {
          d3.select('#chart').datum(data).call(mp);
          done();
        }).catch(function(error) {
          console.error(error);
          done();
        });
    });

    afterEach(function() {
      d3.select('#chart').html("");
    });

    describe('the svg container', function() {
      it('should be created', function() {
      expect(selectSVG()).not.toBeNull();
      });

      it('should be the specified width', function() {
        expect(+selectSVG().attr('width')).toBe(this.width + this.margin.right + this.margin.left);
      });

      it('should be the specified height', function() {
        expect(+selectSVG().attr('height')).toBe(this.height + this.margin.top + this.margin.bottom);
      });
    });

    describe('the map object', function() {
      it('should be positioned inside the SVG container by the margin values', function() {
        expect(selectMapObject().attr('transform')).toBe(`translate(${this.margin.left},${this.margin.top})`)
      });
      describe('has getter methods', function() {
        it('should return the current width', function() {
          expect(this.testMap.width()).toBe(this.width);
        });
        it('should return the current height', function() {
          expect(this.testMap.height()).toBe(this.height);
        });
        it('should return the current margin object', function() {
          expect(this.testMap.margin()).toEqual(this.margin);
        });
      });
      describe('has setter methods', function() {
        it('should set the width', function() {
          expect(this.testMap.width()).toBe(this.width);
          this.testMap.width(1000);
          expect(this.testMap.width()).toBe(1000);
        });
        it('should set the height', function() {
          expect(this.testMap.height()).toBe(this.height);
          this.testMap.height(1000);
          expect(this.testMap.height()).toBe(1000);
        });
        it('should set the margin object', function() {
          var newMargin = { top: 80, right: 70, bottom: 60, left: 50 }
          expect(this.testMap.margin()).toBe(this.margin);
          this.testMap.margin(newMargin);
          expect(this.testMap.margin()).toEqual(newMargin);
        });
      });
    });

    function selectSVG() {
      return d3.select('svg');
    }

    function selectMapObject() {
      return d3.select('g.mapContainer');
    }
  });

  describe('The getJSON helper function', function() {
    describe('works with valid input', function() {
      var gdata;
      beforeEach(function(done) {
        this.testPromise = getJSON(worldDataLocal)
          .then(function(data) {
            gdata = data;
            done();
          })
          .catch(function(error) {
            console.error(error);
            done.fail();
          });
      });
      it('returns a promise', function() {
        expect(typeof this.testPromise).toBe('object');
        expect(this.testPromise.then()).not.toBe(undefined);
      });
      it('should fetch JSON data from valid URL', function(done) {
        expect(gdata).not.toBe(null);
        expect(gdata.type).toBe("Topology");
        done();
      });
    });
    describe('handles errors', function() {
      var gerror;
      beforeEach(function(done) {
        getJSON('notaworkingurl').then(function(data) {
          done.fail()
        })
        .catch(function(error) {
          gerror = error;
          console.error(error);
          done();
        });
      });
      it('should send an error when trying to access an invalid URL', function(done) {
        expect(gerror).not.toBe(null);
        done();
      });
    });
  });

  describe('The map object parses data', function() {
    var meteoriteData;
    function getChart() {
      return d3.select('#chart');
    }
    function getSVG() {
      return d3.select('svg');
    }
    function getMeteoriteStrikes() {
      return getSVG().selectAll('circle.meteoriteStrike')[0];
    }
    beforeEach(function(done) {
      this.map = strikeMap();
      var testMap = this.map;
      Promise.all([getJSON(worldDataLocal), getJSON(meteorDataLocal)])
        .then(function(data) {
          meteoriteData = data[1].features;
          getChart().datum(data).call(testMap);
          done();
        }).catch(function(error) {
          console.eror(error);
          done();
        });
    });
    afterEach(function() {
      getChart().html("");
    });
    describe('for meteor strikes', function() {
      it('should place a circle for each meteor strike', function(done) {
        var numberOfMeteors = meteoriteData.length;
        expect(getMeteoriteStrikes().length).toBe(numberOfMeteors);
        done();
      });
      it('should set each circle\'s position based on the coordinate data', function(done) {
        var testProjection = this.map.getProjection();
        var someRandomNumber = Math.floor(Math.random() * meteoriteData.length);
        console.log(`Checking circle position with random number: ${someRandomNumber}`);
        var testCoords = testProjection([meteoriteData[someRandomNumber].properties.reclong, meteoriteData[someRandomNumber].properties.reclat]);
        expect(+d3.select(getMeteoriteStrikes()[someRandomNumber]).attr('cx')).toBe(testCoords[0]);
        expect(+d3.select(getMeteoriteStrikes()[someRandomNumber]).attr('cy')).toBe(testCoords[1]);
        done();
      });
      it('should set the circle\'s radius based on the mass property', function(done) {
        var someRandomNumber = Math.floor(Math.random() * meteoriteData.length);
        console.log(`Checking circle radius with random number: ${someRandomNumber}`);
        var setRadius = this.map.getSetRadius();
        var circleRadius = +d3.select(getMeteoriteStrikes()[someRandomNumber]).attr('r');
        expect(circleRadius).toBe(setRadius(meteoriteData[someRandomNumber].properties.mass));
        expect(circleRadius).toBeLessThan(this.map.impactRadiusMax());
        expect(circleRadius).toBeGreaterThan(this.map.impactRadiusMin());
        done();
      });
    });
  });
})();
