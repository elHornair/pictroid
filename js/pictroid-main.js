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
            value: 66// size in pixels, including margins
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
            e.preventDefault();
        },

        _handleDropHit: function (e) {
            var dropContainer = e.target,
                droppedItem = e.drag.get('node'),
                currentChildren = dropContainer.get('node').get('children'),
                insertionIndex = this._calcChildToDriftIndex(this._calcRelativeDragCenterY(e.target, e.drag)),
                nodeToInsert = '<li class="item ' + droppedItem.getData().type + ' " data-type="' + droppedItem.getData().type + '"></li>';// TODO: use template

            this._cleanupDrifts(dropContainer);

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

        _handleRunCodeClick: function () {
            var parser = new Y.Pictroid.Parser(),
                commands = [];

            this._dropContainer.get('children').each(function (item) {
                commands.push(item.getData().type);
            });

            parser.isValid(commands);

        },

        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /****************************** extended methods / members ******************************/
        /****************************************************************************************/

        initializer: function (cfg) {
            var dragItems = new Y.DD.Delegate({
                    container: '#items',
                    nodes: 'li'
                });

            this._dropContainer = Y.one('#drop').plug(Y.Plugin.Drop);

            // event listeners
            dragItems.on('drag:end', this._handleDragEnd);
            this._dropContainer .drop.on('drop:hit', this._handleDropHit, this);
            this._dropContainer .drop.on('drop:exit', this._handleDropExit, this);
            this._dropContainer .drop.on('drop:over', this._handleDropOver, this);

            Y.one('#btn_run_code').on('click', this._handleRunCodeClick, this);

            // TODO: add possibility to remove/reorder item
            // TODO: if the new item will be inserted as the last one, just make the container bigger instead of drifting an item

        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Main = Main;

}, '0.1', { requires: ['base', 'dd', 'dd-drop', 'dd-constrain', 'pictroid-parser']});

