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
        condition: {
            value: 'condition'
        },
        counter: {
            value: 'counter'
        },
        conditional: {
            value: 'conditional'
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
                conditional: [
                    ['stone'],
                    ['field']
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

        _getReplacement: function (availableReplacements, currentInstruction) {
            var i;

            for (i = 0; i < availableReplacements.length; i++) {
                if (availableReplacements[i][0] === currentInstruction) {
                    return availableReplacements[i];
                }
            }

            return null;
        },

        _getPlaceholderReplacement: function (instructions, currentIndex) {
            switch (instructions[currentIndex]) {
            case this.get('repeat'):
                return this.get('replacementRules.placeholder')[2];// repeat
                break;
            case this.get('condition'):
                return this.get('replacementRules.placeholder')[3];// condition
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
            var replacement = this._getReplacement(this.get('replacementRules.command'), instructions[currentIndex]);
            return replacement || ['e_command_expected'];// TODO: this can actually never happen - think a bit about it
        },

        _getCounterReplacement: function (instructions, currentIndex) {
            var replacement = this._getReplacement(this.get('replacementRules.counter'), instructions[currentIndex]);
            return replacement || ['e_counter_expected'];
        },

        _getConditionalReplacement: function (instructions, currentIndex) {
            var replacement = this._getReplacement(this.get('replacementRules.conditional'), instructions[currentIndex]);
            return replacement || ['e_conditional_expected'];
        },

        _removePlaceholders: function (instructions) {
            return instructions.filter(function (instruction) {
                return instruction !== this.get('placeholder');
            }, this);
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/

        isValid: function (instructions) {
            var i,
                numInstructions,
                stack = [this.get('placeholder')],
                replacement,
                nextStackElement,
                err = null;

            // TODO: add proper tests
//            instructions = [
//                'repeat',
//                    'two',
//                    'left',
//                    'repeat',
//                        'infinite',
//                        'left',
//                        'up',
//                        'left',
//                        'condition',
//                            'star',
//                                'repeat',
//                                    'three',
//                                'endrepeat',
//                        'endcondition',
//                    'endrepeat',
//                    'right',
//                'endrepeat',
//                'condition',
//                    'star',
//                    'left',
//                'endcondition',
//                'left'
//            ];

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
                case this.get('conditional'):
                    replacement = this._getConditionalReplacement(instructions, i);
                    stack = stack.concat(replacement);
                    i -= 1;
                    break;
                default:
                    if (nextStackElement !== instructions[i]) {
                        err = "Unexpeced symbol at index " + i + ". Expected " + nextStackElement + ", received " + instructions[i];
                    }
                }

            }

            stack = this._removePlaceholders(stack);
            if (stack.length > 0) {
                err = 'Stack not empty. Found ' + stack;
            }

            return err || true;

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

