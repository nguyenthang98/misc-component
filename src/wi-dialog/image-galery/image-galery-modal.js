let helper = require('../DialogHelper');

module.exports = function (ModalService, callback) {
    function ModalController($scope, $http, wiToken, close) {
        const self = this;
        self.title = "Image Galery";

        self.baseUrl = "http://dev.i2g.cloud";
        self.treeRoot = undefined;
        $http({
            method: "POST",
            url: self.baseUrl + '/image-list',
            data: {},
            headers: {
                Authorization: wiToken.getToken()
            }
        }).then(function(response) {
            if (response.data.code === 200) {
                self.treeRoot = response.data.content;
            }
        }, function(err) {
            console.error(err);
        });
        
        this.$onInit = function() {
            console.log('On init in dialog');
        }
        this.getLabel = function(node) {
            return node;
        }
        this.clickFunction = function($event, node) {
            self.imgUrl = node;
        }
        this.runMatch = function(node, criteria) {
            node.includes(criteria);
        }
        this.onOkButtonClicked = function () {
            close(self.imgUrl);
        }
        this.onCancelButtonClicked = function () {
            close(null);
        }
    }

    ModalService.showModal({
        template: require("./image-galery-modal.html"),
        controller: ModalController,
        controllerAs: 'wiModal'
    }).then(function (modal) {
        helper.initModal(modal);
        modal.close.then(function (ret) {
            helper.removeBackdrop();
            ret && callback && callback(ret);
        });
    });
}
