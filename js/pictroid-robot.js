/*global YUI */

YUI.add('pictroid-robot', function (Y) {

    'use strict';

    /****************************************************************************************/
    /************************************* constructor **************************************/
    /****************************************************************************************/

    function Robot(config) {
        Robot.superclass.constructor.apply(this, arguments);
    }

    Robot.NAME = 'robot';

    /****************************************************************************************/
    /************************************ public members ************************************/
    /****************************************************************************************/

    Robot.ATTRS = {
        mapNode: {},
        robotNode: {},
        speed: {
            value: 200// milliseconds between two steps
        },
        tileSize: {
            value: 60// pixels of a tile on the map
        },
        mapSize: {
            value: 10// amount of tiles per dimension
        },
        map: {
            value: [
                ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1'],
                ['1', 'R', '0', '0', '0', '0', '0', '0', 'X', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '0', '0', '0', '0', '0', '0', '0', '0', '1'],
                ['1', '1', '1', '1', '1', '1', '1', '1', '1', '1']
            ]
        },
        counterHash: {
            value: {
                two: 2,
                three: 3,
                four: 4,
                five: 5,
                six: 6,
                seven: 7,
                eight: 8,
                nine: 9,
                infinite: 9999 // TODO: make it really infinite somehow?
            }
        }
    };

    Y.extend(Robot, Y.Base, {

        /****************************************************************************************/
        /*********************************** private members ************************************/
        /****************************************************************************************/

        _x: 0,
        _y: 0,
        _orientation: 'right',
        _goal: null,

        STONE: '1',
        GOAL: 'X',
        ROBOT: 'R',

        /****************************************************************************************/
        /*********************************** private methods ************************************/
        /****************************************************************************************/

        _counterToInt: function (counter) {
            return this.get('counterHash')[counter];
        },

        _setPos: function (pos, hard) {
            this._x = pos.x;
            this._y = pos.y;

            if (hard) {
                this.get('robotNode').removeClass('easy_move');
            }

            this.get('robotNode').setStyles({
                marginLeft: (this._x * this.get('tileSize')) + 'px',
                marginTop: (this._y * this.get('tileSize')) + 'px'
            });

            if (hard) {
                Y.later(this.get('speed') / 2, this, function () {
                    this.get('robotNode').addClass('easy_move');
                });
            }
        },

        _setOrientation: function (newOrientation) {
            this.get('robotNode').removeClass(this._orientation);
            this.get('robotNode').addClass(newOrientation);
            this._orientation = newOrientation;
        },

        _getNextFieldItem: function () {
            var deltaObj = this._dirToDeltaObj(this._orientation),
                nextFieldX = this._x + deltaObj.deltaX,
                nextFieldY = this._y + deltaObj.deltaY,
                map = this.get('map');

            return map[nextFieldY][nextFieldX];
        },

        _dirToDeltaObj: function (dir) {
            var deltaX = 0,
                deltaY = 0;

            switch (dir) {
            case 'left':
                deltaX = -1;
                break;
            case 'right':
                deltaX = 1;
                break;
            case 'up':
                deltaY = -1;
                break;
            case 'down':
                deltaY = 1;
                break;
            default:
                // TODO: log error at least
                Y.error('not a move statement: ' + dir);
                break;
            }

            return {
                deltaX: deltaX,
                deltaY: deltaY
            };
        },

        _move: function (dir) {
            var deltaObj;

            // check what direction to go
            deltaObj = this._dirToDeltaObj(dir);

            if (dir === this._orientation) {
                if (this._getNextFieldItem() !== this.STONE) {
                    this._setPos({
                        x: this._x + deltaObj.deltaX,
                        y: this._y + deltaObj.deltaY
                    });
                } else {
                    this.get('robotNode').addClass('error');
                    Y.later(this.get('speed') / 2, this, function () {
                        this.get('robotNode').removeClass('error');
                    });
                }
            } else {
                this._setOrientation(dir);
            }
        },

        _runInstruction: function (instructions, i, callback) {
            var limit,
                j,
                loop,
                loopEndIndex;

            if (i >= instructions.length) {
                callback();
                return;
            }

            switch (instructions[i]) {
            case 'repeat':
                j = 0;
                loopEndIndex = i + 2;
                limit = this._counterToInt(instructions[i + 1]);

                loop = function (inst) {
                    if (j < limit) {
                        inst._runInstruction(instructions, i + 2, function (endIndex) {
                            loopEndIndex = endIndex;
                            j++;
                            loop(inst);
                        });
                    } else {
                        inst._runInstruction(instructions, loopEndIndex + 1, callback);
                    }
                };

                loop(this);
                break;
            case 'endrepeat':
                callback(i);
                break;
            default:
                this._move(instructions[i]);
                if (this._isGoalReached()) {
                    Y.log('Victory!');
                } else {
                    i++;
                    Y.later(this.get('speed'), this, this._runInstruction, [instructions, i, callback]);
                }
                break;
            }
        },

        _isGoalReached: function () {
            return this._goal.x === this._x && this._goal.y === this._y;
        },

        _indexFromCoordinates: function (x, y) {
            return y * this.get('mapSize') + x;
        },

        _setGoal: function (goal) {
            var goalIndex = goal.y * this.get('mapSize') + goal.x;
            this.get('mapNode').get('children').item(goalIndex).addClass('goal');
            this._goal = goal;
        },

        // TODO: refactor map related stuff into map module
        _drawMap: function () {
            var i,
                j,
                map = this.get('map'),
                mapNodes = this.get('mapNode').get('children');

            for (i = 0; i < map.length; i++) {
                for (j = 0; j < map[0].length; j++) {
                    switch (map[i][j]) {
                    case this.STONE:
                        mapNodes.item(this._indexFromCoordinates(j, i)).addClass('stone');
                        break
                    case this.GOAL:
                        this._setGoal({
                            x: j,
                            y: i
                        });
                        break;
                    case this.ROBOT:
                        this._setPos({
                            x: j,
                            y: i
                        }, true);
                        break;
                    default:
                        break;
                    }
                }
            }
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/

        run: function (instructions) {
            this._runInstruction(instructions, 0, function () {
                Y.log('done');
            });
        },

        /****************************************************************************************/
        /****************************** extended methods / members ******************************/
        /****************************************************************************************/

        initializer: function (cfg) {
            this._drawMap();
        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Robot = Robot;

}, '0.1', { requires: ['base']});

