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
        placeholder: {
            value: 'placeholder'
        },
        command: {
            value: 'command'
        },
        // note: commands need to be read reverse because the will directly land in the stack
        // command, placeholder needs to be ['placeholder', 'command'], because 'command must be on top of the stack'
        replacementRules: {
            value: {
                command: [
                    ['left'],
                    ['right'],
                    ['up'],
                    ['down']
                ],
                placeholder: [
                    ['command'],
                    ['placeholder', 'command']
                ]
            }
        }
    };

    Y.extend(Parser, Y.Base, {

        /****************************************************************************************/
        /*********************************** private members ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /*********************************** private methods ************************************/
        /****************************************************************************************/

        _getPlaceholderReplacement: function (instructions, i) {
            if (i === instructions.length - 1) {
                return this.get('replacementRules.placeholder')[0];
            }
            return this.get('replacementRules.placeholder')[1];
        },

        _getCommandReplacement: function (instructions, currentIndex) {
            var i,
                nextInstruction = instructions[currentIndex],
                availableReplacements = this.get('replacementRules.command');

            for (i = 0; i < availableReplacements.length; i++) {
                if (availableReplacements[i][0] === nextInstruction) {
                    return availableReplacements[i];
                }
            }
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/

        isValid: function (instructions) {
            var i = 0,
                numInstructions,
                stack = [this.get('placeholder')],
                replacement,
                nextStackElement;

            instructions = [
//                'for',
//                    'two',
//                    'for',
//                        'left',
//                    'endfor',
//                    'test',
//                'endfor',
                'down'
            ];

            numInstructions = instructions.length;


            for (i = 0; i < numInstructions; i++) {

                nextStackElement = stack.pop();

                Y.log('---------------------');
                Y.log("instruction: " + instructions[i]);
                Y.log("next stack element: " + nextStackElement);
                Y.log("remaining stack: ");
                Y.log(stack);

                // TODO: make switch/case
                if (nextStackElement === this.get('placeholder')) {
                    replacement = this._getPlaceholderReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    continue;
                } else if (nextStackElement === this.get('command')) {
                    replacement = this._getCommandReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    continue;
                }

                if (nextStackElement !== instructions[i]) {
                    Y.log("error, unexpeced symbol");
                }

            }

            Y.log('*****************');
            Y.log("done checking. stack: ");
            Y.log(stack);
            // TODO: error if stack is not empty here

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

