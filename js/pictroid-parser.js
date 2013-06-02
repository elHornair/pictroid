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

        _getSymbolLabel: function (classes, body) {
            return '<span class="label ' + classes + '">' + body + '</span>';
        },

        _getErrorMessage: function (nextStackElement) {
            var message;

            switch (nextStackElement) {
            case 'endrepeat':
                message = 'Pictroid expects a ' + this._getSymbolLabel('green', 'green symbol with cross') + ' at this position.';
                break;
            case 'endcondition':
                message = 'Pictroid expects a ' + this._getSymbolLabel('red', 'red symbol with cross') + ' at this position.';
                break;
            case 'conditional':
                case 'e_conditional_expected':
                message = 'Pictroid expects an ' + this._getSymbolLabel('orange', 'orange symbol') + ' at this position.';
                break;
            case 'counter':
            case 'e_counter_expected':
                message = 'Pictroid expects a ' + this._getSymbolLabel('blue', 'blue symbol') + ' at this position.';
                break;
            case undefined:
                message =
                    'Pictroid expects a ' +
                    this._getSymbolLabel('yellow', 'yellow symbol') +
                    ', a ' +
                    this._getSymbolLabel('red', 'red question mark') +
                    ' or ' +
                    this._getSymbolLabel('green', 'a green circular arrow') +
                    ' at this position.';
                break;
            default:
                message = 'Pictroid is not sure what\'s wrong.';
                break;
            }

            return 'Pictroid doesn\'t understand your program: ' + message;
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/

        isValid: function (instructions) {
            var i,
                numInstructions = instructions.length,
                stack = [this.get('placeholder')],
                replacement,
                nextStackElement,
                protocol = {
                    success: true
                };

            for (i = 0; i < numInstructions; i++) {

                nextStackElement = stack.pop();

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
                        protocol.success = false;
                        protocol.err = {
                            description: this._getErrorMessage(nextStackElement),
                            index: i
                        };
                        return protocol;
                    }
                }

            }

            stack = this._removePlaceholders(stack);
            if (stack.length > 0) {
                protocol.success = false;
                protocol.err = {
                    description: this._getErrorMessage(stack.pop()),
                    index: instructions.length
                };
            }

            return protocol;
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

