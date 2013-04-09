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
            value: 106// size in pixels, including margins
        }
    };

    Y.extend(Main, Y.Base, {

        /****************************************************************************************/
        /*********************************** private members ************************************/
        /****************************************************************************************/

        _currentlyDriftedChildIndex: null,

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


        /****************************************************************************************/
        /************************************ public methods ************************************/
        /****************************************************************************************/


        /****************************************************************************************/
        /****************************** extended methods / members ******************************/
        /****************************************************************************************/

        initializer: function (cfg) {
            var inst = this,
                del = new Y.DD.Delegate({
                    container: '#items',
                    nodes: 'li'
                }),
                drop = Y.one('#drop').plug(Y.Plugin.Drop);

            del.on('drag:end', function (e) {
                e.preventDefault();
            });

            drop.drop.on('drop:hit', function (e) {
                var droppedItem = e.drag.get('node'),
                    insertionIndex = inst._calcChildToDriftIndex(inst._calcRelativeDragCenterY(e.target, e.drag));

                inst._cleanupDrifts(e.target);

                // TODO: append child at correct position
                console.log(insertionIndex);
                drop.append('<li class="item ' + droppedItem.getData().type + '"></li>');
            });

            drop.drop.on('drop:exit', function (e) {
                inst._cleanupDrifts(e.target);
            });

            drop.drop.on('drop:over', function (e) {
                var dropTarget = e.target,
                    currentChildren = dropTarget.get('node').get('children'),
                    childToDriftIndex,
                    childToDrift;

                // only drift if there are actual children
                if (currentChildren.size() > 0) {
                    childToDriftIndex = inst._calcChildToDriftIndex(inst._calcRelativeDragCenterY(dropTarget, e.drag));

                    if (inst._currentlyDriftedChildIndex !== childToDriftIndex) {
                        inst._currentlyDriftedChildIndex = childToDriftIndex;
                        currentChildren.removeClass('drift');

                        if (childToDriftIndex < currentChildren.size()) {
                            // move
                            childToDrift = currentChildren.item(childToDriftIndex);
                            childToDrift.addClass('drift');
                        }
                    }

                }

                // TODO: add possibility to remove/reorder item
                // TODO: if the new item will be inserted as the last one, just make the container bigger instead of drifting an item

            });
        },

        destructor: function () {
        }

    });

    Y.namespace('Pictroid').Main = Main;

}, '0.1', { requires: ['base', 'dd', 'dd-drop', 'dd-constrain']});

