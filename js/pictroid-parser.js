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
        repeat: {
            value: 'repeat'
        },
        counter: {
            value: 'counter'
        },
        left: {
            value: 'left'
        },
        right: {
            value: 'right'
        },
        up: {
            value: 'up'
        },
        down: {
            value: 'down'
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
                counter: [
                    ['two'],
                    ['three'],
                    ['four'],
                    ['five'],
                    ['six'],
                    ['seven'],
                    ['eight'],
                    ['nine'],
                    ['ten'],
                    ['infinite']
                ],
                placeholder: [
                    [],
                    ['placeholder', 'command'],
                    ['placeholder', 'endrepeat', 'placeholder', 'counter', 'repeat'],
                    ['placeholder', 'endcondition', 'placeholder', 'conditional', 'condition']
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

        _getPlaceholderReplacement: function (instructions, currentIndex) {
            switch (instructions[currentIndex]) {
            case this.get('repeat'):
                return this.get('replacementRules.placeholder')[2];// repeat
                break;
            case this.get('left'):
            case this.get('right'):
            case this.get('up'):
            case this.get('down'):
                return this.get('replacementRules.placeholder')[1];// command and placeholder
                break;
            default:
                return this.get('replacementRules.placeholder')[0];// empty
            }
        },

        _getCommandReplacement: function (instructions, currentIndex) {
            var i,
                availableReplacements = this.get('replacementRules.command');

            for (i = 0; i < availableReplacements.length; i++) {
                if (availableReplacements[i][0] === instructions[currentIndex]) {
                    return availableReplacements[i];
                }
            }

            return ['e_command_expected'];
        },

        // TODO: refactor, because it's basically the same code as _getCommandReplacement
        _getCounterReplacement: function (instructions, currentIndex) {
            var i,
                availableReplacements = this.get('replacementRules.counter');

            for (i = 0; i < availableReplacements.length; i++) {
                if (availableReplacements[i][0] === instructions[currentIndex]) {
                    return availableReplacements[i];
                }
            }

            return ['e_counter_expected'];
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
                'repeat',
                    'two',
                    'left',
                    'repeat',
                        'infinite',
                        'left',
                        'up',
                        'left',
                    'endrepeat',
                    'right',
                'endrepeat',
                'left'
            ];

            numInstructions = instructions.length;

            for (i = 0; i < numInstructions; i++) {

                nextStackElement = stack.pop();

//                Y.log('---------------------');
//                Y.log("instruction: " + instructions[i]);
//                Y.log("next stack element: " + nextStackElement);
//                Y.log("remaining stack: ");
//                Y.log(stack);

                switch (nextStackElement) {
                case this.get('placeholder'):
                    replacement = this._getPlaceholderReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    break;
                case this.get('command'):
                    replacement = this._getCommandReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    break;
                case this.get('counter'):
                    replacement = this._getCounterReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    break;
                default:
                    if (nextStackElement !== instructions[i]) {
                        Y.error("Unexpeced symbol at index " + i + ". Expected " + nextStackElement + ", received " + instructions[i]);
                    }
                }

            }

            Y.log('*****************');
            // TODO: remove all placeholders first and then check for empty stack
            if (stack.length > 0) {
                Y.error('Stack not empty. Found ' + stack);
            }

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

