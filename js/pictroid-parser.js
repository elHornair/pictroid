/*global YUI */

YUI.add('pictroid-parser', function (Y) {

    'use strict';

    /****************************************************************************************/
    /************************************* constructor **************************************/
    /****************************************************************************************/

    function Parser(config) {
        Parser.superclass.constructor.apply(this, arguments);
    }

    Parser.NAME = 'parser';

    /****************************************************************************************/
    /************************************ public members ************************************/
    /****************************************************************************************/

    Parser.ATTRS = {
    };

    Y.extend(Parser, Y.Base, {

        /****************************************************************************************/
        /*********************************** private members ************************************/
        /****************************************************************************************/

        _directions: [
            'left',
            'right',
            'up',
            'down'
        ],

        /****************************************************************************************/
        /*********************************** private methods ************************************/
        /****************************************************************************************/

        _isDirection: function (command) {
            return this._directions.indexOf(command) !== -1;
        },

        _isForLoop: function (commandCollection) {
            // TODO: validate for loop
            return true;
        },

        _isCommand: function (command) {
            if (command.length > 1) {
                return this._isForLoop(command);
            }

            return this._isDirection(command[0]);
        },

        _extractNextCommandCollection: function (commands, i) {
            var commandCollection = [],
                nestingLevel = 0;

            switch (commands[i]) {
            case 'for':
                while (i < commands.length) {
                    commandCollection.push(commands[i]);

                    if (commands[i] === 'for') {
                        nestingLevel += 1;
                    } else if (commands[i] === 'endfor') {
                        nestingLevel -= 1;
                    }

                    if (nestingLevel === 0) {
                        break;
                    }
                    i += 1;
                }
                break;
            case 'if':
                // TODO: search for "endif" keyword
                break;
            default:
                commandCollection.push(commands[i]);
                break;
            }

            return commandCollection;
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/

        isValid: function (commands) {
            var i = 0,
                commandToCheck;

//            commands = [
//                'for',
//                    'for',
//                        'left',
//                    'endfor',
//                    'test',
//                'endfor',
//                'right'
//            ];

            while (i < commands.length) {
                commandToCheck = this._extractNextCommandCollection(commands, i);
                if (!this._isCommand(commandToCheck)) {
                    Y.log('Error at command nr: ' + i);
                    Y.log(commandToCheck);
                    break;
                }
                i += commandToCheck.length;
            }

            Y.log("done checking");

        },

        /****************************************************************************************/
        /****************************** extended methods / members ******************************/
        /****************************************************************************************/

        initializer: function (cfg) {
        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Parser = Parser;

}, '0.1', { requires: ['base']});

