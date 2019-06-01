const serviceName = 'wiApi';
angular.module(serviceName, ['wiToken', 'ngFileUpload']).factory(serviceName, function($http, wiToken, Upload) {
    return new wiApiService($http, wiToken, Upload);
});

function wiApiService($http, wiToken, Upload) {
    let self = this;
    this.$http = $http;
    this.baseUrl = window.localStorage.getItem('__BASE_URL') || 'http://dev.i2g.cloud';
    let unitTable = undefined;
    let familyTable;
    function postPromise(url, data) {
        return new Promise(function(resolve, reject) {
            $http({
                method: 'POST',
                url: self.baseUrl + url,
                data: data,
                headers: {
                    Authorization: wiToken.getToken()
                }
            }).then((response) => {
                if (response.data.code === 200) resolve(response.data.content);
                else reject(new Error(response.data.reason));
            }, (err) => {
                reject(err);
            })
        });
    }

    getAllUnitPromise().then(unittable => unitTable = unittable).catch(err => console.error(err));
    getAllFamilyPromise().then(familytable => familyTable = familytable).catch(err => console.error(err));
    
    this.getFamily = function(idFamily) {
        return familyTable.find(family => family.idFamily === idFamily);
    }
    this.setBaseUrl = function(baseUrl) {
        self.baseUrl = baseUrl;
    }
    function getAllUnitPromise() {
        return postPromise('/family/all-unit', {});
    }
    function getAllFamilyPromise() {
        return postPromise('/family/list', {});
    }

    this.getWellsPromise = getWellsPromise;
    function getWellsPromise(idProject) {
        return postPromise('/project/well/list', {idProject: idProject});
    }
     
    this.getWellPromise = getWellPromise;
    function getWellPromise(idWell) {
        return postPromise('/project/well/info', {idWell: idWell});
    }
    
    this.getImageSetsPromise = getImageSetsPromise;
    function getImageSetsPromise(idWell) {
        return postPromise('/project/well/image-set/list', {idWell:idWell});
    }
    this.createImageSetPromise = createImageSetPromise;
    function createImageSetPromise(idWell, name) {
        return postPromise('/project/well/image-set/new', {name, idWell});
    }
    this.createOrGetImageSetPromise = createOrGetImageSetPromise;
    function createOrGetImageSetPromise(idWell, name) {
        return postPromise('/project/well/image-set/new-or-get', {name, idWell});
    }
    this.deleteImageSetPromise = deleteImageSetPromise;
    function deleteImageSetPromise(idImageSet) {
        return postPromise('/project/well/image-set/delete', {idImageSet});
    }
    this.getImageSetPromise = getImageSetPromise;
    function getImageSetPromise(idImageSet) {
        return postPromise('/project/well/image-set/info', {idImageSet});
    }
    this.deleteImagePromise = deleteImagePromise;
    function deleteImagePromise(idImage) {
        return postPromise('/project/well/image-set/image/delete', {idImage});
    }
    this.createImagePromise = createImagePromise;
    function createImagePromise(image) {
        return postPromise('/project/well/image-set/image/new', image);
    }
    this.updateImagePromise = updateImagePromise;
    function updateImagePromise(image) {
        return postPromise('/project/well/image-set/image/edit', image)
    }
    this.uploadImage = uploadImage;
    function uploadImage(image, idImage,successCb, errorCb, progressCb) {
        return Upload.upload({
            url: self.baseUrl + '/image-upload',
            headers: {
                Authorization: wiToken.getToken()
            },
            data: {
                idImage: idImage,
                file: image
            }
        }).then(
            resp => successCb(resp.data.content),
            resp => errorCb(resp), 
            evt => progressCb(parseFloat(100.0 * evt.loaded / evt.total))
        ).catch(err => errorCb(err));
    }
    this.deleteImageFilePromise = deleteImageFilePromise;
    function deleteImageFilePromise(imageUrl) {
        return postPromise('/image-delete', {imageUrl: imageUrl});
    }

    this.convertUnit = convertUnit;
    function convertUnit(value, fromUnit, destUnit) {
        if ((!Array.isArray(value) && !_.isFinite(value)) || fromUnit === destUnit) return value;
        if (!unitTable) {
            return null;
        }

        let startUnit = unitTable.find(u => u.name == fromUnit);
        let endUnit = unitTable.find(u => u.name == destUnit);

        if(!startUnit || !endUnit || startUnit.idUnitGroup != endUnit.idUnitGroup)
            return value;
        if (startUnit && endUnit) {
            let sCoeffs = JSON.parse(startUnit.rate);
            let eCoeffs = JSON.parse(endUnit.rate);
            function convert(value) {
                return eCoeffs[0]* (value - sCoeffs[1])/sCoeffs[0] + eCoeffs[1];
            }
            if (Array.isArray(value)) {
                return value.map(convert);
            } else {
                return convert(value);
            }
            //return value * endUnit.rate / startUnit.rate;
        }
        else {
            let errUnit = !startUnit ? fromUnit : destUnit;
            console.error(`cannot find ${errUnit} from unit system.`, {silent: true});
            return null;
        }
    }
    this.bestNumberFormat = function(x, digits = 0) {
        if (!x) return x;
        let ex = Math.abs(x / 100);
        let n = -Math.round(Math.log10(ex));
        n = n>=digits?n:digits;
        return (Math.round(x*(10**n))/(10**n)).toFixed(n);
    }
    this.getWellTopDepth = function(well, unit = 'm') {
        let startHdr = well.well_headers.find((wh) => (wh.header === 'STRT'));
        if(!startHdr){
            throw new Error("STRT Well header doesnot exist");
        }
        return convertUnit(parseFloat((startHdr||{}).value || 0), startHdr.unit, unit);
    }
    this.getWellBottomDepth = function(well, unit = 'm') {
        let stopHdr = well.well_headers.find((wh) => (wh.header === 'STOP'));
        if(!stopHdr){
            throw new Error("STOP Well header doesnot exist");
        }
        return convertUnit(parseFloat((stopHdr || {}).value || 0), stopHdr.unit, unit);
    }
}
