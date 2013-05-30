/*global YUI */

YUI.add('pictroid-main', function (Y) {

    'use strict';

    /****************************************************************************************/
    /************************************* constructor **************************************/
    /****************************************************************************************/

    function Main(config) {
        Main.superclass.constructor.apply(this, arguments);
    }

    Main.NAME = 'main';

    /****************************************************************************************/
    /************************************ public members ************************************/
    /****************************************************************************************/

    Main.ATTRS = {
        tileSize: {
            value: 56// size in pixels, including margins (size of the programming icons)
        },
        robot: {
            valueFn: function () {
                var robot =  new Y.Pictroid.Robot({
                    mapNode: Y.one('#map'),
                    robotNode: Y.one('#robot')
                });

                robot.init();
                return robot;
            }
        }
    };

    Y.extend(Main, Y.Base, {

        /****************************************************************************************/
        /*********************************** private members ************************************/
        /****************************************************************************************/

        _currentlyDriftedChildIndex: null,
        _dropContainer: null,

        /****************************************************************************************/
        /*********************************** private methods ************************************/
        /****************************************************************************************/

        _cleanupDrifts: function (dropContainer) {
            var currentChildren = dropContainer.get('node').get('children');
            currentChildren.removeClass('drift');
            this._currentlyDriftedChildIndex = null;
        },

        _calcRelativeDragCenterY: function (dropTarget, dragItem) {
            return dragItem.realXY[1] - dropTarget.region.top + (this.get('tileSize') / 2);
        },

        _calcChildToDriftIndex: function (measurePointY) {
            var tileSize = this.get('tileSize');
            return Math.floor((measurePointY - tileSize / 2) / tileSize) + 1;
        },

        /****************************************************************************************/
        /************************************ event handlers ************************************/
        /****************************************************************************************/

        _handleDragEnd: function (e) {
            var droppedItem = e.target.get('node');

            e.preventDefault();

            // remove items that are already in use
            if (droppedItem.get('parentNode').get('id') === 'commands-in-use') {
                droppedItem.remove();
            }
        },

        _handleDropHit: function (e) {
            var dropContainer = e.target,
                droppedItem = e.drag.get('node'),
                currentChildren = dropContainer.get('node').get('children'),
                insertionIndex = this._calcChildToDriftIndex(this._calcRelativeDragCenterY(e.target, e.drag)),
                nodeToInsert = '<li class="' + droppedItem.getAttribute('class') + '" data-type="' + droppedItem.getData().type + '">' + droppedItem.getContent() + '</li>';// TODO: use template

            this._cleanupDrifts(dropContainer);

            // insert item at the right position
            if (currentChildren.size() === 0 || insertionIndex >= currentChildren.size()) {
                dropContainer.get('node').append(nodeToInsert);

            } else {
                currentChildren.item(insertionIndex).insert(nodeToInsert, 'before');
            }
        },

        _handleDropExit: function (e) {
            this._cleanupDrifts(e.target);
        },

        _handleDropOver: function (e) {
            var dropTarget = e.target,
                currentChildren = dropTarget.get('node').get('children'),
                childToDriftIndex,
                childToDrift;

            // only drift if there are actual children
            if (currentChildren.size() > 0) {
                childToDriftIndex = this._calcChildToDriftIndex(this._calcRelativeDragCenterY(dropTarget, e.drag));

                if (this._currentlyDriftedChildIndex !== childToDriftIndex) {
                    this._currentlyDriftedChildIndex = childToDriftIndex;
                    currentChildren.removeClass('drift');

                    if (childToDriftIndex < currentChildren.size()) {
                        // move
                        childToDrift = currentChildren.item(childToDriftIndex);
                        childToDrift.addClass('drift');
                    }
                }
            }
        },

        _swapRobotControlButtons: function () {
            Y.one('#btn_reset').toggleClass('hidden');
            Y.one('#btn_run_code').toggleClass('hidden');
        },

        _handleRunCodeClick: function (e) {
            var parser = new Y.Pictroid.Parser(),
                instructions = [],
                parseResult;

            e.preventDefault();
            this._swapRobotControlButtons();

            this._dropContainer.get('children').each(function (item) {
                instructions.push(item.getData().type);
            });

            parseResult = parser.isValid(instructions);

            if (parseResult === true) {
                this.get('robot').run(instructions);
            } else {
                // TODO: show errors in coding area
                Y.error('Parse error: ' + parseResult);
            }
        },

        _handleResetClick: function (e) {
            e.preventDefault();

            this._swapRobotControlButtons();
            this.get('robot').reset();
        },

        _handleLevelBtClick: function (e) {
            var levelId;

            e.preventDefault();

            if (Y.one('#btn_run_code').hasClass('hidden')) {
                this._swapRobotControlButtons();
            }

            Y.all('.bt-level').get('parentNode').removeClass('active');
            e.target.get('parentNode').addClass('active');

            levelId = parseInt(e.target.getData('level'), 10);
            this.get('robot').setMap(levelId);
        },


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /****************************** extended methods / members ******************************/
        /****************************************************************************************/

        initializer: function (cfg) {
            var commandsOriginal = new Y.DD.Delegate({
                    container: '#commands-original',
                    nodes: 'li'
                }),
                commandsInUse = new Y.DD.Delegate({
                    container: '#commands-in-use',
                    nodes: 'li'
                });

            this._dropContainer = Y.one('#commands-in-use').plug(Y.Plugin.Drop);

            // event listeners
            commandsOriginal.on('drag:end', this._handleDragEnd);
            commandsInUse.on('drag:end', this._handleDragEnd);

            this._dropContainer.drop.on('drop:hit', this._handleDropHit, this);
            this._dropContainer.drop.on('drop:exit', this._handleDropExit, this);
            this._dropContainer.drop.on('drop:over', this._handleDropOver, this);

            Y.one('#btn_run_code').on('click', this._handleRunCodeClick, this);
            Y.one('#btn_reset').on('click', this._handleResetClick, this);

            Y.all('.bt-level').on('click', this._handleLevelBtClick, this);

            // TODO: add possibility to remove/reorder item
            // TODO: if the new item will be inserted as the last one, just make the container bigger instead of drifting an item

        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Main = Main;

}, '0.1', { requires: ['base', 'dd', 'dd-drop', 'dd-constrain', 'pictroid-parser', 'pictroid-robot']});

