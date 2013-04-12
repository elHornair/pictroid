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
        domNode: {},
        tileSize: {
            value: 60// pixels of a tile on the map
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

        /****************************************************************************************/
        /*********************************** private methods ************************************/
        /****************************************************************************************/

        _counterToInt: function (counter) {
            return this.get('counterHash')[counter];
        },

        _move: function (dir) {
            var deltaX = 0,
                deltaY = 0;

            // TODO: use constants from parser here
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
                Y.log('not a move statement');
                break;
            }

            this._x += deltaX;
            this._y += deltaY;

            this.get('domNode').setStyles({
                marginLeft: (this._x * this.get('tileSize')) + 'px',
                marginTop: (this._y * this.get('tileSize')) + 'px'
            });
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
                i++;
                Y.later(500, this, this._runInstruction, [instructions, i, callback]);
                break;
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
        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Robot = Robot;

}, '0.1', { requires: ['base']});

